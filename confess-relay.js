/**
 * Confess Relay — Firebase RTDB ↔ Ollama bridge
 * Watches Firebase for AI requests, forwards to local Ollama, writes responses back.
 * Run via PM2: pm2 start confess-relay.js --name "confess-relay"
 */

const admin = require('firebase-admin');
const http = require('http');

const SERVICE_ACCOUNT_PATH = 'C:/Users/sebmo/Downloads/epsteinchat-faa29-firebase-adminsdk-fbsvc-f8f4184903.json';
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const OLLAMA_PATH = '/api/chat';

// ── Firebase Init ──
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://epsteinchat-faa29-default-rtdb.firebaseio.com'
});
const db = admin.database();
console.log('[confess-relay] Firebase connected. Watching for AI requests...');

// ── Watch for new requests ──
const requestsRef = db.ref('ai_requests');

requestsRef.on('child_added', async (snapshot) => {
  const id = snapshot.key;
  const data = snapshot.val();

  // Skip if already processed or no payload
  if (!data || data.status === 'done' || data.status === 'processing') return;

  console.log(`[confess-relay] New request: ${id}`);

  // Mark as processing
  await db.ref(`ai_requests/${id}/status`).set('processing');

  try {
    const ollamaResponse = await callOllama(data.payload);
    
    // Write response to Firebase
    await db.ref(`ai_responses/${id}`).set({
      response: ollamaResponse,
      timestamp: Date.now()
    });

    // Mark done and clean up request
    await db.ref(`ai_requests/${id}`).remove();
    console.log(`[confess-relay] Done: ${id}`);

  } catch (err) {
    console.error(`[confess-relay] Error for ${id}:`, err.message);
    await db.ref(`ai_responses/${id}`).set({
      error: err.message,
      timestamp: Date.now()
    });
    await db.ref(`ai_requests/${id}`).remove();
  }
});

// ── Call local Ollama ──
function callOllama(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = http.request({
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: OLLAMA_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON from Ollama'));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Ollama timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Cleanup old requests on startup ──
(async () => {
  try {
    const snap = await requestsRef.once('value');
    if (snap.exists()) {
      const stale = snap.val();
      for (const id of Object.keys(stale)) {
        await db.ref(`ai_requests/${id}`).remove();
        console.log(`[confess-relay] Cleaned stale request: ${id}`);
      }
    }
  } catch (e) {
    console.log('[confess-relay] Cleanup skipped:', e.message);
  }
})();

// ── Keep alive ──
process.on('SIGINT', () => { console.log('[confess-relay] Shutting down'); process.exit(0); });
process.on('SIGTERM', () => { console.log('[confess-relay] Shutting down'); process.exit(0); });
