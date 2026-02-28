

const MAX_BALANCE = 1e18; 
const MIN_BALANCE = 0; 
function safeNum(v) {
  if (typeof v !== 'number' || !isFinite(v)) return 0;
  return Math.max(MIN_BALANCE, Math.min(MAX_BALANCE, Math.round(v * 100) / 100));
}
let balance = 1000;
window.getBalance=()=>balance;
window.setBalance=(v)=>{balance=safeNum(v);updateBalDisplay();};

function formatBalance(v){
  if(typeof v!=='number'||!isFinite(v))return'$0.00';
  v=safeNum(v);
  const sign=v<0?'-':'';
  const abs=Math.abs(v);
  if(abs>=1e18)return sign+(abs/1e18).toFixed(2)+'Qi';
  if(abs>=1e15)return sign+(abs/1e15).toFixed(2)+'Q';
  if(abs>=1e12)return sign+(abs/1e12).toFixed(2)+'T';
  if(abs>=1e9)return sign+(abs/1e9).toFixed(2)+'B';
  if(abs>=1e6)return sign+(abs/1e6).toFixed(2)+'M';
  if(abs>=1e4)return sign+(abs/1e3).toFixed(1)+'K';
  return v.toFixed(2);
}
function updateBalDisplay(){
  balance=safeNum(balance);
  const el=document.getElementById('balText');
  el.textContent=formatBalance(balance);
  el.title='$'+balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  el.style.transition='transform .15s';
  el.style.transform='scale(1.15)';
  setTimeout(()=>{el.style.transform='scale(1)';},150);
  
  if(balance<=0 && !window._pityOffered){
    window._pityOffered=true;
    
    if(balance<0) balance=0;
    setTimeout(()=>{
      if(balance<=0){
        balance+=100;
        updateBalDisplay();
        firebaseSave();
        showToast('💸 Pity bonus! Here\'s $100 to get back on your feet.',true);
      }
      window._pityOffered=false;
    },1500);
  }
}

let _lastAddMoney=0;
let _addMoneySessionTotal=0;
const _ADD_MONEY_SESSION_CAP=5000; 
function addMoney(amt){if(amt<=0||amt>1000)return;if(_addMoneySessionTotal>=_ADD_MONEY_SESSION_CAP){showToast('Free money limit reached for this session!',false);return;}if(balance>100){showToast('Pity money is only for broke players!',false);return;}if(Date.now()-_lastAddMoney<10000){showToast('Cooldown! Wait 10s',false);return;}_lastAddMoney=Date.now();const give=Math.min(amt,_ADD_MONEY_SESSION_CAP-_addMoneySessionTotal);balance+=give;_addMoneySessionTotal+=give;updateBalDisplay();firebaseSave();showToast('+$'+give+' (pity money)',true);}
let _fbSaveTimer=null, _fbSaveDirty=false;
function firebaseSave(){
  _fbSaveDirty=true;
  if(_fbSaveTimer)return; 
  _fbSaveTimer=setTimeout(()=>{
    _fbSaveTimer=null;
    if(_fbSaveDirty && window._firebaseSave){ _fbSaveDirty=false; window._firebaseSave(); }
  },5000);
}
function firebaseSaveNow(){ 
  if(_fbSaveTimer){clearTimeout(_fbSaveTimer);_fbSaveTimer=null;}
  _fbSaveDirty=false;
  if(window._firebaseSave) window._firebaseSave();
}


let authIsRegister = false;
let isGuestMode = false;

function authGuestMode() {
  isGuestMode = true;
  let guestId = localStorage.getItem('casino_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substr(2, 8);
    localStorage.setItem('casino_guest_id', guestId);
  }
  
  const savedBal = localStorage.getItem('casino_guest_balance');
  if (savedBal != null) { balance = safeNum(parseFloat(savedBal)); }
  const savedStats = localStorage.getItem('casino_guest_stats');
  if (savedStats) try { playerStats = JSON.parse(savedStats); } catch(e) {}
  const savedGameStats = localStorage.getItem('casino_guest_gameStats');
  if (savedGameStats) try { gameStats = JSON.parse(savedGameStats); } catch(e) {}

  window._currentPlayerId = guestId;
  window._currentUsername = 'Guest';
  window._pylPlayerId = guestId;
  window._currentPylSessionId = guestId;

  
  window._firebaseSave = () => {
    localStorage.setItem('casino_guest_balance', balance.toString());
    localStorage.setItem('casino_guest_stats', JSON.stringify(playerStats));
    localStorage.setItem('casino_guest_gameStats', JSON.stringify(gameStats));
  };
  
  window._recordGameResult = () => {};
  window._claimDailyBonus = async () => null;
  window._sendChatMsg = async () => {};
  window._broadcastWin = () => {};
  window._updateGlobalMarketItem = async () => {};
  window._initGlobalMarket = () => {};

  window._onAuthReady('Guest', guestId);
}


(function initLoginParticles() {
  const c = document.getElementById('loginParticles');
  if (!c) return;
  for (let i = 0; i < 40; i++) {
    const d = document.createElement('div');
    d.style.left = Math.random() * 100 + '%';
    d.style.animationDuration = (3 + Math.random() * 6) + 's';
    d.style.animationDelay = (Math.random() * 5) + 's';
    d.style.width = d.style.height = (2 + Math.random() * 3) + 'px';
    c.appendChild(d);
  }
})();

function authToggleMode() {
  authIsRegister = !authIsRegister;
  document.getElementById('authSubmitBtn').textContent = authIsRegister ? 'CREATE ACCOUNT' : 'SIGN IN';
  document.getElementById('authToggleBtn').textContent = authIsRegister ? 'BACK TO SIGN IN' : 'CREATE ACCOUNT';
  document.getElementById('authToggleText').innerHTML = authIsRegister
    ? 'Already have an account? <a onclick="authToggleMode()">Sign in</a>'
    : 'Don\'t have an account? <a onclick="authToggleMode()">Sign up</a>';
  document.getElementById('authError').textContent = '';
}

async function authSubmit() {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = authIsRegister ? 'CREATING...' : 'SIGNING IN...';
  try {
    await window._authSubmit(username, password, authIsRegister);
  } catch (e) {
    let msg = e.message || 'Unknown error';
    if (msg.includes('auth/email-already-in-use')) msg = 'Username already taken';
    else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) msg = 'Invalid username or password';
    else if (msg.includes('auth/too-many-requests')) msg = 'Too many attempts. Try again later';
    else if (msg.includes('auth/weak-password')) msg = 'Password must be at least 6 characters';
    errEl.textContent = msg;
  }
  btn.disabled = false;
  btn.textContent = authIsRegister ? 'CREATE ACCOUNT' : 'SIGN IN';
}

function authLogout() {
  firebaseSaveNow();
  isGuestMode = false;
  if (window._authLogout) window._authLogout();
  else window._onAuthLoggedOut(); 
}


async function checkPendingRefunds() {
  if (!window._checkPendingRefunds) return;
  try {
    const refunds = await window._checkPendingRefunds();
    if (!refunds || refunds.length === 0) return;
    let totalCash = 0;
    let itemsReceived = [];
    refunds.forEach(r => {
      if (r.cash > 0) { balance += r.cash; totalCash += r.cash; }
      if (r.item && r.item !== '_cash_' && r.item !== null) {
        addToInventory(r.item);
        const cat = ITEM_CATALOG[r.item];
        itemsReceived.push(cat ? cat.name : r.itemName || r.item);
      }
    });
    if (totalCash > 0 || itemsReceived.length > 0) {
      updateBalDisplay();
      renderInventory();
      firebaseSave();
      let msg = '📬 ';
      if (totalCash > 0) msg += '+$' + totalCash.toFixed(0);
      if (itemsReceived.length > 0) msg += (totalCash > 0 ? ' + ' : '') + itemsReceived.join(', ');
      const reasons = [...new Set(refunds.map(r => r.reason))];
      if (reasons.includes('trade_declined')) msg += ' (trade returned)';
      else if (reasons.includes('outbid')) msg += ' (outbid refund)';
      else if (reasons.includes('store_sale') || reasons.includes('auction_sold')) msg += ' (sale proceeds)';
      else if (reasons.includes('listing_cancelled')) msg += ' (listing cancelled)';
      else if (reasons.includes('auction_won')) msg += ' (auction won)';
      showToast(msg, true);
    }
  } catch(e) {  }
}

window._onAuthReady = function(username, uid) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('topNav').style.display = '';
  const uaInit = (username && username[0] || '?').toUpperCase();
  document.getElementById('userAvatar').innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><linearGradient id="avG" x1="0" x2="1"><stop offset="0" stop-color="#00f0ff"/><stop offset="1" stop-color="#6b2fd9"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#avG)"/><text x="50" y="58" font-family="Orbitron,Inter,sans-serif" font-weight="900" font-size="48" fill="#fff" text-anchor="middle">${uaInit}</text></svg>`;
  document.getElementById('userNameDisplay').textContent = username;
  
  if (typeof applyPfp === 'function' && selectedPfp) applyPfp();
  updateBalDisplay();
  checkDailyBonus();
  
  document.getElementById('chatToggleBtn').style.display = 'flex';
  
  if (!chatInitialized && window._initChat) {
    window._initChat();
    chatInitialized = true;
  }
  
  checkPendingRefunds();
  
  if (!window._refundInterval) {
    window._refundInterval = setInterval(checkPendingRefunds, 30000);
  }
  
  if (typeof rrListenForChallenges === 'function') rrListenForChallenges();
};

window._onAuthLoggedOut = function() {
  if (isGuestMode) return; 
  document.getElementById('loginScreen').style.display = '';
  document.getElementById('topNav').style.display = 'none';
  document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
  
  if (window._refundInterval) { clearInterval(window._refundInterval); window._refundInterval = null; }
  if (window._onlineStatusInterval) { clearInterval(window._onlineStatusInterval); window._onlineStatusInterval = null; }
  if (window._chatPresenceInterval) { clearInterval(window._chatPresenceInterval); window._chatPresenceInterval = null; }
  if (window._presenceCountInterval) { clearInterval(window._presenceCountInterval); window._presenceCountInterval = null; }
  if (typeof stockTickInterval !== 'undefined' && stockTickInterval) { clearInterval(stockTickInterval); stockTickInterval = null; }
  
  try {
    if (typeof crashRunning !== 'undefined') crashRunning = false;
    if (typeof bjActive !== 'undefined') bjActive = false;
    if (typeof minesActive !== 'undefined') minesActive = false;
    if (typeof towerActive !== 'undefined') towerActive = false;
    if (typeof hiloActive !== 'undefined') hiloActive = false;
    if (typeof pylGameActive !== 'undefined') pylGameActive = false;
    if (typeof autoDropping !== 'undefined') autoDropping = false;
    if (typeof rouletteSpinning !== 'undefined') rouletteSpinning = false;
    if (typeof limboRolling !== 'undefined') limboRolling = false;
    if (typeof pokerPhase !== 'undefined') pokerPhase = 'idle';
    
    if (typeof balance !== 'undefined') balance = 1000;
    if (typeof inventory !== 'undefined') inventory = [];
    if (typeof tradeHistory !== 'undefined') tradeHistory = [];
    if (typeof chatInitialized !== 'undefined') chatInitialized = false;
    updateBalDisplay();
  } catch(e) {}
};


document.getElementById('authPassword').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') authSubmit();
});
document.getElementById('authUsername').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('authPassword').focus();
});


let playerStats = { totalWagered: 0, totalWon: 0, totalProfit: 0, gamesPlayed: 0, biggestWin: 0 };
let gameStats = {
  slots: { played: 0, won: 0, biggestWin: 0 },
  crash: { played: 0, won: 0, biggestMultiplier: 0, biggestWin: 0 },
  roulette: { played: 0, won: 0, biggestWin: 0 },
  cases: { played: 0, opened: 0, bestItem: '' },
  plinko: { played: 0, won: 0, biggestWin: 0 },
  pyl: { played: 0, highScore: 0 },
  blackjack: { played: 0, won: 0, biggestWin: 0 },
  mines: { played: 0, won: 0, biggestWin: 0 },
  dice: { played: 0, won: 0, biggestWin: 0 },
  tower: { played: 0, won: 0, biggestWin: 0 },
  coinflip: { played: 0, won: 0, biggestWin: 0 },
  keno: { played: 0, won: 0, biggestWin: 0 },
  limbo: { played: 0, won: 0, biggestWin: 0 },
  poker: { played: 0, won: 0, biggestWin: 0 },
  horses: { played: 0, won: 0, biggestWin: 0 },
  scratch: { played: 0, won: 0, biggestWin: 0 },
  wheel: { played: 0, won: 0, biggestWin: 0 },
  baccarat: { played: 0, won: 0, biggestWin: 0 },
  hilo: { played: 0, won: 0, biggestWin: 0 },
  duels: { played: 0, won: 0, biggestWin: 0 },
  rusroulette: { played: 0, won: 0, biggestWin: 0 },
  mpbsr: { played: 0, won: 0, biggestWin: 0 },
  russianr: { played: 0, won: 0, biggestWin: 0 }
};
let dailyBonusData = { lastClaimed: 0, streak: 0 };


function checkMaxBet(bet, game) {
  if (bet > balance) { showToast('Max bet is your balance: $' + Math.floor(balance).toLocaleString(), false); return false; }
  return true;
}

window._loadStats = (s) => { if (s) { Object.keys(s).forEach(k => { if(typeof s[k]==='number') s[k]=safeNum(s[k]); }); playerStats = { ...playerStats, ...s }; } };
window._loadGameStats = (gs) => { if (!gs) return; Object.keys(gs).forEach(g => { gameStats[g] = { ...(gameStats[g]||{}), ...gs[g] }; }); };
window._loadDailyBonus = (db) => { if (db) dailyBonusData = { ...dailyBonusData, ...db }; checkDailyBonus(); };
window._getStats = () => playerStats;
window._getGameStats = () => gameStats;
window._getDailyBonus = () => dailyBonusData;

function recordGame(game, wagered, won) {
  wagered = safeNum(wagered); won = safeNum(won);
  const profit = won - wagered;
  playerStats.totalWagered = safeNum(playerStats.totalWagered + wagered);
  playerStats.totalWon = safeNum(playerStats.totalWon + won);
  playerStats.totalProfit = safeNum(playerStats.totalProfit + profit);
  playerStats.gamesPlayed++;
  if (won > playerStats.biggestWin) playerStats.biggestWin = won;
  if (gameStats[game]) {
    gameStats[game].played = (gameStats[game].played || 0) + 1;
    if (won > wagered) gameStats[game].won = (gameStats[game].won || 0) + 1;
    if (won > (gameStats[game].biggestWin || 0)) gameStats[game].biggestWin = won;
  }
  if (window._recordGameResult) window._recordGameResult(game, wagered, won);
  firebaseSave();
  
  checkCasinoAchievements(game, wagered, won);
}

function addResultDot(containerId,label,isWin){
  const c=document.getElementById(containerId);if(!c)return;
  const dot=document.createElement('span');dot.className='result-dot';
  dot.style.background=isWin?'var(--green)':'var(--red)';dot.textContent=label;
  c.appendChild(dot);if(c.children.length>20)c.removeChild(c.firstChild);
}


function checkDailyBonus() {
  const btn = document.getElementById('dailyBonusBtn');
  if (!btn) return;
  const lastDate = new Date(dailyBonusData.lastClaimed).toDateString();
  const todayDate = new Date().toDateString();
  if (lastDate === todayDate) {
    btn.disabled = true;
    btn.textContent = '✓ CLAIMED';
  } else {
    btn.disabled = false;
    btn.textContent = '🎁 DAILY';
  }
}

async function claimDailyBonus() {
  const btn = document.getElementById('dailyBonusBtn');
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const result = await window._claimDailyBonus();
    if (result) {
      balance = safeNum(balance + result.amount); updateBalDisplay(); firebaseSave();
      dailyBonusData.lastClaimed = Date.now();
      dailyBonusData.streak = result.streak;
      showToast('🎁 Daily Bonus: $' + result.amount + ' (Day ' + result.streak + ' streak!)', true);
      btn.textContent = '✓ CLAIMED';
    } else {
      showToast('Already claimed today!', false);
      btn.textContent = '✓ CLAIMED';
    }
  } catch (e) {
    btn.disabled = false;
    btn.textContent = '🎁 DAILY';
    showToast('Error claiming bonus', false);
  }
}


let currentLBCategory = 'richest';

function switchLB(category, btn) {
  currentLBCategory = category;
  document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadLeaderboard(category);
}

async function loadLeaderboard(category) {
  const container = document.getElementById('lbTable');
  container.innerHTML = '<div class="lb-empty">Loading...</div>';
  
  if (!window._getLeaderboard) {
    container.innerHTML = '<div class="lb-empty">Not connected</div>';
    return;
  }

  try {
    const entries = await window._getLeaderboard(category);
    if (entries.length === 0) {
      container.innerHTML = '<div class="lb-empty">No entries yet. Start playing to get on the board!</div>';
      return;
    }
const myId = window._currentPlayerId || '';
const fmtBig = (v) => {
      const abs = Math.abs(v);
      if (abs >= 1e18) return '$' + (v/1e18).toFixed(2) + 'Qi';
      if (abs >= 1e15) return '$' + (v/1e15).toFixed(2) + 'Q';
      if (abs >= 1e12) return '$' + (v/1e12).toFixed(2) + 'T';
      if (abs >= 1e9)  return '$' + (v/1e9).toFixed(2) + 'B';
      if (abs >= 1e6)  return '$' + (v/1e6).toFixed(2) + 'M';
      if (abs >= 1e4)  return '$' + (v/1e3).toFixed(1) + 'K';
      return '$' + v.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    };
    const fmtProfit = (v) => {
      const sign = v >= 0 ? '+' : '-';
      const abs = Math.abs(v);
      if (abs >= 1e18) return sign + '$' + (abs/1e18).toFixed(2) + 'Qi';
      if (abs >= 1e15) return sign + '$' + (abs/1e15).toFixed(2) + 'Q';
      if (abs >= 1e12) return sign + '$' + (abs/1e12).toFixed(2) + 'T';
      if (abs >= 1e9)  return sign + '$' + (abs/1e9).toFixed(2) + 'B';
      if (abs >= 1e6)  return sign + '$' + (abs/1e6).toFixed(2) + 'M';
      if (abs >= 1e4)  return sign + '$' + (abs/1e3).toFixed(1) + 'K';
      return (v >= 0 ? '+$' : '-$') + abs.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    };
    const labels = {
      richest: { col: 'Balance', fmt: fmtBig },
      slots: { col: 'Biggest Win', fmt: fmtBig },
      crash: { col: 'Biggest Win', fmt: fmtBig },
      roulette: { col: 'Biggest Win', fmt: fmtBig },
      blackjack: { col: 'Biggest Win', fmt: fmtBig },
      cases: { col: 'Biggest Win', fmt: fmtBig },
      plinko: { col: 'Biggest Win', fmt: fmtBig },
      mines: { col: 'Biggest Win', fmt: fmtBig },
      dice: { col: 'Biggest Win', fmt: fmtBig },
      tower: { col: 'Biggest Win', fmt: fmtBig },
      coinflip: { col: 'Biggest Win', fmt: fmtBig },
      keno: { col: 'Biggest Win', fmt: fmtBig },
      limbo: { col: 'Biggest Win', fmt: fmtBig },
      poker: { col: 'Biggest Win', fmt: fmtBig },
      horses: { col: 'Biggest Win', fmt: fmtBig },
      scratch: { col: 'Biggest Win', fmt: fmtBig },
      wheel: { col: 'Biggest Win', fmt: fmtBig },
      baccarat: { col: 'Biggest Win', fmt: fmtBig },
      hilo: { col: 'Biggest Win', fmt: fmtBig },
      pyl: { col: 'High Score', fmt: v => v.toLocaleString() + ' pts' },
      profit: { col: 'Total Profit', fmt: fmtProfit },
      duels: { col: 'Biggest Win', fmt: fmtBig },
      prestige: { col: 'Prestige Level', fmt: v => '👑 ' + v },
    };
    const cfg = labels[category] || labels.richest;

    container.innerHTML = entries.map((e, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
      const isMe = e.uid === myId;
      return '<div class="lb-data-row' + (isMe ? ' me' : '') + '">' +
        '<span class="lb-col-rank">' + medal + '</span>' +
        '<span class="lb-col-name">' + escapeHtml(e.name) + (isMe ? ' (you)' : '') + '</span>' +
        '<span class="lb-col-val">' + cfg.fmt(e.value) + '</span>' +
        '</div>';
    }).join('');
  } catch (e) {
    container.innerHTML = '<div class="lb-empty">Error loading leaderboard</div>';
  }
}


let navCatCloseTimer = null;
function openCat(el){
  if(navCatCloseTimer) { clearTimeout(navCatCloseTimer); navCatCloseTimer = null; }
  document.querySelectorAll('.nav-cat').forEach(c=>{if(c!==el)c.classList.remove('open');});
  el.classList.add('open');
}
function closeCat(el){
  navCatCloseTimer = setTimeout(()=>{
    el.classList.remove('open');
    navCatCloseTimer = null;
  }, 120);
}

function toggleCat(el){el.classList.toggle('open');document.querySelectorAll('.nav-cat').forEach(c=>{if(c!==el)c.classList.remove('open');});}

document.addEventListener('click',function(e){if(!e.target.closest('.nav-cat'))document.querySelectorAll('.nav-cat').forEach(c=>c.classList.remove('open'));});
document.addEventListener('touchstart',function(e){if(!e.target.closest('.nav-cat'))document.querySelectorAll('.nav-cat').forEach(c=>c.classList.remove('open'));},{passive:true});


const gamesData = [
  { cat: '⭐ Classic', games: [
    { name: 'Plinko', icon: '⚡', id: 'plinko' },
    { name: 'Crash', icon: '📈', id: 'crash' },
    { name: 'Slots', icon: '🎰', id: 'slots' },
    { name: 'Mines', icon: '💣', id: 'mines' },
    { name: 'Roulette', icon: '🎡', id: 'roulette' }
  ]},
  { cat: '🃏 Card Games', games: [
    { name: 'Blackjack', icon: '🃏', id: 'blackjack' },
    { name: 'Video Poker', icon: '♠️', id: 'poker' },
    { name: 'Baccarat', icon: '🎴', id: 'baccarat' },
    { name: 'Hi-Lo', icon: '↕️', id: 'hilo' }
  ]},
  { cat: '🎡 Table Games', games: [
    { name: 'Wheel', icon: '💫', id: 'wheel' },
    { name: 'Keno', icon: '🔢', id: 'keno' },
    { name: 'Horse Racing', icon: '🏇', id: 'horses' },
    { name: 'Buckshot Roulette', icon: '🔫', id: 'rusroulette' },
    { name: 'MP Buckshot', icon: '💥', id: 'mpbsr' },
    { name: 'Russian Roulette', icon: '🎰', id: 'russianr' }
  ]},
  { cat: '⚡ Quick & Special', games: [
    { name: 'Dice', icon: '🎯', id: 'dice' },
    { name: 'Tower', icon: '🗼', id: 'tower' },
    { name: 'Scratch Cards', icon: '🎫', id: 'scratch' },
    { name: 'Limbo', icon: '🚀', id: 'limbo' },
    { name: 'Coin Flip', icon: '🪙', id: 'coinflip' },
    { name: 'Push Your Luck', icon: '🎲', id: 'luck' },
    { name: 'Cases', icon: '📦', id: 'cases' }
  ]},
  { cat: '💎 Pro Games', games: [
    { name: 'Stocks', icon: '📊', id: 'stocks' },
    { name: 'Crypto', icon: '₿', id: 'crypto' },
    { name: 'Duels', icon: '⚔️', id: 'duels' }
  ]}
];

function openGamesMenu(){
  const overlay = document.getElementById('gamesMenuOverlay');
  overlay.style.display = 'block';
  const container = document.getElementById('gamesCategoriesContainer');
  container.innerHTML = gamesData.map((cat, i) => {
    const games = cat.games.map(g => {
      return `<button class="game-btn" onclick="switchGame('${g.id}',this);closeGamesMenu();" style="border-color:var(--green);"><span class="game-icon">${g.icon}</span><div>${g.name}</div></button>`;
    }).join('');
    return `<div class="games-category"><div class="games-category-title"><span>${cat.cat}</span></div><div class="games-grid">${games}</div></div>`;
  }).join('');
  setTimeout(() => overlay.style.opacity = '1', 10);
}

function closeGamesMenu(){
  const overlay = document.getElementById('gamesMenuOverlay');
  overlay.style.display = 'none';
}


document.getElementById('gamesMenuOverlay')?.addEventListener('click', (e) => {
  if(e.target.id === 'gamesMenuOverlay') closeGamesMenu();
});


function htpToggle(el){el.closest('.htp-box').classList.toggle('open');}
function showToast(msg,isWin=true){
  const t=document.getElementById('winToast');
  t.textContent=msg;t.className='win-toast'+(isWin?'':' loss');
  setTimeout(()=>t.classList.add('show'),10);
  setTimeout(()=>t.classList.remove('show'),2500);
}


function showBigWin(amount) {
  if (amount < 500) return;
  
  
  const intensity = Math.min(amount / 1000, 8);
  document.body.style.animation = `screenShake ${0.3 + Math.min(amount/5000, 0.4)}s ease-out`;
  setTimeout(() => { document.body.style.animation = ''; }, 800);
  
  
  if (amount >= 2000) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:radial-gradient(circle,rgba(255,215,0,0.15),rgba(0,0,0,0.85));pointer-events:none;animation:fadeInOut 2.5s ease forwards;`;
    
    const tier = amount >= 50000 ? {label:'MEGA WIN',color:'#ff00e5',glow:'rgba(255,0,229,0.6)',icon:'👑'} 
      : amount >= 10000 ? {label:'HUGE WIN',color:'#ffd700',glow:'rgba(255,215,0,0.6)',icon:'💎'} 
      : amount >= 5000 ? {label:'BIG WIN',color:'#00f0ff',glow:'rgba(0,240,255,0.6)',icon:'🔥'}
      : {label:'NICE WIN',color:'#00ff88',glow:'rgba(0,255,136,0.5)',icon:'✨'};
    
    overlay.innerHTML = `
      <div style="font-size:60px;animation:bigWinBounce 0.6s ease-out;">${tier.icon}</div>
      <div style="font-family:'Orbitron';font-weight:900;font-size:${amount>=10000?'48':'36'}px;color:${tier.color};
        text-shadow:0 0 30px ${tier.glow},0 0 60px ${tier.glow};animation:bigWinBounce 0.6s ease-out 0.1s both;">${tier.label}</div>
      <div style="font-family:'Orbitron';font-weight:700;font-size:28px;color:#fff;margin-top:8px;
        animation:bigWinBounce 0.6s ease-out 0.2s both;">+$${amount.toFixed(2)}</div>
    `;
    document.body.appendChild(overlay);
    
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => spawnParticles(
        Math.random() * window.innerWidth, 
        Math.random() * window.innerHeight, 
        20 + Math.min(amount / 500, 40)
      ), i * 150);
    }
    
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 2600);
  }
}

function switchGame(game,btn){
  document.querySelectorAll('.game-panel').forEach(p=>p.classList.remove('active'));
  const targetPanel = document.getElementById(game+'Panel');
  if(targetPanel) targetPanel.classList.add('active'); else return;
  
  const catalog = document.getElementById('gameCatalog'); if(catalog) catalog.style.display = 'none';
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  if(game==='plinko'&&!plinkoInitialized)initPlinko();
  if(game==='roulette'&&!rouletteDrawn)drawRouletteWheel(0);
  if(game==='crash')resizeCrashCanvas();
  if(game==='profile')renderProfile();
  if(game==='stocks')renderStocks();
  if(game==='leaderboard')loadLeaderboard(currentLBCategory);
  if(game==='duels')duelLoadLobby();
  if(game==='wheel'&&!wheelDrawn)drawWheel(0);
  if(game==='keno')kenoInit();
  if(game==='horses')horseInit();
  if(game==='mines')minesRenderGrid();
  if(game==='dice')diceUpdateSlider();
  if(game==='rusroulette')initBuckshotRoulette();
  if(game==='mpbsr')initMPBSR();
  if(game==='russianr')initRussianRoulette();
  if(game==='crypto')initCrypto();
  if(game==='luck'){
    let iframe=document.getElementById('pylIframe');
    if(!iframe){
      
      iframe=document.createElement('iframe');
      iframe.id='pylIframe';
      iframe.allow='autoplay';
      document.getElementById('luckPanel').insertBefore(iframe,document.getElementById('luckPanel').firstChild);
    }
    if(!iframe.src||!iframe.src.includes('push-your-luck')){
      
      setTimeout(()=>{ iframe.src='push-your-luck/index.html'; }, 300);
    }
    pylLoadLeaderboard();
  }
  
}

function adjustBet(id,mult){
  const el=document.getElementById(id);
  let v=Math.max(1,Math.round(parseFloat(el.value||10)*mult));
  if(v>balance)v=Math.floor(balance);
  el.value=v;
}
function betAll(id){
  const el=document.getElementById(id);
  el.value=Math.max(1,Math.floor(balance));
  playClickSound();
}


const pCanvas=document.getElementById('particles');
const pCtx=pCanvas.getContext('2d');
let particles=[];
function resizeParticles(){pCanvas.width=window.innerWidth;pCanvas.height=window.innerHeight;}
resizeParticles();window.addEventListener('resize',resizeParticles);

function spawnParticles(x,y,count=30,colors=['#ffd700','#ff8800','#00f0ff','#ff00e5','#00ff88']){
  
  const MAX_PARTICLES = 200;
  if(particles.length >= MAX_PARTICLES) return;
  count = Math.min(count, MAX_PARTICLES - particles.length);
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=Math.random()*10+3;
    particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-3,
      life:1,decay:Math.random()*.015+.008,size:Math.random()*5+2,
      color:colors[Math.floor(Math.random()*colors.length)]});
  }
  
  if(particles.length===count) requestAnimationFrame(updateParticles);
}
function updateParticles(){
  pCtx.clearRect(0,0,pCanvas.width,pCanvas.height);
  particles=particles.filter(p=>{
    p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=p.decay;p.vx*=.99;
    if(p.life<=0)return false;
    pCtx.globalAlpha=p.life;pCtx.fillStyle=p.color;
    pCtx.shadowColor=p.color;pCtx.shadowBlur=p.size*2;
    pCtx.beginPath();pCtx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);pCtx.fill();
    return true;
  });
  pCtx.globalAlpha=1;pCtx.shadowBlur=0;
  if(particles.length>0)requestAnimationFrame(updateParticles);
}
updateParticles();


let soundMuted = false;
function toggleMute() {
  soundMuted = !soundMuted;
  const btn = document.getElementById('muteBtn');
  if (btn) btn.textContent = soundMuted ? '🔇' : '🔊';
}
let audioCtx=null;
function ensureAudioCtx(){if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;}
document.addEventListener('click',ensureAudioCtx,{once:true});
document.addEventListener('keydown',ensureAudioCtx,{once:true});
function playSound(freq,type='sine',dur=0.15,vol=0.1){
  try{
    if(!audioCtx)return;
    const o=audioCtx.createOscillator();const g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);
    o.start();o.stop(audioCtx.currentTime+dur);
  }catch(e){}
}
function playWinSound(){playSound(523,'sine',.1,.12);setTimeout(()=>playSound(659,'sine',.1,.12),80);
  setTimeout(()=>playSound(784,'sine',.15,.12),160);setTimeout(()=>playSound(1047,'sine',.25,.1),240);}
function playLoseSound(){playSound(200,'sawtooth',.25,.06);setTimeout(()=>playSound(150,'sawtooth',.3,.05),100);}
function playClickSound(){playSound(800,'sine',.04,.06);}
let _achievementsCache = {};

try { _achievementsCache = JSON.parse(localStorage.getItem('casino_achievements') || '{}'); } catch(e) { _achievementsCache = {}; }

function getCasinoAch() {
  return _achievementsCache;
}
function saveCasinoAch(id) {
  if (_achievementsCache[id]) return false;
  _achievementsCache[id] = Date.now();
  
  try { localStorage.setItem('casino_achievements', JSON.stringify(_achievementsCache)); } catch(e) {}
  
  return true;
}

window._getAchievements = () => _achievementsCache;
window._loadAchievements = (data) => {
  if (data && typeof data === 'object') {
    
    Object.keys(data).forEach(k => {
      if (!_achievementsCache[k]) _achievementsCache[k] = data[k];
    });
    try { localStorage.setItem('casino_achievements', JSON.stringify(_achievementsCache)); } catch(e) {}
  }
};

const _origPlaySound = playSound;
playSound = function(freq, type, dur, vol) {
  if (soundMuted) return;
  _origPlaySound(freq, type, dur, vol);
};


const CASINO_ACHIEVEMENTS = [
  { id:'first_game', icon:'🎮', name:'FIRST SPIN', desc:'Play your first game' },
  { id:'first_win', icon:'🏆', name:'WINNER', desc:'Win your first bet' },
  { id:'high_roller', icon:'💰', name:'HIGH ROLLER', desc:'Wager $10,000 total' },
  { id:'whale', icon:'🐋', name:'WHALE', desc:'Wager $100,000 total' },
  { id:'big_win', icon:'💎', name:'BIG WIN', desc:'Win $5,000+ in a single bet' },
  { id:'mega_win', icon:'👑', name:'MEGA WIN', desc:'Win $50,000+ in a single bet' },
  { id:'broke', icon:'📉', name:'ROCK BOTTOM', desc:'Lose all your money (balance $0)' },
  { id:'comeback', icon:'🔥', name:'COMEBACK KID', desc:'Go from under $100 to over $10,000' },
  { id:'games_50', icon:'⭐', name:'REGULAR', desc:'Play 50 games' },
  { id:'games_500', icon:'🌟', name:'VETERAN', desc:'Play 500 games' },
  { id:'games_5000', icon:'✨', name:'LEGEND', desc:'Play 5,000 games' },
  { id:'slots_pro', icon:'🎰', name:'SLOTS PRO', desc:'Win 50 times at Slots' },
  { id:'crash_pro', icon:'📈', name:'CRASH MASTER', desc:'Win 50 times at Crash' },
  { id:'diversified', icon:'🎯', name:'DIVERSIFIED', desc:'Play 5+ different games' },
  { id:'collector', icon:'🎒', name:'COLLECTOR', desc:'Own 10+ inventory items' },
  { id:'daily_7', icon:'📅', name:'DEDICATED', desc:'Claim 7 daily bonuses (streak)' },
  { id:'profit_10k', icon:'📊', name:'PROFITABLE', desc:'Reach $10,000 total profit' },
  { id:'inv_value', icon:'💼', name:'PORTFOLIO', desc:'Inventory worth $10,000+' }
];

function checkCasinoAchievements(game, wagered, won) {
  const newAchs = [];
  function tryAward(id) {
    if (saveCasinoAch(id)) {
      const a = CASINO_ACHIEVEMENTS.find(x => x.id === id);
      if (a) { newAchs.push(a); showAchToast(a); }
    }
  }
  
  tryAward('first_game');
  
  if (won > 0) tryAward('first_win');
  
  if (won >= 5000) tryAward('big_win');
  if (won >= 50000) tryAward('mega_win');
  
  if (playerStats.totalWagered >= 10000) tryAward('high_roller');
  if (playerStats.totalWagered >= 100000) tryAward('whale');
  
  if (playerStats.gamesPlayed >= 50) tryAward('games_50');
  if (playerStats.gamesPlayed >= 500) tryAward('games_500');
  if (playerStats.gamesPlayed >= 5000) tryAward('games_5000');
  
  if (gameStats.slots && gameStats.slots.won >= 50) tryAward('slots_pro');
  if (gameStats.crash && gameStats.crash.won >= 50) tryAward('crash_pro');
  
  const gamesPlayed = Object.values(gameStats).filter(g => g.played > 0).length;
  if (gamesPlayed >= 5) tryAward('diversified');
  
  if (balance <= 0) tryAward('broke');
  
  if (playerStats.totalProfit >= 10000) tryAward('profit_10k');
  
  if (inventory.length >= 10) tryAward('collector');
  
  if (typeof getInventoryValue === 'function' && getInventoryValue() >= 10000) tryAward('inv_value');
  
  if (dailyBonusData.streak >= 7) tryAward('daily_7');
  
  if (balance >= 10000 && (getCasinoAch()['broke'])) tryAward('comeback');
  return newAchs;
}
function showAchToast(ach) {
  showToast(ach.icon + ' Achievement: ' + ach.name + ' — ' + ach.desc, true);
}


window._getTradeHistory = () => tradeHistory.slice(0, 50);
window._loadTradeHistory = (data) => {
  if (Array.isArray(data)) {
    const existing = new Set(tradeHistory.map(t => t.ts));
    data.forEach(t => { if (t.ts && !existing.has(t.ts)) tradeHistory.push(t); });
    tradeHistory.sort((a, b) => b.ts - a.ts);
    if (tradeHistory.length > 50) tradeHistory = tradeHistory.slice(0, 50);
    try { localStorage.setItem('casino_trade_history', JSON.stringify(tradeHistory)); } catch(e) {}
  }
};


const PFP_OPTIONS = [
  '👤','😎','🤑','🎰','🃏','👑','🔥','💎','⚡','🌟',
  '🐉','🦊','🐺','🦅','🐲','🦁','🐯','🦈','🐙','🦇',
  '💀','👻','🤖','👽','🎭','🥷','🧙','🧛','🧟','🏴‍☠️',
  '🎲','🎯','🎪','🏆','🎸','🎮','⚔️','🛡️','🗡️','💣',
  '🌊','🌋','❄️','☄️','🌙','☀️','🌈','🍀','💰','🏝️'
];
let selectedPfp = localStorage.getItem('casino_pfp') || '';
let customPfpUrl = localStorage.getItem('casino_pfp_url') || '';
const UPLOAD_WORKER_URL = 'https://chatra.modmojheh.workers.dev';

function openPfpPicker() {
  const overlay = document.getElementById('pfpPickerOverlay');
  overlay.style.display = 'flex';
  const grid = document.getElementById('pfpGrid');
  grid.innerHTML = '';
  
  
  const uploadDiv = document.createElement('div');
  uploadDiv.style.cssText = 'width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:20px;border-radius:10px;cursor:pointer;border:2px dashed var(--neon);background:rgba(0,240,255,.05);transition:all .15s;';
  uploadDiv.innerHTML = '📷';
  uploadDiv.title = 'Upload custom image';
  uploadDiv.onmouseover = function(){ this.style.transform='scale(1.15)'; };
  uploadDiv.onmouseout = function(){ this.style.transform='scale(1)'; };
  uploadDiv.onclick = function(){ document.getElementById('pfpFileInput').click(); };
  grid.appendChild(uploadDiv);
  
  
  if (customPfpUrl) {
    const customDiv = document.createElement('div');
    customDiv.style.cssText = 'width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;border:2px solid ' + (!selectedPfp && customPfpUrl ? 'var(--gold)' : 'var(--border)') + ';background:var(--bg);transition:all .15s;overflow:hidden;';
    customDiv.innerHTML = '<img src="' + customPfpUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">';
    customDiv.title = 'Your custom avatar';
    customDiv.onmouseover = function(){ this.style.transform='scale(1.15)'; };
    customDiv.onmouseout = function(){ this.style.transform='scale(1)'; };
    customDiv.onclick = function(){ selectCustomPfp(customPfpUrl); };
    grid.appendChild(customDiv);
  }
  
  PFP_OPTIONS.forEach((emoji) => {
    const isSelected = emoji === selectedPfp;
    const div = document.createElement('div');
    div.style.cssText = 'width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:28px;border-radius:10px;cursor:pointer;border:2px solid ' + (isSelected ? 'var(--gold)' : 'var(--border)') + ';background:' + (isSelected ? 'rgba(255,215,0,.15)' : 'var(--bg)') + ';transition:all .15s;';
    div.textContent = emoji;
    div.onmouseover = function(){ this.style.transform='scale(1.15)'; };
    div.onmouseout = function(){ this.style.transform='scale(1)'; };
    div.onclick = function(){ selectPfp(emoji); };
    grid.appendChild(div);
  });
}
function closePfpPicker() { document.getElementById('pfpPickerOverlay').style.display = 'none'; }
function selectPfp(emoji) {
  selectedPfp = emoji;
  customPfpUrl = ''; 
  localStorage.setItem('casino_pfp', emoji);
  localStorage.removeItem('casino_pfp_url');
  if(window._firebaseSave) firebaseSave();
  applyPfp();
  closePfpPicker();
  showToast('Avatar updated! ' + emoji, true);
}

function selectCustomPfp(url) {
  selectedPfp = '';
  customPfpUrl = url;
  localStorage.setItem('casino_pfp_url', url);
  localStorage.setItem('casino_pfp', '');
  if(window._firebaseSave) firebaseSave();
  applyPfp();
  closePfpPicker();
  showToast('Custom avatar set!', true);
}

async function handlePfpUpload(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/') && file.type !== 'image/gif') {
    showToast('❌ Please select an image or GIF file', false);
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showToast('❌ Image too large (max 5MB)', false);
    return;
  }
  
  showToast('⏳ Uploading avatar...', true);
  closePfpPicker();
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(UPLOAD_WORKER_URL + '/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Upload failed');
    }
    
    customPfpUrl = data.url;
    selectedPfp = '';
    localStorage.setItem('casino_pfp_url', customPfpUrl);
    localStorage.setItem('casino_pfp', '');
    
    
    if (window._currentPlayerId) {
      await window._fbUpdate('casino/players/' + window._currentPlayerId, { profilePicUrl: customPfpUrl });
    }
    if(window._firebaseSave) firebaseSave();
    applyPfp();
    showToast('✅ Custom avatar uploaded!', true);
  } catch(err) {
    console.error('PFP upload error:', err);
    showToast('❌ Upload failed: ' + err.message, false);
  }
  
  input.value = ''; 
}
function applyPfp() {
  const name = window._currentUsername || 'Guest';
  const init = name.charAt(0).toUpperCase();
  if (customPfpUrl) {
    document.getElementById('userAvatar').innerHTML = '<img src="' + customPfpUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    document.getElementById('profileAvatar').innerHTML = '<img src="' + customPfpUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
  } else if (selectedPfp) {
    document.getElementById('userAvatar').innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;">' + selectedPfp + '</div>';
    document.getElementById('profileAvatar').innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">' + selectedPfp + '</div>';
  } else {
    document.getElementById('userAvatar').innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="avG" x1="0" x2="1"><stop offset="0" stop-color="#00f0ff"/><stop offset="1" stop-color="#6b2fd9"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#avG)"/><text x="50" y="58" font-family="Orbitron,Inter,sans-serif" font-weight="900" font-size="48" fill="#fff" text-anchor="middle">${init}</text></svg>`;
    document.getElementById('profileAvatar').innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="profG" x1="0" x2="1"><stop offset="0" stop-color="#ffb86b"/><stop offset="1" stop-color="#ff6b6b"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#profG)"/><text x="50" y="60" font-family="Orbitron,Inter,sans-serif" font-weight="900" font-size="42" fill="#071028" text-anchor="middle">${init}</text></svg>`;
  }
}

function renderProfile() {
  const name = document.getElementById('userNameDisplay').textContent || 'PLAYER';
  document.getElementById('profileName').textContent = name;
  applyPfp();
  document.getElementById('profBalance').textContent = '$' + formatBalance(balance);
  document.getElementById('profGames').textContent = playerStats.gamesPlayed.toLocaleString();
  const profit = playerStats.totalProfit;
  const profEl = document.getElementById('profProfit');
  profEl.textContent = (profit >= 0 ? '+$' : '-$') + formatBalance(Math.abs(profit));
  profEl.style.color = profit >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('profWagered').textContent = '$' + formatBalance(playerStats.totalWagered);
  document.getElementById('profBiggest').textContent = '$' + formatBalance(playerStats.biggestWin);
  if (typeof getInventoryValue === 'function') {
    document.getElementById('profInvValue').textContent = '$' + getInventoryValue().toFixed(2);
  }
  
  const achs = getCasinoAch();
  const count = Object.keys(achs).length;
  document.getElementById('casinoAchCount').textContent = '(' + count + '/' + CASINO_ACHIEVEMENTS.length + ')';
  document.getElementById('casinoAchGrid').innerHTML = CASINO_ACHIEVEMENTS.map(a => {
    const done = !!achs[a.id];
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--surface);border:1px solid ${done?'var(--gold)':'var(--border)'};border-radius:6px;opacity:${done?1:0.35}">
      <span style="font-size:18px">${a.icon}</span>
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:bold;color:${done?'var(--gold)':'var(--text)'};letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.name}</div>
      <div style="font-size:9px;color:var(--text2)">${a.desc}</div></div>
      ${done ? '<span style="color:var(--green)">✓</span>' : ''}
    </div>`;
  }).join('');
  
  document.getElementById('profGameStats').innerHTML = Object.entries(gameStats).map(([name, s]) => {
    if (!s.played) return '';
    const wr = s.played > 0 ? Math.round((s.won / s.played) * 100) : 0;
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px;">
      <div style="font-size:10px;color:var(--text2);letter-spacing:1px;text-transform:uppercase">${name}</div>
      <div style="font-size:13px;color:var(--text);margin-top:2px">${s.played} played · ${wr}% WR</div>
      <div style="font-size:10px;color:var(--green)">Best: $${(s.biggestWin||0).toFixed(0)}</div>
    </div>`;
  }).filter(Boolean).join('');
  
  renderPrestige();
  
  const adminPanel = document.getElementById('adminPanel');
  const lowerName = name.toLowerCase();
  if (lowerName === 'mojheh' || lowerName === 'terpez') {
    adminPanel.style.display = 'block';
  } else {
    adminPanel.style.display = 'none';
  }
}


let prestigeLevel = 0;
const PRESTIGE_REQS = [10000, 50000, 250000, 1000000, 10000000]; 
const PRESTIGE_NAMES = ['Bronze','Silver','Gold','Diamond','Legendary'];
const PRESTIGE_COLORS = ['prestige-1','prestige-2','prestige-3','prestige-4','prestige-5'];

window._loadPrestige = (val) => { prestigeLevel = val || 0; };
window._getPrestige = () => prestigeLevel;

window._loadProfilePicUrl = (url) => { customPfpUrl = url || ''; localStorage.setItem('casino_pfp_url', customPfpUrl); if (customPfpUrl) { selectedPfp = ''; localStorage.setItem('casino_pfp', ''); } applyPfp(); };
window._getProfilePicUrl = () => customPfpUrl || null;

function getPrestigeReq() {
  if (prestigeLevel >= PRESTIGE_REQS.length) return PRESTIGE_REQS[PRESTIGE_REQS.length - 1] * Math.pow(5, prestigeLevel - PRESTIGE_REQS.length + 1);
  return PRESTIGE_REQS[prestigeLevel];
}


async function adminGiveMoney() {
  const _aName = (window._currentUsername||'').toLowerCase();
  if (_aName !== 'mojheh' && _aName !== 'terpez') {
    showToast('Admin only!', false);
    return;
  }
  const username = document.getElementById('adminUsername').value.trim();
  const amount = parseFloat(document.getElementById('adminAmount').value);
  if (!username || !amount || amount <= 0) {
    showToast('Invalid input!', false);
    return;
  }
  try {
    showToast('⏳ Processing...', true);
    
    const usersSnap = await window._fbGet('casino/usernames/' + username.toLowerCase());
    if (!usersSnap.exists()) {
      showToast('❌ User "' + username + '" not found!', false);
      return;
    }
    const userId = usersSnap.val();
    console.log('Found user:', userId);
    
    
    const playerSnap = await window._fbGet('casino/players/' + userId);
    const currentData = playerSnap.exists() ? playerSnap.val() : {};
    const currentBal = parseFloat(currentData.balance || 0);
    const newBal = currentBal + amount;
    
    console.log('Current balance:', currentBal, 'Adding:', amount, 'New balance:', newBal);
    
    
    await window._fbUpdate('casino/players/' + userId, {
      balance: newBal,
      lastAdminGift: {
        from: window._currentUsername,
        amount: amount,
        time: Date.now()
      }
    });
    
    console.log('Balance updated successfully for', username);
    showToast('✅ Gave $' + formatBalance(amount) + ' to ' + username + ' (' + newBal.toFixed(2) + ')', true);
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminAmount').value = '';
  } catch(e) {
    console.error('Admin give money error:', e);
    showToast('❌ Error: ' + (e.message || 'Unknown error'), false);
  }
}

async function adminSetSelfBalance() {
  const _aName2 = (window._currentUsername||'').toLowerCase();
  if (_aName2 !== 'mojheh' && _aName2 !== 'terpez') {
    showToast('Admin only!', false);
    return;
  }
  const amount = parseFloat(document.getElementById('adminSelfBalance').value);
  if (isNaN(amount) || amount < 0) {
    showToast('Invalid amount!', false);
    return;
  }
  try {
    showToast('⏳ Setting balance...', true);
    balance = amount;
    updateBalDisplay();
    
    
    await window._fbUpdate('casino/players/' + window._currentPlayerId, {
      balance: amount,
      lastBalanceSet: Date.now()
    });
    
    console.log('Self balance set to:', amount);
    showToast('✅ Balance set to $' + formatBalance(amount), true);
    document.getElementById('adminSelfBalance').value = '';
    renderProfile();
  } catch(e) {
    console.error('Admin set balance error:', e);
    showToast('❌ Error: ' + (e.message || 'Unknown'), false);
  }
}


async function _checkBan(uid) {
  try {
    const snap = await window._fbGet('casino/bans/' + uid);
    if (!snap.exists()) return null;
    const ban = snap.val();
    if (ban.expires && ban.expires > 0 && Date.now() > ban.expires) {
      window._fbRemove('casino/bans/' + uid);
      return null;
    }
    return ban;
  } catch(e) { return null; }
}

async function _checkMute(uid) {
  try {
    const snap = await window._fbGet('casino/mutes/' + uid);
    if (!snap.exists()) return null;
    const mute = snap.val();
    if (mute.expires && mute.expires > 0 && Date.now() > mute.expires) {
      window._fbRemove('casino/mutes/' + uid);
      return null;
    }
    return mute;
  } catch(e) { return null; }
}

function _showBanScreen(ban) {
  const scr = document.getElementById('banScreen');
  if (!scr) return;
  document.getElementById('banReason').textContent = 'Reason: ' + (ban.reason || 'No reason given');
  const expEl = document.getElementById('banExpiry');
  if (ban.expires && ban.expires > 0) {
    expEl.textContent = 'Expires: ' + new Date(ban.expires).toLocaleString();
  } else {
    expEl.textContent = 'This ban is permanent.';
  }
  scr.style.display = 'flex';
  const ls = document.getElementById('loginScreen');
  if (ls) ls.style.display = 'none';
  const tn = document.getElementById('topNav');
  if (tn) tn.style.display = 'none';
}

async function _isAdminUser() {
  const uname = (window._currentUsername || '').toLowerCase();
  if (uname === 'mojheh' || uname === 'terpez') return true;
  if (!window._currentPlayerId) return false;
  try {
    const snap = await window._fbGet('casino/admins/' + window._currentPlayerId);
    return snap.exists();
  } catch(e) { return false; }
}

async function _modLookupUid(username) {
  const snap = await window._fbGet('casino/usernames/' + username.toLowerCase());
  if (!snap.exists()) return null;
  return snap.val();
}

async function adminBanPlayer() {
  if (!await _isAdminUser()) { showToast('Admin only!', false); return; }
  const u = (document.getElementById('modTargetUser').value || '').trim();
  const reason = (document.getElementById('modReason').value || '').trim() || 'Admin ban';
  const hours = parseFloat(document.getElementById('modDuration').value) || 0;
  if (!u) { showToast('Enter a username!', false); return; }
  showToast('⏳ Processing...', true);
  const uid = await _modLookupUid(u);
  if (!uid) { showToast('User not found: ' + u, false); return; }
  const expires = hours > 0 ? Date.now() + hours * 3600000 : 0;
  await window._fbSet('casino/bans/' + uid, {
    reason, bannedBy: window._currentPlayerId,
    bannedByName: window._currentUsername, timestamp: Date.now(), expires
  });
  await window._fbSet('casino/modlog/' + Date.now(), {
    action: 'ban', target: u, targetUid: uid, reason, duration: hours + 'h',
    by: window._currentUsername, timestamp: Date.now()
  });
  showToast('🔨 Banned ' + u + (hours > 0 ? ' for ' + hours + 'h' : ' permanently'), true);
}

async function adminUnbanPlayer() {
  if (!await _isAdminUser()) { showToast('Admin only!', false); return; }
  const u = (document.getElementById('modTargetUser').value || '').trim();
  if (!u) { showToast('Enter a username!', false); return; }
  const uid = await _modLookupUid(u);
  if (!uid) { showToast('User not found: ' + u, false); return; }
  await window._fbRemove('casino/bans/' + uid);
  await window._fbSet('casino/modlog/' + Date.now(), {
    action: 'unban', target: u, targetUid: uid,
    by: window._currentUsername, timestamp: Date.now()
  });
  showToast('✅ Unbanned ' + u, true);
}

async function adminMutePlayer() {
  if (!await _isAdminUser()) { showToast('Admin only!', false); return; }
  const u = (document.getElementById('modTargetUser').value || '').trim();
  const reason = (document.getElementById('modReason').value || '').trim() || 'Admin mute';
  const minutes = parseFloat(document.getElementById('modDuration').value) || 60;
  if (!u) { showToast('Enter a username!', false); return; }
  showToast('⏳ Processing...', true);
  const uid = await _modLookupUid(u);
  if (!uid) { showToast('User not found: ' + u, false); return; }
  const expires = Date.now() + minutes * 60000;
  await window._fbSet('casino/mutes/' + uid, {
    reason, mutedBy: window._currentPlayerId,
    mutedByName: window._currentUsername, timestamp: Date.now(), expires
  });
  await window._fbSet('casino/modlog/' + Date.now(), {
    action: 'mute', target: u, targetUid: uid, reason, duration: minutes + 'min',
    by: window._currentUsername, timestamp: Date.now()
  });
  showToast('🔇 Muted ' + u + ' for ' + minutes + 'min', true);
}

async function adminUnmutePlayer() {
  if (!await _isAdminUser()) { showToast('Admin only!', false); return; }
  const u = (document.getElementById('modTargetUser').value || '').trim();
  if (!u) { showToast('Enter a username!', false); return; }
  const uid = await _modLookupUid(u);
  if (!uid) { showToast('User not found: ' + u, false); return; }
  await window._fbRemove('casino/mutes/' + uid);
  await window._fbSet('casino/modlog/' + Date.now(), {
    action: 'unmute', target: u, targetUid: uid,
    by: window._currentUsername, timestamp: Date.now()
  });
  showToast('🔊 Unmuted ' + u, true);
}

async function adminWarnPlayer() {
  if (!await _isAdminUser()) { showToast('Admin only!', false); return; }
  const u = (document.getElementById('modTargetUser').value || '').trim();
  const reason = (document.getElementById('modReason').value || '').trim() || 'Warned by admin';
  if (!u) { showToast('Enter a username!', false); return; }
  showToast('⏳ Processing...', true);
  const uid = await _modLookupUid(u);
  if (!uid) { showToast('User not found: ' + u, false); return; }
  const warnKey = Date.now().toString();
  await window._fbSet('casino/players/' + uid + '/warnings/' + warnKey, {
    reason, warnedBy: window._currentPlayerId,
    warnedByName: window._currentUsername, timestamp: Date.now()
  });
  await window._fbSet('casino/players/' + uid + '/notifications/' + warnKey, {
    type: 'warning', reason, from: window._currentUsername, timestamp: Date.now()
  });
  await window._fbSet('casino/modlog/' + Date.now(), {
    action: 'warn', target: u, targetUid: uid, reason,
    by: window._currentUsername, timestamp: Date.now()
  });
  showToast('⚠️ Warned ' + u, true);
}

function getPrestigeBadgeHTML(level) {
  if (!level || level <= 0) return '';
  const tier = Math.min(level, 5);
  const name = tier <= PRESTIGE_NAMES.length ? PRESTIGE_NAMES[tier - 1] : PRESTIGE_NAMES[PRESTIGE_NAMES.length - 1];
  const cls = tier <= PRESTIGE_COLORS.length ? PRESTIGE_COLORS[tier - 1] : PRESTIGE_COLORS[PRESTIGE_COLORS.length - 1];
  return `<span class="prestige-badge ${cls}">P${level} ${name}</span>`;
}

function renderPrestige() {
  const el = document.getElementById('profPrestigeLevel');
  if (el) el.textContent = prestigeLevel;
  const badge = document.getElementById('profilePrestigeBadge');
  if (badge) badge.innerHTML = prestigeLevel > 0 ? getPrestigeBadgeHTML(prestigeLevel) : '<span style="font-size:11px;color:var(--text2);">Not yet prestiged</span>';
  const req = getPrestigeReq();
  const reqEl = document.getElementById('prestigeReqText');
  if (reqEl) reqEl.textContent = 'Requires $' + formatBalance(req) + ' balance to prestige.';
  const btn = document.getElementById('prestigeBtn');
  if (btn) btn.disabled = balance < req;
}

function prestigeConfirm() {
  const req = getPrestigeReq();
  const currentBal = Number(balance) || 0;
  console.log('Prestige check - Current balance:', currentBal, 'Requirement:', req, 'Prestige level:', prestigeLevel);
  if (currentBal < req) { 
    showToast('Need $' + formatBalance(req) + ' to prestige! You have $' + formatBalance(currentBal), false); 
    return; 
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'prestige-confirm-overlay';
  overlay.innerHTML = `<div class="prestige-confirm-box">
    <div style="font-size:36px;margin-bottom:8px;">👑</div>
    <div style="font-family:'Orbitron';font-size:18px;color:var(--gold);margin-bottom:8px;">PRESTIGE UP?</div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:12px;">
      Your balance will reset to <b style="color:var(--gold);">$1,000</b><br>
      You'll go from <b>Prestige ${prestigeLevel}</b> → <b style="color:var(--gold);">Prestige ${prestigeLevel + 1}</b><br>
      <span style="color:var(--text2);font-size:10px;">Your inventory, stats and achievements are kept.</span>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;">
      <button onclick="this.closest('.prestige-confirm-overlay').remove()" style="padding:10px 20px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer;font-family:'Orbitron';font-size:11px;">CANCEL</button>
      <button onclick="prestigeExecute();this.closest('.prestige-confirm-overlay').remove()" style="padding:10px 20px;background:linear-gradient(135deg,var(--gold),#ff8800);border:none;border-radius:8px;color:#1a1a2e;cursor:pointer;font-family:'Orbitron';font-size:11px;font-weight:900;">👑 PRESTIGE</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function prestigeExecute() {
  const req = getPrestigeReq();
  const currentBal = Number(balance) || 0;
  if (currentBal < req) {
    showToast('Not enough balance! Need $' + formatBalance(req) + ', have $' + formatBalance(currentBal), false);
    return;
  }
  try {
    prestigeLevel++;
    balance = 1000;
    updateBalDisplay();
    console.log('Prestige executed! New level:', prestigeLevel, 'New balance:', balance);
    showToast('👑 PRESTIGE ' + prestigeLevel + '! Welcome to ' + (PRESTIGE_NAMES[Math.min(prestigeLevel, PRESTIGE_NAMES.length) - 1] || 'Legendary') + '!');
    playWinSound();
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 50);
    
    if (window._currentPlayerId && window._currentUsername) {
      window._fbSet('casino/leaderboards/prestige/' + window._currentPlayerId, {
        name: window._currentUsername,
        value: prestigeLevel,
        updated: Date.now()
      }).catch((err) => { console.error('Prestige leaderboard update failed:', err); });
    }
    firebaseSave();
    renderProfile();
    renderPrestige();
  } catch(e) {
    console.error('Prestige execute error:', e);
    showToast('❌ Error: ' + (e.message || 'Unknown'), false);
  }
}


let duelRoomUnsub = null;
let duelLobbyUnsub = null;
let currentDuelRoom = null;
let duelHistory = [];
try { duelHistory = JSON.parse(localStorage.getItem('casino_duel_history') || '[]'); } catch(e) { duelHistory = []; }

function duelGenCode() { return 'D' + Math.random().toString(36).substr(2, 6).toUpperCase(); }

async function duelCreate() {
  if (!window._currentPlayerId) { showToast('Login required!', false); return; }
  const wager = parseFloat(document.getElementById('duelWagerInput').value) || 100;
  if (wager < 10) { showToast('Minimum wager is $10', false); return; }
  if (wager > balance) { showToast('Not enough balance!', false); return; }
  const code = duelGenCode();
  balance -= wager;
  updateBalDisplay();
  try {
    await window._fbSet('casino/duelRooms/' + code, {
      host: window._currentPlayerId,
      hostName: window._currentUsername,
      hostPrestige: prestigeLevel,
      wager: wager,
      status: 'waiting',
      created: Date.now()
    });
    
    window._fbOnDisconnect('casino/duelRooms/' + code).remove();
    showToast('Duel created! Waiting for opponent...', true);
    playClickSound();
    duelWatchGame(code, wager);
  } catch(e) {
    balance += wager;
    updateBalDisplay();
    showToast('Failed to create duel: ' + (e.message || 'Unknown error'), false);
  }
}

async function duelJoin(code) {
  if (!window._currentPlayerId) { showToast('Login required!', false); return; }
  try {
    const snap = await window._fbGet('casino/duelRooms/' + code);
    if (!snap.exists()) { showToast('Duel not found!', false); return; }
    const room = snap.val();
    if (room.status !== 'waiting') { showToast('Duel already started!', false); return; }
    if (room.host === window._currentPlayerId) { showToast("Can't join your own duel!", false); return; }
    if (room.wager > balance) { showToast('Not enough balance!', false); return; }
    balance -= room.wager;
    updateBalDisplay();
    await window._fbUpdate('casino/duelRooms/' + code, {
      challenger: window._currentPlayerId,
      challengerName: window._currentUsername,
      challengerPrestige: prestigeLevel,
      status: 'playing'
    });
    playClickSound();
    
    duelWatchGame(code, room.wager);
  } catch(e) {
    balance += room.wager; updateBalDisplay();
    showToast('Failed to join duel: ' + (e.message || 'Unknown error'), false);
  }
}

let _duelAnimating = false;
let _duelResolved = false;

function duelPlayTick() { playSound(800, 'sine', .15, .04); }
function duelPlayBoom() { playSound(100, 'sawtooth', .5, .15); setTimeout(() => playSound(80, 'square', .4, .2), 80); }
function duelPlayDrum() { playSound(150, 'triangle', .3, .08); }
function duelPlaySuspense(i) {
  
  const freq = 300 + i * 60;
  playSound(freq, 'sine', .12, .06);
}

function duelWatchGame(code, wager) {
  currentDuelRoom = code;
  _duelAnimating = false;
  _duelResolved = false;
  const overlay = document.getElementById('duelGameOverlay');
  overlay.style.display = 'flex';
  document.getElementById('duelCloseBtn').style.display = 'none';
  document.getElementById('duelResultText').style.display = 'none';
  document.getElementById('duelCoin').style.display = 'none';
  document.getElementById('duelCoin').style.animation = 'none';
  document.getElementById('duelCountdown').style.display = 'none';
  document.getElementById('duelTensionBar').style.display = 'none';
  document.getElementById('duelStatusText').textContent = 'WAITING FOR OPPONENT...';
  document.getElementById('duelWagerText').textContent = '⚔️ $' + formatBalance(wager) + ' ON THE LINE ⚔️';
  document.getElementById('duelVsText').textContent = 'VS';
  document.getElementById('duelInner').classList.remove('duel-overlay-shake');

  if (duelRoomUnsub) { duelRoomUnsub(); duelRoomUnsub = null; }
  
  duelRoomUnsub = window._fbOnValue('casino/duelRooms/' + code, (snap) => {
    if (!snap.exists()) return;
    const room = snap.val();
    document.getElementById('duelP1Name').textContent = room.hostName || 'Host';
    document.getElementById('duelP2Name').textContent = room.challengerName || 'Waiting...';
    
    if (room.status === 'playing' && !room.result && !_duelAnimating) {
      _duelAnimating = true;
      document.getElementById('duelStatusText').textContent = 'OPPONENT FOUND!';
      
      if (room.host === window._currentPlayerId) {
        setTimeout(() => duelResolve(code), 7500);
      }
      
      if (room.challenger === window._currentPlayerId) {
        setTimeout(() => duelResolve(code), 12000);
      }
      
      setTimeout(async () => {
        const checkSnap = await window._fbGet('casino/duelRooms/' + code);
        if (checkSnap.exists() && !checkSnap.val().result) {
          
          duelResolve(code);
          
          setTimeout(async () => {
            const finalSnap = await window._fbGet('casino/duelRooms/' + code);
            if (finalSnap.exists() && !finalSnap.val().result) {
              balance += wager; updateBalDisplay();
              showToast('Duel timed out — wager refunded!', false);
              document.getElementById('duelGameOverlay').style.display = 'none';
              if (duelRoomUnsub) { duelRoomUnsub(); duelRoomUnsub = null; }
              window._fbRemove('casino/duelRooms/' + code).catch(()=>{});
            }
          }, 3000);
        }
      }, 20000);
      
      duelDramaticSequence(room);
    }
    
    if (room.result && !_duelResolved) {
      _duelResolved = true;
      duelShowResult(room);
    }
  });
}

function duelDramaticSequence(room) {
  const countdownEl = document.getElementById('duelCountdown');
  const coinEl = document.getElementById('duelCoin');
  const statusEl = document.getElementById('duelStatusText');
  const tensionBar = document.getElementById('duelTensionBar');
  const tensionFill = document.getElementById('duelTensionFill');
  
  
  countdownEl.style.display = 'block';
  let count = 3;
  countdownEl.textContent = count;
  countdownEl.style.animation = 'none';
  void countdownEl.offsetWidth;
  countdownEl.style.animation = 'duelCountPulse .5s ease-out';
  duelPlayTick();
  
  const countInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
      countdownEl.style.animation = 'none';
      void countdownEl.offsetWidth;
      countdownEl.style.animation = 'duelCountPulse .5s ease-out';
      duelPlayTick();
    } else if (count === 0) {
      countdownEl.textContent = '⚔️';
      countdownEl.style.animation = 'none';
      void countdownEl.offsetWidth;
      countdownEl.style.animation = 'duelCountPulse .5s ease-out';
      duelPlayBoom();
      
      
      const flash = document.getElementById('duelFlash');
      flash.style.background = 'white';
      flash.style.animation = 'duelFlashBang .4s ease-out forwards';
      setTimeout(() => { flash.style.animation = 'none'; }, 500);
      
      
      setTimeout(() => {
        countdownEl.style.display = 'none';
        coinEl.style.display = 'flex';
        coinEl.style.animation = 'duelCoinSpin .12s linear infinite';
        tensionBar.style.display = 'block';
        
        
        const gameOverlay = document.getElementById('duelGameOverlay');
        const fogTint = document.createElement('div');
        fogTint.style.position = 'absolute';
        fogTint.style.top = '0';
        fogTint.style.left = '0';
        fogTint.style.width = '100%';
        fogTint.style.height = '100%';
        fogTint.style.pointerEvents = 'none';
        fogTint.style.background = 'radial-gradient(ellipse at center, transparent 0%, rgba(30,58,138,0.3) 100%)';
        fogTint.style.opacity = '0';
        gameOverlay.appendChild(fogTint);
        
        duelPlayDrum();
        
        
        let tensionStep = 0;
        const tensionTotal = 40;
        const tensionInterval = setInterval(() => {
          tensionStep++;
          const pct = Math.min((tensionStep / tensionTotal) * 100, 100);
          tensionFill.style.width = pct + '%';
          
          
          const eased = (tensionStep / tensionTotal);
          const speed = 0.12 + eased * eased * 2.0; 
          coinEl.style.animation = 'duelCoinSpin ' + speed.toFixed(3) + 's linear infinite';
          
          
          const glowIntensity = 8 + Math.sin(tensionStep / 8) * 6;
          coinEl.style.filter = 'drop-shadow(0 0 ' + glowIntensity + 'px rgba(255, 200, 0, 0.7)) saturate(1.2)';
          
          
          if (tensionStep < tensionTotal - 5) {
            const saturation = 0.9 + Math.sin(tensionStep / 4) * 0.15;
            gameOverlay.style.filter = 'saturate(' + saturation + ') brightness(1.05)';
          }
          
          
          fogTint.style.opacity = (pct / 100 * 0.6).toFixed(3);
          
          
          if (tensionStep % 3 === 0) duelPlaySuspense(tensionStep / 3);
          
          
          if (tensionStep >= tensionTotal - 7) {
            coinEl.style.animation = 'duelCoinSpin 3s linear infinite';
          }
          
          if (tensionStep >= tensionTotal) {
            clearInterval(tensionInterval);
            
            tensionBar.style.display = 'none';
            gameOverlay.style.filter = 'saturate(1) brightness(1)';
            fogTint.style.opacity = '0';
            setTimeout(()=>{ fogTint.remove(); }, 500);
          }
        }, 85);
      }, 600);
      
      clearInterval(countInterval);
    }
  }, 1000);
}

async function duelResolve(code) {
  const snap = await window._fbGet('casino/duelRooms/' + code);
  if (!snap.exists()) return;
  const room = snap.val();
  if (room.result) return; 
  
  
  const flip = Math.random() < 0.5 ? 'heads' : 'tails';
  const winnerId = flip === 'heads' ? room.host : room.challenger;
  const winnerName = flip === 'heads' ? room.hostName : room.challengerName;
  const loserId = flip === 'heads' ? room.challenger : room.host;
  const loserName = flip === 'heads' ? room.challengerName : room.hostName;
  const pot = room.wager * 2;
  
  await window._fbUpdate('casino/duelRooms/' + code, {
    result: flip,
    winner: winnerId,
    winnerName: winnerName,
    loserId: loserId,
    loserName: loserName,
    pot: pot,
    status: 'finished',
    finishedAt: Date.now()
  });
}

function duelShowResult(room) {
  const coin = document.getElementById('duelCoin');
  const inner = document.getElementById('duelInner');
  const flash = document.getElementById('duelFlash');
  const statusEl = document.getElementById('duelStatusText');
  const resultEl = document.getElementById('duelResultText');
  const isWinner = room.winner === window._currentPlayerId;
  const isLoser = room.loserId === window._currentPlayerId;
  
  
  duelPlayBoom();
  inner.classList.remove('duel-overlay-shake');
  void inner.offsetWidth;
  inner.classList.add('duel-overlay-shake');
  
  
  flash.style.background = isWinner ? '#00e676' : isLoser ? '#ff1744' : '#ffd700';
  flash.style.animation = 'duelFlashBang .6s ease-out forwards';
  setTimeout(() => { flash.style.animation = 'none'; }, 700);
  
  
  coin.style.animation = room.result === 'heads' ? 'duelCoinRevealHeads .8s ease-out forwards' : 'duelCoinRevealTails .8s ease-out forwards';
  
  
  setTimeout(() => {
    resultEl.style.display = 'block';
    resultEl.className = 'duel-result duel-result-reveal';
    statusEl.textContent = room.result === 'heads' ? '🟡 HEADS! 🟡' : '⚫ TAILS! ⚫';
    
    if (isWinner) {
      resultEl.textContent = '💰 YOU WIN! 💰';
      resultEl.style.color = '#00e676';
      resultEl.classList.add('duel-win-glow');
      
      setTimeout(() => {
        playSound(200, 'square', .4, .1);
        setTimeout(() => playSound(300, 'square', .4, .1), 100);
        setTimeout(() => playSound(400, 'square', .4, .1), 200);
        setTimeout(() => playSound(600, 'square', .5, .15), 300);
        setTimeout(() => playSound(800, 'sine', .3, .2), 400);
      }, 100);
      
      balance += room.pot;
      updateBalDisplay();
      showBigWin(room.pot);
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 60);
      setTimeout(() => spawnParticles(window.innerWidth / 3, window.innerHeight / 2, 30), 200);
      setTimeout(() => spawnParticles(window.innerWidth * 2 / 3, window.innerHeight / 2, 30), 400);
      showToast('🎉 +$' + formatBalance(room.pot) + ' from duel!');
      recordGame('duels', room.wager, room.pot);
      
      let flashCount = 0;
      const flashInterval = setInterval(() => {
        flash.style.background = '#00e676';
        flash.style.animation = 'duelFlashBang .3s ease-out forwards';
        setTimeout(() => { flash.style.animation = 'none'; }, 350);
        flashCount++;
        if (flashCount >= 3) clearInterval(flashInterval);
      }, 400);
    } else if (isLoser) {
      resultEl.textContent = '💀 YOU LOSE 💀';
      resultEl.style.color = '#ff1744';
      playLoseSound();
      recordGame('duels', room.wager, 0);
    } else {
      resultEl.textContent = room.winnerName + ' WINS!';
      resultEl.style.color = 'var(--gold)';
    }
    
    
    document.getElementById('duelWagerText').textContent = room.winnerName + ' takes $' + formatBalance(room.pot) + '!';
  }, 400);
  
  document.getElementById('duelCloseBtn').style.display = '';
  
  
  duelHistory.unshift({ winner: room.winnerName, loser: room.loserName, pot: room.pot, time: Date.now() });
  if (duelHistory.length > 20) duelHistory.length = 20;
  localStorage.setItem('casino_duel_history', JSON.stringify(duelHistory));
  
  
  if (isWinner && room.pot >= 500 && window._broadcastWin) {
    window._broadcastWin(window._currentUsername, 'Duel', room.pot);
  }
  
  
  if (room.host === window._currentPlayerId) {
    setTimeout(() => {
      window._fbRemove('casino/duelRooms/' + currentDuelRoom).catch(() => {});
    }, 10000);
  }
  
  if (duelRoomUnsub) { duelRoomUnsub(); duelRoomUnsub = null; }
  firebaseSave();
}

function duelCloseOverlay() {
  document.getElementById('duelGameOverlay').style.display = 'none';
  currentDuelRoom = null;
  duelLoadLobby();
}

function duelLoadLobby() {
  
  if (duelLobbyUnsub) { clearInterval(duelLobbyUnsub); duelLobbyUnsub = null; }
  async function _pollDuels() {
    try {
      const snap = await window._fbGet('casino/duelRooms');
      const list = document.getElementById('duelList');
      if (!list) return;
      if (!snap.exists()) {
        list.innerHTML = '<div style="text-align:center;color:var(--text2);font-size:12px;padding:20px;">No open duels. Create one!</div>';
        return;
      }
      const rooms = snap.val();
      let html = '';
      let hasOpen = false;
      Object.entries(rooms).forEach(([code, room]) => {
        if (room.status !== 'waiting') return;
        if (Date.now() - room.created > 300000) return;
        hasOpen = true;
        const isHost = room.host === window._currentPlayerId;
        const badge = room.hostPrestige > 0 ? getPrestigeBadgeHTML(room.hostPrestige) : '';
        html += `<div class="duel-card">
          <div>
            <div class="duel-host">${escapeHtml(room.hostName || 'Unknown')} ${badge}</div>
            <div style="font-size:10px;color:var(--text2);">${isHost ? 'Your duel — waiting...' : 'Open duel'}</div>
          </div>
          <div class="duel-wager">$${formatBalance(room.wager)}</div>
          ${isHost
            ? `<button class="duel-join" style="background:var(--red);" onclick="duelCancel('${code}')">CANCEL</button>`
            : `<button class="duel-join" onclick="duelJoin('${code}')">JOIN ⚔️</button>`}
        </div>`;
      });
      if (!hasOpen) {
        html = '<div style="text-align:center;color:var(--text2);font-size:12px;padding:20px;">No open duels. Create one!</div>';
      }
      list.innerHTML = html;
    } catch(e) {}
  }
  _pollDuels();
  duelLobbyUnsub = setInterval(_pollDuels, 5000);
  
  
  renderDuelHistory();
}

async function duelCancel(code) {
  const snap = await window._fbGet('casino/duelRooms/' + code);
  if (snap.exists()) {
    const room = snap.val();
    if (room.host === window._currentPlayerId && room.status === 'waiting') {
      balance += room.wager; 
      updateBalDisplay();
      await window._fbRemove('casino/duelRooms/' + code);
      showToast('Duel cancelled, wager refunded.', true);
    }
  }
}

function renderDuelHistory() {
  const el = document.getElementById('duelHistory');
  if (!el) return;
  if (duelHistory.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);font-size:11px;padding:8px;">No duels yet.</div>';
    return;
  }
  el.innerHTML = duelHistory.slice(0, 10).map(d => {
    const ago = Math.floor((Date.now() - d.time) / 60000);
    const timeStr = ago < 1 ? 'just now' : ago + 'm ago';
    return `<div class="duel-history-item">
      <span style="color:var(--green);">${escapeHtml(d.winner)}</span>
      <span style="color:var(--text2);">beat</span>
      <span style="color:var(--red);">${escapeHtml(d.loser)}</span>
      <span style="color:var(--gold);font-family:'Orbitron';">$${formatBalance(d.pot)}</span>
      <span style="color:var(--text2);">${timeStr}</span>
    </div>`;
  }).join('');
}


let tradeHistory = [];
try { tradeHistory = JSON.parse(localStorage.getItem('casino_trade_history') || '[]'); } catch(e) { tradeHistory = []; }
let _tradeRequestUnsub = null;
let _tradePartner = '';

function openTradeOverlay() {
  playClickSound();
  document.getElementById('tradeOverlay').style.display = 'block';
  tradeGoToStep(1);
  loadIncomingTrades();
  loadTradeRequests();
}
function closeTradeOverlay() {
  document.getElementById('tradeOverlay').style.display = 'none';
  if (_tradeRequestUnsub) { _tradeRequestUnsub(); _tradeRequestUnsub = null; }
}

function showTradePanel() { openTradeOverlay(); }

function openStoreOverlay() {
  playClickSound();
  document.getElementById('storeOverlay').style.display = 'block';
  storePopulateListSelect();
  loadStoreListings();
}
function closeStoreOverlay() {
  document.getElementById('storeOverlay').style.display = 'none';
}
function showStorePanel() { openStoreOverlay(); }

function tradeGoToStep(n) {
  document.getElementById('tradeStep1').style.display = n === 1 ? 'block' : 'none';
  document.getElementById('tradeStep2').style.display = n === 2 ? 'block' : 'none';
  document.getElementById('tradeStep3').style.display = n === 3 ? 'block' : 'none';
  if (n === 1) {
    document.getElementById('tradeRecipient').value = '';
    document.getElementById('tradeUserStatus').textContent = '';
    document.getElementById('tradeRequestBtn').disabled = true;
    document.getElementById('tradeRequestBtn').style.opacity = '0.5';
    if (_tradeRequestUnsub) { _tradeRequestUnsub(); _tradeRequestUnsub = null; }
  }
}


(function() {
  const inp = document.getElementById('tradeRecipient');
  if (!inp) return;
  let debounce;
  inp.addEventListener('input', () => {
    const btn = document.getElementById('tradeRequestBtn');
    const st = document.getElementById('tradeUserStatus');
    clearTimeout(debounce);
    const u = inp.value.trim().toLowerCase();
    if (u.length < 2) { btn.disabled = true; btn.style.opacity = '0.5'; st.textContent = ''; return; }
    st.textContent = 'Checking...';
    st.style.color = 'var(--text2)';
    debounce = setTimeout(async () => {
      if (!window._sendTradeRequest) { st.textContent = 'Login first'; st.style.color = 'var(--red)'; return; }
      try {
        
        const nameSnap = await window._checkUsernameExists(u);
        if (nameSnap) {
          st.innerHTML = '✅ <strong style="color:var(--neon);">' + u + '</strong> found';
          st.style.color = 'var(--green)';
          btn.disabled = false;
          btn.style.opacity = '1';
        } else {
          st.textContent = '❌ Player not found';
          st.style.color = 'var(--red)';
          btn.disabled = true;
          btn.style.opacity = '0.5';
        }
      } catch(e) { st.textContent = 'Error checking'; st.style.color = 'var(--red)'; }
    }, 500);
  });
})();

async function tradeRequestSend() {
  const u = document.getElementById('tradeRecipient').value.trim().toLowerCase();
  const st = document.getElementById('tradeUserStatus');
  if (!u) return;
  if (!window._sendTradeRequest) { st.textContent = 'Login first'; st.style.color = 'var(--red)'; return; }
  st.textContent = '⏳ Sending request...';
  try {
    const res = await window._sendTradeRequest(u);
    if (res.error) { st.textContent = '❌ ' + res.error; st.style.color = 'var(--red)'; return; }
    _tradePartner = u;
    document.getElementById('tradeWaitingFor').textContent = u;
    tradeGoToStep(2);
    
    let dots = 0;
    const dotsEl = document.getElementById('tradeWaitDots');
    const dotsI = setInterval(() => { dots = (dots + 1) % 4; dotsEl.textContent = '.'.repeat(dots + 1); }, 600);
    
    _tradeRequestUnsub = window._listenTradeRequestResponse(res.recipientUid, res.requestId,
      async () => { 
        clearInterval(dotsI);
        document.getElementById('tradePartnerName').textContent = u;
        
        const tradeId = await window._createLiveTrade(res.recipientUid, u);
        if (tradeId) {
          _liveTradeId = tradeId;
          _liveTradeIsHost = true;
          _liveTradePartner = u;
          tradeGoToStep(3);
          populateTradeSelect();
          startLiveTradeListener(tradeId);
        }
        showToast('🤝 ' + u + ' accepted! Live trade started!', true);
      },
      () => { 
        clearInterval(dotsI);
        showToast('❌ ' + u + ' declined your trade request', false);
        tradeGoToStep(1);
      }
    );
  } catch(e) { st.textContent = '❌ Error'; st.style.color = 'var(--red)'; }
}

function tradeCancelRequest() {
  if (_tradeRequestUnsub) { _tradeRequestUnsub(); _tradeRequestUnsub = null; }
  tradeGoToStep(1);
  showToast('Trade request cancelled');
}

function tradeCancelSession() {
  if (_tradeRequestUnsub) { _tradeRequestUnsub(); _tradeRequestUnsub = null; }
  if (_liveTradeUnsub) { try { _liveTradeUnsub(); } catch(e) {} _liveTradeUnsub = null; }
  if (_liveTradeId) { window._fbUpdate('casino/liveTrades/' + _liveTradeId, { status: 'cancelled' }); }
  _liveTradeId = null;
  tradeGoToStep(1);
}


let _liveTradeId = null;
let _liveTradeIsHost = false;
let _liveTradePartner = '';
let _liveTradeUnsub = null;
let _liveTradeMyItems = []; 
let _liveTradeReady = false;

function startLiveTradeListener(tradeId) {
  if (_liveTradeUnsub) { try { _liveTradeUnsub(); } catch(e) {} }
  _liveTradeMyItems = [];
  _liveTradeReady = false;
  
  _liveTradeUnsub = window._fbOnValue('casino/liveTrades/' + tradeId, snap => {
    const t = snap.val();
    if (!t) return;
    
    if (t.status === 'cancelled') {
      showToast('Trade was cancelled', false);
      if (_liveTradeUnsub) { try { _liveTradeUnsub(); } catch(e) {} _liveTradeUnsub = null; }
      tradeGoToStep(1);
      return;
    }
    
    if (t.status === 'completed') {
      showToast('🤝 Trade completed successfully!', true);
      if (_liveTradeUnsub) { try { _liveTradeUnsub(); } catch(e) {} _liveTradeUnsub = null; }
      
      if (typeof checkPendingRefunds === 'function') setTimeout(checkPendingRefunds, 1000);
      tradeGoToStep(1);
      return;
    }
    
    
    const isHost = _liveTradeIsHost;
    const theirOffer = isHost ? t.guestOffer : t.hostOffer;
    const theirReady = isHost ? t.guestReady : t.hostReady;
    const myReady = isHost ? t.hostReady : t.guestReady;
    
    
    const theirItemsEl = document.getElementById('liveTradeTheirItems');
    const theirItems = (theirOffer?.items || '').split(',').filter(Boolean);
    if (theirItems.length === 0) {
      theirItemsEl.textContent = 'No items offered';
    } else {
      theirItemsEl.innerHTML = theirItems.map(id => {
        const cat = (typeof ITEM_CATALOG !== 'undefined') ? ITEM_CATALOG[id] : null;
        return cat ? `<span style="margin-right:4px;">${cat.icon} ${cat.name}</span>` : id;
      }).join('<br>');
    }
    
    
    document.getElementById('liveTradeTheirCash').textContent = '$' + Math.floor(theirOffer?.cash || 0).toLocaleString();
    
    
    document.getElementById('liveTradeTheirReadyStatus').innerHTML = theirReady ? 
      '<span style="color:var(--green);">✅ LOCKED IN</span>' : 
      '<span style="color:var(--text2);">⏳ Not locked in</span>';
    
    
    document.getElementById('liveTradeConfirmArea').style.display = (myReady && theirReady) ? 'block' : 'none';
  });
}

function liveTradeAddItem() {
  if (_liveTradeReady) return; 
  const sel = document.getElementById('tradeItemSelect');
  const invId = parseInt(sel.value);
  if (!invId) return;
  
  const item = inventory.find(x => x.id === invId);
  if (!item) return;
  
  
  if (_liveTradeMyItems.includes(item.itemId)) {
    showToast('Item already in offer', false);
    return;
  }
  
  _liveTradeMyItems.push(item.itemId);
  sel.value = '';
  liveTradeUpdateMyDisplay();
  liveTradeSync();
}

function liveTradeRemoveItem(idx) {
  if (_liveTradeReady) return;
  _liveTradeMyItems.splice(idx, 1);
  liveTradeUpdateMyDisplay();
  liveTradeSync();
}

function liveTradeUpdateMyDisplay() {
  const el = document.getElementById('liveTradeMyItems');
  if (_liveTradeMyItems.length === 0) {
    el.textContent = 'No items added';
    return;
  }
  el.innerHTML = _liveTradeMyItems.map((id, i) => {
    const cat = (typeof ITEM_CATALOG !== 'undefined') ? ITEM_CATALOG[id] : null;
    const name = cat ? `${cat.icon} ${cat.name}` : id;
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">${name} <button onclick="liveTradeRemoveItem(${i})" style="padding:1px 6px;background:var(--red);border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:9px;">✕</button></div>`;
  }).join('');
}

function liveTradeUpdateCash() {
  if (_liveTradeReady) return;
  liveTradeSync();
}

async function liveTradeSync() {
  if (!_liveTradeId) return;
  const offerKey = _liveTradeIsHost ? 'hostOffer' : 'guestOffer';
  const cash = Math.max(0, parseInt(document.getElementById('tradeCashAmount').value) || 0);
  await window._fbUpdate('casino/liveTrades/' + _liveTradeId, {
    [offerKey]: {
      items: _liveTradeMyItems.join(','),
      cash: cash
    },
    [_liveTradeIsHost ? 'hostReady' : 'guestReady']: false
  });
  _liveTradeReady = false;
  document.getElementById('liveTradeReadyBtn').textContent = '✅ LOCK IN';
  document.getElementById('liveTradeReadyBtn').style.background = 'linear-gradient(135deg,#00cc66,#009944)';
}

async function liveTradeToggleReady() {
  if (!_liveTradeId) return;
  _liveTradeReady = !_liveTradeReady;
  const key = _liveTradeIsHost ? 'hostReady' : 'guestReady';
  await window._fbUpdate('casino/liveTrades/' + _liveTradeId, { [key]: _liveTradeReady });
  
  if (_liveTradeReady) {
    document.getElementById('liveTradeReadyBtn').textContent = '🔓 UNLOCK';
    document.getElementById('liveTradeReadyBtn').style.background = 'linear-gradient(135deg,#ff4444,#cc0000)';
  } else {
    document.getElementById('liveTradeReadyBtn').textContent = '✅ LOCK IN';
    document.getElementById('liveTradeReadyBtn').style.background = 'linear-gradient(135deg,#00cc66,#009944)';
  }
}

async function liveTradeExecute() {
  if (!_liveTradeId) return;
  const statusEl = document.getElementById('tradeStatus');
  statusEl.textContent = '⏳ Executing trade...';
  
  
  const myItemsCopy = [..._liveTradeMyItems];
  for (const itemId of myItemsCopy) {
    const idx = inventory.findIndex(x => x.itemId === itemId);
    if (idx >= 0) inventory.splice(idx, 1);
  }
  
  
  const cash = Math.max(0, parseInt(document.getElementById('tradeCashAmount').value) || 0);
  if (cash > 0) { balance -= cash; updateBalDisplay(); }
  
  const res = await window._executeLiveTrade(_liveTradeId);
  if (res.error) {
    statusEl.textContent = '❌ ' + res.error;
    statusEl.style.color = 'var(--red)';
    
    return;
  }
  
  statusEl.textContent = '✅ Trade completed!';
  statusEl.style.color = 'var(--green)';
  firebaseSave();
  
}

async function loadTradeRequests() {
  if (!window._loadTradeRequests) return;
  try {
    const reqs = await window._loadTradeRequests();
    
    const div = document.getElementById('incomingTrades');
    if (reqs.length > 0) {
      const reqHtml = reqs.map((r, idx) => {
        const dataId = 'tradeReq_' + idx;
        window[dataId] = { requestId: r.id, fromName: r.from, fromUid: r.fromUid };
        return `<div style="background:var(--bg);border:1px solid rgba(0,230,118,.4);border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;">
          <div style="font-size:28px;">🤝</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:13px;color:var(--green);">Trade Request</div>
            <div style="font-size:11px;color:var(--text2);">From <strong style="color:var(--neon);">${r.from}</strong></div>
            <div style="font-size:10px;color:var(--text2);margin-top:2px;">${new Date(r.ts).toLocaleString()}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <button onclick="handleTradeResponse('${dataId}', true)" style="padding:6px 14px;background:linear-gradient(135deg,#00cc66,#009944);border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:'Orbitron';">ACCEPT</button>
            <button onclick="handleTradeResponse('${dataId}', false)" style="padding:4px 12px;background:transparent;border:1px solid var(--red);border-radius:6px;color:var(--red);cursor:pointer;font-size:10px;">DECLINE</button>
          </div>
        </div>`;
      }).join('');
      
      const existing = div.innerHTML;
      if (existing.includes('No pending')) div.innerHTML = reqHtml;
      else div.innerHTML = reqHtml + existing;
    }
  } catch(e) {}
}

async function handleTradeResponse(dataId, accepted) {
  const data = window[dataId];
  if (!data) return;
  await respondTradeRequest(data.requestId, data.fromName, data.fromUid, accepted);
}

async function respondTradeRequest(reqId, fromName, fromUid, accepted) {
  if (!window._respondTradeRequest) return;
  await window._respondTradeRequest(reqId, accepted);
  if (accepted) {
    showToast('✅ Accepted! Starting live trade with ' + fromName, true);
    _liveTradePartner = fromName;
    _liveTradeIsHost = false;
    
    switchTradeTab('send', document.getElementById('tradeSendTab'));
    document.getElementById('tradePartnerName').textContent = fromName;
    tradeGoToStep(3);
    populateTradeSelect();
    
    let pollCount = 0;
    const pollForLive = setInterval(async () => {
      pollCount++;
      if (pollCount > 60) { clearInterval(pollForLive); showToast('Trade session timeout', false); tradeGoToStep(1); return; }
      try {
        const snap = await window._fbGet('casino/liveTrades');
        if (!snap.exists()) return;
        const trades = snap.val();
        for (const [tid, t] of Object.entries(trades)) {
          if (t.guest === window._currentPlayerId && t.host !== window._currentPlayerId && t.status === 'active' && Date.now() - t.created < 60000) {
            clearInterval(pollForLive);
            _liveTradeId = tid;
            startLiveTradeListener(tid);
            return;
          }
        }
      } catch(e) {}
    }, 1000);
  } else {
    showToast('Declined trade request from ' + fromName, false);
  }
  loadIncomingTrades();
  loadTradeRequests();
}

function switchTradeTab(tab, btn) {
  document.querySelectorAll('#tradePanel .inv-tab').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('tradeSendView').style.display = tab === 'send' ? 'block' : 'none';
  document.getElementById('tradeInboxView').style.display = tab === 'inbox' ? 'block' : 'none';
  document.getElementById('tradeHistoryView').style.display = tab === 'history' ? 'block' : 'none';
  document.getElementById('giftView').style.display = tab === 'gift' ? 'block' : 'none';
  if (tab === 'send') tradeGoToStep(1);
  if (tab === 'inbox') { loadIncomingTrades(); loadTradeRequests(); }
  if (tab === 'history') renderTradeHistory();
  if (tab === 'gift') { document.getElementById('giftUsername').focus(); }
}


function quickGiftAmount(amt) {
  document.getElementById('giftAmount').value = amt;
}

async function sendGift() {
  const statusEl = document.getElementById('giftStatus');
  const usernameEl = document.getElementById('giftUsername');
  const amountEl = document.getElementById('giftAmount');
  
  const username = usernameEl.value.trim();
  const amount = parseFloat(amountEl.value);
  
  if (!username) {
    statusEl.textContent = '❌ Please enter a username';
    statusEl.style.color = 'var(--red)';
    return;
  }
  
  if (!amount || amount < 1) {
    statusEl.textContent = '❌ Invalid amount (minimum $1)';
    statusEl.style.color = 'var(--red)';
    return;
  }
  
  statusEl.textContent = '⏳ Processing gift...';
  statusEl.style.color = 'var(--text2)';
  
  const result = await window._giftMoney(username, amount);
  
  if (result.error) {
    statusEl.textContent = '❌ ' + result.error;
    statusEl.style.color = 'var(--red)';
  } else {
    statusEl.textContent = '✅ Gift sent! Your balance: $' + Math.floor(result.newBalance);
    statusEl.style.color = 'var(--green)';
    usernameEl.value = '';
    amountEl.value = '';
    showToast('💝 Sent $' + Math.floor(amount) + ' to ' + username + '!', true);
    
    balance = result.newBalance; updateBalDisplay(); firebaseSave();
    setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);
  }
}


function openLoanOverlay() { showToast('Loans have been removed!', false); }
function closeLoanOverlay() {}
function switchLoanTab() {}
function takeBankLoan() { showToast('Loans have been removed!', false); }
function enforceBankLoanRepayment() {}
function repayLoan() {}
function sendPlayerLoan() {}
function loadMyLoans() {}

function populateTradeSelect() {
  const sel = document.getElementById('tradeItemSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select an item...</option>';
  inventory.forEach(item => {
    const cat = ITEM_CATALOG ? ITEM_CATALOG[item.itemId] : null;
    const name = cat ? (cat.icon + ' ' + cat.name) : item.itemId;
    const val = typeof getItemMarketValue === 'function' ? getItemMarketValue(item.itemId) : 0;
    sel.innerHTML += '<option value="' + item.id + '">' + name + ' ($' + val.toFixed(0) + ')</option>';
  });
  sel.onchange = updateTradePreview;
}

function updateTradePreview() {
  const sel = document.getElementById('tradeItemSelect');
  const preview = document.getElementById('tradeItemPreview');
  const invId = parseInt(sel.value);
  if (!invId) { preview.innerHTML = '<div style="color:var(--text2);font-size:12px;">Select an item above</div>'; updateTradeSummary(); return; }
  const item = inventory.find(x => x.id === invId);
  if (!item) { preview.innerHTML = '<div style="color:var(--red);font-size:12px;">Item not found</div>'; return; }
  const cat = ITEM_CATALOG[item.itemId];
  if (!cat) { preview.innerHTML = '<div style="color:var(--text2);">Unknown</div>'; return; }
  const val = typeof getItemMarketValue === 'function' ? getItemMarketValue(item.itemId) : cat.baseValue;
  const rar = RARITY[cat.rarity];
  preview.innerHTML = '<div style="font-size:36px;">' + cat.icon + '</div>'
    + '<div style="font-weight:700;font-size:14px;color:' + rar.color + ';">' + cat.name + '</div>'
    + '<div style="font-size:10px;color:' + rar.color + ';letter-spacing:1px;">' + rar.label.toUpperCase() + '</div>'
    + '<div style="font-family:Orbitron;font-size:16px;color:var(--gold);margin-top:4px;">$' + val.toFixed(2) + '</div>'
    + '<div style="height:3px;width:100%;background:' + rar.color + ';border-radius:2px;margin-top:4px;opacity:.6;"></div>';
  updateTradeSummary();
}

function updateTradeSummary() {
  const summary = document.getElementById('tradeSummary');
  if (!summary) return;
  const invId = parseInt((document.getElementById('tradeItemSelect') || {}).value || '0');
  const cash = parseFloat((document.getElementById('tradeCashAmount') || {}).value || '0') || 0;
  if (!invId && cash <= 0) { summary.innerHTML = '<div style="color:var(--text2);font-size:11px;text-align:center;">Select items above</div>'; return; }
  let html = '<div style="font-size:11px;color:var(--text2);margin-bottom:6px;">TRADE SUMMARY</div>';
  if (invId) {
    const item = inventory.find(x => x.id === invId);
    const cat = item ? ITEM_CATALOG[item.itemId] : null;
    if (cat) {
      const val = typeof getItemMarketValue === 'function' ? getItemMarketValue(item.itemId) : cat.baseValue;
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="font-size:16px;">' + cat.icon + '</span><span style="font-size:12px;font-weight:600;">' + cat.name + '</span><span style="font-size:11px;color:var(--gold);margin-left:auto;">$' + val.toFixed(0) + '</span></div>';
    }
  }
  if (cash > 0) html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="font-size:16px;">💵</span><span style="font-size:12px;font-weight:600;">Cash</span><span style="font-size:11px;color:var(--gold);margin-left:auto;">$' + cash.toFixed(0) + '</span></div>';
  html += '<div style="font-size:11px;color:var(--text2);margin-top:6px;border-top:1px solid var(--border);padding-top:6px;">To: <strong style="color:var(--neon);">' + _tradePartner + '</strong></div>';
  summary.innerHTML = html;
}


setTimeout(() => {
  ['tradeCashAmount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateTradeSummary);
  });
}, 100);

async function sendTrade() {
  const invId = parseInt(document.getElementById('tradeItemSelect').value);
  const cash = parseFloat(document.getElementById('tradeCashAmount').value) || 0;
  const message = (document.getElementById('tradeMessage') || {}).value || '';
  const status = document.getElementById('tradeStatus');
  if (!_tradePartner) { status.textContent = '⚠ No trade partner'; status.style.color = 'var(--red)'; return; }
  if (!invId && cash <= 0) { status.textContent = '⚠ Select an item or add cash'; status.style.color = 'var(--red)'; return; }
  if (cash > balance) { status.textContent = '⚠ Not enough balance'; status.style.color = 'var(--red)'; return; }
  if (!window._sendTradeOffer) { status.textContent = '⚠ Not logged in'; status.style.color = 'var(--red)'; return; }
  status.textContent = '⏳ Sending...';
  try {
    const item = invId ? inventory.find(x => x.id === invId) : null;
    if (invId && !item) throw new Error('Item not found');
    const res = await window._sendTradeOffer(_tradePartner, item || { itemId: '_cash_' }, cash, message.trim());
    if (res.error) throw new Error(res.error);
    if (item) removeFromInventory(invId);
    if (cash > 0) { balance -= cash; updateBalDisplay(); }
    const cat = item ? ITEM_CATALOG[item.itemId] : null;
    tradeHistory.unshift({ type: 'sent', to: _tradePartner, itemName: cat ? cat.name : (cash > 0 ? 'Cash' : 'Unknown'), itemIcon: cat ? cat.icon : '💵', cash, message: message.trim(), ts: Date.now() });
    if (tradeHistory.length > 50) tradeHistory = tradeHistory.slice(0, 50);
    try { localStorage.setItem('casino_trade_history', JSON.stringify(tradeHistory)); } catch(e) {}
    renderInventory(); populateTradeSelect();
    status.textContent = '✅ Sent to ' + _tradePartner + '!';
    status.style.color = 'var(--green)';
    showToast('📦 Trade sent to ' + _tradePartner, true);
    firebaseSave();
    
    setTimeout(() => { tradeGoToStep(1); }, 2000);
  } catch(e) { status.textContent = '❌ ' + (e.message || 'Failed'); status.style.color = 'var(--red)'; }
}

async function loadIncomingTrades() {
  const div = document.getElementById('incomingTrades');
  const countBadge = document.getElementById('tradeInboxCount');
  if (!window._loadPendingTrades) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">Login to see trades</div>'; return; }
  try {
    const trades = await window._loadPendingTrades();
    if (!trades || trades.length === 0) {
      div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">No pending trades</div>';
      if (countBadge) countBadge.style.display = 'none';
      return;
    }
    if (countBadge) { countBadge.style.display = 'inline'; countBadge.textContent = trades.length; }
    div.innerHTML = trades.map(t => {
      const cat = ITEM_CATALOG[t.itemId];
      const icon = cat ? cat.icon : '📦';
      const itemName = cat ? cat.name : (t.itemName || t.itemId);
      const rar = cat ? RARITY[cat.rarity] : null;
      const val = cat && typeof getItemMarketValue === 'function' ? getItemMarketValue(t.itemId) : 0;
      const cashPart = t.cash ? ' + $' + t.cash.toFixed(0) + ' cash' : '';
      const safeName = escapeHtml(t.from || 'Unknown');
      const safeMsg = t.message ? escapeHtml(t.message) : '';
      return '<div style="background:var(--bg);border:1px solid ' + (rar ? rar.color : 'var(--border)') + ';border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;">'
        + '<div style="font-size:28px;">' + icon + '</div>'
        + '<div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:13px;color:' + (rar ? rar.color : 'var(--text)') + ';">' + escapeHtml(itemName) + cashPart + '</div>'
        + '<div style="font-size:11px;color:var(--text2);">From <strong style="color:var(--neon);">' + safeName + '</strong></div>'
        + (safeMsg ? '<div style="font-size:10px;color:var(--text2);font-style:italic;margin-top:2px;">"' + safeMsg + '"</div>' : '')
        + '<div style="font-size:10px;color:var(--text2);margin-top:2px;">' + (val > 0 ? 'Value: $' + val.toFixed(0) : '') + ' · ' + new Date(t.timestamp).toLocaleString() + '</div></div>'
        + '<div style="display:flex;flex-direction:column;gap:4px;">'
        + '<button onclick="acceptTrade(\'' + t.id + '\',\'' + t.itemId + '\',' + (t.cash || 0) + ')" style="padding:6px 14px;background:linear-gradient(135deg,#00cc66,#009944);border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:Orbitron;">ACCEPT</button>'
        + '<button onclick="declineTrade(\'' + t.id + '\')" style="padding:4px 12px;background:transparent;border:1px solid var(--red);border-radius:6px;color:var(--red);cursor:pointer;font-size:10px;">DECLINE</button></div></div>';
    }).join('');
  } catch(e) { div.innerHTML = '<div style="color:var(--red);font-size:12px;text-align:center;padding:20px;">Error loading trades</div>'; }
}

async function acceptTrade(tradeId, itemId, cash) {
  if (!window._acceptTradeOffer) return;
  try {
    await window._acceptTradeOffer(tradeId);
    if (itemId && itemId !== '_cash_') addToInventory(itemId);
    if (cash > 0) { balance += cash; updateBalDisplay(); }
    const cat = ITEM_CATALOG[itemId];
    tradeHistory.unshift({ type: 'received', itemName: cat ? cat.name : (cash > 0 ? 'Cash' : 'Unknown'), itemIcon: cat ? cat.icon : '💵', cash: cash || 0, ts: Date.now() });
    if (tradeHistory.length > 50) tradeHistory = tradeHistory.slice(0, 50);
    try { localStorage.setItem('casino_trade_history', JSON.stringify(tradeHistory)); } catch(e) {}
    renderInventory(); loadIncomingTrades();
    showToast('📦 Trade accepted!' + (cash > 0 ? ' +$' + cash.toFixed(0) : ''), true);
    firebaseSave();
  } catch(e) { showToast('Error accepting trade', false); }
}

async function declineTrade(tradeId) {
  if (!window._declineTradeOffer && !window._acceptTradeOffer) return;
  try {
    if (window._declineTradeOffer) {
      await window._declineTradeOffer(tradeId);
    } else {
      showToast('Decline function unavailable', false);
      return;
    }
    loadIncomingTrades();
    showToast('Trade declined — items returned to sender', false);
  } catch(e) { showToast('Error declining trade', false); }
}

function renderTradeHistory() {
  const div = document.getElementById('tradeHistoryList');
  if (!tradeHistory.length) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">No trade history yet</div>'; return; }
  div.innerHTML = tradeHistory.slice(0, 30).map(t => {
    const isSent = t.type === 'sent';
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;">'
      + '<span style="font-size:16px;">' + (isSent ? '📤' : '📥') + '</span>'
      + '<span style="font-size:16px;">' + (t.itemIcon || '📦') + '</span>'
      + '<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;">' + escapeHtml(t.itemName) + (t.cash > 0 ? ' + $' + t.cash.toFixed(0) : '') + '</div>'
      + '<div style="font-size:10px;color:var(--text2);">' + (isSent ? 'Sent to ' + escapeHtml(t.to || '?') : 'Received') + ' · ' + new Date(t.ts).toLocaleDateString() + '</div></div>'
      + '<span style="font-size:10px;color:' + (isSent ? 'var(--red)' : 'var(--green)') + ';font-weight:700;">' + (isSent ? 'SENT' : 'RECEIVED') + '</span></div>';
  }).join('');
}


let storeListType = 'fixed';

function switchStoreTab(tab, btn) {
  document.querySelectorAll('#storePanel .inv-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  ['Browse', 'List', 'My', 'Sales'].forEach(v => {
    const el = document.getElementById('store' + v + 'View');
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('store' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'View');
  if (target) target.style.display = 'block';
  if (tab === 'browse') loadStoreListings();
  if (tab === 'list') storePopulateListSelect();
  if (tab === 'my') loadMyListings();
  if (tab === 'sales') loadStoreSales();
}

function storeSetType(type) {
  storeListType = type;
  document.getElementById('storeTypeFixed').className = 'inv-tab' + (type === 'fixed' ? ' active' : '');
  document.getElementById('storeTypeAuction').className = 'inv-tab' + (type === 'auction' ? ' active' : '');
  document.getElementById('storeFixedFields').style.display = type === 'fixed' ? 'block' : 'none';
  document.getElementById('storeAuctionFields').style.display = type === 'auction' ? 'block' : 'none';
}

function storePopulateListSelect() {
  const sel = document.getElementById('storeListItemSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select an item...</option>';
  inventory.forEach(item => {
    const cat = ITEM_CATALOG ? ITEM_CATALOG[item.itemId] : null;
    const name = cat ? (cat.icon + ' ' + cat.name) : item.itemId;
    const val = typeof getItemMarketValue === 'function' ? getItemMarketValue(item.itemId) : 0;
    sel.innerHTML += '<option value="' + item.id + '">' + name + ' ($' + val.toFixed(0) + ')</option>';
  });
}

function storeUpdateListPreview() {
  const sel = document.getElementById('storeListItemSelect');
  const preview = document.getElementById('storeListItemPreview');
  const mRef = document.getElementById('storeMarketRef');
  const invId = parseInt(sel.value);
  if (!invId) { preview.innerHTML = '<div style="color:var(--text2);font-size:12px;">Select an item from your inventory</div>'; if (mRef) mRef.textContent = 'Market value: —'; return; }
  const item = inventory.find(x => x.id === invId);
  if (!item) return;
  const cat = ITEM_CATALOG[item.itemId];
  if (!cat) return;
  const val = typeof getItemMarketValue === 'function' ? getItemMarketValue(item.itemId) : cat.baseValue;
  const rar = RARITY[cat.rarity];
  preview.innerHTML = '<div style="font-size:40px;">' + cat.icon + '</div><div style="font-weight:700;font-size:14px;color:' + rar.color + ';">' + cat.name + '</div><div style="font-size:10px;color:' + rar.color + ';">' + rar.label + '</div><div style="font-family:Orbitron;font-size:14px;color:var(--gold);margin-top:4px;">$' + val.toFixed(0) + '</div>';
  if (mRef) mRef.textContent = 'Market value: $' + val.toFixed(0);
  document.getElementById('storeAskPrice').value = Math.round(val);
  document.getElementById('storeStartBid').value = Math.round(val * 0.7);
}

async function storeListItem() {
  const st = document.getElementById('storeListStatus');
  const invId = parseInt(document.getElementById('storeListItemSelect').value);
  if (!invId) { st.textContent = '⚠ Select an item'; st.style.color = 'var(--red)'; return; }
  const item = inventory.find(x => x.id === invId);
  if (!item) { st.textContent = '⚠ Item not found'; st.style.color = 'var(--red)'; return; }
  if (!window._storeListItem) { st.textContent = '⚠ Not logged in'; st.style.color = 'var(--red)'; return; }
  const cat = ITEM_CATALOG[item.itemId];
  const price = storeListType === 'fixed' ? parseFloat(document.getElementById('storeAskPrice').value) : parseFloat(document.getElementById('storeStartBid').value);
  if (!price || price < 1) { st.textContent = '⚠ Enter a valid price'; st.style.color = 'var(--red)'; return; }
  st.textContent = '⏳ Listing...';
  try {
    const duration = storeListType === 'auction' ? parseInt(document.getElementById('storeAuctionDuration').value) : 0;
    const res = await window._storeListItem({
      itemId: item.itemId,
      itemName: cat ? cat.name : item.itemId,
      rarity: cat ? cat.rarity : 'consumer',
      type: storeListType,
      price: price,
      duration: duration
    });
    if (res.error) throw new Error(res.error);
    removeFromInventory(invId);
    renderInventory(); storePopulateListSelect();
    st.textContent = '✅ Listed on store!';
    st.style.color = 'var(--green)';
    showToast('🏪 Item listed on store!', true);
    firebaseSave();
  } catch(e) { st.textContent = '❌ ' + (e.message || 'Failed'); st.style.color = 'var(--red)'; }
}

async function loadStoreListings() {
  const grid = document.getElementById('storeListingsGrid');
  if (!window._storeGetListings) { grid.innerHTML = '<div style="grid-column:1/-1;color:var(--text2);font-size:12px;text-align:center;padding:30px;">Login to browse</div>'; return; }
  grid.innerHTML = '<div style="grid-column:1/-1;color:var(--text2);font-size:12px;text-align:center;padding:30px;">Loading...</div>';
  try {
    let listings = await window._storeGetListings();
    
    const rarFilter = document.getElementById('storeFilterRarity').value;
    if (rarFilter !== 'all') listings = listings.filter(l => l.rarity === rarFilter);
    
    const sort = document.getElementById('storeSortBy').value;
    if (sort === 'newest') listings.sort((a, b) => b.listedAt - a.listedAt);
    else if (sort === 'priceAsc') listings.sort((a, b) => (a.type === 'auction' ? a.currentBid : a.price) - (b.type === 'auction' ? b.currentBid : b.price));
    else if (sort === 'priceDesc') listings.sort((a, b) => (b.type === 'auction' ? b.currentBid : b.price) - (a.type === 'auction' ? a.currentBid : a.price));
    else if (sort === 'ending') listings = listings.filter(l => l.type === 'auction').sort((a, b) => a.endsAt - b.endsAt);
    if (listings.length === 0) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div style="font-size:48px;margin-bottom:12px;">🏪</div><div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;">Marketplace is Empty</div><div style="font-size:12px;color:var(--text2);margin-bottom:16px;">No items listed yet. Be the first to sell something!</div><button onclick="switchStoreTab(\'list\',document.getElementById(\'storeListTab\'))" style="padding:10px 20px;background:linear-gradient(135deg,#00cc66,#009944);border:none;border-radius:8px;color:#fff;cursor:pointer;font-family:Orbitron;font-size:12px;font-weight:700;">📦 List an Item</button></div>'; return; }
    grid.innerHTML = listings.map(l => {
      const cat = ITEM_CATALOG[l.itemId];
      const rar = cat ? RARITY[cat.rarity] : null;
      const icon = cat ? cat.icon : '📦';
      const isAuction = l.type === 'auction';
      const displayPrice = isAuction ? l.currentBid : l.price;
      const timeLeft = isAuction ? Math.max(0, l.endsAt - Date.now()) : 0;
      const timeStr = isAuction ? (timeLeft > 0 ? Math.floor(timeLeft / 60000) + 'm left' : 'ENDED') : '';
      const ended = isAuction && timeLeft <= 0;
      return '<div style="background:var(--bg);border:1px solid ' + (rar ? rar.color : 'var(--border)') + ';border-radius:10px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;">'
        + (isAuction ? '<div style="position:absolute;top:6px;right:6px;font-size:9px;padding:2px 6px;background:rgba(136,71,255,.25);border:1px solid rgba(136,71,255,.5);border-radius:4px;color:#8847ff;">🔨 AUCTION</div>' : '')
        + '<div style="font-size:32px;">' + icon + '</div>'
        + '<div style="font-weight:700;font-size:12px;color:' + (rar ? rar.color : 'var(--text)') + ';text-align:center;">' + escapeHtml(l.itemName || l.itemId) + '</div>'
        + (rar ? '<div style="font-size:9px;color:' + rar.color + ';">' + rar.label + '</div>' : '')
        + '<div style="font-family:Orbitron;font-size:14px;color:var(--gold);">$' + formatBalance(displayPrice) + '</div>'
        + '<div style="font-size:10px;color:var(--text2);">by ' + escapeHtml(l.seller) + '</div>'
        + (isAuction && l.highBidder ? '<div style="font-size:9px;color:var(--neon);">High bid: ' + l.highBidder + '</div>' : '')
        + (timeStr ? '<div style="font-size:9px;color:' + (ended ? 'var(--red)' : 'var(--green)') + ';">' + timeStr + '</div>' : '')
        + '<div style="width:100%;margin-top:4px;">'
        + (isAuction && !ended
          ? '<div style="display:flex;gap:4px;"><input type="number" id="bid_' + l.id + '" placeholder="Bid..." min="' + (displayPrice + 1) + '" style="flex:1;padding:6px;background:var(--surface);border:1px solid var(--border);border-radius:4px;color:var(--gold);font-size:11px;font-family:Orbitron;"><button onclick="storeBid(\'' + l.id + '\')" style="padding:6px 10px;background:linear-gradient(135deg,#8847ff,#6b2fd9);border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:10px;font-weight:700;">BID</button></div>'
          : (isAuction && ended
            ? '<button onclick="storeClaim(\'' + l.id + '\')" style="width:100%;padding:8px;background:linear-gradient(135deg,#ffd700,#ff9900);border:none;border-radius:6px;color:#000;cursor:pointer;font-size:11px;font-weight:700;">CLAIM</button>'
            : '<button onclick="storeBuy(\'' + l.id + '\','+l.price+')" style="width:100%;padding:8px;background:linear-gradient(135deg,#00cc66,#009944);border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:Orbitron;">BUY NOW</button>'))
        + '</div></div>';
    }).join('');
  } catch(e) {
    console.error('Store load error:', e);
    const isPermErr = (e.message || '').toLowerCase().includes('permission');
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;">'
      + '<div style="font-size:36px;margin-bottom:8px;">' + (isPermErr ? '🔒' : '⚠️') + '</div>'
      + '<div style="color:var(--red);font-size:14px;font-weight:700;margin-bottom:8px;">' + (isPermErr ? 'Database Rules Need Updating' : 'Error Loading Marketplace') + '</div>'
      + '<div style="color:var(--text2);font-size:11px;margin-bottom:12px;">' + (e.message || 'Unknown error') + '</div>'
      + (isPermErr ? '<div style="text-align:left;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin:0 auto;max-width:400px;margin-bottom:12px;">'
        + '<div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:6px;">Go to Firebase Console → Realtime Database → Rules</div>'
        + '<div style="font-size:11px;color:var(--text2);margin-bottom:6px;">Set your rules to:</div>'
        + '<pre style="background:#111;border:1px solid #333;border-radius:4px;padding:8px;color:#00e676;font-size:10px;overflow-x:auto;white-space:pre;">{\n  "rules": {\n    "casino": {\n      ".read": true,\n      ".write": "auth != null"\n    }\n  }\n}</pre>'
        + '<div style="font-size:10px;color:var(--text2);margin-top:4px;">This allows anyone to read game data, but only logged-in users can write.</div></div>' : '')
      + '<button onclick="loadStoreListings()" style="padding:8px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--neon);cursor:pointer;font-size:11px;font-family:Orbitron;">🔄 Retry</button>'
      + '</div>';
  }
}
function renderStoreListings() { loadStoreListings(); }

async function storeBuy(listingId, price) {
  if (!confirm('Buy this item for $' + formatBalance(price) + '?')) return;
  if(price > balance){ showToast('Not enough balance!', false); return; }
  try {
    const res = await window._storeBuyItem(listingId);
    if (res.error) { showToast(res.error, false); return; }
    const actualPrice = res.item.price || price;
    balance -= actualPrice; updateBalDisplay();
    addToInventory(res.item.itemId);
    showToast('🛒 Purchased ' + (res.item.itemName || 'item') + '!', true);
    loadStoreListings(); renderInventory(); firebaseSave();
  } catch(e) { showToast('Purchase failed', false); }
}

async function storeBid(listingId) {
  const bidInput = document.getElementById('bid_' + listingId);
  const amount = parseFloat(bidInput ? bidInput.value : 0);
  if (!amount || amount < 1) { showToast('Enter a valid bid', false); return; }
  if (amount > balance) { showToast('Not enough balance!', false); return; }
  try {
    const res = await window._storePlaceBid(listingId, amount);
    if (res.error) { showToast(res.error, false); return; }
    balance -= amount; updateBalDisplay();
    
    if (res.oldBid > 0 && res.oldBidderUid === (window._currentPlayerId || '')) {
      balance += res.oldBid; updateBalDisplay();
    }
    showToast('🔨 Bid placed: $' + amount.toLocaleString(), true);
    loadStoreListings(); firebaseSave();
  } catch(e) { showToast('Bid failed', false); }
}

async function storeClaim(listingId) {
  try {
    const res = await window._storeClaimAuction(listingId);
    if (res.error) { showToast(res.error, false); return; }
    if (res.noBids) {
      addToInventory(res.item.itemId);
      showToast('No bids — item returned to inventory', true);
    } else {
      
      
      if (res.item.sellerUid === (window._currentPlayerId || '')) {
        showToast('💰 Auction sold for $' + res.item.currentBid.toLocaleString() + '! Payment pending.', true);
      } else {
        showToast('🎉 Won auction: ' + (res.item.itemName || 'item') + '! Item pending.', true);
      }
      
      checkPendingRefunds();
    }
    loadStoreListings(); renderInventory(); firebaseSave();
  } catch(e) { showToast('Claim failed', false); }
}

async function loadMyListings() {
  const div = document.getElementById('storeMyListings');
  if (!window._storeGetListings) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">Login first</div>'; return; }
  try {
    const all = await window._storeGetListings();
    const mine = all.filter(l => l.sellerUid === (window._currentPlayerId || ''));
    if (mine.length === 0) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">No active listings</div>'; return; }
    div.innerHTML = mine.map(l => {
      const cat = ITEM_CATALOG[l.itemId];
      const rar = cat ? RARITY[cat.rarity] : null;
      const isAuction = l.type === 'auction';
      const ended = isAuction && Date.now() > l.endsAt;
      return '<div style="background:var(--bg);border:1px solid ' + (rar ? rar.color : 'var(--border)') + ';border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;">'
        + '<div style="font-size:28px;">' + (cat ? cat.icon : '📦') + '</div>'
        + '<div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:13px;color:' + (rar ? rar.color : 'var(--text)') + ';">' + escapeHtml(l.itemName || l.itemId) + '</div>'
        + '<div style="font-size:11px;color:var(--text2);">' + (isAuction ? '🔨 Auction' : '💰 Fixed') + ' — $' + (isAuction ? l.currentBid : l.price) + '</div>'
        + (isAuction && l.highBidder ? '<div style="font-size:10px;color:var(--neon);">High bid: ' + l.highBidder + '</div>' : '')
        + (ended ? '<div style="font-size:10px;color:var(--gold);">Auction ended</div>' : '') + '</div>'
        + (ended && isAuction
          ? '<button onclick="storeClaim(\'' + l.id + '\')" style="padding:6px 14px;background:linear-gradient(135deg,#ffd700,#ff9900);border:none;border-radius:6px;color:#000;cursor:pointer;font-size:11px;font-weight:700;">CLAIM</button>'
          : '<button onclick="storeCancelListing(\'' + l.id + '\')" style="padding:6px 14px;background:transparent;border:1px solid var(--red);border-radius:6px;color:var(--red);cursor:pointer;font-size:10px;">CANCEL</button>')
        + '</div>';
    }).join('');
  } catch(e) { div.innerHTML = '<div style="color:var(--red);font-size:12px;text-align:center;padding:20px;">Error</div>'; }
}

async function storeCancelListing(listingId) {
  try {
    const res = await window._storeCancelListing(listingId);
    if (res.error) { showToast(res.error, false); return; }
    addToInventory(res.item.itemId);
    showToast('Listing cancelled — item returned', true);
    loadMyListings(); renderInventory(); firebaseSave();
  } catch(e) { showToast('Cancel failed', false); }
}

async function loadStoreSales() {
  const div = document.getElementById('storeSalesLog');
  if (!window._storeGetSales) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">Login first</div>'; return; }
  try {
    const sales = await window._storeGetSales();
    if (sales.length === 0) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">No sales yet</div>'; return; }
    div.innerHTML = sales.map(s => {
      const cat = ITEM_CATALOG[s.itemId];
      const rar = cat ? RARITY[cat.rarity] : null;
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border:1px solid ' + (rar ? rar.color : 'var(--border)') + ';border-radius:8px;">'
        + '<span style="font-size:16px;">' + (cat ? cat.icon : '📦') + '</span>'
        + '<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;color:' + (rar ? rar.color : 'var(--text)') +';">' + (s.itemName || s.itemId) + '</div>'
        + '<div style="font-size:10px;color:var(--text2);">' + s.seller + ' → ' + s.buyer + (s.auction ? ' (auction)' : '') + ' · ' + new Date(s.ts).toLocaleDateString() + '</div></div>'
        + '<div style="font-family:Orbitron;font-size:12px;color:var(--gold);">$' + formatBalance(s.price) + '</div></div>';
    }).join('');
  } catch(e) { div.innerHTML = '<div style="color:var(--red);font-size:12px;text-align:center;padding:20px;">Error</div>'; }
}


let _dmUnsub = null;
let _dmPartnerUid = '';
let _dmPartnerName = '';

function showFriendsPanel() {
  playClickSound();
  document.getElementById('friendsOverlay').style.display = 'block';
  loadFriendsList();
  loadFriendRequests();
  
  if (window._setOnlineStatus) window._setOnlineStatus(true);
}
function hideFriendsPanel() {
  document.getElementById('friendsOverlay').style.display = 'none';
  if (_dmUnsub) { _dmUnsub(); _dmUnsub = null; }
}

function switchFriendsTab(tab, btn) {
  document.querySelectorAll('#friendsOverlay .inv-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  ['Friends','Requests','Add','Blocked','Dm','Privacy'].forEach(v => {
    const el = document.getElementById('frView' + v);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('frView' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (target) target.style.display = 'block';
  if (tab === 'friends') loadFriendsList();
  if (tab === 'requests') loadFriendRequests();
  if (tab === 'blocked') loadBlockedList();
  if (tab === 'dm') loadDMContacts();
  if (tab === 'privacy') loadPrivacySettings();
}

async function loadFriendsList() {
  const div = document.getElementById('frFriendsList');
  const countEl = document.getElementById('frFriendCount');
  if (!window._loadFriendsList) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">Login to see friends</div>'; return; }
  try {
    const friends = await window._loadFriendsList();
    if (countEl) countEl.textContent = '(' + friends.length + ')';
    if (friends.length === 0) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">No friends yet — add some!</div>'; return; }
    
    const presences = await window._getPresenceBatch(friends.map(f => f.uid));
    div.innerHTML = friends.map(f => {
      const p = presences[f.uid] || { online: false, lastSeen: 0 };
      const online = p.online && (Date.now() - (p.lastSeen || 0) < 120000);
      const statusDot = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (online ? '#00e676' : '#555') + ';margin-right:6px;"></span>';
      const lastSeen = !online && p.lastSeen ? 'Last seen ' + timeAgo(p.lastSeen) : (online ? 'Online now' : 'Offline');
      return '<div style="background:var(--bg);border:1px solid ' + (online ? 'rgba(0,230,118,.3)' : 'var(--border)') + ';border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;">'
        + '<div style="font-size:24px;">👤</div>'
        + '<div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:13px;color:var(--text);">' + statusDot + escapeHtml(f.username) + '</div>'
        + '<div style="font-size:10px;color:' + (online ? 'var(--green)' : 'var(--text2)') + ';">' + lastSeen + '</div></div>'
        + '<div style="display:flex;gap:4px;">'
        + '<button onclick="dmOpenChat(\'' + f.uid + '\',\'' + f.username + '\')" style="padding:5px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--neon);cursor:pointer;font-size:10px;" title="Message">💬</button>'
        + '<button onclick="friendGetMutuals(\'' + f.uid + '\',\'' + f.username + '\')" style="padding:5px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);cursor:pointer;font-size:10px;" title="Mutual friends">👥</button>'
        + '<button onclick="friendRemove(\'' + f.uid + '\',\'' + f.username + '\')" style="padding:5px 10px;background:transparent;border:1px solid var(--red);border-radius:6px;color:var(--red);cursor:pointer;font-size:10px;" title="Remove">✕</button>'
        + '</div></div>';
    }).join('');
  } catch(e) { div.innerHTML = '<div style="color:var(--red);font-size:12px;text-align:center;padding:20px;">Error loading friends</div>'; }
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

async function loadFriendRequests() {
  const div = document.getElementById('frRequestsList');
  const badge = document.getElementById('friendReqBadge');
  const countEl = document.getElementById('frReqCount');
  if (!window._loadFriendRequests) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">Login first</div>'; return; }
  try {
    const reqs = await window._loadFriendRequests();
    if (badge) { if (reqs.length > 0) { badge.style.display = 'inline'; badge.textContent = reqs.length; } else badge.style.display = 'none'; }
    if (countEl) { if (reqs.length > 0) { countEl.style.display = 'inline'; countEl.textContent = reqs.length; } else countEl.style.display = 'none'; }
    if (reqs.length === 0) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">No pending requests</div>'; return; }
    div.innerHTML = reqs.map(r => {
      return '<div style="background:var(--bg);border:1px solid rgba(0,230,118,.3);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;">'
        + '<div style="font-size:24px;">📩</div>'
        + '<div style="flex:1;"><div style="font-weight:700;font-size:13px;color:var(--neon);">' + escapeHtml(r.from) + '</div>'
        + '<div style="font-size:10px;color:var(--text2);">' + new Date(r.ts).toLocaleString() + '</div></div>'
        + '<button onclick="friendAcceptReq(\'' + r.uid + '\',\'' + r.from + '\')" style="padding:6px 14px;background:linear-gradient(135deg,#00cc66,#009944);border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:11px;font-weight:700;">ACCEPT</button>'
        + '<button onclick="friendDeclineReq(\'' + r.uid + '\')" style="padding:5px 10px;background:transparent;border:1px solid var(--red);border-radius:6px;color:var(--red);cursor:pointer;font-size:10px;">✕</button>'
        + '</div>';
    }).join('');
  } catch(e) { div.innerHTML = '<div style="color:var(--red);font-size:12px;text-align:center;padding:20px;">Error</div>'; }
}

async function friendAcceptReq(fromUid, fromName) {
  await window._acceptFriendRequest(fromUid, fromName);
  showToast('👥 Now friends with ' + fromName + '!', true);
  loadFriendRequests(); loadFriendsList();
}
async function friendDeclineReq(fromUid) {
  await window._declineFriendRequest(fromUid);
  showToast('Request declined');
  loadFriendRequests();
}

async function friendSendRequest() {
  const inp = document.getElementById('frAddInput');
  const st = document.getElementById('frAddStatus');
  const u = inp.value.trim().toLowerCase();
  if (!u) { st.textContent = 'Enter a username'; st.style.color = 'var(--red)'; return; }
  if (!window._sendFriendRequest) { st.textContent = 'Login first'; st.style.color = 'var(--red)'; return; }
  st.textContent = '⏳ Sending...';
  try {
    const res = await window._sendFriendRequest(u);
    if (res.error) { st.textContent = '❌ ' + res.error; st.style.color = 'var(--red)'; return; }
    st.textContent = '✅ Request sent to ' + u + '!';
    st.style.color = 'var(--green)';
    inp.value = '';
  } catch(e) { st.textContent = '❌ Error'; st.style.color = 'var(--red)'; }
}

async function friendBlockPlayer() {
  const inp = document.getElementById('frBlockInput');
  const st = document.getElementById('frBlockStatus');
  const u = inp.value.trim().toLowerCase();
  if (!u) { st.textContent = 'Enter a username'; st.style.color = 'var(--red)'; return; }
  if (!window._blockPlayer) { st.textContent = 'Login first'; st.style.color = 'var(--red)'; return; }
  if (!confirm('Block ' + u + '? This will also remove them as a friend.')) return;
  st.textContent = '⏳ Blocking...';
  try {
    const res = await window._blockPlayer(u);
    if (res.error) { st.textContent = '❌ ' + res.error; st.style.color = 'var(--red)'; return; }
    st.textContent = '✅ Blocked ' + u;
    st.style.color = 'var(--green)';
    inp.value = '';
    loadFriendsList();
  } catch(e) { st.textContent = '❌ Error'; st.style.color = 'var(--red)'; }
}

async function friendRemove(uid, name) {
  if (!confirm('Remove ' + name + ' from friends?')) return;
  await window._removeFriend(uid);
  showToast('Removed ' + name + ' from friends');
  loadFriendsList();
}

async function friendGetMutuals(uid, name) {
  if (!window._getMutualFriends) return;
  try {
    const mutuals = await window._getMutualFriends(uid);
    if (mutuals.length === 0) { showToast('No mutual friends with ' + name); return; }
    const names = mutuals.map(m => m.username).join(', ');
    showToast('👥 Mutual friends with ' + name + ': ' + names, true);
  } catch(e) { showToast('Error checking mutuals'); }
}

async function loadBlockedList() {
  const div = document.getElementById('frBlockedList');
  if (!window._loadBlockedList) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">Login first</div>'; return; }
  try {
    const blocked = await window._loadBlockedList();
    if (blocked.length === 0) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">No blocked players</div>'; return; }
    div.innerHTML = blocked.map(b => {
      return '<div style="background:var(--bg);border:1px solid rgba(255,55,95,.3);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;">'
        + '<div style="font-size:20px;">🚫</div>'
        + '<div style="flex:1;"><div style="font-weight:600;font-size:13px;color:var(--text);">' + b.username + '</div>'
        + '<div style="font-size:10px;color:var(--text2);">Blocked ' + new Date(b.ts).toLocaleDateString() + '</div></div>'
        + '<button onclick="friendUnblock(\'' + b.uid + '\',\'' + b.username + '\')" style="padding:5px 12px;background:transparent;border:1px solid var(--green);border-radius:6px;color:var(--green);cursor:pointer;font-size:10px;">Unblock</button>'
        + '</div>';
    }).join('');
  } catch(e) { div.innerHTML = '<div style="color:var(--red);font-size:12px;text-align:center;padding:20px;">Error</div>'; }
}

async function friendUnblock(uid, name) {
  await window._unblockPlayer(uid);
  showToast('Unblocked ' + name, true);
  loadBlockedList();
}


async function loadDMContacts() {
  const list = document.getElementById('dmContactList');
  const chatView = document.getElementById('dmChatView');
  chatView.style.display = 'none';
  list.style.display = 'flex';
  if (!window._loadFriendsList) { list.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">Login first</div>'; return; }
  try {
    const friends = await window._loadFriendsList();
    if (friends.length === 0) { list.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">Add friends to message them</div>'; return; }
    const presences = await window._getPresenceBatch(friends.map(f => f.uid));
    list.innerHTML = friends.map(f => {
      const p = presences[f.uid] || {};
      const online = p.online && (Date.now() - (p.lastSeen || 0) < 120000);
      return '<div onclick="dmOpenChat(\'' + f.uid + '\',\'' + f.username + '\')" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:border-color .2s;" onmouseover="this.style.borderColor=\'var(--neon)\'" onmouseout="this.style.borderColor=\'var(--border)\'">'
        + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (online ? '#00e676' : '#555') + ';"></span>'
        + '<div style="font-weight:600;font-size:13px;color:var(--text);">' + escapeHtml(f.username) + '</div>'
        + '<div style="margin-left:auto;font-size:10px;color:var(--text2);">' + (online ? '🟢 Online' : 'Offline') + '</div>'
        + '<div style="font-size:14px;">💬</div>'
        + '</div>';
    }).join('');
  } catch(e) { list.innerHTML = '<div style="color:var(--red);font-size:12px;text-align:center;padding:20px;">Error</div>'; }
}

function dmOpenChat(uid, name) {
  _dmPartnerUid = uid;
  _dmPartnerName = name;
  
  const dmTab = document.getElementById('frTabDM');
  if (dmTab) switchFriendsTab('dm', dmTab);
  document.getElementById('dmContactList').style.display = 'none';
  document.getElementById('dmChatView').style.display = 'block';
  document.getElementById('dmChatPartner').textContent = name;
  document.getElementById('dmMessages').innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;">Loading...</div>';
  
  if (window._getPresence) {
    window._getPresence(uid).then(p => {
      const online = p.online && (Date.now() - (p.lastSeen || 0) < 120000);
      document.getElementById('dmPartnerStatus').innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (online ? '#00e676' : '#555') + ';margin-right:4px;"></span>' + (online ? 'Online' : 'Offline');
    });
  }
  
  if (_dmUnsub) _dmUnsub();
  if (window._listenDirectMessages) {
    _dmUnsub = window._listenDirectMessages(uid, (msgs) => {
      const div = document.getElementById('dmMessages');
      const myId = window._currentPlayerId || '';
      if (msgs.length === 0) { div.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:20px;">No messages yet. Say hi!</div>'; return; }
      div.innerHTML = msgs.slice(-100).map(m => {
        const isMe = m.fromUid === myId;
        return '<div style="display:flex;justify-content:' + (isMe ? 'flex-end' : 'flex-start') + ';">'
          + '<div style="max-width:75%;padding:8px 12px;border-radius:' + (isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px') + ';background:' + (isMe ? 'linear-gradient(135deg,#00cc66,#009944)' : 'var(--surface2)') + ';color:' + (isMe ? '#fff' : 'var(--text)') + ';font-size:12px;">'
          + '<div>' + escapeHtml(m.text) + '</div>'
          + '<div style="font-size:9px;color:' + (isMe ? 'rgba(255,255,255,.6)' : 'var(--text2)') + ';margin-top:3px;">' + (isMe ? 'You' : escapeHtml(m.from)) + ' · ' + new Date(m.ts).toLocaleTimeString() + '</div>'
          + '</div></div>';
      }).join('');
      div.scrollTop = div.scrollHeight;
    });
  }
  
  const inp = document.getElementById('dmInput');
  inp.onkeydown = (e) => { if (e.key === 'Enter') dmSendMessage(); };
  inp.focus();
}

function dmBackToList() {
  if (_dmUnsub) { _dmUnsub(); _dmUnsub = null; }
  document.getElementById('dmChatView').style.display = 'none';
  document.getElementById('dmContactList').style.display = 'flex';
  loadDMContacts();
}

async function dmSendMessage() {
  const inp = document.getElementById('dmInput');
  const text = inp.value.trim();
  if (!text) return;
  if (!window._sendDirectMessage) { showToast('Not logged in', false); return; }
  inp.value = '';
  try {
    const res = await window._sendDirectMessage(_dmPartnerUid, _dmPartnerName, text);
    if (res.error) showToast(res.error, false);
  } catch(e) { showToast('Message failed', false); }
}


async function loadPrivacySettings() {
  if (!window._loadPrivacySettings) return;
  try {
    const p = await window._loadPrivacySettings();
    document.getElementById('privFriendRequests').value = p.friendRequests || 'everyone';
    document.getElementById('privDirectMessages').value = p.directMessages || 'friends';
    document.getElementById('privOnlineStatus').value = p.onlineStatus || 'everyone';
    document.getElementById('privTradeRequests').value = p.tradeRequests || 'everyone';
  } catch(e) {}
}

async function savePrivacySettings() {
  const st = document.getElementById('privSaveStatus');
  if (!window._savePrivacySettings) { st.textContent = 'Login first'; st.style.color = 'var(--red)'; return; }
  const settings = {
    friendRequests: document.getElementById('privFriendRequests').value,
    directMessages: document.getElementById('privDirectMessages').value,
    onlineStatus: document.getElementById('privOnlineStatus').value,
    tradeRequests: document.getElementById('privTradeRequests').value
  };
  try {
    await window._savePrivacySettings(settings);
    st.textContent = '✅ Settings saved!';
    st.style.color = 'var(--green)';
    showToast('🔒 Privacy settings saved', true);
  } catch(e) { st.textContent = '❌ Error saving'; st.style.color = 'var(--red)'; }
}


window.addEventListener('load', () => { if (window._setOnlineStatus) window._setOnlineStatus(true); });
window.addEventListener('beforeunload', () => { if (window._setOnlineStatus) window._setOnlineStatus(false); });


const SYMBOLS=['🍒','🍋','🔔','💎','7️⃣','🍀','⭐','👑'];
const SYMBOL_VALUES={'👑':100,'7️⃣':50,'💎':30,'⭐':20,'🔔':15,'🍀':10,'🍋':6,'🍒':4};
const REEL_COUNT=5;
const SYM_H=93;
const VISIBLE=3;
let slotsSpinning=false;

function slotsJackpotAnimation(winAmount, symbol, bet) {
  
  const overlay = document.createElement('div');
  overlay.id = 'slotsJackpotOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;flex-direction:column;pointer-events:auto;transition:background 0.5s;';
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.background = 'rgba(4,8,20,.95)'; });

  
  playSound(523, 'sine', 0.5, 0.2); 
  setTimeout(() => playSound(659, 'sine', 0.5, 0.18), 150); 
  setTimeout(() => playSound(784, 'sine', 0.5, 0.15), 300); 
  setTimeout(() => playSound(1047, 'sine', 0.8, 0.2), 500); 

  
  const symEl = document.createElement('div');
  symEl.textContent = symbol;
  symEl.style.cssText = 'font-size:20px;opacity:0;transition:all 0.8s cubic-bezier(.2,1,.3,1);transform:scale(0.1);filter:blur(10px);';
  overlay.appendChild(symEl);
  requestAnimationFrame(() => {
    symEl.style.fontSize = '120px';
    symEl.style.opacity = '1';
    symEl.style.transform = 'scale(1)';
    symEl.style.filter = 'blur(0) drop-shadow(0 0 40px rgba(255,215,0,.8))';
  });

  
  setTimeout(() => {
    const txt = document.createElement('div');
    txt.textContent = '★ JACKPOT ★';
    txt.style.cssText = 'font-family:Orbitron;font-size:0px;font-weight:900;background:linear-gradient(135deg,#ffd700,#ff8c00,#ffd700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:none;opacity:0;transition:all 0.6s cubic-bezier(.2,1,.3,1);letter-spacing:6px;';
    overlay.appendChild(txt);
    requestAnimationFrame(() => {
      txt.style.fontSize = '48px';
      txt.style.opacity = '1';
    });
  }, 1000);

  
  setTimeout(() => {
    const multEl = document.createElement('div');
    multEl.style.cssText = 'font-family:Orbitron;font-size:36px;font-weight:900;color:#ff4444;margin-top:8px;';
    overlay.appendChild(multEl);
    
    let count = 1;
    const target = 1000;
    const startT = Date.now();
    const dur = 2000;
    function tick() {
      const elapsed = Date.now() - startT;
      const prog = Math.min(elapsed / dur, 1);
      
      const eased = 1 - Math.pow(1 - prog, 3);
      count = Math.max(1, Math.floor(eased * target));
      multEl.textContent = count + '× YOUR BET';
      if (prog < 1) requestAnimationFrame(tick);
      else {
        multEl.textContent = '1000× YOUR BET';
        multEl.style.color = '#ffd700';
        multEl.style.textShadow = '0 0 20px rgba(255,215,0,.6)';
        
        playSound(200, 'sawtooth', 0.4, 0.25);
        setTimeout(() => playSound(150, 'square', 0.3, 0.15), 100);
      }
    }
    tick();
  }, 1500);

  
  setTimeout(() => {
    const winEl = document.createElement('div');
    winEl.style.cssText = 'font-family:Orbitron;font-size:42px;font-weight:900;color:var(--green);margin-top:16px;opacity:0;transform:scale(0.5);transition:all 0.5s cubic-bezier(.2,1,.3,1);';
    winEl.textContent = '+$' + winAmount.toLocaleString();
    overlay.appendChild(winEl);
    requestAnimationFrame(() => {
      winEl.style.opacity = '1';
      winEl.style.transform = 'scale(1)';
    });
    
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const x = window.innerWidth * (0.2 + Math.random() * 0.6);
        const y = window.innerHeight * (0.2 + Math.random() * 0.6);
        spawnParticles(x, y, 30);
      }, i * 200);
    }
  }, 3500);

  
  setTimeout(() => {
    const btn = document.createElement('button');
    btn.textContent = 'COLLECT WINNINGS';
    btn.style.cssText = 'margin-top:24px;padding:16px 40px;font-family:Orbitron;font-size:16px;font-weight:700;background:linear-gradient(135deg,#ffd700,#ff8c00);border:none;border-radius:12px;color:#000;cursor:pointer;letter-spacing:2px;transition:all .2s;opacity:0;transform:translateY(20px);';
    btn.onmouseenter = () => { btn.style.transform = 'scale(1.05)'; btn.style.boxShadow = '0 0 30px rgba(255,215,0,.5)'; };
    btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = 'none'; };
    btn.onclick = () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => overlay.remove(), 300);
    };
    overlay.appendChild(btn);
    requestAnimationFrame(() => {
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    });
    playWinSound();
    showBigWin(winAmount);
  }, 5000);
}

function initSlots(){
  const container=document.getElementById('reelsContainer');
  for(let r=0;r<REEL_COUNT;r++){
    const win=document.createElement('div');win.className='reel-window';
    const strip=document.createElement('div');strip.className='reel-strip';strip.id='reel'+r;
    for(let i=0;i<60;i++){
      const sym=document.createElement('div');sym.className='reel-symbol';
      sym.textContent=SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
      strip.appendChild(sym);
    }
    win.appendChild(strip);container.appendChild(win);
    strip.style.transform='translateY(-'+(28*SYM_H)+'px)';
  }
}

function spinSlots(){
  if(slotsSpinning)return;
  const bet=parseFloat(document.getElementById('slotsBet').value)||10;
  if(bet<=0)return;
  if(!checkMaxBet(bet,'Slots'))return;
  if(bet>balance){showToast('Not enough balance!',false);return;}
  slotsSpinning=true;
  
  const slotsShielded = typeof isShieldActive==='function' && isShieldActive();
  balance-=bet;updateBalDisplay();
  document.getElementById('spinBtn').disabled=true;
  playClickSound();

  
  const results=[];
  for(let r=0;r<REEL_COUNT;r++) results.push(SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]);

  for(let r=0;r<REEL_COUNT;r++){
    const strip=document.getElementById('reel'+r);
    const children=strip.children;
    
    for(let i=0;i<children.length;i++){
      children[i].textContent=SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
    }
    
    const targetIdx=42+r*2;
    children[targetIdx].textContent=results[r];

    setTimeout(()=>{
      
      strip.style.transition='none';
      strip.style.transform='translateY(0px)';
      void strip.offsetWidth;
      
      strip.style.transition='transform '+(1.2+r*0.25)+'s cubic-bezier(.15,.72,.12,1)';
      strip.style.transform='translateY(-'+((targetIdx-1)*SYM_H)+'px)';
      playSound(300+r*50,'square',.04,.03);
    },r*120);
  }

  const totalDuration=1200+REEL_COUNT*250+300;
  setTimeout(()=>{
    
    const counts={};
    results.forEach(s=>{counts[s]=(counts[s]||0)+1;});
    let maxCount=0,maxSym='';
    for(const[s,c]of Object.entries(counts)){if(c>maxCount){maxCount=c;maxSym=s;}}

    let winAmount=0;
    const isJackpot = maxCount===5;
    if(maxCount>=3){
      const mult=SYMBOL_VALUES[maxSym]||4;
      if(maxCount===3)winAmount=bet*mult;
      else if(maxCount===4)winAmount=bet*mult*5;
      else winAmount=bet*1000; 
      
      if(typeof getLuckBonus==='function') winAmount*=getLuckBonus();
      winAmount=Math.round(winAmount*100)/100;
    }

    if(winAmount>0){
      balance+=winAmount;updateBalDisplay();
      if(isJackpot){
        slotsJackpotAnimation(winAmount, maxSym, bet);
      } else {
        showBigWin(winAmount);
        showToast('WIN $'+winAmount.toFixed(2)+'!');
        playWinSound();
        const rect=document.querySelector('.slots-machine').getBoundingClientRect();
        spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2,40+winAmount/10);
      }
    }else{
      
      if(slotsShielded){ const refund=Math.floor(bet*0.5); balance+=refund; updateBalDisplay(); showToast('🛡️ Shield! -$'+(bet-refund).toFixed(2),false); }
      else{ showToast('-$'+bet.toFixed(2),false); }
      playLoseSound();
    }

    recordGame('slots', bet, winAmount);
    firebaseSave();
    slotsSpinning=false;
    document.getElementById('spinBtn').disabled=false;

    
    setTimeout(()=>{
      for(let r=0;r<REEL_COUNT;r++){
        const strip=document.getElementById('reel'+r);
        for(let i=0;i<strip.children.length;i++){
          strip.children[i].textContent=SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
        }
        strip.style.transition='none';
        strip.style.transform='translateY(-'+(28*SYM_H)+'px)';
      }
    },400);
  },totalDuration);
}


let crashRunning=false,crashBetAmount=0,crashCashedOut=false;
let crashMultVal=1,crashPoint=0,crashStartTime=0,crashHistory=[];

function resizeCrashCanvas(){
  const c=document.getElementById('crashCanvas');
  if(!c)return;
  c.width=c.offsetWidth*2;c.height=c.offsetHeight*2;
  if(!crashRunning)drawCrashGraph();
}

function drawCrashGraph(){
  const c=document.getElementById('crashCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const w=c.width,h=c.height;
  ctx.clearRect(0,0,w,h);

  
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
  for(let i=1;i<10;i++){
    const y=h*(1-i/10);
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();
  }

  if(crashHistory.length<2)return;

  const maxMult=Math.max(...crashHistory.map(p=>p.m),2);

  
  ctx.beginPath();
  crashHistory.forEach((p,i)=>{
    const x=(i/(crashHistory.length-1||1))*w;
    const y=h-((p.m-1)/Math.max(maxMult-1,.1))*(h*0.82)-h*0.06;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  const lastX=w,lastY=h-((crashHistory[crashHistory.length-1].m-1)/Math.max(maxMult-1,.1))*(h*0.82)-h*0.06;
  ctx.lineTo(lastX,h);ctx.lineTo(0,h);ctx.closePath();
  const grad=ctx.createLinearGradient(0,0,0,h);
  const col=crashRunning&&!crashCashedOut?'0,240,255':(crashCashedOut?'0,255,136':'255,51,85');
  grad.addColorStop(0,'rgba('+col+',.2)');grad.addColorStop(1,'rgba('+col+',0)');
  ctx.fillStyle=grad;ctx.fill();

  
  ctx.beginPath();
  const lineColor=crashRunning&&!crashCashedOut?'#00f0ff':(crashCashedOut?'#00ff88':'#ff3355');
  ctx.strokeStyle=lineColor;ctx.lineWidth=4;ctx.shadowColor=lineColor;ctx.shadowBlur=12;
  crashHistory.forEach((p,i)=>{
    const x=(i/(crashHistory.length-1||1))*w;
    const y=h-((p.m-1)/Math.max(maxMult-1,.1))*(h*0.82)-h*0.06;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  ctx.stroke();
  ctx.shadowBlur=0;

  
  if(crashHistory.length>1){
    const lp=crashHistory[crashHistory.length-1];
    const dx=(1)*w;
    const dy=h-((lp.m-1)/Math.max(maxMult-1,.1))*(h*0.82)-h*0.06;
    ctx.beginPath();ctx.arc(dx,dy,6,0,Math.PI*2);ctx.fillStyle=lineColor;ctx.fill();
    ctx.beginPath();ctx.arc(dx,dy,10,0,Math.PI*2);ctx.strokeStyle=lineColor;ctx.lineWidth=2;
    ctx.globalAlpha=.4;ctx.stroke();ctx.globalAlpha=1;
  }
}

function startCrash(){
  if(crashRunning)return;
  if(Date.now() - (window._lastCrashEnd||0) < 500){showToast('Cooldown! Wait...',false);return;}
  const bet=parseFloat(document.getElementById('crashBet').value)||10;
  if(bet<=0)return;
  if(!checkMaxBet(bet,'Crash'))return;
  if(bet>balance){showToast('Not enough balance!',false);return;}
  crashBetAmount=bet;balance-=bet;updateBalDisplay();
  crashCashedOut=false;crashRunning=true;
  window._crashCashoutReady=false;
  setTimeout(()=>{window._crashCashoutReady=true;},200);
  crashMultVal=1;crashHistory=[{t:0,m:1}];
  
  let rnd = Math.random();
  if (rnd >= 0.99999) rnd = 0.99999; 
  crashPoint=1+(0.92/(1-rnd))-0.92;
  
  if(typeof getLuckBonus==='function'){ const lb=getLuckBonus(); if(lb>1) crashPoint*=lb; }
  if(crashPoint<1.02)crashPoint=1.02;
  if(crashPoint>100)crashPoint=100;
  if(!isFinite(crashPoint))crashPoint=1.02;

  document.getElementById('crashStartBtn').style.display='none';
  document.getElementById('cashoutBtn').style.display='';
  document.getElementById('crashStatus').textContent='Multiplier rising...';
  document.getElementById('crashMultiplier').className='crash-multiplier';

  crashStartTime=performance.now();
  playClickSound();
  animateCrash();
}

function animateCrash(){
  if(!crashRunning)return;
  const elapsed=(performance.now()-crashStartTime)/1000;
  crashMultVal=Math.pow(Math.E,0.06*elapsed*elapsed+0.04*elapsed);
  crashMultVal=Math.round(crashMultVal*100)/100;
  if(crashMultVal<1)crashMultVal=1;
  crashHistory.push({t:elapsed,m:crashMultVal});
  if(crashHistory.length>500)crashHistory.splice(0,crashHistory.length-500);

  document.getElementById('crashMultiplier').textContent=crashMultVal.toFixed(2)+'×';
  drawCrashGraph();

  if(crashMultVal>=crashPoint){
    crashRunning=false;
    window._lastCrashEnd=Date.now();
    document.getElementById('crashMultiplier').textContent=crashPoint.toFixed(2)+'×';
    document.getElementById('crashMultiplier').className='crash-multiplier crashed';
    document.getElementById('crashStatus').textContent='CRASHED at '+crashPoint.toFixed(2)+'×';
    document.getElementById('crashStartBtn').style.display='';
    document.getElementById('cashoutBtn').style.display='none';

    if(!crashCashedOut){
      const crashShielded = typeof isShieldActive==='function' && isShieldActive();
      if(crashShielded){ const refund=Math.floor(crashBetAmount*0.5); balance+=refund; updateBalDisplay(); showToast('🛡️ Shield! -$'+(crashBetAmount-refund).toFixed(2),false); }
      else{ showToast('CRASHED! -$'+crashBetAmount.toFixed(2),false); }
      playLoseSound();
      recordGame('crash', crashBetAmount, 0);
    }
    drawCrashGraph();return;
  }
  requestAnimationFrame(animateCrash);
}

function cashOut(){
  if(!crashRunning||crashCashedOut)return;
  if(!window._crashCashoutReady){showToast('Wait...',false);return;}
  crashCashedOut=true;
  const winnings=crashBetAmount*crashMultVal;
  balance+=winnings;updateBalDisplay();
  crashRunning=false;
  window._lastCrashEnd=Date.now();

  document.getElementById('crashStatus').textContent='Cashed out at '+crashMultVal.toFixed(2)+'× — Won $'+winnings.toFixed(2);
  document.getElementById('crashStartBtn').style.display='';
  document.getElementById('cashoutBtn').style.display='none';

  showBigWin(winnings);
  showToast('WIN $'+winnings.toFixed(2)+'!');
  playWinSound();
  spawnParticles(window.innerWidth/2,window.innerHeight/2,40);
  recordGame('crash', crashBetAmount, winnings);
  if (crashMultVal > (gameStats.crash.biggestMultiplier || 0)) gameStats.crash.biggestMultiplier = crashMultVal;
  drawCrashGraph();
}


const ROUL_NUMS=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED_NUMS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
let rouletteSpinning=false,rouletteAngle=0,selectedRoulBet=null,rouletteDrawn=false;

function selectRoulBet(type,btn){
  selectedRoulBet=type;playClickSound();
  document.querySelectorAll('.roul-bet-btn').forEach(b=>b.classList.remove('selected'));
  if(btn)btn.classList.add('selected');
}

function drawRouletteWheel(angle){
  rouletteDrawn=true;
  const c=document.getElementById('rouletteCanvas');const ctx=c.getContext('2d');
  const cx=c.width/2,cy=c.height/2,r=c.width/2-10;
  ctx.clearRect(0,0,c.width,c.height);

  const n=ROUL_NUMS.length;
  const sliceAngle=Math.PI*2/n;

  ROUL_NUMS.forEach((num,i)=>{
    const start=angle+i*sliceAngle;const end=start+sliceAngle;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();
    if(num===0)ctx.fillStyle='#00884a';
    else if(RED_NUMS.has(num))ctx.fillStyle='#cc2233';
    else ctx.fillStyle='#1a1a1a';
    ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=1;ctx.stroke();

    
    const ta=start+sliceAngle/2;
    const tx=cx+Math.cos(ta)*(r*0.78);const ty=cy+Math.sin(ta)*(r*0.78);
    ctx.save();ctx.translate(tx,ty);ctx.rotate(ta+Math.PI/2);
    ctx.fillStyle='#fff';ctx.font='bold 11px Inter';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(num.toString(),0,0);ctx.restore();
  });

  
  ctx.beginPath();ctx.arc(cx,cy,r*0.15,0,Math.PI*2);
  const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r*0.15);
  cg.addColorStop(0,'#2a2a5e');cg.addColorStop(1,'#15153a');
  ctx.fillStyle=cg;ctx.fill();
  ctx.strokeStyle='rgba(255,215,0,.5)';ctx.lineWidth=2;ctx.stroke();

  
  ctx.beginPath();ctx.arc(cx,cy,r+3,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,215,0,.25)';ctx.lineWidth=5;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,r-1,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,215,0,.15)';ctx.lineWidth=1;ctx.stroke();
}

function spinRoulette(){
  if(rouletteSpinning)return;
  if(!selectedRoulBet){showToast('Select a bet type first!',false);return;}
  const bet=parseFloat(document.getElementById('roulBetInput').value)||10;
  if(bet<=0)return;
  if(!checkMaxBet(bet,'Roulette'))return;
  if(bet>balance){showToast('Not enough balance!',false);return;}

  rouletteSpinning=true;balance-=bet;updateBalDisplay();
  document.getElementById('roulSpinBtn').disabled=true;
  document.getElementById('rouletteResult').textContent='';
  playClickSound();

  
  const n=ROUL_NUMS.length;
  const winIdx=Math.floor(Math.random()*n);
  const winNum=ROUL_NUMS[winIdx];
  
  const isActuallyRed=RED_NUMS.has(winNum);
  const isActuallyGreen=winNum===0;
  const sliceAngle=Math.PI*2/n;

  
  const targetCenter=winIdx*sliceAngle+sliceAngle/2;
  const targetAngle=-Math.PI/2-targetCenter+Math.PI*2*(6+Math.random()*3);
  const startAngle=rouletteAngle;
  const totalRot=targetAngle-startAngle;

  const duration=4500;const st=performance.now();
  let lastTickAngle=startAngle;

  function animWheel(now){
    const elapsed=now-st;const prog=Math.min(elapsed/duration,1);
    const eased=1-Math.pow(1-prog,4);
    const cur=startAngle+totalRot*eased;
    drawRouletteWheel(cur);

    
    const angleDiff=Math.abs(cur-lastTickAngle);
    if(angleDiff>sliceAngle){
      lastTickAngle=cur;
      if(prog<0.85)playSound(400+Math.random()*200,'sine',.02,.025);
    }

    if(prog<1){requestAnimationFrame(animWheel);}
    else{
      rouletteAngle=cur%(Math.PI*2);
      rouletteSpinning=false;
      document.getElementById('roulSpinBtn').disabled=false;

      
      const pointerAngle=((-Math.PI/2-rouletteAngle)%(Math.PI*2)+Math.PI*4)%(Math.PI*2);
      const visualIdx=Math.floor(pointerAngle/sliceAngle)%n;
      const visualNum=ROUL_NUMS[visualIdx];
      
      const fNum=visualNum;
      const fRed=RED_NUMS.has(fNum);
      const fGreen=fNum===0;

      const colorLabel=fGreen?'💚 Green':(fRed?'🔴 Red':'⚫ Black');
      const colorCSS=fGreen?'var(--green)':(fRed?'#ff5555':'#ccc');
      document.getElementById('rouletteResult').innerHTML=
        '<span style="color:'+colorCSS+'">'+fNum+' — '+colorLabel+'</span>';

      let won=false;
      if(selectedRoulBet==='red'&&fRed)won=true;
      if(selectedRoulBet==='black'&&!fRed&&!fGreen)won=true;
      if(selectedRoulBet==='green'&&fGreen)won=true;
      if(selectedRoulBet==='odd'&&fNum>0&&fNum%2===1)won=true;
      if(selectedRoulBet==='even'&&fNum>0&&fNum%2===0)won=true;
      if(selectedRoulBet==='1-18'&&fNum>=1&&fNum<=18)won=true;
      if(selectedRoulBet==='19-36'&&fNum>=19&&fNum<=36)won=true;

      if(won){
        let payout=selectedRoulBet==='green'?bet*36:bet*2;
        
        if(typeof getLuckBonus==='function') payout=Math.round(payout*getLuckBonus()*100)/100;
        balance+=payout;updateBalDisplay();
        showBigWin(payout);
        showToast('WIN $'+payout.toFixed(2)+'!');playWinSound();
        const rect=document.getElementById('rouletteCanvas').getBoundingClientRect();
        spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2,40);
        recordGame('roulette', bet, payout);
      }else{
        const roulShielded = typeof isShieldActive==='function' && isShieldActive();
        if(roulShielded){ const refund=Math.floor(bet*0.5); balance+=refund; updateBalDisplay(); showToast('🛡️ Shield! -$'+(bet-refund).toFixed(2),false); }
        else{ showToast('-$'+bet.toFixed(2),false); }
        playLoseSound();
        recordGame('roulette', bet, 0);
      }
    }
  }
  requestAnimationFrame(animWheel);
}


const RARITY={
  consumer:  {label:'Consumer Grade', color:'#b0c3d9',cls:'rarity-consumer',  tier:0},
  industrial:{label:'Industrial Grade',color:'#5e98d9',cls:'rarity-industrial',tier:1},
  milspec:   {label:'Mil-Spec',       color:'#4b69ff',cls:'rarity-milspec',   tier:2},
  restricted:{label:'Restricted',     color:'#8847ff',cls:'rarity-restricted',tier:3},
  classified:{label:'Classified',     color:'#d32ce6',cls:'rarity-classified',tier:4},
  covert:    {label:'Covert',         color:'#eb4b4b',cls:'rarity-covert',    tier:5},
  legendary: {label:'★ Legendary',    color:'#ffd700',cls:'rarity-legendary', tier:6},
  mythic:    {label:'★★ Mythic',      color:'#ff4500',cls:'rarity-legendary', tier:7},
};


const ITEM_CATALOG={
  
  rustedCoin:      {id:'rustedCoin',      name:'Rusted Coin',        icon:'🪙', rarity:'consumer',  baseValue:15},
  brokenCompass:   {id:'brokenCompass',   name:'Broken Compass',     icon:'🧭', rarity:'consumer',  baseValue:20},
  driftwood:       {id:'driftwood',       name:'Driftwood Charm',    icon:'🪵', rarity:'consumer',  baseValue:12},
  seaGlass:        {id:'seaGlass',        name:'Sea Glass',          icon:'💠', rarity:'consumer',  baseValue:18},
  coconutShell:    {id:'coconutShell',    name:'Coconut Shell',      icon:'🥥', rarity:'consumer',  baseValue:10},
  
  bronzeMedallion: {id:'bronzeMedallion', name:'Bronze Medallion',   icon:'🏅', rarity:'industrial',baseValue:60},
  pearlFragment:   {id:'pearlFragment',   name:'Pearl Fragment',     icon:'⚪', rarity:'industrial',baseValue:80},
  corkedBottle:    {id:'corkedBottle',    name:'Corked Bottle',      icon:'🍾', rarity:'industrial',baseValue:70},
  ancientMap:      {id:'ancientMap',      name:'Ancient Map',        icon:'🗺️', rarity:'industrial', baseValue:90},
  
  silverDagger:    {id:'silverDagger',    name:'Silver Dagger',      icon:'🗡️', rarity:'milspec',   baseValue:200},
  crystalOrb:      {id:'crystalOrb',      name:'Crystal Orb',        icon:'🔮', rarity:'milspec',   baseValue:250},
  enchantedRing:   {id:'enchantedRing',   name:'Enchanted Ring',     icon:'💍', rarity:'milspec',   baseValue:300},
  stormLantern:    {id:'stormLantern',    name:'Storm Lantern',      icon:'🏮', rarity:'milspec',   baseValue:220},
  
  goldenCompass:   {id:'goldenCompass',   name:'Golden Compass',     icon:'🧭', rarity:'restricted',baseValue:600},
  dragonScale:     {id:'dragonScale',     name:'Dragon Scale',       icon:'🐉', rarity:'restricted',baseValue:750},
  phoenixFeather:  {id:'phoenixFeather',  name:'Phoenix Feather',    icon:'🪶', rarity:'restricted',baseValue:700},
  moonstone:       {id:'moonstone',       name:'Moonstone Gem',      icon:'🌙', rarity:'restricted',baseValue:650},
  
  voidShard:       {id:'voidShard',       name:'Void Shard',         icon:'♠️', rarity:'classified',baseValue:1500},
  starforgedBlade: {id:'starforgedBlade', name:'Starforged Blade',   icon:'⚔️', rarity:'classified',baseValue:2000},
  abyssalPearl:    {id:'abyssalPearl',    name:'Abyssal Pearl',      icon:'⚫', rarity:'classified',baseValue:1800},
  
  dragonheart:     {id:'dragonheart',     name:'Dragonheart',        icon:'❤️‍🔥', rarity:'covert', baseValue:5000},
  etherealCrown:   {id:'etherealCrown',   name:'Ethereal Crown',     icon:'👑', rarity:'covert',    baseValue:6000},
  cosmicDust:      {id:'cosmicDust',      name:'Cosmic Dust',        icon:'✨', rarity:'covert',    baseValue:5500},
  
  infinityGem:     {id:'infinityGem',     name:'Infinity Gem',       icon:'💎', rarity:'legendary', baseValue:15000},
  islandRelic:     {id:'islandRelic',     name:'Island Relic',       icon:'🏝️', rarity:'legendary', baseValue:25000},
  casinoChip:      {id:'casinoChip',      name:'Casino Royale Chip', icon:'🎰', rarity:'legendary', baseValue:30000},
  
  
  obsidianCrown:   {id:'obsidianCrown',   name:'Obsidian Crown',     icon:'🖤', rarity:'legendary', baseValue:100000},
  solarFlare:      {id:'solarFlare',      name:'Solar Flare',        icon:'☀️', rarity:'legendary', baseValue:200000},
  voidEngine:      {id:'voidEngine',      name:'Void Engine',        icon:'⚙️', rarity:'legendary', baseValue:500000},
  
  worldEater:      {id:'worldEater',      name:'World Eater',        icon:'🌍', rarity:'mythic',    baseValue:2000000},
  tidalForce:      {id:'tidalForce',      name:'Tidal Force',        icon:'🌊', rarity:'mythic',    baseValue:5000000},
  cosmicTear:      {id:'cosmicTear',      name:'Cosmic Tear',        icon:'💧', rarity:'mythic',    baseValue:15000000},
  galaxyHeart:     {id:'galaxyHeart',     name:'Galaxy Heart',       icon:'🫀', rarity:'mythic',    baseValue:50000000},
  infinityCascade: {id:'infinityCascade', name:'Infinity Cascade',   icon:'♾️', rarity:'mythic',    baseValue:250000000},
  bigBang:         {id:'bigBang',         name:'Big Bang',           icon:'💥', rarity:'mythic',    baseValue:1000000000},
};


const CASES = [
  { name:'Starter Crate', icon:'📦', price:50, items:[
    {id:'rustedCoin',w:20},{id:'brokenCompass',w:18},{id:'driftwood',w:18},{id:'seaGlass',w:16},
    {id:'coconutShell',w:18},{id:'bronzeMedallion',w:10},{id:'pearlFragment',w:8},{id:'corkedBottle',w:8},
    {id:'ancientMap',w:6},{id:'silverDagger',w:3},{id:'crystalOrb',w:2},{id:'enchantedRing',w:1}
  ]},
  { name:'Explorer Chest', icon:'🧰', price:200, items:[
    {id:'bronzeMedallion',w:15},{id:'pearlFragment',w:14},{id:'corkedBottle',w:14},{id:'ancientMap',w:12},
    {id:'silverDagger',w:10},{id:'crystalOrb',w:8},{id:'enchantedRing',w:7},{id:'stormLantern',w:7},
    {id:'goldenCompass',w:4},{id:'dragonScale',w:3},{id:'phoenixFeather',w:3},{id:'moonstone',w:3}
  ]},
  { name:'Mystic Vault', icon:'🔮', price:500, items:[
    {id:'silverDagger',w:10},{id:'crystalOrb',w:10},{id:'enchantedRing',w:9},{id:'stormLantern',w:9},
    {id:'goldenCompass',w:8},{id:'dragonScale',w:7},{id:'phoenixFeather',w:7},{id:'moonstone',w:7},
    {id:'voidShard',w:4},{id:'starforgedBlade',w:3},{id:'abyssalPearl',w:3.5},
    {id:'dragonheart',w:1.2},{id:'etherealCrown',w:0.8},{id:'cosmicDust',w:1}
  ]},
  { name:'Legendary Trove', icon:'👑', price:2000, items:[
    {id:'goldenCompass',w:8},{id:'dragonScale',w:8},{id:'phoenixFeather',w:8},{id:'moonstone',w:8},
    {id:'voidShard',w:7},{id:'starforgedBlade',w:6},{id:'abyssalPearl',w:6},
    {id:'dragonheart',w:5},{id:'etherealCrown',w:4},{id:'cosmicDust',w:4.5},
    {id:'infinityGem',w:2},{id:'islandRelic',w:1.2},{id:'casinoChip',w:1}
  ]},
  { name:'Diamond Vault', icon:'💎', price:10000, items:[
    {id:'voidShard',w:10},{id:'starforgedBlade',w:9},{id:'abyssalPearl',w:9},
    {id:'dragonheart',w:8},{id:'etherealCrown',w:7},{id:'cosmicDust',w:7},
    {id:'infinityGem',w:6},{id:'islandRelic',w:4},{id:'casinoChip',w:4},
    {id:'obsidianCrown',w:2.5},{id:'solarFlare',w:1},{id:'voidEngine',w:0.4}
  ]},
  { name:'Whale Chest', icon:'🐋', price:100000, items:[
    {id:'infinityGem',w:10},{id:'islandRelic',w:8},{id:'casinoChip',w:8},
    {id:'obsidianCrown',w:7},{id:'solarFlare',w:5},{id:'voidEngine',w:3},
    {id:'worldEater',w:1.5},{id:'tidalForce',w:0.8},{id:'cosmicTear',w:0.3}
  ]},
  { name:'Cosmic Crate', icon:'🌌', price:1000000, items:[
    {id:'obsidianCrown',w:10},{id:'solarFlare',w:8},{id:'voidEngine',w:6},
    {id:'worldEater',w:5},{id:'tidalForce',w:3},{id:'cosmicTear',w:1.5},
    {id:'galaxyHeart',w:0.5},{id:'infinityCascade',w:0.15}
  ]},
  { name:'Big Bang Box', icon:'💥', price:50000000, items:[
    {id:'voidEngine',w:10},{id:'worldEater',w:8},{id:'tidalForce',w:6},
    {id:'cosmicTear',w:5},{id:'galaxyHeart',w:3},{id:'infinityCascade',w:1.5},
    {id:'bigBang',w:0.5}
  ]}
];


let inventory = [];
let invIdCounter = Date.now();

function addToInventory(itemId) {
  const cat = ITEM_CATALOG[itemId];
  if (!cat) return;
  invIdCounter++;
  const item = { id: invIdCounter, itemId: itemId, acquiredPrice: getItemMarketValue(itemId), acquiredAt: Date.now() };
  inventory.push(item);
  
  const d = itemDemand[itemId];
  if (d) { d.supply = (d.supply || 0) + 1; d.mult = Math.max(0.3, d.mult - 0.01); }
  
  if (window._updateGlobalMarketItem) window._updateGlobalMarketItem(itemId, 'opened', getItemMarketValue(itemId));
}

function removeFromInventory(invId) {
  const idx = inventory.findIndex(x => x.id === invId);
  if (idx === -1) return;
  const item = inventory[idx];
  const d = itemDemand[item.itemId];
  if (d) { d.supply = Math.max(0, d.supply - 1); d.mult = Math.min(3, d.mult + 0.015); }
  
  const val = getItemMarketValue(item.itemId);
  if (window._updateGlobalMarketItem) window._updateGlobalMarketItem(item.itemId, 'sold', val);
  inventory.splice(idx, 1);
}

function getInventoryValue() {
  return inventory.reduce((s, x) => s + getItemMarketValue(x.itemId), 0);
}


let itemDemand = {};
let globalMarketData = {};

function initDemand() {
  Object.keys(ITEM_CATALOG).forEach(id => {
    if (!itemDemand[id]) itemDemand[id] = { mult: 1, velocity: 0, supply: 0, globalSupply: 0 };
  });
  if (window._initGlobalMarket) window._initGlobalMarket();
}

window._onGlobalMarketUpdate = (data) => {
  globalMarketData = data || {};
  Object.keys(globalMarketData).forEach(id => {
    const gm = globalMarketData[id];
    const d = itemDemand[id];
    if (!d) return;
    d.globalSupply = gm.globalSupply || 0;
    const supplyFactor = Math.max(0.3, 1.5 - d.globalSupply * 0.08);
    d.mult = d.mult * 0.7 + supplyFactor * 0.3;
    d.mult = Math.max(0.3, Math.min(3, d.mult));
    if (gm.lastTradePrice && gm.lastTradeTs && Date.now() - gm.lastTradeTs < 300000) {
      const cat = ITEM_CATALOG[id];
      if (cat && cat.baseValue > 0) {
        const tradeMult = gm.lastTradePrice / cat.baseValue;
        d.mult = d.mult * 0.85 + Math.max(0.3, Math.min(3, tradeMult)) * 0.15;
      }
    }
  });
};

function getItemMarketValue(id) {
  const cat = ITEM_CATALOG[id]; if (!cat) return 0;
  const d = itemDemand[id] || { mult: 1 };
  return Math.round(cat.baseValue * d.mult);
}

function tickDemand() {
  const tick = Math.floor(Date.now() / 5000);
  Object.keys(itemDemand).forEach((id, idx) => {
    const d = itemDemand[id];
    
    const seed = ((tick * 2654435761) ^ (idx * 340573321)) >>> 0;
    const r = (seed % 1000) / 1000; 
    const shift = (r - 0.5) * 0.02; 
    d.velocity = d.velocity * 0.9 + shift * 0.1;
    d.mult += d.velocity;
    
    d.mult += (1 - d.mult) * 0.005;
    d.mult = Math.max(0.3, Math.min(3, d.mult));
  });
}
setInterval(tickDemand, 5000);


let caseStreak = 0, caseOpenTotal = 0, caseBestTier = -1, caseBestName = '—';
let caseRecentUnboxes = [];
let selectedCase = 0, caseOpening = false;

function initCases() {
  initDemand();
  const sel = document.getElementById('caseSelector');
  CASES.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'case-card' + (i === 0 ? ' selected' : '');
    card.innerHTML = '<div class="case-icon">' + c.icon + '</div><div class="case-name">' + c.name + '</div><div class="case-price">$' + c.price.toLocaleString() + '</div>';
    card.onclick = () => { selectedCase = i; document.querySelectorAll('.case-card').forEach(x => x.classList.remove('selected')); card.classList.add('selected'); playClickSound(); };
    sel.appendChild(card);
  });
}

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const item of items) { r -= item.w; if (r <= 0) return item; }
  return items[items.length - 1];
}

function hexToRgb(h) {
  if (!h || h[0] !== '#') return '200,200,200';
  const n = parseInt(h.slice(1), 16);
  return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}

function pickWeightedWithStreak(items) {
  const streakBonus = Math.min(caseStreak * 0.02, 0.2);
  const adjusted = items.map(it => {
    const cat = ITEM_CATALOG[it.id];
    const tier = cat ? RARITY[cat.rarity].tier : 0;
    const boost = 1 + (tier >= 3 ? streakBonus * tier * 0.3 : 0);
    return { ...it, w: it.w * boost };
  });
  return pickWeighted(adjusted);
}

function updateCaseStats(winCat, winRarity) {
  caseOpenTotal++;
  
  if (winRarity.tier <= 1) { caseStreak = 0; } else { caseStreak++; }
  const countEl = document.getElementById('caseOpenCount');
  if (countEl) countEl.textContent = caseOpenTotal;
  const streakEl = document.getElementById('caseStreak');
  if (streakEl) streakEl.textContent = caseStreak;
  const bonusEl = document.getElementById('caseStreakBonus');
  if (bonusEl) {
    if (caseStreak >= 3) {
      const bonusPct = Math.min(caseStreak * 2, 20);
      bonusEl.textContent = ' +' + bonusPct + '% luck';
    } else {
      bonusEl.textContent = '';
    }
  }
  if (winRarity.tier > caseBestTier) {
    caseBestTier = winRarity.tier;
    caseBestName = winCat.icon + ' ' + winCat.name;
    const bestEl = document.getElementById('caseBestItem');
    if (bestEl) { bestEl.textContent = caseBestName; bestEl.style.color = winRarity.color; }
  }
  addToCaseRecentFeed(winCat, winRarity);
}

function addToCaseRecentFeed(cat, rar) {
  caseRecentUnboxes.unshift({ icon: cat.icon, name: cat.name, color: rar.color });
  if (caseRecentUnboxes.length > 20) caseRecentUnboxes.pop();
  const feed = document.getElementById('caseRecentFeed');
  if (!feed) return;
  const el = document.createElement('div');
  el.className = 'case-recent-item';
  el.style.borderColor = rar.color;
  el.innerHTML = '<span style="font-size:14px;">' + cat.icon + '</span><span style="color:' + rar.color + ';">' + cat.name + '</span>';
  feed.insertBefore(el, feed.firstChild);
  if (feed.children.length > 15) feed.removeChild(feed.lastChild);
}

function openCase() {
  if (caseOpening) return;
  const c = CASES[selectedCase];
  if(c.price>balance){showToast('Not enough balance!',false);return;}
  caseOpening = true; balance -= c.price; updateBalDisplay();
  document.getElementById('openCaseBtn').disabled = true;
  const quickBtn = document.getElementById('quickOpenBtn');
  if (quickBtn) quickBtn.disabled = true;
  document.getElementById('caseWon').textContent = '';
  document.getElementById('caseWonDetail').textContent = '';
  playClickSound();

  const opener = document.getElementById('caseOpener');
  opener.classList.remove('rare-reveal', 'legendary-reveal');
  const flashEl = document.getElementById('caseFlash');
  if (flashEl) flashEl.style.opacity = '0';

  const strip = document.getElementById('caseStrip');
  strip.innerHTML = ''; strip.style.transition = 'none'; strip.style.transform = 'translateX(0)';

  const winRef = caseStreak >= 3 ? pickWeightedWithStreak(c.items) : pickWeighted(c.items);
  const winCat = ITEM_CATALOG[winRef.id];
  const winRarity = RARITY[winCat.rarity];
  const winPos = 35;
  const totalItems = 50;

  for (let i = 0; i < totalItems; i++) {
    let ref;
    if (i === winPos) {
      ref = winRef;
    } else if (Math.abs(i - winPos) <= 2 && winRarity.tier >= 3 && Math.random() < 0.4) {
      const rareItems = c.items.filter(it => { const ct = ITEM_CATALOG[it.id]; return ct && RARITY[ct.rarity].tier >= Math.max(2, winRarity.tier - 1); });
      ref = rareItems.length > 0 ? rareItems[Math.floor(Math.random() * rareItems.length)] : c.items[Math.floor(Math.random() * c.items.length)];
    } else {
      ref = c.items[Math.floor(Math.random() * c.items.length)];
    }
    const cat = ITEM_CATALOG[ref.id];
    const rar = RARITY[cat.rarity];
    const el = document.createElement('div'); el.className = 'case-item';
    if (i === winPos) el.id = 'caseWinnerItem';
    el.style.borderColor = rar.color;
    el.style.background = 'linear-gradient(180deg,rgba(' + hexToRgb(rar.color) + ',.15),transparent)';
    el.innerHTML = '<div class="item-icon">' + cat.icon + '</div><div class="' + rar.cls + '" style="font-size:10px;">' + cat.name + '</div>'
      + '<div class="item-rarity" style="background:' + rar.color + ';"></div>';
    strip.appendChild(el);
  }

  requestAnimationFrame(() => { requestAnimationFrame(() => {
    const openerW = strip.parentElement.offsetWidth;
    const offset = winPos * 120 - openerW / 2 + 60 + (Math.random() * 60 - 30);
    strip.style.transition = 'transform 4s cubic-bezier(.08,.82,.17,1)';
    strip.style.transform = 'translateX(-' + offset + 'px)';
  }); });

  let ticks = 0;
  const tickI = setInterval(() => {
    const slowdown = Math.max(0.3, 1 - ticks / 60);
    playSound(400 + Math.random() * 500, 'sine', 0.02 * slowdown, 0.04 * slowdown);
    ticks++;
    if (ticks > 55) clearInterval(tickI);
  }, 65);

  setTimeout(() => {
    if (winRarity.tier >= 4 && flashEl) {
      flashEl.style.background = winRarity.color;
      flashEl.style.opacity = '0.3';
      setTimeout(() => flashEl.style.opacity = '0', 300);
    }
  }, 3500);

  setTimeout(() => {
    clearInterval(tickI); caseOpening = false;
    document.getElementById('openCaseBtn').disabled = false;
    if (quickBtn) quickBtn.disabled = false;

    const winEl = document.getElementById('caseWinnerItem');
    if (winEl) winEl.classList.add('highlighted');
    if (winRarity.tier >= 6) opener.classList.add('legendary-reveal');
    else if (winRarity.tier >= 3) opener.classList.add('rare-reveal');

    addToInventory(winRef.id);
    const mktVal = getItemMarketValue(winRef.id);
    const profit = mktVal - c.price;
    const isW = profit >= 0;

    document.getElementById('caseWon').innerHTML =
      '<span class="' + winRarity.cls + '" style="text-shadow:0 0 15px ' + winRarity.color + ';">' + winCat.icon + ' ' + winCat.name + '</span>';
    document.getElementById('caseWonDetail').innerHTML =
      '<span style="color:' + winRarity.color + '">' + winRarity.label + '</span> — Market: <span style="color:var(--gold)">$' + mktVal.toLocaleString() + '</span>'
      + ' <span style="color:' + (isW ? 'var(--green)' : 'var(--red)') + '">(' + (isW ? '+' : '') + ('$' + profit.toLocaleString()) + ')</span>'
      + (caseStreak >= 3 ? ' <span style="color:var(--neon);font-size:10px;">🔥 ' + caseStreak + '× streak!</span>' : '');

    if (winRarity.tier >= 6) {
      showToast('👑 LEGENDARY: ' + winCat.name + '!');
      playWinSound();
      setTimeout(() => { playSound(1047, 'sine', .3, .15); }, 300);
      setTimeout(() => { playSound(1319, 'sine', .4, .12); }, 500);
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 150);
      setTimeout(() => spawnParticles(window.innerWidth / 2, window.innerHeight / 3, 80), 300);
      setTimeout(() => spawnParticles(window.innerWidth / 2, window.innerHeight * 2 / 3, 80), 600);
    } else if (winRarity.tier >= 5) {
      showToast('🔥 ' + winRarity.label + ': ' + winCat.name + '!'); playWinSound();
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 80 + winRarity.tier * 30);
    } else if (winRarity.tier >= 3) {
      showToast(winCat.icon + ' ' + winCat.name + '!'); playWinSound();
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 30);
    } else {
      showToast(winCat.name + ' added to inventory', isW);
      if (!isW) playLoseSound(); else playWinSound();
    }

    updateCaseStats(winCat, winRarity);
    recordGame('cases', c.price, mktVal);
  }, 4300);
}

function quickOpenCase() {
  if (caseOpening) return;
  const c = CASES[selectedCase];
  if(c.price>balance){showToast('Not enough balance!',false);return;}
  caseOpening = true;
  balance -= c.price; updateBalDisplay();
  playClickSound();

  const winRef = caseStreak >= 3 ? pickWeightedWithStreak(c.items) : pickWeighted(c.items);
  const winCat = ITEM_CATALOG[winRef.id];
  const winRarity = RARITY[winCat.rarity];

  addToInventory(winRef.id);
  const mktVal = getItemMarketValue(winRef.id);
  const profit = mktVal - c.price;
  const isW = profit >= 0;

  document.getElementById('caseWon').innerHTML =
    '<span class="' + winRarity.cls + '" style="text-shadow:0 0 15px ' + winRarity.color + ';">' + winCat.icon + ' ' + winCat.name + '</span>';
  document.getElementById('caseWonDetail').innerHTML =
    '<span style="color:' + winRarity.color + '">' + winRarity.label + '</span> — Market: <span style="color:var(--gold)">$' + mktVal.toLocaleString() + '</span>'
    + ' <span style="color:' + (isW ? 'var(--green)' : 'var(--red)') + '">(' + (isW ? '+' : '') + ('$' + profit.toLocaleString()) + ')</span>';

  if (winRarity.tier >= 5) {
    showToast('🔥 ' + winRarity.label + ': ' + winCat.name + '!'); playWinSound();
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 60);
  } else if (winRarity.tier >= 3) {
    showToast(winCat.icon + ' ' + winCat.name + '!'); playWinSound();
  } else {
    if (isW) playWinSound(); else playLoseSound();
  }

  updateCaseStats(winCat, winRarity);
  recordGame('cases', c.price, mktVal);
  setTimeout(() => { caseOpening = false; }, 50);
}


function showInventory(){playClickSound();document.getElementById('inventoryOverlay').classList.add('show');renderInventory();}
function hideInventory(){document.getElementById('inventoryOverlay').classList.remove('show');}
let invFilter='all';

function filterInventory(f,btn){
  invFilter=f;
  document.querySelectorAll('.inv-tab').forEach(t=>t.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderInventory();
}

function renderInventory(){
  const grid=document.getElementById('invGrid');
  grid.innerHTML='';
  const totalVal=getInventoryValue();
  document.getElementById('invTotalValue').textContent=totalVal.toLocaleString();
  document.getElementById('invCount').textContent=inventory.length;

  
  let rarestTier=-1,rarestName='—';
  inventory.forEach(x=>{
    const cat=ITEM_CATALOG[x.itemId];
    if(!cat)return;
    const rarDef=RARITY[cat.rarity];
    if(!rarDef)return;
    const t=rarDef.tier;
    if(t>rarestTier){rarestTier=t;rarestName=cat.icon+' '+cat.name;}
  });
  document.getElementById('invRarest').textContent=rarestName;

  
  const trends=Object.values(itemDemand).map(d=>d.velocity);
  const avg=trends.length?trends.reduce((a,b)=>a+b,0)/trends.length:0;
  document.getElementById('invTrend').innerHTML=avg>0.005?'<span style="color:var(--green)">📈 Bullish</span>'
    :avg<-0.005?'<span style="color:var(--red)">📉 Bearish</span>':'<span style="color:var(--text2)">➡️ Stable</span>';

  let filtered=inventory;
  if(invFilter!=='all'){
    filtered=inventory.filter(x=>{const c=ITEM_CATALOG[x.itemId];return c&&c.rarity===invFilter;});
  }

  
  filtered.sort((a,b)=>{
    const catA=ITEM_CATALOG[a.itemId], catB=ITEM_CATALOG[b.itemId];
    const ra=catA&&RARITY[catA.rarity]?RARITY[catA.rarity].tier:0;
    const rb=catB&&RARITY[catB.rarity]?RARITY[catB.rarity].tier:0;
    if(rb!==ra)return rb-ra;
    return getItemMarketValue(b.itemId)-getItemMarketValue(a.itemId);
  });

  if(filtered.length===0){
    grid.innerHTML='<div class="inv-empty">No items'+(invFilter!=='all'?' of this rarity':'')+'. Open some cases!</div>';
    return;
  }

  filtered.forEach(inv=>{
    const cat=ITEM_CATALOG[inv.itemId];
    if(!cat)return; 
    const rar=RARITY[cat.rarity];
    if(!rar)return;
    const val=getItemMarketValue(inv.itemId);
    const pnl=val-(inv.acquiredPrice||0);
    const pnlPct=inv.acquiredPrice>0?((pnl/inv.acquiredPrice)*100).toFixed(1):0;
    const d=itemDemand[inv.itemId]||{mult:1};

    const el=document.createElement('div');el.className='inv-item';
    el.innerHTML=
      '<div class="ii-icon">'+cat.icon+'</div>'
      +'<div class="ii-name '+rar.cls+'">'+cat.name+'</div>'
      +'<div class="ii-value">$'+val.toLocaleString()+'</div>'
      +'<div class="ii-demand" style="color:'+(pnl>=0?'var(--green)':'var(--red)')+'">'+
        (pnl>=0?'▲':'▼')+' '+(pnl>=0?'+':'')+pnlPct+'% | x'+d.mult.toFixed(2)+'</div>'
      +'<button class="inv-sell-btn" data-inv="'+inv.id+'">SELL $'+val.toLocaleString()+'</button>'
      +'<div class="ii-rarity-bar" style="background:'+rar.color+';"></div>';
    grid.appendChild(el);
  });

  
  grid.querySelectorAll('.inv-sell-btn').forEach(btn=>{
    btn.onclick=(e)=>{
      e.stopPropagation();
      const invId=parseInt(btn.dataset.inv);
      const inv=inventory.find(x=>x.id===invId);
      if(!inv)return;
      const val=getItemMarketValue(inv.itemId);
      const cat=ITEM_CATALOG[inv.itemId];
      if(!cat){removeFromInventory(invId);renderInventory();return;}
      balance+=val;updateBalDisplay();
      removeFromInventory(invId);
      showToast('Sold '+cat.name+' for $'+val.toLocaleString()+'!');
      playWinSound();renderInventory();firebaseSave();
    };
  });
}


window._getInventoryData=()=>inventory;
window._loadInventory=(data)=>{if(Array.isArray(data)){inventory=data;invIdCounter=inventory.reduce((m,x)=>Math.max(m,x.id||0),Date.now());}};
window._getDemandData=()=>itemDemand;
window._loadDemand=(data)=>{if(data&&typeof data==='object'){Object.assign(itemDemand,data);}};


const PLINKO_PAYOUTS={
  8:{LOW:[5.6,2.1,1.1,1,.5,1,1.1,2.1,5.6],MEDIUM:[13,3,1.3,.7,.4,.7,1.3,3,13],HIGH:[29,4,1.5,.3,.2,.3,1.5,4,29]},
  9:{LOW:[5.6,2,1.6,1,.7,.7,1,1.6,2,5.6],MEDIUM:[18,4,1.7,.9,.5,.5,.9,1.7,4,18],HIGH:[43,7,2,.6,.2,.2,.6,2,7,43]},
  10:{LOW:[8.9,3,1.4,1.1,1,.5,1,1.1,1.4,3,8.9],MEDIUM:[22,5,2,1.4,.6,.4,.6,1.4,2,5,22],HIGH:[76,10,3,.9,.3,.2,.3,.9,3,10,76]},
  11:{LOW:[8.4,3,1.9,1.3,1,.7,.7,1,1.3,1.9,3,8.4],MEDIUM:[24,6,3,1.8,.7,.5,.5,.7,1.8,3,6,24],HIGH:[120,14,5.2,1.4,.4,.2,.2,.4,1.4,5.2,14,120]},
  12:{LOW:[10,3,1.6,1.4,1.1,1,.5,1,1.1,1.4,1.6,3,10],MEDIUM:[33,11,4,2,1.1,.6,.3,.6,1.1,2,4,11,33],HIGH:[170,24,8.1,2,.7,.2,.2,.2,.7,2,8.1,24,170]},
  13:{LOW:[8.1,4,3,1.9,1.2,.9,.7,.7,.9,1.2,1.9,3,4,8.1],MEDIUM:[43,13,6,3,1.3,.7,.4,.4,.7,1.3,3,6,13,43],HIGH:[260,37,11,4,1,.2,.2,.2,.2,1,4,11,37,260]},
  14:{LOW:[7.1,4,1.9,1.4,1.3,1.1,1,.5,1,1.1,1.3,1.4,1.9,4,7.1],MEDIUM:[58,15,7,4,1.9,1,.5,.2,.5,1,1.9,4,7,15,58],HIGH:[420,56,18,5,1.9,.3,.2,.2,.2,.3,1.9,5,18,56,420]},
  15:{LOW:[15,8,3,2,1.5,1.1,1,.7,.7,1,1.1,1.5,2,3,8,15],MEDIUM:[88,18,11,5,3,1.3,.5,.3,.3,.5,1.3,3,5,11,18,88],HIGH:[620,83,27,8,3,.5,.2,.2,.2,.2,.5,3,8,27,83,620]},
  16:{LOW:[16,9,2,1.4,1.4,1.2,1.1,1,.5,1,1.1,1.2,1.4,1.4,2,9,16],MEDIUM:[110,41,10,5,3,1.5,1,.5,.3,.5,1,1.5,3,5,10,41,110],HIGH:[1000,130,26,9,4,2,.2,.2,.2,.2,.2,2,4,9,26,130,1000]}
};
const BALL_FRICTIONS={8:.0395,9:.041,10:.038,11:.0355,12:.0414,13:.0437,14:.0401,15:.0418,16:.0364};

let plinkoInitialized=false,plinkoMatterEngine=null,plinkoMatterRender=null,plinkoMatterRunner=null;
let plinkoPins=[],plinkoWalls=[],plinkoSensor=null,plinkoBallBets={};
let plinkoDropCount=0,plinkoTotalProfit=0,plinkoLastWinsList=[];
let plinkoProfitHistory=[0]; 
let plinkoProfitChartInstance = null; 
let plinkoWinCount=0, plinkoLossCount=0; 
let autoDropInterval=null,autoDropping=false,plinkoDropLock=false;
let plinkoRowCount=16,plinkoRiskLevel='MEDIUM';
let plinkoLastRowXCoords=[];

const PW=760,PH=570,PPX=52,PPT=36,PPB=28;
const PIN_CAT=0x0001,BALL_CAT=0x0002;

function initPlinko(){
  if(plinkoInitialized)return;plinkoInitialized=true;
  const canvas=document.getElementById('plinkoCanvas');
  canvas.width=PW;canvas.height=PH;

  const engine=Matter.Engine.create({timing:{timeScale:1}});
  const dpr=window.devicePixelRatio||1;
  const render=Matter.Render.create({engine,canvas,options:{width:PW,height:PH,pixelRatio:dpr,background:'#0f1728',wireframes:false}});
  const runner=Matter.Runner.create();
  plinkoMatterEngine=engine;plinkoMatterRender=render;plinkoMatterRunner=runner;

  plinkoSensor=Matter.Bodies.rectangle(PW/2,PH,PW,10,{isSensor:true,isStatic:true,render:{visible:false}});
  Matter.Composite.add(engine.world,[plinkoSensor]);

  Matter.Events.on(engine,'collisionStart',({pairs})=>{
    pairs.forEach(({bodyA,bodyB})=>{
      if(bodyA===plinkoSensor)handlePlinkoHit(bodyB);
      else if(bodyB===plinkoSensor)handlePlinkoHit(bodyA);
    });
  });

  
  Matter.Events.on(engine,'collisionStart',({pairs})=>{
    pairs.forEach(({bodyA,bodyB})=>{
      const pin=(bodyA.collisionFilter.category===PIN_CAT)?bodyA:
                (bodyB.collisionFilter.category===PIN_CAT)?bodyB:null;
      if(pin){
        pin.render.fillStyle='#00f0ff';
        setTimeout(()=>{pin.render.fillStyle='#ffffff';},80);
        const pitch=350+(pin.position.x/PW)*300+(pin.position.y/PH)*80;
        playSound(pitch,'sine',.02,.008);
      }
    });
  });

  placePlinkoPins();
  updatePlinkoBins();
  Matter.Render.run(render);
  Matter.Runner.run(runner,engine);
  
  if(render && render.canvas){ render.canvas.style.width = document.querySelector('.plinko-canvas-wrap').clientWidth + 'px'; render.canvas.style.height = document.querySelector('.plinko-canvas-wrap').clientHeight + 'px'; }

  
  Matter.Events.on(render,'afterRender',()=>{
    const ctx=render.context;
    Matter.Composite.allBodies(engine.world).forEach(body=>{
      if(body.collisionFilter.category===BALL_CAT){
        const {x,y}=body.position;const r=body.circleRadius||6;
        ctx.save();
        const grd=ctx.createRadialGradient(x,y,r*.5,x,y,r*3);
        grd.addColorStop(0,'rgba(255,80,80,0.25)');grd.addColorStop(1,'rgba(255,40,40,0)');
        ctx.fillStyle=grd;ctx.beginPath();ctx.arc(x,y,r*3,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
    });
  });

  
  setInterval(()=>{
    Matter.Composite.allBodies(engine.world).forEach(body=>{
      if(body.collisionFilter.category===BALL_CAT&&(body.position.y>PH+60||body.position.x<-20||body.position.x>PW+20)){
        Matter.Composite.remove(engine.world,body);
        delete plinkoBallBets[body.id];
      }
    });
  },2000);

  document.getElementById('plinkoRows').addEventListener('change',e=>{
    
    const activeBalls=Object.keys(plinkoBallBets);
    if(activeBalls.length>0){
      let refundTotal=0;
      activeBalls.forEach(id=>{refundTotal+=plinkoBallBets[id].bet||0;});
      if(refundTotal>0){balance+=refundTotal;updateBalDisplay();showToast('Refunded $'+refundTotal.toFixed(2)+' for in-flight balls',true);}
    }
    plinkoRowCount=parseInt(e.target.value);
    removeAllPlinkoBalls();placePlinkoPins();updatePlinkoBins();
  });
  document.getElementById('plinkoRisk').addEventListener('change',e=>{
    plinkoRiskLevel=e.target.value;updatePlinkoBins();
  });
}

function getPinDistX(){return(PW-PPX*2)/(3+plinkoRowCount-1-1);}
function getPinR(){return(24-plinkoRowCount)/2;}

function placePlinkoPins(){
  if(plinkoPins.length)Matter.Composite.remove(plinkoMatterEngine.world,plinkoPins);
  if(plinkoWalls.length)Matter.Composite.remove(plinkoMatterEngine.world,plinkoWalls);
  plinkoPins=[];plinkoWalls=[];plinkoLastRowXCoords=[];

  const pinDist=getPinDistX();const pinR=getPinR();

  for(let row=0;row<plinkoRowCount;row++){
    const rowY=PPT+((PH-PPT-PPB)/(plinkoRowCount-1))*row;
    const rowPadX=PPX+((plinkoRowCount-1-row)*pinDist)/2;
    const cols=3+row;
    for(let col=0;col<cols;col++){
      const colX=cols>1?rowPadX+((PW-rowPadX*2)/(cols-1))*col:PW/2;
      const pin=Matter.Bodies.circle(colX,rowY,pinR,{
        isStatic:true,render:{fillStyle:'#ffffff'},
        collisionFilter:{category:PIN_CAT,mask:BALL_CAT}
      });
      plinkoPins.push(pin);
      if(row===plinkoRowCount-1)plinkoLastRowXCoords.push(colX);
    }
  }
  Matter.Composite.add(plinkoMatterEngine.world,plinkoPins);

  
  if(plinkoLastRowXCoords.length>1){
    const firstPinX=plinkoPins[0].position.x;
    const wallAngle=Math.atan2(firstPinX-plinkoLastRowXCoords[0],PH-PPT-PPB);
    const wallX=firstPinX-(firstPinX-plinkoLastRowXCoords[0])/2-pinDist*0.25;

    const lw=Matter.Bodies.rectangle(wallX,PH/2,10,PH,{isStatic:true,angle:wallAngle,render:{visible:false}});
    const rw=Matter.Bodies.rectangle(PW-wallX,PH/2,10,PH,{isStatic:true,angle:-wallAngle,render:{visible:false}});
    plinkoWalls=[lw,rw];
    Matter.Composite.add(plinkoMatterEngine.world,plinkoWalls);
  }
}

function updatePlinkoBins(){
  const binsEl=document.getElementById('plinkoBins');
  const payouts=PLINKO_PAYOUTS[plinkoRowCount][plinkoRiskLevel];
  const count=payouts.length;
  binsEl.innerHTML='';

  
  
  const half=Math.ceil(count/2);
  function lerpC(a,b,t){return Math.round(a+(b-a)*t);}
  function binBg(i){
    const t2=Math.abs(i-(count-1)/2)/((count-1)/2);
    return'rgb('+lerpC(255,255,t2)+','+lerpC(192,0,t2)+','+lerpC(0,63,t2)+')';
  }
  function binSh(i){
    const t2=Math.abs(i-(count-1)/2)/((count-1)/2);
    return'rgb('+lerpC(171,166,t2)+','+lerpC(121,0,t2)+','+lerpC(0,4,t2)+')';
  }
  for(let i=0;i<count;i++){
    const bin=document.createElement('div');bin.className='plinko-bin';
    bin.style.background=binBg(i);
    bin.style.boxShadow='0 3px 0 '+binSh(i);
    bin.textContent=payouts[i]+'×';
    bin.id='plinkoBin'+i;
    binsEl.appendChild(bin);
  }

  if(plinkoLastRowXCoords.length>1){
    const first=plinkoLastRowXCoords[0],last=plinkoLastRowXCoords[plinkoLastRowXCoords.length-1];
    const pct=((last-first)/PW)*100;
    binsEl.style.width=pct+'%';
  }
}

function handlePlinkoHit(ball){
  if(!plinkoLastRowXCoords.length)return;
  const coords=plinkoLastRowXCoords;
  const ballX=ball.position.x;
  
  let binIndex=-1;
  for(let i=coords.length-1;i>=0;i--){
    if(coords[i]<ballX){binIndex=i;break;}
  }

  
  Matter.Composite.remove(plinkoMatterEngine.world,ball);
  const ballData=plinkoBallBets[ball.id]||{bet:0,risk:plinkoRiskLevel,rows:plinkoRowCount};
  const betAmt=typeof ballData==='object'?ballData.bet:ballData;
  const ballRisk=typeof ballData==='object'?ballData.risk:plinkoRiskLevel;
  const ballRows=typeof ballData==='object'?ballData.rows:plinkoRowCount;
  delete plinkoBallBets[ball.id];

  if(binIndex<0){binIndex=0;}
  if(binIndex>=coords.length-1){binIndex=coords.length-2;}
  if(binIndex<0){return;} 
  
  playSound(180+(binIndex/(coords.length-1))*120,'triangle',.06,.04);

  const payouts=PLINKO_PAYOUTS[ballRows][ballRisk];
  if(!payouts){return;}
  const multiplier=payouts[binIndex];
  const payout=betAmt*multiplier;
  const profit=payout-betAmt;

  balance+=payout;
  plinkoTotalProfit+=profit;
  
  if(profit>=0) plinkoWinCount++; else plinkoLossCount++;
  
  plinkoProfitHistory.push(plinkoTotalProfit); if(plinkoProfitHistory.length>500)plinkoProfitHistory.shift();
  
  try{ updatePlinkoProfitChart(); }catch(e){}
  plinkoDropCount++;
  updateBalDisplay();

  document.getElementById('plinkoDropCount').textContent=plinkoDropCount;
  
  const profitEl=document.getElementById('plinkoProfit');
  profitEl.textContent=(plinkoTotalProfit>=0?'+':'')+('$'+Math.abs(plinkoTotalProfit).toFixed(2));
  profitEl.style.color=plinkoTotalProfit>=0?'#4ade80':'#f87171';
  
  document.getElementById('plinkoWins').textContent=plinkoWinCount.toLocaleString();
  document.getElementById('plinkoLosses').textContent=plinkoLossCount.toLocaleString();

  
  const binEl=document.getElementById('plinkoBin'+binIndex);
  if(binEl){binEl.classList.remove('bounce');void binEl.offsetWidth;binEl.classList.add('bounce');}

  
  plinkoLastWinsList.push({multiplier,binIndex});
  if(plinkoLastWinsList.length>4)plinkoLastWinsList.shift();
  renderPlinkoLastWins();

  
  if(multiplier>=10){
    playWinSound();
    const rect=document.getElementById('plinkoCanvas').getBoundingClientRect();
    const bx=rect.left+rect.width*(ballX/PW);
    const by=rect.top+rect.height;
    spawnParticles(bx,by,20+Math.min(multiplier,100));
    showToast(multiplier+'× — $'+payout.toFixed(2)+'!');
  }else if(multiplier>=3){
    playSound(600,'sine',.08,.08);
  }else{
    playSound(300,'sine',.04,.04);
  }
  recordGame('plinko', betAmt, payout);
}

function renderPlinkoLastWins(){
  const container=document.getElementById('plinkoLastWins');
  container.innerHTML='';
  const payouts=PLINKO_PAYOUTS[plinkoRowCount][plinkoRiskLevel];
  const count=payouts.length;

  [...plinkoLastWinsList].reverse().forEach(w=>{
    const t=Math.abs(w.binIndex-(count-1)/2)/((count-1)/2);
    const el=document.createElement('div');el.className='plinko-last-win';
    el.style.background='rgb('+Math.round(255)+','+Math.round(192-192*t)+','+Math.round(63*t)+')';
    el.textContent=w.multiplier+'×';
    container.appendChild(el);
  });
}


const PLINKO_WIN_COLOR='rgb(74,222,128)', PLINKO_WIN_FILL='rgba(74,222,128,0.3)';
const PLINKO_LOSS_COLOR='rgb(248,113,113)', PLINKO_LOSS_FILL='rgba(248,113,113,0.3)';
const PLINKO_X_AXIS_COLOR='#1e293b', PLINKO_HOVER_COLOR='#fff';

function updatePlinkoProfitChart(){
  const canvas=document.getElementById('plinkoProfitChart'); if(!canvas) return;
  if(typeof Chart==='undefined') return;
  const data=plinkoProfitHistory.length? plinkoProfitHistory : [0];
  if(plinkoProfitChartInstance){
    plinkoProfitChartInstance.data.labels=Array(data.length).fill(0);
    plinkoProfitChartInstance.data.datasets[0].data=data;
    plinkoProfitChartInstance.update();
    return;
  }
  const ctx=canvas.getContext('2d');
  plinkoProfitChartInstance=new Chart(ctx,{
    type:'line',
    data:{labels:Array(data.length).fill(0),datasets:[{label:'Profit',data:data,
      fill:{target:'origin',above:PLINKO_WIN_FILL,below:PLINKO_LOSS_FILL},
      cubicInterpolationMode:'monotone',
      segment:{borderColor:(c)=>{
        const y0=c.p0.parsed.y, y1=c.p1.parsed.y;
        if(y1===0) return y0<0? PLINKO_LOSS_COLOR : PLINKO_WIN_COLOR;
        return y1<0? PLINKO_LOSS_COLOR : PLINKO_WIN_COLOR;
      }},
      pointRadius:0, pointHoverRadius:5,
      pointHoverBackgroundColor:PLINKO_HOVER_COLOR,
      pointHoverBorderColor:PLINKO_HOVER_COLOR
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      animations:{y:{duration:0}},
      interaction:{intersect:false, mode:'index'},
      plugins:{legend:{display:false}, tooltip:{enabled:false}},
      scales:{
        x:{border:{display:false}, grid:{display:false}, ticks:{display:false}},
        y:{border:{display:false}, grid:{color:(c)=>(c.tick.value===0? PLINKO_X_AXIS_COLOR : undefined), lineWidth:2}, ticks:{display:false}, grace:'1%'}
      },
      onHover:(_,elements)=>{
        const hv=document.getElementById('plinkoHoverValue');
        if(elements.length){
          const idx=elements[0].index;
          const val=plinkoProfitHistory[idx];
          if(hv && val!==undefined){
            hv.textContent=(val>=0?'+':'')+('$'+Math.abs(val).toFixed(2));
            hv.style.color=val>=0?'#4ade80':'#f87171';
          }
        }
      }
    }
  });
  
  canvas.addEventListener('mouseleave',()=>{
    const hv=document.getElementById('plinkoHoverValue'); if(hv) hv.textContent='';
  });
}

function resetPlinkoStats(){
  plinkoDropCount=0; plinkoTotalProfit=0; plinkoWinCount=0; plinkoLossCount=0;
  plinkoProfitHistory=[0]; plinkoLastWinsList=[];
  
  if(plinkoProfitChartInstance){plinkoProfitChartInstance.destroy();plinkoProfitChartInstance=null;}
  
  document.getElementById('plinkoDropCount').textContent='0';
  const pe=document.getElementById('plinkoProfit'); pe.textContent='$0.00'; pe.style.color='#4ade80';
  document.getElementById('plinkoWins').textContent='0';
  document.getElementById('plinkoLosses').textContent='0';
  const hv=document.getElementById('plinkoHoverValue'); if(hv) hv.textContent='';
  renderPlinkoLastWins();
  
  updatePlinkoProfitChart();
}


function removeAllPlinkoBalls(){
  if(!plinkoMatterEngine)return;
  Matter.Composite.allBodies(plinkoMatterEngine.world).forEach(body=>{
    if(body.collisionFilter.category===BALL_CAT)Matter.Composite.remove(plinkoMatterEngine.world,body);
  });
  plinkoBallBets={};
}

function dropPlinkoBall(){
  if(plinkoDropLock)return;plinkoDropLock=true;
  if(!plinkoInitialized)initPlinko();
  const bet=parseFloat(document.getElementById('plinkoBet').value)||10;
  if(bet>balance){showToast('Not enough balance!',false);if(autoDropping)toggleAutoDrop();plinkoDropLock=false;return;}
  if(bet<=0){plinkoDropLock=false;return;}

  balance-=bet;updateBalDisplay();
  plinkoDropLock=false;
  playSound(500,'sine',.04,.05);

  const pinDist=getPinDistX();
  const ballR=getPinR()*2;
  const offsetRange=pinDist*0.8;

  const ball=Matter.Bodies.circle(
    PW/2+(Math.random()-.5)*offsetRange*2, 0, ballR,
    {restitution:0.8,friction:0.5,frictionAir:BALL_FRICTIONS[plinkoRowCount],
      collisionFilter:{category:BALL_CAT,mask:PIN_CAT},
      render:{fillStyle:'#ff0000'}}
  );
  Matter.Composite.add(plinkoMatterEngine.world,ball);
  plinkoBallBets[ball.id]={bet:bet,risk:plinkoRiskLevel,rows:plinkoRowCount};
}

function toggleAutoDrop(){
  if(autoDropping){
    clearInterval(autoDropInterval);autoDropInterval=null;autoDropping=false;
    document.getElementById('autoDropBtn').textContent='AUTO DROP';
    document.getElementById('autoDropBtn').style.background='linear-gradient(135deg,#3355cc,#2244aa)';
  }else{
    autoDropping=true;
    document.getElementById('autoDropBtn').textContent='STOP AUTO';
    document.getElementById('autoDropBtn').style.background='linear-gradient(135deg,#cc3355,#991133)';
    autoDropInterval=setInterval(()=>{
      const bet=parseFloat(document.getElementById('plinkoBet').value)||10;
      if(bet>balance){toggleAutoDrop();return;}
      
      const activeBallCount=Object.keys(plinkoBallBets).length;
      if(activeBallCount>=50)return;
      dropPlinkoBall();
    },250);
  }
}


let pylCurrentMode = null; 
let pylRoomCode = null;
let pylRoomUnsub = null; 
let pylWagerAmount = 0;
let pylWagerEscrowed = false; 
let pylHSTarget = 500;
let pylHSMultiplier = 2;
let pylGameActive = false;
let pylOpponentId = null; 


window.addEventListener('message', function(evt) {
  if (evt.data && evt.data.type === 'pylScore' && pylGameActive) {
    const score = evt.data.score || 0;
    document.getElementById('pylScoreDisplay').textContent = 'Score: ' + score;
    document.getElementById('pylScoreInput').value = score;
    
    pylSubmitScore();
  }
  
  if (evt.data && evt.data.type === 'pylChoice' && pylCurrentMode === '1v1' && pylRoomCode && pylOpponentId) {
    const round = evt.data.round;
    const choice = evt.data.choice;
    
    if (window._pylWriteChoice) {
      window._pylWriteChoice(pylRoomCode, round, choice);
    }
    
    if (window._pylListenChoice) {
      window._pylListenChoice(pylRoomCode, round, pylOpponentId, function(opChoice) {
        
        const iframe = document.getElementById('pylIframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'pylOpponentChoice', choice: opChoice, round: round }, '*');
        }
      });
    }
  }
});

function pylStartMode(mode) {
  pylCurrentMode = mode;
  playClickSound();

  if (mode === 'solo') {
    pylHideLobby();
    pylShowOverlay('FREE PLAY', 0);
    pylGameActive = true;
  } else if (mode === 'tournament') {
    pylHideLobby();
    pylShowOverlay('🏆 TOURNAMENT', 0);
    pylGameActive = true;
    pylLoadLeaderboard();
  }
}

function pylShowWager(mode) {
  playClickSound();
  pylCurrentMode = mode;

  
  document.querySelector('.pyl-modes').style.display = 'none';
  document.getElementById('pylLeaderboard').style.display = 'none';

  if (mode === '1v1') {
    document.getElementById('pylRoomUI').style.display = 'block';
    document.getElementById('pylHighStakesUI').style.display = 'none';
    document.getElementById('pylRoomStatus').textContent = 'Create a room or enter a code to join';
    document.getElementById('pylRoomPlayers').innerHTML = '';
  } else if (mode === 'highstakes') {
    document.getElementById('pylHighStakesUI').style.display = 'block';
    document.getElementById('pylRoomUI').style.display = 'none';
  }
}

function pylBackToLobby() {
  playClickSound();
  
  if (pylWagerEscrowed && pylWagerAmount > 0) {
    balance += pylWagerAmount;
    updateBalDisplay();
    showToast('Wager refunded ($' + pylWagerAmount + ')');
    pylWagerEscrowed = false;
  }
  
  if (pylRoomUnsub) { pylRoomUnsub(); pylRoomUnsub = null; }
  if (pylRoomCode && pylCurrentMode === '1v1') {
    
    if (window._pylCancelDisconnect) window._pylCancelDisconnect(pylRoomCode);
    
    if (window._pylDeleteRoom) window._pylDeleteRoom(pylRoomCode);
    
    const iframe = document.getElementById('pylIframe');
    if (iframe) iframe.src = '';
  }
  pylRoomCode = null;
  pylCurrentMode = null;
  pylGameActive = false;
  pylOpponentId = null;
  _pylDisconnectHandled = false;

  
  document.querySelector('.pyl-modes').style.display = '';
  document.getElementById('pylRoomUI').style.display = 'none';
  document.getElementById('pylHighStakesUI').style.display = 'none';
  document.getElementById('pylLobby').style.display = '';
  document.getElementById('pylOverlay').classList.add('hidden');
  document.getElementById('pylLeaderboard').style.display = '';
  pylLoadLeaderboard();
}

function pylHideLobby(opponentName, roomCode) {
  document.getElementById('pylLobby').style.display = 'none';
  
  let iframe = document.getElementById('pylIframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'pylIframe';
    iframe.allow = 'autoplay';
    const panel = document.getElementById('luckPanel');
    panel.insertBefore(iframe, panel.firstChild);
  }
  
  let url = 'push-your-luck/index.html';
  if (opponentName) {
    url += '?t=' + Date.now() + '#1v1=' + encodeURIComponent(opponentName) + '&room=' + (roomCode || 'default');
  }
  
  if (opponentName || !iframe.src || !iframe.src.includes('push-your-luck') || iframe.src.includes('#1v1=')) {
    iframe.src = url;
  }
}

function pylShowOverlay(label, wager) {
  const overlay = document.getElementById('pylOverlay');
  overlay.classList.remove('hidden');
  document.getElementById('pylModeLabel').textContent = label;
  document.getElementById('pylScoreDisplay').textContent = 'Score: —';
  document.getElementById('pylScoreInput').value = '';

  if (wager > 0) {
    document.getElementById('pylWagerCard').style.display = '';
    document.getElementById('pylWagerDisplay').textContent = '$' + wager.toLocaleString();
  } else {
    document.getElementById('pylWagerCard').style.display = 'none';
  }

  document.getElementById('pylOpponentCard').style.display = 'none';
}


function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function pylCreateRoom() {
  const wager = parseFloat(document.getElementById('pylWager').value) || 100;
  if (wager < 10) { showToast('Minimum wager is $10', false); return; }

  pylWagerAmount = wager;
  pylRoomCode = generateRoomCode();
  playClickSound();

  
  balance -= pylWagerAmount;
  updateBalDisplay();
  pylWagerEscrowed = true;

  document.getElementById('pylRoomStatus').innerHTML =
    'Room: <span style="color:var(--neon);font-size:18px;letter-spacing:3px;">' + pylRoomCode + '</span><br>' +
    '<span style="color:var(--text2);font-size:11px;">Share this code with your opponent</span>';
  document.getElementById('pylRoomPlayers').innerHTML =
    '<div style="color:var(--green);margin:4px 0;">✓ You (host) — $' + wager + ' wager</div>' +
    '<div style="color:var(--text2);margin:4px 0;">⏳ Waiting for opponent...</div>';

  
  if (window._pylCreateRoom) {
    window._pylCreateRoom(pylRoomCode, wager).then(() => {
      
      let pylGameStarted = false;
      pylRoomUnsub = window._pylListenRoom(pylRoomCode, (data) => {
        if (!data || pylGameStarted) return;
        const players = data.players || {};
        const playerKeys = Object.keys(players);

        if (playerKeys.length >= 2) {
          pylGameStarted = true;
          pylWagerEscrowed = false; 
          showToast('⚔️ Opponent joined! Game on!');
          playWinSound();
          
          const opId = playerKeys.find(k => k !== window._pylPlayerId);
          const opData = opId ? players[opId] : null;
          const opName = opData && opData.name ? opData.name : (opId ? opId.slice(-5) : 'Opponent');
          pylOpponentId = opId;

          pylHideLobby(opName, pylRoomCode);
          document.getElementById('pylRoomUI').style.display = 'none';
          pylShowOverlay('⚔️ 1v1 WAGER — $' + (pylWagerAmount * 2), pylWagerAmount);
          document.getElementById('pylOpponentCard').style.display = '';
          document.getElementById('pylOpponentName').textContent = opName;
          document.getElementById('pylOpponentScore').textContent = 'Playing...';
          pylGameActive = true;

          
          pylRoomUnsub = window._pylListenRoom(pylRoomCode, (roomData) => {
            if (!roomData) {
              
              pylHandleOpponentDisconnect();
              return;
            }
            const ps = roomData.players || {};
            if (opId && ps[opId]) {
              if (ps[opId].score != null) {
                document.getElementById('pylOpponentScore').textContent = ps[opId].score + ' pts';
              }
              if (ps[opId].online === false && pylGameActive) {
                pylHandleOpponentDisconnect();
              }
            }
          });
        }
      });
    });
  }
}

function pylJoinRoom() {
  const code = (document.getElementById('pylJoinCode').value || '').toUpperCase().trim();
  if (!code) { showToast('Enter a room code!', false); return; }

  playClickSound();
  document.getElementById('pylRoomStatus').textContent = 'Checking room...';

  if (window._pylJoinRoom) {
    
    window._pylPeekRoom(code).then(data => {
      if (!data) {
        showToast('Room not found or already started!', false);
        document.getElementById('pylRoomStatus').textContent = 'Room not found. Try again.';
        return;
      }
      const wager = data.wager || 100;
      if (wager > balance) {
        showToast('Not enough balance for $' + wager + ' wager!', false);
        document.getElementById('pylRoomStatus').textContent = 'Insufficient balance ($' + wager + ' needed).';
        return;
      }
      
      document.getElementById('pylRoomStatus').textContent = 'Joining...';
      return window._pylJoinRoom(code);
    }).then(data => {
      if (!data) return; 

      pylRoomCode = code;
      pylWagerAmount = data.wager || 100;

      balance -= pylWagerAmount;
      updateBalDisplay();

      showToast('⚔️ Joined! Game on!');
      playWinSound();
      const players = data.players || {};
      const opId = Object.keys(players).find(k => k !== window._pylPlayerId);
      const opData = opId ? players[opId] : null;
      const opName = opData && opData.name ? opData.name : (opId ? opId.slice(-5) : 'Opponent');
      pylOpponentId = opId;

      pylHideLobby(opName, pylRoomCode);
      document.getElementById('pylRoomUI').style.display = 'none';
      pylShowOverlay('⚔️ 1v1 WAGER — $' + (pylWagerAmount * 2), pylWagerAmount);
      document.getElementById('pylOpponentCard').style.display = '';
      document.getElementById('pylOpponentName').textContent = opName;
      document.getElementById('pylOpponentScore').textContent = 'Playing...';
      pylGameActive = true;

      
      pylRoomUnsub = window._pylListenRoom(pylRoomCode, (roomData) => {
        if (!roomData) {
          
          pylHandleOpponentDisconnect();
          return;
        }
        const ps = roomData.players || {};
        if (opId && ps[opId]) {
          if (ps[opId].score != null) {
            document.getElementById('pylOpponentScore').textContent = ps[opId].score + ' pts';
          }
          if (ps[opId].online === false && pylGameActive) {
            pylHandleOpponentDisconnect();
          }
        }
      });
    });
  }
}


function pylStartHighStakes() {
  const wager = parseFloat(document.getElementById('pylHSWager').value) || 500;
  if (wager > balance) { showToast('Not enough balance!', false); return; }
  if (wager < 50) { showToast('Minimum wager is $50', false); return; }

  const sel = document.getElementById('pylHSTarget');
  pylHSTarget = parseInt(sel.value);
  pylHSMultiplier = parseFloat(sel.options[sel.selectedIndex].dataset.mult);
  pylWagerAmount = wager;

  balance -= wager;
  updateBalDisplay();
  playClickSound();

  pylHideLobby();
  document.getElementById('pylHighStakesUI').style.display = 'none';
  pylShowOverlay('💀 HIGH STAKES — ' + pylHSTarget + 'pts for ' + pylHSMultiplier + 'x', wager);
  pylGameActive = true;

  showToast('💀 Hit ' + pylHSTarget + ' pts to win $' + (wager * pylHSMultiplier).toLocaleString() + '!');
}


function pylSubmitScore() {
  const scoreInput = document.getElementById('pylScoreInput');
  const score = parseInt(scoreInput.value);
  if (isNaN(score) || score < 0) { showToast('Enter a valid score!', false); return; }

  playClickSound();
  document.getElementById('pylScoreDisplay').textContent = 'Score: ' + score;
  scoreInput.value = '';
  pylGameActive = false;

  
  if (gameStats.pyl) {
    gameStats.pyl.played = (gameStats.pyl.played || 0) + 1;
    if (score > (gameStats.pyl.highScore || 0)) gameStats.pyl.highScore = score;
  }

  if (pylCurrentMode === 'solo') {
    showToast('Free play score: ' + score + ' pts!');
    firebaseSave();
  }

  else if (pylCurrentMode === '1v1') {
    
    if (window._pylSubmitRoomScore && pylRoomCode) {
      window._pylSubmitRoomScore(pylRoomCode, score).then(() => {
        document.getElementById('pylScoreDisplay').textContent = 'Your Score: ' + score + ' — Waiting for opponent...';

        
        const checkResult = () => {
          if (pylRoomUnsub) pylRoomUnsub();
          pylRoomUnsub = window._pylListenRoom(pylRoomCode, (data) => {
            if (!data) {
              
              if (!_pylDisconnectHandled) {
                _pylDisconnectHandled = true;
                pylGameActive = false;
                const pot = pylWagerAmount * 2;
                balance += pot;
                updateBalDisplay();
                showToast('⚔️ Opponent disconnected — YOU WIN! +$' + pot.toLocaleString() + '!');
                playWinSound();
                document.getElementById('pylScoreDisplay').innerHTML =
                  '<span style="color:var(--green);">⚔️ OPPONENT DISCONNECTED</span> — You win $' + pot.toLocaleString() + '!';
                document.getElementById('pylOpponentScore').textContent = 'DISCONNECTED';
                if (pylRoomUnsub) { pylRoomUnsub(); pylRoomUnsub = null; }
                firebaseSave();
                setTimeout(() => pylBackToLobby(), 4000);
              }
              return;
            }
            const ps = data.players || {};
            const myScore = score;
            const opId = Object.keys(ps).find(k => k !== window._pylPlayerId);

            
            if (opId && ps[opId] && ps[opId].online === false && ps[opId].score == null) {
              if (!_pylDisconnectHandled) {
                _pylDisconnectHandled = true;
                pylGameActive = false;
                if (pylRoomUnsub) { pylRoomUnsub(); pylRoomUnsub = null; }
                const pot = pylWagerAmount * 2;
                balance += pot;
                updateBalDisplay();
                showToast('⚔️ Opponent disconnected — YOU WIN! +$' + pot.toLocaleString() + '!');
                playWinSound();
                document.getElementById('pylScoreDisplay').innerHTML =
                  '<span style="color:var(--green);">⚔️ OPPONENT DISCONNECTED</span> — You win $' + pot.toLocaleString() + '!';
                document.getElementById('pylOpponentScore').textContent = 'DISCONNECTED';
                firebaseSave();
                setTimeout(() => { if (window._pylDeleteRoom) window._pylDeleteRoom(pylRoomCode); pylRoomCode = null; }, 4000);
              }
              return;
            }

            if (opId && ps[opId] && ps[opId].score != null) {
              const opScore = ps[opId].score;
              document.getElementById('pylOpponentScore').textContent = opScore + ' pts';

              if (pylRoomUnsub) { pylRoomUnsub(); pylRoomUnsub = null; }

              const pot = pylWagerAmount * 2;
              if (myScore > opScore) {
                balance += pot;
                updateBalDisplay();
                showToast('🏆 YOU WIN! +$' + pot.toLocaleString() + '!');
                playWinSound();
                spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 60);
                document.getElementById('pylScoreDisplay').innerHTML =
                  '<span style="color:var(--green);">🏆 YOU WIN!</span> ' + myScore + ' vs ' + opScore + ' — +$' + pot.toLocaleString();
              } else if (myScore < opScore) {
                showToast('💀 You lost! -$' + pylWagerAmount, false);
                playLoseSound();
                document.getElementById('pylScoreDisplay').innerHTML =
                  '<span style="color:var(--red);">💀 YOU LOSE</span> ' + myScore + ' vs ' + opScore;
              } else {
                balance += pylWagerAmount; 
                updateBalDisplay();
                showToast('🤝 Tie! Wager refunded.');
                document.getElementById('pylScoreDisplay').innerHTML =
                  '<span style="color:var(--gold);">🤝 TIE</span> ' + myScore + ' vs ' + opScore + ' — Refunded';
              }

              
              setTimeout(() => { if (window._pylDeleteRoom) window._pylDeleteRoom(pylRoomCode); pylRoomCode = null; }, 5000);
              firebaseSave();
            }
          });
        };
        checkResult();
      });
    }
  }

  else if (pylCurrentMode === 'highstakes') {
    if (score >= pylHSTarget) {
      const payout = pylWagerAmount * pylHSMultiplier;
      balance += payout;
      updateBalDisplay();
      showToast('🔥 HIGH STAKES WIN! +$' + payout.toLocaleString() + '!');
      playWinSound();
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 80);
      document.getElementById('pylScoreDisplay').innerHTML =
        '<span style="color:var(--green);">🔥 ' + pylHSMultiplier + 'x WIN!</span> ' + score + '/' + pylHSTarget +
        ' pts — +$' + payout.toLocaleString();
    } else {
      showToast('💀 Didn\'t hit target! -$' + pylWagerAmount, false);
      playLoseSound();
      document.getElementById('pylScoreDisplay').innerHTML =
        '<span style="color:var(--red);">💀 MISS</span> ' + score + '/' + pylHSTarget +
        ' pts — Lost $' + pylWagerAmount.toLocaleString();
    }
    firebaseSave();
  }

  else if (pylCurrentMode === 'tournament') {
    if (window._pylSubmitLeaderboard) {
      window._pylSubmitLeaderboard(score).then(() => {
        showToast('🏆 Score submitted to leaderboard: ' + score + ' pts!');
        pylLoadLeaderboard();
      });
    }
    firebaseSave();
  }
}

let _pylDisconnectHandled = false;

function pylHandleOpponentDisconnect() {
  if (_pylDisconnectHandled || !pylGameActive) return;
  _pylDisconnectHandled = true;

  
  if (pylRoomUnsub) { pylRoomUnsub(); pylRoomUnsub = null; }
  pylGameActive = false;

  const pot = pylWagerAmount * 2;
  balance += pot;
  updateBalDisplay();
  firebaseSave();

  showToast('⚔️ Opponent disconnected — YOU WIN! +$' + pot.toLocaleString() + '!');
  playWinSound();
  spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 40);

  document.getElementById('pylScoreDisplay').innerHTML =
    '<span style="color:var(--green);">⚔️ OPPONENT DISCONNECTED</span> — You win $' + pot.toLocaleString() + '!';
  document.getElementById('pylOpponentScore').textContent = 'DISCONNECTED';

  
  if (pylRoomCode && window._pylDeleteRoom) {
    window._pylDeleteRoom(pylRoomCode);
  }

  
  setTimeout(() => {
    pylBackToLobby();
  }, 4000);
}

function pylEndGame() {
  playClickSound();

  
  if (pylCurrentMode === '1v1' && pylGameActive && pylRoomCode) {
    showToast('Forfeited wager: -$' + pylWagerAmount, false);
    playLoseSound();
    if (window._pylSubmitRoomScore) window._pylSubmitRoomScore(pylRoomCode, 0);
    
    if (window._pylMarkOffline) window._pylMarkOffline(pylRoomCode);
  }

  pylGameActive = false;
  _pylDisconnectHandled = false;
  if (pylRoomUnsub) { pylRoomUnsub(); pylRoomUnsub = null; }
  pylBackToLobby();
}


function pylLoadLeaderboard() {
  const container = document.getElementById('pylLBRows');
  if (!container) return;

  if (window._pylGetLeaderboard) {
    window._pylGetLeaderboard().then(entries => {
      if (entries.length === 0) {
        container.innerHTML = '<div style="color:var(--text2);padding:8px;text-align:center;font-size:12px;">No scores yet. Be the first!</div>';
        return;
      }
      container.innerHTML = entries.map((e, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
        const isMe = e.player === (window._currentUsername || '');
        return '<div class="pyl-lb-row' + (isMe ? ' me' : '') + '">' +
          '<span class="lb-rank">' + medal + '</span>' +
          '<span class="lb-name">' + escapeHtml(e.player) + (isMe ? ' (you)' : '') + '</span>' +
          '<span class="lb-score">' + e.score.toLocaleString() + ' pts</span>' +
          '</div>';
      }).join('');
    }).catch(() => {
      container.innerHTML = '<div style="color:var(--text2);padding:8px;text-align:center;font-size:12px;">Could not load leaderboard</div>';
    });
  }
}


function mulberry32(seed) {
  let t = (seed >>> 0) + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function hashTicker(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return h >>> 0;
}

const STOCK_DEFS = [
  { ticker: 'GMBL', name: 'Gamble Corp', basePrice: 100, volatility: 0.025, drift: 0.00012 },
  { ticker: 'LUCK', name: 'Lucky Labs', basePrice: 42, volatility: 0.035, drift: -0.00005 },
  { ticker: 'NEON', name: 'Neon Digital', basePrice: 250, volatility: 0.018, drift: 0.0002 },
  { ticker: 'DICE', name: 'DiceTech Inc', basePrice: 15, volatility: 0.045, drift: 0.00008 },
  { ticker: 'MOON', name: 'Moonshot AI', basePrice: 500, volatility: 0.03, drift: 0.00025 },
];


const TICK_EPOCH = new Date('2025-01-01T00:00:00Z').getTime();
const TICK_MS = 3000; 

function getCurrentTick() {
  return Math.floor((Date.now() - TICK_EPOCH) / TICK_MS);
}


function getTickRandom(tickerHash, tickNum) {
  return mulberry32(tickerHash ^ (tickNum * 2654435761));
}

let stockPrices = {};       
let stockHoldings = {};     
let stockPriceHistory = {}; 
let stocksInitialized = false;
let stockTickInterval = null;
let lastComputedTick = 0;   

function initStocks() {
  if (stocksInitialized) return;
  stocksInitialized = true;

  
  STOCK_DEFS.forEach(s => {
    if (!stockPrices[s.ticker]) stockPrices[s.ticker] = s.basePrice;
    if (!stockPriceHistory[s.ticker]) stockPriceHistory[s.ticker] = [];
  });

  
  if (lastComputedTick === 0) {
    
    const now = getCurrentTick();
    lastComputedTick = Math.max(0, now - 500);
    
    STOCK_DEFS.forEach(s => { stockPrices[s.ticker] = s.basePrice; });
    advanceToTick(now);
  } else {
    
    advanceToTick(getCurrentTick());
  }

  
  startStockTicker();
}

function advanceToTick(targetTick) {
  if (targetTick <= lastComputedTick) return;

  
  const MAX_CATCHUP_TICKS = 5000;
  const MAX_COMPUTE_TICKS = 20000; 
  const gap = targetTick - lastComputedTick;
  if (gap > MAX_CATCHUP_TICKS) {
    
    
    const skipTo = targetTick - MAX_CATCHUP_TICKS;
    const skipGap = skipTo - lastComputedTick;
    const step = Math.max(1, Math.ceil(skipGap / MAX_COMPUTE_TICKS));
    for (let t = lastComputedTick + step; t <= skipTo; t += step) {
      STOCK_DEFS.forEach(s => {
        const h = hashTicker(s.ticker);
        const r = getTickRandom(h, t);
        const price = stockPrices[s.ticker];
        const change = price * s.volatility * (r * 2 - 1) * step;
        const reversion = (s.basePrice - price) * 0.0015 * step;
        const driftAmt = price * s.drift * step;
        let newPrice = price + change + reversion + driftAmt;
        newPrice = Math.max(s.basePrice * 0.05, newPrice);
        stockPrices[s.ticker] = Math.round(newPrice * 10000) / 10000;
      });
    }
    lastComputedTick = skipTo;
    STOCK_DEFS.forEach(s => { stockPriceHistory[s.ticker] = []; });
  }

  const startTick = lastComputedTick;
  
  const oldPrices = {};
  STOCK_DEFS.forEach(s => { oldPrices[s.ticker] = stockPrices[s.ticker]; });

  for (let t = startTick + 1; t <= targetTick; t++) {
    STOCK_DEFS.forEach(s => {
      const h = hashTicker(s.ticker);
      const r = getTickRandom(h, t); 
      const price = stockPrices[s.ticker];
      const change = price * s.volatility * (r * 2 - 1);
      const reversion = (s.basePrice - price) * 0.0015;
      const driftAmt = price * s.drift;
      let newPrice = price + change + reversion + driftAmt;
      newPrice = Math.max(s.basePrice * 0.05, newPrice); 
      stockPrices[s.ticker] = Math.round(newPrice * 10000) / 10000;
    });

    
    const remaining = targetTick - t;
    if (remaining < 500 || t % 5 === 0) {
      STOCK_DEFS.forEach(s => {
        const hist = stockPriceHistory[s.ticker];
        hist.push(stockPrices[s.ticker]);
        if (hist.length > 500) hist.shift();
      });
    }
  }

  const ticksAdvanced = targetTick - startTick;
  lastComputedTick = targetTick;

  
  if (ticksAdvanced > 10) {
    const elapsed = ticksAdvanced * TICK_MS;
    const mins = Math.floor(elapsed / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let timeStr = '';
    if (days > 0) timeStr = days + 'd ' + (hours % 24) + 'h';
    else if (hours > 0) timeStr = hours + 'h ' + (mins % 60) + 'm';
    else timeStr = mins + 'm';

    
    let biggestMove = '', biggestPct = 0;
    STOCK_DEFS.forEach(s => {
      const pct = Math.abs((stockPrices[s.ticker] - oldPrices[s.ticker]) / oldPrices[s.ticker] * 100);
      if (pct > biggestPct) { biggestPct = pct; biggestMove = s.ticker; }
    });
    const moveDir = stockPrices[biggestMove] > oldPrices[biggestMove] ? '📈' : '📉';
    const msg = moveDir + ' ' + biggestMove + ' moved ' + biggestPct.toFixed(1) + '% while you were away';

    setTimeout(() => { showToast(msg, biggestPct > 0); }, 500);
  }
}

function startStockTicker() {
  if (stockTickInterval) return;
  stockTickInterval = setInterval(() => {
    const now = getCurrentTick();
    if (now > lastComputedTick) {
      advanceToTick(now);
      if (document.querySelector('#stocksPanel.active')) renderStocks();
      
    }
  }, 1000); 
}

function buyStock(ticker) {
  const amt = parseFloat(document.getElementById('stockBuyAmt').value) || 100;
  if (amt > balance) { showToast('Not enough balance!', false); return; }
  if (amt <= 0) return;

  const price = stockPrices[ticker];
  const shares = amt / price;

  balance -= amt;
  updateBalDisplay();

  if (!stockHoldings[ticker]) {
    stockHoldings[ticker] = { shares: 0, totalCost: 0 };
  }
  stockHoldings[ticker].shares += shares;
  stockHoldings[ticker].totalCost += amt;

  playClickSound();
  showToast('Bought ' + shares.toFixed(4) + ' ' + ticker + ' @ $' + formatStockPrice(price));
  renderStocks();
  firebaseSave();
}

function sellStock(ticker) {
  if (!stockHoldings[ticker] || stockHoldings[ticker].shares <= 0) return;

  const holding = stockHoldings[ticker];
  const price = stockPrices[ticker];
  const value = holding.shares * price;
  const profit = value - holding.totalCost;

  balance += value;
  updateBalDisplay();

  if (profit >= 0) {
    showToast('Sold ' + ticker + ' +$' + profit.toFixed(2) + '!');
    playWinSound();
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 20 + Math.min(profit / 10, 60));
  } else {
    showToast('Sold ' + ticker + ' -$' + Math.abs(profit).toFixed(2), false);
    playLoseSound();
  }

  delete stockHoldings[ticker];
  renderStocks();
  firebaseSave();
}

let selectedStock = 'GMBL';

function selectStock(ticker) {
  selectedStock = ticker;
  renderStocks();
}

function renderStocks() {
  if (!stocksInitialized) initStocks();

  
  const tickerBar = document.getElementById('stockTickerBar');
  if (tickerBar) {
    tickerBar.innerHTML = STOCK_DEFS.map(s => {
      const price = stockPrices[s.ticker];
      const hist = stockPriceHistory[s.ticker] || [price];
      const prev = hist.length > 1 ? hist[hist.length - 2] : price;
      const isUp = price >= prev;
      const pct = prev ? ((price - prev) / prev * 100).toFixed(1) : '0.0';
      const active = s.ticker === selectedStock;
      const hasPos = stockHoldings[s.ticker] && stockHoldings[s.ticker].shares > 0;
      return `<div onclick="selectStock('${s.ticker}')" style="
        flex:0 0 auto;padding:6px 12px;border-radius:8px;cursor:pointer;text-align:center;font-family:'Orbitron';
        background:${active ? 'linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,255,136,0.05))' : 'var(--bg)'};
        border:1px solid ${active ? 'var(--neon)' : 'var(--border)'};transition:all 0.2s;position:relative;
      ">
        ${hasPos ? '<div style="position:absolute;top:2px;right:4px;width:6px;height:6px;background:var(--gold);border-radius:50%;"></div>' : ''}
        <div style="font-size:11px;font-weight:700;color:${active?'var(--neon)':'var(--text)'};">$${s.ticker}</div>
        <div style="font-size:9px;color:${isUp?'#3fb950':'#f85149'};">${isUp?'▲':'▼'}${pct}%</div>
      </div>`;
    }).join('');
  }

  const s = STOCK_DEFS.find(x => x.ticker === selectedStock) || STOCK_DEFS[0];
  const price = stockPrices[s.ticker];
  const hist = stockPriceHistory[s.ticker] || [price];
  const prev = hist.length > 1 ? hist[hist.length - 2] : price;
  const isUp = price >= prev;
  const changePct = prev ? ((price - prev) / prev * 100).toFixed(2) : '0.00';
  const holding = stockHoldings[s.ticker];
  const hasHolding = holding && holding.shares > 0;

  
  document.getElementById('stockTickerLabel').textContent = '$' + s.ticker;
  document.getElementById('stockNameLabel').textContent = s.name;
  document.getElementById('stockPriceDisplay').textContent = '$' + formatStockPrice(price);
  const changeEl = document.getElementById('stockChangeDisplay');
  const firstPrice = hist[0] || price;
  const totalChangePct = ((price - firstPrice) / firstPrice * 100).toFixed(2);
  const tickChangePct = changePct;
  changeEl.innerHTML = (isUp ? '▲' : '▼') + ' ' + tickChangePct + '% <span style="color:#8b949e;font-size:12px;">tick</span> &nbsp; ' +
    (price >= firstPrice ? '▲' : '▼') + ' ' + totalChangePct + '% <span style="color:#8b949e;font-size:12px;">session</span>';
  changeEl.className = 'sh-change ' + (isUp ? 'up' : 'down');

  
  if (hasHolding) {
    const curVal = holding.shares * price;
    const pnl = curVal - holding.totalCost;
    document.getElementById('stockShares').textContent = holding.shares.toFixed(4);
    document.getElementById('stockValue').textContent = '$' + curVal.toFixed(2);
    const pnlEl = document.getElementById('stockPnl');
    pnlEl.textContent = (pnl >= 0 ? '+' : '') + '$' + pnl.toFixed(2);
    pnlEl.style.color = pnl >= 0 ? '#3fb950' : '#f85149';
  } else {
    document.getElementById('stockShares').textContent = '0';
    document.getElementById('stockValue').textContent = '$0';
    const pnlEl = document.getElementById('stockPnl');
    pnlEl.textContent = '$0';
    pnlEl.style.color = '#8b949e';
  }
  document.getElementById('stockSellBtn').disabled = !hasHolding;

  
  drawStockChart(hist);

  
  const overviewDiv = document.getElementById('stockPortfolioOverview');
  if (overviewDiv) {
    const activePositions = STOCK_DEFS.filter(sd => stockHoldings[sd.ticker] && stockHoldings[sd.ticker].shares > 0);
    if (activePositions.length === 0) {
      overviewDiv.innerHTML = '<div style="text-align:center;font-size:11px;color:var(--text2);padding:8px;">No open positions</div>';
    } else {
      let totalValue = 0, totalCost = 0;
      const rows = activePositions.map(sd => {
        const h = stockHoldings[sd.ticker];
        const p = stockPrices[sd.ticker];
        const val = h.shares * p;
        const pnl = val - h.totalCost;
        totalValue += val;
        totalCost += h.totalCost;
        const pnlColor = pnl >= 0 ? '#3fb950' : '#f85149';
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
          <span style="font-family:'Orbitron';font-size:11px;font-weight:700;color:var(--neon);min-width:45px;">$${sd.ticker}</span>
          <span style="font-size:10px;color:var(--text2);flex:1;">${h.shares.toFixed(2)} shares</span>
          <span style="font-size:11px;color:var(--text);font-weight:600;">$${val.toFixed(0)}</span>
          <span style="font-size:10px;font-weight:700;color:${pnlColor};min-width:50px;text-align:right;">${pnl>=0?'+':''}$${pnl.toFixed(0)}</span>
        </div>`;
      }).join('');
      const totalPnl = totalValue - totalCost;
      overviewDiv.innerHTML = `
        <div style="font-size:10px;color:var(--text2);font-weight:600;letter-spacing:1px;margin-bottom:6px;">PORTFOLIO</div>
        <div style="display:flex;flex-direction:column;gap:4px;">${rows}</div>
        <div style="display:flex;justify-content:space-between;padding:6px 8px;margin-top:4px;background:rgba(0,255,136,0.05);border-radius:6px;border:1px solid var(--neon)20;">
          <span style="font-size:11px;font-weight:700;color:var(--text);">Total: $${totalValue.toFixed(0)}</span>
          <span style="font-size:11px;font-weight:700;color:${totalPnl>=0?'#3fb950':'#f85149'};">${totalPnl>=0?'+':''}$${totalPnl.toFixed(0)}</span>
        </div>`;
    }
  }
}

function drawStockChart(hist) {
  const canvas = document.getElementById('stockChart');
  const wrap = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = wrap.clientWidth * dpr;
  canvas.height = wrap.clientHeight * dpr;
  canvas.style.width = wrap.clientWidth + 'px';
  canvas.style.height = wrap.clientHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;

  ctx.clearRect(0, 0, W, H);

  if (hist.length < 2) return;

  const pMin = Math.min(...hist);
  const pMax = Math.max(...hist);
  const pRange = pMax - pMin || 1;
  const pad = { top: 12, bottom: 20, left: 50, right: 12 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  
  const gridLines = 4;
  ctx.strokeStyle = '#1e2933';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#8b949e';
  ctx.font = '11px Orbitron, monospace';
  ctx.textAlign = 'right';
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + (cH / gridLines) * i;
    const priceAtLine = pMax - (pRange / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    ctx.fillText('$' + formatStockPrice(priceAtLine), pad.left - 6, y + 4);
  }

  
  const points = [];
  for (let i = 0; i < hist.length; i++) {
    const x = pad.left + (i / (hist.length - 1)) * cW;
    const y = pad.top + (1 - (hist[i] - pMin) / pRange) * cH;
    points.push({ x, y });
  }

  const isUpOverall = hist[hist.length - 1] >= hist[0];
  const lineColor = isUpOverall ? '#3fb950' : '#f85149';
  const fillColor = isUpOverall ? 'rgba(63,185,80,' : 'rgba(248,81,73,';

  
  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, fillColor + '0.35)');
  grad.addColorStop(1, fillColor + '0.0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, H - pad.bottom);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = lineColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.4;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function formatStockPrice(p) {
  if (p >= 1000) return p.toFixed(0);
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(4);
}


window._getStocksData = () => {
  if (!stocksInitialized && Object.keys(stockHoldings).length === 0) return null;
  return {
    prices: stockPrices,
    holdings: stockHoldings,
    lastTick: lastComputedTick 
  };
};

window._loadStocks = (data) => {
  if (!data) return;

  
  if (data.prices) {
    stockPrices = data.prices;
    STOCK_DEFS.forEach(s => {
      if (!stockPrices[s.ticker]) stockPrices[s.ticker] = s.basePrice;
      stockPriceHistory[s.ticker] = [stockPrices[s.ticker]];
    });
  }

  
  if (data.holdings) stockHoldings = data.holdings;

  
  
  if (data.lastTick) {
    lastComputedTick = data.lastTick;
  }

  stocksInitialized = true;

  
  advanceToTick(getCurrentTick());

  
  startStockTicker();
};


const CARD_SUITS=['♠','♥','♦','♣'];const CARD_RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function newDeck(){let d=[];CARD_SUITS.forEach(s=>CARD_RANKS.forEach(r=>d.push({r,s})));for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function cardNumVal(c){if(c.r==='A')return 11;if('KQJ'.includes(c.r))return 10;return parseInt(c.r);}
function cardIsRed(c){return c.s==='♥'||c.s==='♦';}
function renderCard(c,hidden){if(hidden)return'<div class="bj-card hidden">?</div>';return'<div class="bj-card'+(cardIsRed(c)?' red':'')+'">'+c.r+'<br>'+c.s+'</div>';}
function cardRankIdx(c){return CARD_RANKS.indexOf(c.r);}


let bjDeck=[],bjPlayer=[],bjDealer=[],bjBetAmt=0,bjActive=false;
function bjDrawCard(){if(bjDeck.length<10)bjDeck=bjDeck.concat(newDeck());return bjDeck.pop();}
function bjHandVal(h){let v=0,a=0;h.forEach(c=>{v+=cardNumVal(c);if(c.r==='A')a++;});while(v>21&&a>0){v-=10;a--;}return v;}
function bjDeal(){
  if(bjActive)return;const bet=parseFloat(document.getElementById('bjBet').value)||10;if(bet<=0)return;
  if(!checkMaxBet(bet,'Blackjack'))return;
  if(bet>balance){showToast('Not enough balance!',false);return;}
  bjBetAmt=bet;balance-=bet;updateBalDisplay();bjDeck=newDeck();bjPlayer=[bjDrawCard(),bjDrawCard()];bjDealer=[bjDrawCard(),bjDrawCard()];bjActive=true;bjRender();
  document.getElementById('bjResult').textContent='';
  if(bjHandVal(bjPlayer)===21)bjStand();playClickSound();
}
function bjHit(){if(!bjActive)return;bjPlayer.push(bjDrawCard());if(bjHandVal(bjPlayer)>21){bjActive=false;bjRender();bjFinish();}else if(bjHandVal(bjPlayer)===21)bjStand();else bjRender();}
function bjStand(){if(!bjActive)return;while(bjHandVal(bjDealer)<17)bjDealer.push(bjDrawCard());bjActive=false;bjRender();bjFinish();}
function bjDouble(){if(!bjActive||bjPlayer.length!==2)return;if(!checkMaxBet(bjBetAmt*2,'Blackjack'))return;if(bjBetAmt>balance){showToast('Not enough balance to double!',false);return;}balance-=bjBetAmt;bjBetAmt*=2;updateBalDisplay();bjPlayer.push(bjDrawCard());while(bjHandVal(bjDealer)<17)bjDealer.push(bjDrawCard());bjActive=false;bjRender();bjFinish();}
function bjFinish(){
  const pv=bjHandVal(bjPlayer),dv=bjHandVal(bjDealer);let w=0,msg='';
  const isNatural=bjPlayer.length===2&&pv===21;
  const dealerNatural=bjDealer.length===2&&dv===21;
  if(pv>21){msg='BUST!';showToast('-$'+bjBetAmt.toFixed(2),false);playLoseSound();}
  else if(isNatural&&!dealerNatural){w=Math.round(bjBetAmt*2.5*100)/100;msg='BLACKJACK! +$'+w.toFixed(2);balance+=w;updateBalDisplay();showBigWin(w);showToast('BLACKJACK! +$'+w.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,40);}
  else if(dv>21||pv>dv){w=bjBetAmt*2;msg='WIN +$'+w.toFixed(2);balance+=w;updateBalDisplay();showBigWin(w);showToast('+$'+w.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,30);}
  else if(pv===dv){w=bjBetAmt;msg='PUSH';balance+=w;updateBalDisplay();showToast('Push');}
  else{msg='LOSE';showToast('-$'+bjBetAmt.toFixed(2),false);playLoseSound();}
  const r=document.getElementById('bjResult');r.textContent=msg;r.style.color=w>bjBetAmt?'var(--green)':w===bjBetAmt?'var(--gold)':'var(--red)';
  recordGame('blackjack',bjBetAmt,w);
}
function bjRender(){const s=!bjActive;document.getElementById('bjDealerCards').innerHTML=bjDealer.map((c,i)=>renderCard(c,!s&&i===1)).join('');document.getElementById('bjPlayerCards').innerHTML=bjPlayer.map(c=>renderCard(c)).join('');document.getElementById('bjDealerScore').textContent=s?bjHandVal(bjDealer):'?';document.getElementById('bjPlayerScore').textContent=bjHandVal(bjPlayer);document.getElementById('bjHitBtn').disabled=!bjActive;document.getElementById('bjStandBtn').disabled=!bjActive;document.getElementById('bjDoubleBtn').disabled=!bjActive||bjPlayer.length!==2;document.getElementById('bjDealBtn').disabled=bjActive;}


let minesBoard=[],minesRevealed=0,minesBetAmt=0,minesActive=false,minesCount=3;
function minesMultiplier(){const t=25,m=minesCount,r=minesRevealed;if(r===0)return 1;let mult=1;for(let i=0;i<r;i++)mult*=(t-m-i)>0?(t-i)/(t-m-i):t;return Math.round(mult*97)/100;}
function minesStart(){
  if(minesActive)return;const bet=parseFloat(document.getElementById('minesBet').value)||10;if(bet<=0)return;minesCount=parseInt(document.getElementById('mineCount').value);
  if(!minesCount||minesCount<1)minesCount=1;if(minesCount>24)minesCount=24;
  if(bet>balance){showToast('Not enough!',false);return;}
  if(!checkMaxBet(bet,'Mines'))return;
  minesBetAmt=bet;balance-=bet;updateBalDisplay();minesActive=true;minesRevealed=0;
  minesBoard=Array(25).fill(false);const pos=[];while(pos.length<minesCount){const p=Math.floor(Math.random()*25);if(!pos.includes(p))pos.push(p);}
  pos.forEach(p=>minesBoard[p]=true);minesRenderGrid();
  document.getElementById('minesStartBtn').style.display='none';document.getElementById('minesCashoutBtn').style.display='';
  document.getElementById('minesMultiplier').textContent='1.00×';document.getElementById('minesProfit').textContent='Next: $'+minesBetAmt.toFixed(2);playClickSound();
}
function minesCashout(){if(!minesActive||minesRevealed===0)return;const payout=minesBetAmt*minesMultiplier();balance+=payout;updateBalDisplay();
  showBigWin(payout);showToast('+$'+payout.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,30);
  minesActive=false;minesRevealAll();document.getElementById('minesStartBtn').style.display='';document.getElementById('minesCashoutBtn').style.display='none';
  recordGame('mines',minesBetAmt,payout);
}
function minesClick(i){if(!minesActive)return;const cells=document.querySelectorAll('.mine-cell');if(cells[i].classList.contains('revealed'))return;
  if(minesBoard[i]){cells[i].classList.add('revealed','mine');cells[i].textContent='💣';minesActive=false;
    showToast('-$'+minesBetAmt.toFixed(2),false);playLoseSound();minesRevealAll();
    document.getElementById('minesStartBtn').style.display='';document.getElementById('minesCashoutBtn').style.display='none';recordGame('mines',minesBetAmt,0);
  }else{cells[i].classList.add('revealed','safe');cells[i].textContent='💎';minesRevealed++;playSound(600+minesRevealed*40,'sine',.06,.06);
    const m=minesMultiplier();document.getElementById('minesMultiplier').textContent=m.toFixed(2)+'×';
    document.getElementById('minesProfit').textContent='Cash out: $'+(minesBetAmt*m).toFixed(2);if(minesRevealed===25-minesCount)minesCashout();
  }
}
function minesRevealAll(){const cells=document.querySelectorAll('.mine-cell');minesBoard.forEach((isMine,i)=>{if(!cells[i].classList.contains('revealed')){cells[i].classList.add('revealed',isMine?'mine':'safe');cells[i].textContent=isMine?'💣':'💎';}});}
function minesRenderGrid(){const g=document.getElementById('minesGrid');g.innerHTML='';for(let i=0;i<25;i++){const c=document.createElement('div');c.className='mine-cell';c.onclick=(()=>{const idx=i;return()=>minesClick(idx);})();g.appendChild(c);}}


let diceMode='over';
function diceSetMode(m){diceMode=m;document.getElementById('diceOverBtn').className='dice-mode-btn'+(m==='over'?' active':'');document.getElementById('diceUnderBtn').className='dice-mode-btn'+(m==='under'?' active':'');diceUpdateSlider();}
function diceUpdateSlider(){const v=Math.max(2,Math.min(98,parseFloat(document.getElementById('diceSlider').value)));const chance=diceMode==='over'?(100-v):v;const payout=chance>0?Math.min(Math.floor(99/chance*100)/100,9900):0;document.getElementById('diceTarget').textContent=v.toFixed(2);document.getElementById('diceChance').textContent=chance.toFixed(2)+'%';document.getElementById('dicePayout').textContent=payout.toFixed(2)+'×';
  const sl=document.getElementById('diceSlider');sl.style.background='linear-gradient(90deg,'+(diceMode==='over'?'var(--red)':'var(--green)')+' 0%,'+(diceMode==='over'?'var(--red)':'var(--green)')+' '+v+'%,'+(diceMode==='over'?'var(--green)':'var(--red)')+' '+v+'%,'+(diceMode==='over'?'var(--green)':'var(--red)')+' 100%)';}
function diceRoll(){const bet=parseFloat(document.getElementById('diceBet').value)||10;if(bet>balance){showToast('Not enough!',false);return;}if(bet<=0)return;
  if(!checkMaxBet(bet,'Dice'))return;
  balance-=bet;updateBalDisplay();let target=parseFloat(document.getElementById('diceSlider').value);target=Math.max(2,Math.min(98,target));const chance=diceMode==='over'?(100-target):target;const payout=chance>0?Math.min(Math.floor(99/chance*100)/100,9900):0;
  const roll=Math.random()*100;const won=diceMode==='over'?roll>target:roll<target;const display=document.getElementById('diceDisplay');
  display.textContent=roll.toFixed(2);display.style.color=won?'var(--green)':'var(--red)';
  if(won){const w=bet*payout;balance+=w;updateBalDisplay();showBigWin(w);showToast('+$'+w.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,25);recordGame('dice',bet,w);}
  else{showToast('-$'+bet.toFixed(2),false);playLoseSound();recordGame('dice',bet,0);}playClickSound();
}


let towerBoard=[],towerRow=0,towerBetAmt=0,towerActive=false,towerCols=3,towerRows=8,towerSafePerRow=2;
function towerMultiplier(){if(towerRow===0)return 1;let m=1;for(let i=0;i<towerRow;i++)m*=towerCols/towerSafePerRow;return Math.round(m*97)/100;}
function towerStart(){
  if(towerActive)return;const bet=parseFloat(document.getElementById('towerBet').value)||10;if(bet<=0)return;if(bet>balance){showToast('Not enough!',false);return;}
  if(!checkMaxBet(bet,'Tower'))return;
  const diff=document.getElementById('towerDiff').value;
  if(diff==='easy'){towerCols=4;towerSafePerRow=3;}else if(diff==='medium'){towerCols=3;towerSafePerRow=2;}else if(diff==='hard'){towerCols=4;towerSafePerRow=2;}else{towerCols=4;towerSafePerRow=1;}
  towerBetAmt=bet;balance-=bet;updateBalDisplay();towerActive=true;towerRow=0;towerRows=8;
  towerBoard=[];for(let r=0;r<towerRows;r++){const row=Array(towerCols).fill(true);const traps=towerCols-towerSafePerRow;const trapPos=[];while(trapPos.length<traps){const p=Math.floor(Math.random()*towerCols);if(!trapPos.includes(p))trapPos.push(p);}trapPos.forEach(p=>row[p]=false);towerBoard.push(row);}
  towerRender();document.getElementById('towerStartBtn').style.display='none';document.getElementById('towerCashoutBtn').style.display='';
  document.getElementById('towerInfo').innerHTML='Floor <span style="color:var(--neon)">1</span> — Pick a tile!';playClickSound();
}
function towerCashout(){if(!towerActive||towerRow===0)return;const p=towerBetAmt*towerMultiplier();balance+=p;updateBalDisplay();
  showBigWin(p);showToast('+$'+p.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,30);
  towerActive=false;towerRevealAll();document.getElementById('towerStartBtn').style.display='';document.getElementById('towerCashoutBtn').style.display='none';
  document.getElementById('towerInfo').textContent='Cashed out at '+towerMultiplier().toFixed(2)+'× — $'+p.toFixed(2);recordGame('tower',towerBetAmt,p);
}
function towerClick(r,c){if(!towerActive||r!==towerRow)return;
  const rowEl=document.querySelectorAll('.tower-row')[towerRows-1-r];
  if(towerBoard[r][c]){towerRow++;rowEl.children[c].classList.add('revealed','safe');rowEl.children[c].textContent='✅';
    playSound(400+towerRow*60,'sine',.08,.06);const m=towerMultiplier();
    document.getElementById('towerInfo').innerHTML='Floor <span style="color:var(--neon)">'+(towerRow+1)+'</span> — '+m.toFixed(2)+'× ($'+(towerBetAmt*m).toFixed(2)+')';
    if(towerRow>=towerRows)towerCashout();else towerRender();
  }else{rowEl.children[c].classList.add('revealed','trap');rowEl.children[c].textContent='💀';
    towerActive=false;showToast('-$'+towerBetAmt.toFixed(2),false);playLoseSound();towerRevealAll();
    document.getElementById('towerStartBtn').style.display='';document.getElementById('towerCashoutBtn').style.display='none';
    document.getElementById('towerInfo').textContent='Hit a trap! Lost $'+towerBetAmt.toFixed(2);recordGame('tower',towerBetAmt,0);
  }
}
function towerRevealAll(){document.querySelectorAll('.tower-row').forEach((row,ri)=>{const actualRow=towerRows-1-ri;[...row.children].forEach((c,ci)=>{if(!c.classList.contains('revealed')){c.classList.add('revealed',towerBoard[actualRow][ci]?'safe':'trap');c.textContent=towerBoard[actualRow][ci]?'✅':'💀';}});});}
function towerRender(){const g=document.getElementById('towerGrid');g.innerHTML='';for(let r=towerRows-1;r>=0;r--){const row=document.createElement('div');row.className='tower-row';for(let c=0;c<towerCols;c++){const cell=document.createElement('div');cell.className='tower-cell';if(r===towerRow&&towerActive)cell.classList.add('current-row');else if(r>towerRow)cell.classList.add('locked');cell.onclick=(()=>{const rr=r,cc=c;return()=>towerClick(rr,cc);})();row.appendChild(cell);}g.appendChild(row);}}


let coinChoice='heads',coinFlipping=false;
function coinSelect(c){coinChoice=c;document.getElementById('coinHeads').className='coin-choice'+(c==='heads'?' selected':'');document.getElementById('coinTails').className='coin-choice'+(c==='tails'?' selected':'');playClickSound();}
function coinFlip(){if(coinFlipping)return;const bet=parseFloat(document.getElementById('coinBet').value)||10;if(bet<=0)return;if(bet>balance){showToast('Not enough!',false);return;}
  if(!checkMaxBet(bet,'Coinflip'))return;
  coinFlipping=true;balance-=bet;updateBalDisplay();document.getElementById('coinFlipBtn').disabled=true;document.getElementById('coinResult').textContent='';
  const coin=document.getElementById('coinDisplay');coin.classList.remove('flip');void coin.offsetWidth;coin.classList.add('flip');playClickSound();
  const result=Math.random()<0.5?'heads':'tails';
  setTimeout(()=>{coin.textContent=result==='heads'?'👑':'🦅';const won=result===coinChoice;
    if(won){const w=bet*1.96;balance+=w;updateBalDisplay();showBigWin(w);showToast('+$'+w.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,25);
      document.getElementById('coinResult').innerHTML='<span style="color:var(--green)">'+result.toUpperCase()+' — WIN!</span>';recordGame('coinflip',bet,w);}
    else{showToast('-$'+bet.toFixed(2),false);playLoseSound();document.getElementById('coinResult').innerHTML='<span style="color:var(--red)">'+result.toUpperCase()+' — LOSE</span>';recordGame('coinflip',bet,0);}
    coinFlipping=false;document.getElementById('coinFlipBtn').disabled=false;},800);
}


let kenoSelected=new Set(),kenoPlaying=false;
const KENO_PAYOUTS={1:[0,2.5],2:[0,1,5],3:[0,0,2,25],4:[0,0,1,5,50],5:[0,0,.5,3,15,100],6:[0,0,0,2,5,30,200],7:[0,0,0,1,3,10,50,400],8:[0,0,0,.5,2,8,25,100,500],9:[0,0,0,0,1,5,15,50,200,1000],10:[0,0,0,0,.5,3,10,25,100,500,2000]};
function kenoInit(){const g=document.getElementById('kenoGrid');if(!g)return;g.innerHTML='';for(let i=1;i<=40;i++){const c=document.createElement('div');c.className='keno-num';c.textContent=i;c.onclick=(()=>{const n=i;return()=>kenoToggle(n);})();g.appendChild(c);}}
function kenoToggle(n){if(kenoPlaying)return;const cells=document.querySelectorAll('.keno-num');if(kenoSelected.has(n)){kenoSelected.delete(n);cells[n-1].classList.remove('selected');}else{if(kenoSelected.size>=10){showToast('Max 10!',false);return;}kenoSelected.add(n);cells[n-1].classList.add('selected');}document.getElementById('kenoInfo').textContent=kenoSelected.size+'/10 selected';playClickSound();}
function kenoClear(){if(kenoPlaying)return;kenoSelected.clear();document.querySelectorAll('.keno-num').forEach(c=>{c.className='keno-num';});document.getElementById('kenoInfo').textContent='Pick up to 10 numbers';document.getElementById('kenoResult').textContent='';}
function kenoDraw(){if(kenoPlaying||kenoSelected.size===0)return;const bet=parseFloat(document.getElementById('kenoBet').value)||10;if(bet<=0)return;if(bet>balance){showToast('Not enough!',false);return;}
  if(!checkMaxBet(bet,'Keno'))return;
  kenoPlaying=true;balance-=bet;updateBalDisplay();document.getElementById('kenoDrawBtn').disabled=true;
  const drawn=new Set();while(drawn.size<10){drawn.add(Math.floor(Math.random()*40)+1);}
  const cells=document.querySelectorAll('.keno-num');let hits=0;const drawnArr=[...drawn];let idx=0;
  const revealInterval=setInterval(()=>{if(idx>=drawnArr.length){clearInterval(revealInterval);
    const picks=kenoSelected.size;const payTable=KENO_PAYOUTS[picks];const mult=payTable&&payTable[hits]?payTable[hits]:0;const payout=bet*mult;
    cells.forEach((c,i)=>{if(!drawn.has(i+1)&&!kenoSelected.has(i+1))c.classList.add('miss');});
    if(payout>0){balance+=payout;updateBalDisplay();showBigWin(payout);showToast(hits+' hits! +$'+payout.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,20+hits*10);
      document.getElementById('kenoResult').innerHTML='<span style="color:var(--green)">'+hits+' HITS — '+mult+'× — +$'+payout.toFixed(2)+'</span>';}
    else{showToast(hits+' hits — no win',false);playLoseSound();document.getElementById('kenoResult').innerHTML='<span style="color:var(--red)">'+hits+' hits — no win</span>';}
    recordGame('keno',bet,payout);kenoPlaying=false;document.getElementById('kenoDrawBtn').disabled=false;return;}
    const n=drawnArr[idx];cells[n-1].classList.add('drawn');if(kenoSelected.has(n)){cells[n-1].classList.add('hit');hits++;playSound(600+hits*80,'sine',.06,.06);}else{playSound(300,'sine',.03,.02);}idx++;
  },200);
}


let limboRolling=false;
function limboUpdateInfo(){const t=parseFloat(document.getElementById('limboTarget').value)||2;const chance=Math.min(99,(99/t));document.getElementById('limboPayout').textContent='Win chance: '+chance.toFixed(2)+'% — Payout: '+t.toFixed(2)+'×';}
function limboGo(){if(limboRolling)return;const bet=parseFloat(document.getElementById('limboBet').value)||10;if(bet<=0)return;let target=parseFloat(document.getElementById('limboTarget').value)||2;target=Math.max(1.01,Math.min(1000,target));
  if(bet>balance){showToast('Not enough!',false);return;}if(target<1.01){showToast('Min target 1.01×',false);return;}
  if(!checkMaxBet(bet,'Limbo'))return;
  limboRolling=true;balance-=bet;updateBalDisplay();document.getElementById('limboGoBtn').disabled=true;
  const result=Math.min(10000,0.99/(1-Math.random()));const display=document.getElementById('limboResult');const limboBar=document.getElementById('limboBar');
  let cur=1;const step=Math.max(0.01,(result-1)/20);
  const anim=setInterval(()=>{cur+=step;if(cur>=result){cur=result;clearInterval(anim);
    display.textContent=Math.max(1,result).toFixed(2)+'×';const won=result>=target;
    display.style.color=won?'var(--green)':'var(--red)';
    if(limboBar){const pct=Math.min(100,(result/Math.max(target,2))*100);limboBar.style.width=pct+'%';limboBar.style.background=won?'var(--green)':'var(--red)';limboBar.style.boxShadow=won?'0 0 15px var(--green)':'0 0 15px var(--red)';}
    if(won){const w=bet*target;balance+=w;updateBalDisplay();showBigWin(w);showToast('+$'+w.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,25);recordGame('limbo',bet,w);addResultDot('limboHistory',target.toFixed(1)+'×',true);}
    else{showToast('-$'+bet.toFixed(2),false);playLoseSound();recordGame('limbo',bet,0);addResultDot('limboHistory',result.toFixed(1)+'×',false);}
    limboRolling=false;document.getElementById('limboGoBtn').disabled=false;}
  else{display.textContent=cur.toFixed(2)+'×';display.style.color='var(--neon)';if(limboBar){const pct=Math.min(100,(cur/Math.max(target,2))*100);limboBar.style.width=pct+'%';limboBar.style.background=cur>=target?'var(--green)':'var(--neon)';limboBar.style.transition='width 0.05s';}playSound(400+cur*30,'sine',.02,.015);}},50);
}


let pokerDeckArr=[],pokerHandArr=[],pokerHeld=[],pokerBetAmt=0,pokerPhase='idle';
function pokerDeal(){
  if(pokerPhase==='hold'){pokerDrawCards();return;}
  const bet=parseFloat(document.getElementById('pokerBet').value)||10;if(bet<=0)return;if(bet>balance){showToast('Not enough!',false);return;}
  if(!checkMaxBet(bet,'Poker'))return;
  pokerBetAmt=bet;balance-=bet;updateBalDisplay();pokerDeckArr=newDeck();pokerHandArr=[];pokerHeld=Array(5).fill(false);
  for(let i=0;i<5;i++)pokerHandArr.push(pokerDeckArr.pop());pokerPhase='hold';pokerRender();
  document.getElementById('pokerDealBtn').textContent='DRAW';document.getElementById('pokerResult').textContent='Click cards to hold, then DRAW';playClickSound();
}
function pokerDrawCards(){for(let i=0;i<5;i++){if(!pokerHeld[i])pokerHandArr[i]=pokerDeckArr.pop();}pokerPhase='done';pokerRender();
  const result=pokerEvaluate();const mult=result.mult;const payout=pokerBetAmt*mult;
  if(payout>0){balance+=payout;updateBalDisplay();showBigWin(payout);showToast(result.name+' +$'+payout.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,20+mult*5);
    document.getElementById('pokerResult').innerHTML='<span style="color:var(--green)">'+result.name+' — '+mult+'× — +$'+payout.toFixed(2)+'</span>';}
  else{showToast('No win',false);playLoseSound();document.getElementById('pokerResult').innerHTML='<span style="color:var(--red)">No winning hand</span>';}
  recordGame('poker',pokerBetAmt,payout);document.getElementById('pokerDealBtn').textContent='DEAL';pokerPhase='idle';
}
function pokerToggleHold(i){if(pokerPhase!=='hold')return;pokerHeld[i]=!pokerHeld[i];pokerRender();playClickSound();}
function pokerRender(){const h=document.getElementById('pokerHand');h.innerHTML='';pokerHandArr.forEach((c,i)=>{const el=document.createElement('div');el.className='poker-card'+(cardIsRed(c)?' red':'')+(pokerHeld[i]?' held':'');el.innerHTML=c.r+'<div class="card-suit" style="font-size:24px;margin-top:4px;">'+c.s+'</div>'+(pokerHeld[i]?'<div class="held-tag">HELD</div>':'');el.onclick=()=>pokerToggleHold(i);el.style.opacity='0';el.style.transform='translateY(20px) scale(0.8)';el.style.transition='all 0.3s ease '+(i*0.08)+'s';h.appendChild(el);requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform=pokerHeld[i]?'translateY(-10px) scale(1)':'translateY(0) scale(1)';});});}
function pokerEvaluate(){const h=pokerHandArr;const ranks=h.map(c=>cardRankIdx(c)).sort((a,b)=>a-b);const suits=h.map(c=>c.s);
  const isFlush=suits.every(s=>s===suits[0]);const counts={};ranks.forEach(r=>{counts[r]=(counts[r]||0)+1;});const vals=Object.values(counts).sort((a,b)=>b-a);
  const isStraight=(ranks[4]-ranks[0]===4&&new Set(ranks).size===5)||(JSON.stringify(ranks)==='[0,9,10,11,12]');
  const isRoyal=isStraight&&isFlush&&ranks[0]===0&&ranks[1]===9;
  if(isRoyal)return{name:'Royal Flush',mult:250};if(isStraight&&isFlush)return{name:'Straight Flush',mult:50};
  if(vals[0]===4)return{name:'Four of a Kind',mult:25};if(vals[0]===3&&vals[1]===2)return{name:'Full House',mult:9};
  if(isFlush)return{name:'Flush',mult:6};if(isStraight)return{name:'Straight',mult:4};
  if(vals[0]===3)return{name:'Three of a Kind',mult:3};if(vals[0]===2&&vals[1]===2)return{name:'Two Pair',mult:2};
  if(vals[0]===2){const pairRank=parseInt(Object.keys(counts).find(k=>counts[k]===2));if(pairRank>=10||pairRank===0)return{name:'Jacks or Better',mult:1};}
  return{name:'No Win',mult:0};
}
function scratchRevealAll(){if(!scratchActive)return;const cells=document.querySelectorAll('.scratch-cell');let delay=0;cells.forEach((c,i)=>{if(!c.classList.contains('revealed')){setTimeout(()=>scratchReveal(i),delay);delay+=80;}});}


const HORSES=[{name:'Thunder',emoji:'🐎',color:'#ff4444'},{name:'Lightning',emoji:'🏇',color:'#ffaa00'},{name:'Shadow',emoji:'🐴',color:'#8844ff'},{name:'Spirit',emoji:'🦄',color:'#44aaff'},{name:'Blaze',emoji:'🐎',color:'#44ff44'}];
let horseSelected=-1,horseRacing=false;
function horseInit(){const t=document.getElementById('horseTrack');const b=document.getElementById('horseBets');if(!t||!b)return;t.innerHTML='';b.innerHTML='';
  HORSES.forEach((h,i)=>{t.innerHTML+='<div class="horse-lane"><div class="horse-name" style="color:'+h.color+'">'+h.emoji+' '+h.name+'</div><div class="horse-bar"><div class="horse-progress" id="hp'+i+'" style="width:0%;background:'+h.color+';opacity:.6;"></div><div class="horse-emoji" id="he'+i+'" style="left:0%;">'+h.emoji+'</div></div><div class="horse-odds" id="ho'+i+'"></div></div>';
    b.innerHTML+='<button class="horse-bet" onclick="horseSelect('+i+',this)">'+h.emoji+' '+h.name+'</button>';});horseSetOdds();}
function horseSetOdds(){
  
  const demoWeights=HORSES.map(()=>1+Math.random()*3);
  const totalW=demoWeights.reduce((s,w)=>s+w,0);
  HORSES.forEach((_,i)=>{
    const winProb=demoWeights[i]/totalW;
    const odds=Math.max(1.2,(0.95/winProb)).toFixed(1); 
    document.getElementById('ho'+i).textContent=odds+'×';
    document.getElementById('ho'+i).dataset.odds=odds;
  });
}
function horseSelect(i,btn){horseSelected=i;document.querySelectorAll('.horse-bet').forEach(b=>b.classList.remove('selected'));if(btn)btn.classList.add('selected');playClickSound();}
function horseRace(){if(horseRacing||horseSelected<0){if(horseSelected<0)showToast('Pick a horse!',false);return;}
  const bet=parseFloat(document.getElementById('horseBet').value)||10;if(bet<=0)return;if(bet>balance){showToast('Not enough!',false);return;}
  if(!checkMaxBet(bet,'Horses'))return;
  horseRacing=true;balance-=bet;updateBalDisplay();document.getElementById('horseRaceBtn').disabled=true;document.getElementById('horseResult').textContent='';
  const progress=HORSES.map(()=>0);
  const raceSpds=HORSES.map(()=>1+Math.random()*3);
  playClickSound();
  const raceInterval=setInterval(()=>{let winner=-1;HORSES.forEach((_,i)=>{
    progress[i]+=Math.random()*raceSpds[i]*1.8+0.3;
    if(progress[i]>=100){progress[i]=100;if(winner<0)winner=i;}
    document.getElementById('hp'+i).style.width=progress[i]+'%';document.getElementById('he'+i).style.left=Math.min(progress[i],95)+'%';});
    if(winner>=0){clearInterval(raceInterval);horseRacing=false;document.getElementById('horseRaceBtn').disabled=false;
      const odds=parseFloat(document.getElementById('ho'+horseSelected).dataset.odds);
      if(winner===horseSelected){const w=bet*odds;balance+=w;updateBalDisplay();showBigWin(w);showToast(HORSES[winner].emoji+' '+HORSES[winner].name+' wins! +$'+w.toFixed(2));playWinSound();
        spawnParticles(window.innerWidth/2,window.innerHeight/2,40);document.getElementById('horseResult').innerHTML='<span style="color:var(--green)">'+HORSES[winner].name+' WINS! +$'+w.toFixed(2)+'</span>';recordGame('horses',bet,w);}
      else{showToast(HORSES[winner].name+' wins',false);playLoseSound();document.getElementById('horseResult').innerHTML='<span style="color:var(--red)">'+HORSES[winner].name+' wins</span>';recordGame('horses',bet,0);}
      setTimeout(()=>{HORSES.forEach((_,i)=>{document.getElementById('hp'+i).style.width='0%';document.getElementById('he'+i).style.left='0%';});horseSetOdds();},2000);}
  },60);
}


const SCRATCH_TIERS=[{name:'Basic',price:5,symbols:['🍒','🍋','🔔','💎','7️⃣','⭐'],maxWin:50},{name:'Silver',price:25,symbols:['💎','7️⃣','⭐','👑','💰','🏆'],maxWin:500},{name:'Gold',price:100,symbols:['👑','💰','🏆','💎','🔥','🌟'],maxWin:5000},{name:'Diamond',price:500,symbols:['💎','👑','🔥','🌟','💀','🌀'],maxWin:50000}];
let scratchTier=0,scratchCells=[],scratchRevealed=0,scratchActive=false;
function scratchSelectTier(t,btn){scratchTier=t;document.querySelectorAll('.scratch-tier').forEach(b=>b.classList.remove('selected'));if(btn)btn.classList.add('selected');document.getElementById('scratchBuyBtn').textContent='BUY CARD — $'+SCRATCH_TIERS[t].price;playClickSound();}
function scratchBuy(){if(scratchActive)return;const tier=SCRATCH_TIERS[scratchTier];
  if(tier.price>balance){showToast('Not enough balance!',false);return;}
  balance-=tier.price;updateBalDisplay();scratchActive=true;scratchRevealed=0;scratchCells=[];
  const r=Math.random();let winCount=0;if(r<0.03)winCount=4;else if(r<0.15)winCount=3;
  if(winCount>0){
    const winSym=tier.symbols[Math.floor(Math.random()*tier.symbols.length)];
    const others=tier.symbols.filter(s=>s!==winSym);
    for(let i=0;i<9;i++){if(i<winCount)scratchCells.push(winSym);else{
      
      let pick;do{pick=others[Math.floor(Math.random()*others.length)];}while(scratchCells.filter(s=>s===pick).length>=2);scratchCells.push(pick);
    }}
  } else {
    
    const syms=tier.symbols.slice();
    for(let i=0;i<9;i++){
      const valid=syms.filter(s=>scratchCells.filter(c=>c===s).length<2);
      scratchCells.push(valid[Math.floor(Math.random()*valid.length)]);
    }
  }
  for(let i=scratchCells.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[scratchCells[i],scratchCells[j]]=[scratchCells[j],scratchCells[i]];}
  document.getElementById('scratchResult').textContent='';const g=document.getElementById('scratchGrid');g.innerHTML='';
  scratchCells.forEach((_,i)=>{const c=document.createElement('div');c.className='scratch-cell';c.textContent='?';c.onclick=()=>scratchReveal(i);g.appendChild(c);});document.getElementById('scratchRevealAllBtn').style.display='inline-block';playClickSound();
}
function scratchReveal(i){if(!scratchActive)return;const cells=document.querySelectorAll('.scratch-cell');if(cells[i].classList.contains('revealed'))return;
  cells[i].classList.add('revealed');cells[i].textContent=scratchCells[i];scratchRevealed++;playSound(500+Math.random()*200,'sine',.04,.03);
  if(scratchRevealed===9){scratchActive=false;document.getElementById('scratchRevealAllBtn').style.display='none';const tier=SCRATCH_TIERS[scratchTier];const counts={};scratchCells.forEach(s=>{counts[s]=(counts[s]||0)+1;});
    let maxC=0;Object.values(counts).forEach(c=>{if(c>maxC)maxC=c;});let payout=0;
    if(maxC>=3){payout=tier.price*(maxC===3?3:maxC===4?10:50);payout=Math.min(payout,tier.maxWin);}
    if(payout>0){balance+=payout;updateBalDisplay();showBigWin(payout);showToast(maxC+' matches! +$'+payout.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,30);
      document.getElementById('scratchResult').innerHTML='<span style="color:var(--green)">'+maxC+' MATCHES — +$'+payout+'!</span>';recordGame('scratch',tier.price,payout);}
    else{showToast('No matches',false);playLoseSound();document.getElementById('scratchResult').innerHTML='<span style="color:var(--red)">No matches</span>';recordGame('scratch',tier.price,0);}
  }
}


const WHEEL_SEGMENTS=[{label:'0×',mult:0,color:'#333',weight:5},{label:'0.5×',mult:0.5,color:'#444',weight:7},{label:'1×',mult:1,color:'#555',weight:6},{label:'1.5×',mult:1.5,color:'#1a5a1a',weight:4},{label:'2×',mult:2,color:'#2a7a2a',weight:3},{label:'3×',mult:3,color:'#1a1a8e',weight:1.5},{label:'5×',mult:5,color:'#6b2fd9',weight:0.8},{label:'10×',mult:10,color:'#cc2233',weight:0.25},{label:'50×',mult:50,color:'#ffd700',weight:0.04}];
let wheelAngle=0,wheelSpinning=false,wheelDrawn=false;
function drawWheel(angle){wheelDrawn=true;const c=document.getElementById('wheelCanvas');if(!c)return;const ctx=c.getContext('2d');const cx=c.width/2,cy=c.height/2,r=c.width/2-8;ctx.clearRect(0,0,c.width,c.height);
  const totalW=WHEEL_SEGMENTS.reduce((s,seg)=>s+seg.weight,0);let curAngle=angle;
  WHEEL_SEGMENTS.forEach(seg=>{const sliceAngle=(seg.weight/totalW)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,curAngle,curAngle+sliceAngle);ctx.closePath();ctx.fillStyle=seg.color;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=2;ctx.stroke();
    const ta=curAngle+sliceAngle/2;const tx=cx+Math.cos(ta)*(r*.62);const ty=cy+Math.sin(ta)*(r*.62);ctx.save();ctx.translate(tx,ty);ctx.rotate(ta+Math.PI/2);ctx.fillStyle='#fff';ctx.font='bold 11px Orbitron';ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=0.95;ctx.fillText(seg.label,0,0);ctx.restore();curAngle+=sliceAngle;});
  ctx.beginPath();ctx.arc(cx,cy,r*.12,0,Math.PI*2);ctx.fillStyle='#1a1a3e';ctx.fill();ctx.strokeStyle='rgba(255,215,0,.4)';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,r+2,0,Math.PI*2);ctx.strokeStyle='rgba(255,215,0,.2)';ctx.lineWidth=4;ctx.stroke();
}
function wheelSpin(){if(wheelSpinning)return;const bet=parseFloat(document.getElementById('wheelBet').value)||10;if(bet<=0)return;if(bet>balance){showToast('Not enough!',false);return;}
  if(!checkMaxBet(bet,'Wheel'))return;
  wheelSpinning=true;balance-=bet;updateBalDisplay();document.getElementById('wheelSpinBtn').disabled=true;document.getElementById('wheelResult').textContent='';playClickSound();
  const totalW=WHEEL_SEGMENTS.reduce((s,seg)=>s+seg.weight,0);let rnd=Math.random()*totalW,winIdx=0;
  for(let i=0;i<WHEEL_SEGMENTS.length;i++){rnd-=WHEEL_SEGMENTS[i].weight;if(rnd<=0){winIdx=i;break;}}const seg=WHEEL_SEGMENTS[winIdx];
  let cumAngle=0;for(let i=0;i<winIdx;i++){cumAngle+=(WHEEL_SEGMENTS[i].weight/totalW)*Math.PI*2;}cumAngle+=(seg.weight/totalW)*Math.PI;
  const targetAngle=-Math.PI/2-cumAngle+Math.PI*2*(5+Math.random()*3);const startAngle=wheelAngle;const totalRot=targetAngle-startAngle;
  const dur=3500;const st=performance.now();
  let lastTickAngle=startAngle;const tickSize=(WHEEL_SEGMENTS[0].weight/totalW)*Math.PI*2;
  function anim(now){const elapsed=now-st;const prog=Math.min(elapsed/dur,1);const eased=1-Math.pow(1-prog,4);const cur=startAngle+totalRot*eased;drawWheel(cur);
    if(Math.abs(cur-lastTickAngle)>tickSize){lastTickAngle=cur;playSound(600+Math.random()*200,'sine',.015,.01);}
    if(prog<1)requestAnimationFrame(anim);
    else{wheelAngle=cur%(Math.PI*2);wheelSpinning=false;document.getElementById('wheelSpinBtn').disabled=false;
      
      const twTotal=WHEEL_SEGMENTS.reduce((s,sg)=>s+sg.weight,0);
      const pointerAng=((-Math.PI/2-wheelAngle)%(Math.PI*2)+Math.PI*4)%(Math.PI*2);
      let acc=0,visSeg=WHEEL_SEGMENTS[0];
      for(let i=0;i<WHEEL_SEGMENTS.length;i++){acc+=(WHEEL_SEGMENTS[i].weight/twTotal)*Math.PI*2;if(pointerAng<acc){visSeg=WHEEL_SEGMENTS[i];break;}}
      const payout=bet*visSeg.mult;
      if(payout>0){balance+=payout;updateBalDisplay();showBigWin(payout);showToast(visSeg.label+' +$'+payout.toFixed(2));if(visSeg.mult>=2)playWinSound();else playClickSound();
        if(visSeg.mult>=5)spawnParticles(window.innerWidth/2,window.innerHeight/2,30+visSeg.mult*5);
        document.getElementById('wheelResult').innerHTML='<span style="color:var(--green)">'+visSeg.label+' — +$'+payout.toFixed(2)+'</span>';recordGame('wheel',bet,payout);}
      else{showToast(visSeg.label,false);playLoseSound();document.getElementById('wheelResult').innerHTML='<span style="color:var(--red)">'+visSeg.label+'</span>';recordGame('wheel',bet,0);}
    }
  }requestAnimationFrame(anim);
}


let baccBetType=null;
function baccSelect(type,btn){baccBetType=type;document.querySelectorAll('.bacc-bet').forEach(b=>b.classList.remove('selected'));if(btn)btn.classList.add('selected');playClickSound();}
function baccCardVal(c){const v=cardNumVal(c);return v===11?1:v>=10?0:v;}
function baccHandTotal(hand){return hand.reduce((s,c)=>s+baccCardVal(c),0)%10;}
function baccDeal(){if(!baccBetType){showToast('Select bet!',false);return;}const bet=parseFloat(document.getElementById('baccBet').value)||10;if(bet<=0)return;if(bet>balance){showToast('Not enough!',false);return;}
  if(!checkMaxBet(bet,'Baccarat'))return;
  balance-=bet;updateBalDisplay();const deck=newDeck();const player=[deck.pop(),deck.pop()],banker=[deck.pop(),deck.pop()];
  let pScore=baccHandTotal(player),bScore=baccHandTotal(banker);
  if(pScore<8&&bScore<8){let pThird=null;
    if(pScore<=5){pThird=deck.pop();player.push(pThird);pScore=baccHandTotal(player);}
    if(!pThird){if(bScore<=5)banker.push(deck.pop());}
    else{const pTV=baccCardVal(pThird);
      if(bScore<=2)banker.push(deck.pop());
      else if(bScore===3&&pTV!==8)banker.push(deck.pop());
      else if(bScore===4&&[2,3,4,5,6,7].includes(pTV))banker.push(deck.pop());
      else if(bScore===5&&[4,5,6,7].includes(pTV))banker.push(deck.pop());
      else if(bScore===6&&[6,7].includes(pTV))banker.push(deck.pop());
    }
  }
  pScore=baccHandTotal(player);bScore=baccHandTotal(banker);
  document.getElementById('baccPlayerCards').innerHTML='';
  document.getElementById('baccBankerCards').innerHTML='';
  document.getElementById('baccPlayerScore').textContent='?';
  document.getElementById('baccBankerScore').textContent='?';
  document.getElementById('baccResult').innerHTML='<span style="color:var(--text2)">Dealing...</span>';
  const allCards=[];
  allCards.push({side:'player',card:player[0]});allCards.push({side:'banker',card:banker[0]});
  allCards.push({side:'player',card:player[1]});allCards.push({side:'banker',card:banker[1]});
  if(player.length>2)allCards.push({side:'player',card:player[2]});
  if(banker.length>2)allCards.push({side:'banker',card:banker[2]});
  let ci=0;
  const dealInterval=setInterval(()=>{
    if(ci>=allCards.length){clearInterval(dealInterval);
      document.getElementById('baccPlayerScore').textContent=pScore;
      document.getElementById('baccBankerScore').textContent=bScore;
      let winner=pScore>bScore?'player':bScore>pScore?'banker':'tie';let payout=0;
      if(winner===baccBetType){if(baccBetType==='player')payout=bet*2;else if(baccBetType==='banker')payout=bet*1.95;else payout=bet*9;}
      else if(winner==='tie'&&baccBetType!=='tie'){payout=bet;}
      setTimeout(()=>{
        if(payout>bet){balance+=payout;updateBalDisplay();showBigWin(payout);showToast((winner==='tie'?'TIE':winner.toUpperCase())+' +$'+(payout-bet).toFixed(2));playWinSound();
          spawnParticles(window.innerWidth/2,window.innerHeight/2,25);document.getElementById('baccResult').innerHTML='<span style="color:var(--green)">'+winner.toUpperCase()+' WINS! +$'+payout.toFixed(2)+'</span>';recordGame('baccarat',bet,payout);addResultDot('baccHistory',winner[0].toUpperCase(),true);}
        else if(payout===bet){balance+=payout;updateBalDisplay();showToast('Push');document.getElementById('baccResult').innerHTML='<span style="color:var(--gold)">PUSH</span>';recordGame('baccarat',bet,bet);addResultDot('baccHistory','T',false);}
        else{showToast('-$'+bet.toFixed(2),false);playLoseSound();document.getElementById('baccResult').innerHTML='<span style="color:var(--red)">'+winner.toUpperCase()+' WINS</span>';recordGame('baccarat',bet,0);addResultDot('baccHistory',winner[0].toUpperCase(),false);}
      },400);
      return;
    }
    const {side,card}=allCards[ci];
    const container=document.getElementById(side==='player'?'baccPlayerCards':'baccBankerCards');
    const el=document.createElement('div');el.innerHTML=renderCard(card);const cardEl=el.firstChild;
    cardEl.style.opacity='0';cardEl.style.transform='translateY(-20px)';cardEl.style.transition='all 0.3s ease';
    container.appendChild(cardEl);
    requestAnimationFrame(()=>{cardEl.style.opacity='1';cardEl.style.transform='translateY(0)';});
    playSound(300+ci*80,'sine',.03,.02);ci++;
  },450);
  playClickSound();
}


let hiloDeck=[],hiloCard=null,hiloStreakCount=0,hiloBetAmt=0,hiloActive=false,hiloSkipCount=0;
const HILO_MAX_MULT=500; 
const HILO_SKIP_PENALTY=0.10; 
function hiloMultiplier(){
  if(hiloStreakCount===0)return 1;
  let m=1;for(let i=0;i<hiloStreakCount;i++)m*=1.55;
  
  for(let i=0;i<hiloSkipCount;i++)m*=(1-HILO_SKIP_PENALTY);
  m=Math.round(m*100)/100;
  return Math.min(m,HILO_MAX_MULT);
}
function hiloStart(){if(hiloActive)return;const bet=parseFloat(document.getElementById('hiloBet').value)||10;if(bet<=0)return;
  if(!checkMaxBet(bet,'Hi-Lo'))return;
  if(bet>balance){showToast('Not enough balance!',false);return;}
  hiloBetAmt=bet;balance-=bet;updateBalDisplay();hiloActive=true;hiloStreakCount=0;hiloSkipCount=0;hiloDeck=newDeck();hiloCard=hiloDeck.pop();hiloRender();
  document.getElementById('hiloStartBtn').style.display='none';document.getElementById('hiloCashoutBtn').style.display='';playClickSound();
}
function hiloCashout(){if(!hiloActive||hiloStreakCount===0)return;const p=hiloBetAmt*hiloMultiplier();balance+=p;updateBalDisplay();
  showBigWin(p);showToast('+$'+p.toFixed(2));playWinSound();spawnParticles(window.innerWidth/2,window.innerHeight/2,25);hiloActive=false;
  document.getElementById('hiloStartBtn').style.display='';document.getElementById('hiloCashoutBtn').style.display='none';
  document.getElementById('hiloStreak').textContent='Cashed out '+hiloMultiplier().toFixed(2)+'× — $'+p.toFixed(2);recordGame('hilo',hiloBetAmt,p);
}
function hiloGuess(guess){if(!hiloActive)return;if(hiloDeck.length<2)hiloDeck=newDeck();
  const next=hiloDeck.pop();const curRank=cardRankIdx(hiloCard),nextRank=cardRankIdx(next);
  if(guess==='skip'){hiloSkipCount++;hiloCard=next;hiloRender();playSound(400,'sine',.04,.04);
    showToast('Skipped! (-10% payout penalty)',false);return;}
  let correct=false;
  const tied = nextRank===curRank;
  
  if(guess==='higher')correct=nextRank>curRank;else if(guess==='lower')correct=nextRank<curRank;
  hiloCard=next;
  if(tied){hiloRender();playSound(400,'sine',.06,.05);
    showToast('TIE! Same card — try again.',false);
    document.getElementById('hiloStreak').innerHTML='<span style="color:var(--gold)">TIE!</span> Card was '+next.r+next.s+' — guess again';return;}
  if(correct){hiloStreakCount++;playSound(500+hiloStreakCount*60,'sine',.08,.06);hiloRender();}
  else{hiloActive=false;hiloRender();showToast('-$'+hiloBetAmt.toFixed(2),false);playLoseSound();
    document.getElementById('hiloStartBtn').style.display='';document.getElementById('hiloCashoutBtn').style.display='none';
    document.getElementById('hiloStreak').innerHTML='<span style="color:var(--red)">WRONG!</span> Card was '+next.r+next.s;recordGame('hilo',hiloBetAmt,0);
  }
}
function hiloRender(){const c=hiloCard;document.getElementById('hiloCard').className='hilo-card'+(cardIsRed(c)?' red':'');document.getElementById('hiloCard').innerHTML=c.r+'<br>'+c.s;
  document.getElementById('hiloHigherBtn').disabled=!hiloActive;document.getElementById('hiloLowerBtn').disabled=!hiloActive;document.getElementById('hiloSkipBtn').disabled=!hiloActive;
  if(hiloActive){const m=hiloMultiplier();document.getElementById('hiloStreak').textContent='Streak: '+hiloStreakCount+' — '+m.toFixed(2)+'×'+(hiloSkipCount>0?' ('+hiloSkipCount+' skips, -'+Math.round(100*(1-Math.pow(0.9,hiloSkipCount)))+'%)':'');
    document.getElementById('hiloCashout').textContent=hiloStreakCount>0?'Cash out: $'+(hiloBetAmt*m).toFixed(2):'';}
}


let chatOpen = false;
let chatUnread = 0;
let chatInitialized = false;

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  panel.classList.toggle('open', chatOpen);
  if (chatOpen) {
    chatUnread = 0;
    updateChatBadge();
    if (!chatInitialized && window._initChat) {
      window._initChat();
      chatInitialized = true;
    }
    const input = document.getElementById('chatInput');
    setTimeout(() => input.focus(), 100);
    
    const msgs = document.getElementById('chatMessages');
    msgs.scrollTop = msgs.scrollHeight;
  }
}

function updateChatBadge() {
  const badge = document.getElementById('chatBadge');
  if (chatUnread > 0) {
    badge.style.display = 'flex';
    badge.textContent = chatUnread > 99 ? '99+' : chatUnread;
  } else {
    badge.style.display = 'none';
  }
}

window._onChatMessages = function(msgs) {
  const container = document.getElementById('chatMessages');
  const wasAtBottom = container.scrollTop >= container.scrollHeight - container.clientHeight - 30;
  container.innerHTML = '<div class="chat-msg-system">Welcome to Casino Royale chat! Be respectful.</div>';
  
  msgs.forEach(m => {
    if (m.type === 'win') {
      const el = document.createElement('div');
      el.className = 'chat-msg-win';
      el.innerHTML = '<div class="win-text">🎉 ' + escapeHtml(m.text) + '</div>';
      container.appendChild(el);
    } else if (m.type === 'system') {
      const el = document.createElement('div');
      el.className = 'chat-msg-system';
      el.textContent = m.text;
      container.appendChild(el);
    } else {
      const el = document.createElement('div');
      el.className = 'chat-msg';
      const initial = (m.user || '?')[0].toUpperCase();
      const isGuest = (m.user || '').toLowerCase() === 'guest';
      const timeStr = m.ts ? new Date(m.ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '';
      const pBadge = m.prestige > 0 ? getPrestigeBadgeHTML(m.prestige) : '';
      let roleBadge = '';
      if (m.role === 'owner') roleBadge = '<span class="role-badge-owner">OWNER</span>';
      else if (m.role === 'co-owner') roleBadge = '<span class="role-badge-coowner">CO-OWNER</span>';
      const avatarContent = m.profilePicUrl ? `<img src="${m.profilePicUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : initial;
      el.innerHTML = `<div class="chat-msg-avatar">${avatarContent}</div>
        <div class="chat-msg-body">
          <div class="chat-msg-name${isGuest?' guest-name':''}">${escapeHtml(m.user||'Guest')}${roleBadge}${pBadge} <span class="chat-msg-time">${timeStr}</span></div>
          <div class="chat-msg-text">${escapeHtml(m.text)}</div>
        </div>`;
      container.appendChild(el);
    }
  });

  if (wasAtBottom || !chatOpen) container.scrollTop = container.scrollHeight;
  if (!chatOpen && msgs.length > 0) {
    chatUnread = Math.min(chatUnread + 1, 99);
    updateChatBadge();
  }
};

window._onChatOnlineCount = function(count) {
  const el = document.getElementById('chatOnlineCount');
  if (el) el.textContent = count > 0 ? '(' + count + ' online)' : '';
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  let text = input.value.trim();
  if (!text) return;
  if (isGuestMode) { showToast('Sign in to chat', false); return; }
  
  if (window._currentPlayerId && typeof _checkMute === 'function') {
    try {
      const mute = await _checkMute(window._currentPlayerId);
      if (mute) {
        const timeLeft = mute.expires > 0 ? Math.ceil((mute.expires - Date.now()) / 60000) + 'min' : 'permanent';
        showToast('🔇 You are muted (' + timeLeft + '): ' + (mute.reason || ''), false);
        return;
      }
    } catch(e) {}
  }
  if (text.length > 200) text = text.slice(0, 200); 
  const username = window._currentUsername || 'Guest';
  if (window._sendChatMsg) {
    window._sendChatMsg(text, username, 'msg').then(()=>{
      
      const msgs = document.getElementById('chatMessages');
      if(msgs) msgs.scrollTop = msgs.scrollHeight;
    }).catch((e)=>{ showToast('Message failed to send', false); console.error('Chat error:', e); });
  } else {
    showToast('Chat not available', false);
  }
  input.value = '';
}


document.getElementById('chatInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});


let _lastBroadcast = 0;
const _origRecordGame = recordGame;
recordGame = function(game, wagered, won) {
  _origRecordGame(game, wagered, won);
  
  const now = Date.now();
  if (won >= 5000 && window._broadcastWin && (now - _lastBroadcast > 15000)) {
    _lastBroadcast = now;
    const username = window._currentUsername || 'Guest';
    const gameNames = {slots:'Slots',crash:'Crash',roulette:'Roulette',cases:'Cases',plinko:'Plinko',
      blackjack:'Blackjack',mines:'Mines',dice:'Dice',tower:'Tower',coinflip:'Coin Flip',
      keno:'Keno',limbo:'Limbo',poker:'Poker',horses:'Horses',scratch:'Scratch',
      wheel:'Wheel',baccarat:'Baccarat',hilo:'Hi-Lo'};
    window._broadcastWin(username, gameNames[game] || game, won);
  }
};


window.addEventListener('load',()=>{
  initSlots();
  initCases();
  resizeCrashCanvas();
  initStocks();
  minesRenderGrid();
  diceUpdateSlider();
  kenoInit();
  horseInit();
  drawWheel(0);
  
  try{ updatePlinkoProfitChart(); }catch(e){}
  document.getElementById('limboTarget').addEventListener('input',limboUpdateInfo);
  window.addEventListener('resize',()=>{resizeCrashCanvas();resizeParticles();
  try{const wrap=document.querySelector('.plinko-canvas-wrap');if(wrap&&plinkoInitialized&&plinkoMatterRender&&plinkoMatterRender.canvas){plinkoMatterRender.canvas.style.width = wrap.clientWidth + 'px';plinkoMatterRender.canvas.style.height = wrap.clientHeight + 'px';}}
  catch(e){}
  if(document.querySelector('#stocksPanel.active')&&typeof renderStocks==='function'){try{renderStocks();}catch(e){}}
  if(document.querySelector('#wheelPanel.active')&&typeof drawWheel==='function'){try{drawWheel(wheelAngle||0);}catch(e){}}
});
  
  if(window.visualViewport){document.documentElement.style.setProperty('--vh',window.visualViewport.height+'px');window.visualViewport.addEventListener('resize',()=>{document.documentElement.style.setProperty('--vh',window.visualViewport.height+'px');});}
  setInterval(firebaseSave,30000);
  
  let _lastTradeReqCount = 0;
  setInterval(async ()=>{
    if(!window._loadTradeRequests || !window._currentPlayerId) return;
    try {
      const reqs = await window._loadTradeRequests();
      if(reqs.length > 0 && reqs.length > _lastTradeReqCount){
        showToast('🤝 You have ' + reqs.length + ' trade request(s)! Check Trade → Inbox', true);
      }
      _lastTradeReqCount = reqs.length;
    } catch(e){}
  }, 10000);
  
  const logo = document.querySelector('.logo'); if(logo){ logo.addEventListener('click',()=>{ const catalog=document.getElementById('gameCatalog'); if(catalog) catalog.style.display='flex'; document.querySelectorAll('.game-panel').forEach(p=>p.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active')); }); }
});


window.addEventListener('beforeunload',()=>{ if(window._flushStatsNow) window._flushStatsNow(); firebaseSaveNow(); });
window.addEventListener('visibilitychange',()=>{ if(document.hidden) firebaseSave(); });


document.addEventListener('keydown',e=>{
  if(e.code==='Space'){
    
    const tag = (e.target.tagName||'').toUpperCase();
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target.isContentEditable) return;
    e.preventDefault();
    const panel=document.querySelector('.game-panel.active');
    if(!panel)return;
    if(panel.id==='slotsPanel')spinSlots();
    else if(panel.id==='crashPanel'){if(crashRunning)cashOut();else startCrash();}
    else if(panel.id==='roulettePanel')spinRoulette();
    else if(panel.id==='casesPanel')openCase();
    else if(panel.id==='plinkoPanel')dropPlinkoBall();
    else if(panel.id==='blackjackPanel'){if(bjActive)bjHit();else bjDeal();}
    else if(panel.id==='minesPanel'){if(minesActive)minesCashout();else minesStart();}
    else if(panel.id==='dicePanel')diceRoll();
    else if(panel.id==='towerPanel'){if(towerActive)towerCashout();else towerStart();}
    else if(panel.id==='coinflipPanel')coinFlip();
    else if(panel.id==='kenoPanel')kenoDraw();
    else if(panel.id==='limboPanel')limboGo();
    else if(panel.id==='pokerPanel')pokerDeal();
    else if(panel.id==='horsesPanel')horseRace();
    else if(panel.id==='wheelPanel')wheelSpin();
    else if(panel.id==='baccaratPanel')baccDeal();
    else if(panel.id==='hiloPanel'){if(hiloActive)hiloCashout();else hiloStart();}
  }
});


let bsrState = null;
let bsrDifficulty = 'normal'; 
const BSR_DIFF = {
  easy:   { rounds:2, hp:5, items:4, mult:2.5, dealerHpScale:1, label:'EASY',   icon:'😎' },
  normal: { rounds:3, hp:4, items:3, mult:4,   dealerHpScale:1, label:'NORMAL', icon:'💀' },
  hard:   { rounds:4, hp:3, items:2, mult:7,   dealerHpScale:1, label:'HARD',   icon:'☠️' },
};
const BSR_ITEM_ICONS = { handcuffs:'🔗', cigarettes:'🚬', gummy:'🍬', saw:'🪚', phone:'📱', magnifying:'🔍' };
const BSR_ITEM_NAMES = { handcuffs:'Handcuffs', cigarettes:'Cigarettes', gummy:'Rotten Gummy', saw:'Saw', phone:'Burner Phone', magnifying:'Magnifying Glass' };
const BSR_ITEM_DESCS = { handcuffs:'Dealer skips next turn', cigarettes:'Heal +1 HP', gummy:'40% +2HP / 60% −1HP', saw:'Next live = 2 dmg', phone:'Reveal random shell', magnifying:'See current shell' };
const BSR_ALL_ITEMS = ['handcuffs','cigarettes','gummy','saw','phone','magnifying'];


let bsrStats = JSON.parse(localStorage.getItem('bsr_stats')) || { wins:0, losses:0, biggestWin:0, streak:0, bestStreak:0 };
function bsrSaveStats(){ localStorage.setItem('bsr_stats', JSON.stringify(bsrStats)); }

function bsrSelectDiff(diff, el) {
  bsrDifficulty = diff;
  document.querySelectorAll('.bsr-diff-card').forEach(c => c.classList.remove('selected'));
  if(el) el.classList.add('selected');
  playClickSound();
}

function initBuckshotRoulette() {
  if (!bsrState || !bsrState.active) {
    document.getElementById('bsrLobby').style.display = 'block';
    document.getElementById('bsrGame').style.display = 'none';
    document.getElementById('bsrGameOver').style.display = 'none';
    document.getElementById('bsrRoundSplash').style.display = 'none';
    bsrUpdateStats();
  }
}

function bsrUpdateStats() {
  const total = bsrStats.wins + bsrStats.losses;
  const wr = total > 0 ? Math.round(bsrStats.wins / total * 100) + '%' : '--';
  const bw = bsrStats.biggestWin > 0 ? '$' + bsrStats.biggestWin.toLocaleString() : '--';
  const el1 = document.getElementById('bsrStatWinRate');
  const el2 = document.getElementById('bsrStatBigWin');
  const el3 = document.getElementById('bsrStatStreak');
  if(el1) el1.textContent = wr;
  if(el2) el2.textContent = bw;
  if(el3) el3.textContent = bsrStats.streak;
}


function bsrStartGame() {
  const bet = parseFloat(document.getElementById('bsrBet').value) || 100;
  if (bet <= 0) { showToast('Bet must be positive!', false); return; }
  if (bet > balance) { showToast('Not enough balance!', false); return; }
  balance -= bet; updateBalDisplay();
  playClickSound();

  const diff = BSR_DIFF[bsrDifficulty];
  bsrState = {
    active: true,
    bet: bet,
    diff: bsrDifficulty,
    mult: diff.mult,
    round: 1,
    maxRounds: diff.rounds,
    playerHP: diff.hp,
    playerMaxHP: diff.hp,
    dealerHP: diff.hp,
    dealerMaxHP: diff.hp,
    shells: [],
    shellIndex: 0,
    turn: 'player',
    sawActive: false,
    handcuffs: 0,       
    playerHandcuffed: 0,
    maxItems: diff.items,
    items: [],
    dealerItems: [],
    log: [],
    animating: false,
    _dealerKnowsCurrent: null,
    _revealedShells: {},  
  };

  document.getElementById('bsrLobby').style.display = 'none';
  document.getElementById('bsrGame').style.display = 'block';
  document.getElementById('bsrGameOver').style.display = 'none';
  document.getElementById('bsrLog').innerHTML = '';

  bsrShowRoundSplash(1, () => bsrNewRound());
}


function bsrShowRoundSplash(roundNum, callback) {
  const splash = document.getElementById('bsrRoundSplash');
  const txt = document.getElementById('bsrRoundSplashText');
  txt.textContent = 'ROUND ' + roundNum;
  splash.style.display = 'flex';
  splash.style.opacity = '0';
  requestAnimationFrame(() => {
    splash.style.transition = 'opacity 0.4s';
    splash.style.opacity = '1';
  });
  setTimeout(() => {
    splash.style.transition = 'opacity 0.5s';
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      if(callback) callback();
    }, 500);
  }, 1600);
}


function bsrNewRound() {
  const s = bsrState;
  if(!s) return;
  s.animating = false;
  s._dealerKnowsCurrent = null;
  s._revealedShells = {};

  
  const totalShells = Math.floor(Math.random() * 4) + 4; 
  let liveCount = Math.max(1, Math.floor(Math.random() * (totalShells - 1)) + 1);
  if(liveCount >= totalShells) liveCount = totalShells - 1; 
  const blankCount = totalShells - liveCount;
  s.shells = [];
  for(let i = 0; i < liveCount; i++) s.shells.push('live');
  for(let i = 0; i < blankCount; i++) s.shells.push('blank');
  
  for(let i = s.shells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s.shells[i], s.shells[j]] = [s.shells[j], s.shells[i]];
  }
  s.shellIndex = 0;
  s.sawActive = false;
  s.handcuffs = 0;
  s.playerHandcuffed = 0;

  
  s.items = [];
  s.dealerItems = [];
  for(let i = 0; i < s.maxItems; i++) {
    s.items.push(BSR_ALL_ITEMS[Math.floor(Math.random() * BSR_ALL_ITEMS.length)]);
    s.dealerItems.push(BSR_ALL_ITEMS[Math.floor(Math.random() * BSR_ALL_ITEMS.length)]);
  }

  
  s.turn = s.round % 2 === 1 ? 'player' : 'dealer';

  bsrLog(`⚡ ROUND ${s.round} — Shotgun loaded: ${liveCount} LIVE 🔴, ${blankCount} BLANK 🔵`);
  bsrLog(`${s.items.length} items each. ${s.turn === 'player' ? 'Your' : "Dealer's"} turn first.`);

  bsrRender();
  bsrSetStatus(s.turn === 'player' ? 'Your turn — choose wisely.' : "Dealer's turn...");

  if(s.turn === 'dealer') {
    bsrDisableActions();
    setTimeout(() => bsrDealerTurn(), 2000);
  }
}


function bsrLog(msg) {
  if(!bsrState) return;
  bsrState.log.push(msg);
  const el = document.getElementById('bsrLog');
  if(!el) return;
  el.innerHTML = bsrState.log.map(m => '<div class="bsr-log-line">' + m + '</div>').join('');
  el.scrollTop = el.scrollHeight;
}


function bsrRender() {
  const s = bsrState;
  if(!s) return;

  
  document.getElementById('bsrRoundInfo').textContent = `ROUND ${s.round}/${s.maxRounds}`;
  document.getElementById('bsrMultiplier').textContent = `${s.mult}× PAYOUT`;

  
  const remaining = s.shells.length - s.shellIndex;
  const livesLeft = s.shells.slice(s.shellIndex).filter(x => x === 'live').length;
  const blanksLeft = remaining - livesLeft;
  document.getElementById('bsrShellInfo').innerHTML = `<span style="color:#ff4444;">${livesLeft} live</span> / <span style="color:#4488ff;">${blanksLeft} blank</span>`;

  
  const rack = document.getElementById('bsrShellRack');
  rack.innerHTML = s.shells.map((sh, i) => {
    let cls = 'bsr-shell';
    if(i < s.shellIndex) cls += ' used' + (sh === 'live' ? ' was-live' : ' was-blank');
    else if(i === s.shellIndex) cls += ' current';
    else cls += ' unknown';
    
    if(i >= s.shellIndex && s._revealedShells[i]) {
      cls += s._revealedShells[i] === 'live' ? ' reveal-live' : ' reveal-blank';
    }
    const label = i < s.shellIndex ? '✓' : (s._revealedShells[i] && i > s.shellIndex ? (s._revealedShells[i] === 'live' ? '🔴' : '🔵') : '?');
    return `<div class="${cls}">${label}</div>`;
  }).join('');

  
  const pPct = Math.max(0, s.playerHP / s.playerMaxHP * 100);
  const dPct = Math.max(0, s.dealerHP / s.dealerMaxHP * 100);
  const pHP = Math.max(0, s.playerHP);
  const dHP = Math.max(0, s.dealerHP);
  document.getElementById('bsrPlayerHP').textContent = pHP + ' HP';
  document.getElementById('bsrPlayerHPBar').style.width = pPct + '%';
  document.getElementById('bsrPlayerHearts').textContent = '❤️'.repeat(pHP) + '🖤'.repeat(Math.max(0, s.playerMaxHP - pHP));
  document.getElementById('bsrDealerHP').textContent = dHP + ' HP';
  document.getElementById('bsrDealerHPBar').style.width = dPct + '%';
  document.getElementById('bsrDealerHearts').textContent = '❤️'.repeat(dHP) + '🖤'.repeat(Math.max(0, s.dealerMaxHP - dHP));

  
  const pBar = document.getElementById('bsrPlayerHPBar');
  pBar.style.background = pPct > 50 ? 'linear-gradient(90deg,var(--green),#66ff99)' : pPct > 25 ? 'linear-gradient(90deg,#ff8800,#ffbb00)' : 'linear-gradient(90deg,#ff4444,#ff6666)';
  const dBar = document.getElementById('bsrDealerHPBar');
  dBar.style.background = dPct > 50 ? 'linear-gradient(90deg,#ff4444,#ff8888)' : dPct > 25 ? 'linear-gradient(90deg,#ff8800,#ffbb00)' : 'linear-gradient(90deg,#ff4444,#880000)';

  
  const itemsEl = document.getElementById('bsrItems');
  const canUse = s.turn === 'player' && !s.animating;
  itemsEl.innerHTML = s.items.map((it, i) =>
    `<button class="bsr-item-btn${canUse ? '' : ' disabled'}" onclick="bsrUseItem(${i})" ${canUse ? '' : 'disabled'}>` +
    `<span class="item-icon">${BSR_ITEM_ICONS[it]}</span>` +
    `<span class="item-info"><span class="item-name">${BSR_ITEM_NAMES[it]}</span><span class="item-desc">${BSR_ITEM_DESCS[it]}</span></span>` +
    `</button>`
  ).join('');

  
  const dealerItemsEl = document.getElementById('bsrDealerItemsDisplay');
  dealerItemsEl.innerHTML = s.dealerItems.map(it =>
    `<span style="display:inline-block;padding:3px 7px;border-radius:6px;background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.15);font-size:11px;color:rgba(255,68,68,.6);">${BSR_ITEM_ICONS[it]}</span>`
  ).join(' ');

  
  const shotgunEl = document.getElementById('bsrShotgun');
  shotgunEl.textContent = s.sawActive ? '🪚🔫' : '🔫';
  if(s.sawActive) shotgunEl.style.filter = 'drop-shadow(0 0 8px rgba(255,136,0,.6))';
  else shotgunEl.style.filter = '';

  
  if(canUse) bsrEnableActions(); else bsrDisableActions();
}

function bsrEnableActions() {
  const d = document.getElementById('bsrShootDealer');
  const s = document.getElementById('bsrShootSelf');
  if(d){ d.disabled = false; d.style.opacity = '1'; d.style.pointerEvents = 'auto'; }
  if(s){ s.disabled = false; s.style.opacity = '1'; s.style.pointerEvents = 'auto'; }
}
function bsrDisableActions() {
  const d = document.getElementById('bsrShootDealer');
  const s = document.getElementById('bsrShootSelf');
  if(d){ d.disabled = true; d.style.opacity = '0.35'; d.style.pointerEvents = 'none'; }
  if(s){ s.disabled = true; s.style.opacity = '0.35'; s.style.pointerEvents = 'none'; }
}
function bsrSetStatus(msg) {
  const el = document.getElementById('bsrStatus');
  if(el) el.textContent = msg;
}


function bsrAnimateShotgun(direction, isLive) {
  
  const gun = document.getElementById('bsrShotgun');
  if(!gun) return;
  gun.classList.add('shake');
  setTimeout(() => {
    gun.classList.remove('shake');
    gun.classList.add(direction === 'left' ? 'recoil-left' : 'recoil-right');
    
    const shells = document.querySelectorAll('.bsr-shell.current');
    if(shells.length) {
      shells[0].classList.add(isLive ? 'reveal-live' : 'reveal-blank');
    }
    setTimeout(() => {
      gun.classList.remove('recoil-left', 'recoil-right');
    }, 400);
  }, 600);
}

function bsrAnimateHit(who) {
  
  const card = document.getElementById(who === 'player' ? 'bsrPlayerCard' : 'bsrDealerCard');
  if(!card) return;
  card.classList.add('hit');
  setTimeout(() => card.classList.remove('hit'), 500);
}


function bsrUseItem(index) {
  const s = bsrState;
  if(!s || !s.active || s.turn !== 'player' || s.animating) return;
  if(index < 0 || index >= s.items.length) return;

  const item = s.items[index];
  s.items.splice(index, 1);
  playClickSound();

  switch(item) {
    case 'handcuffs':
      s.handcuffs = Math.max(s.handcuffs, 1); 
      bsrLog('🔗 You used Handcuffs! Dealer skips their next turn.');
      bsrSetStatus('Dealer is handcuffed!');
      break;
    case 'cigarettes':
      if(s.playerHP < s.playerMaxHP) {
        s.playerHP = Math.min(s.playerHP + 1, s.playerMaxHP);
        bsrLog('🚬 You smoked a Cigarette. +1 HP! (' + s.playerHP + '/' + s.playerMaxHP + ')');
        bsrSetStatus('+1 HP! Health: ' + s.playerHP + '/' + s.playerMaxHP);
      } else {
        bsrLog('🚬 Cigarette used but HP already full.');
        bsrSetStatus('Already at max HP!');
      }
      break;
    case 'gummy':
      if(Math.random() < 0.4) {
        const heal = Math.min(2, s.playerMaxHP + 1 - s.playerHP); 
        s.playerHP += heal;
        bsrLog('🍬 Rotten Gummy worked! +' + heal + ' HP! (' + s.playerHP + ')');
        bsrSetStatus('Lucky! +' + heal + ' HP!');
      } else {
        s.playerHP -= 1;
        bsrLog('🍬 Rotten Gummy backfired! −1 HP (' + s.playerHP + ')');
        bsrSetStatus('Food poisoning! −1 HP');
        if(s.playerHP <= 0) {
          bsrRender();
          bsrAnimateHit('player');
          setTimeout(() => bsrEndGame(false), 1200);
          return;
        }
      }
      break;
    case 'saw':
      s.sawActive = true;
      bsrLog('🪚 Saw attached! Next LIVE shell deals double damage.');
      bsrSetStatus('Saw equipped — next live = 2 damage!');
      break;
    case 'phone': {
      const rem = s.shells.slice(s.shellIndex);
      if(rem.length > 1) {
        
        const futureIdx = Math.floor(Math.random() * (rem.length - 1)) + 1;
        const absIdx = s.shellIndex + futureIdx;
        const shellType = rem[futureIdx];
        s._revealedShells[absIdx] = shellType;
        bsrLog('📱 Phone call: "Shell #' + (absIdx + 1) + ' is ' + shellType.toUpperCase() + '"');
        bsrSetStatus('Shell #' + (absIdx+1) + ' is ' + shellType.toUpperCase() + (shellType === 'live' ? ' 🔴' : ' 🔵'));
      } else {
        bsrLog('📱 No future shells to reveal.');
        bsrSetStatus('No more shells ahead.');
      }
      break;
    }
    case 'magnifying': {
      const cur = s.shells[s.shellIndex];
      bsrLog('🔍 Current shell: ' + cur.toUpperCase() + (cur === 'live' ? ' 🔴' : ' 🔵'));
      bsrSetStatus('Current shell: ' + cur.toUpperCase() + (cur === 'live' ? ' 🔴' : ' 🔵'));
      break;
    }
  }
  bsrRender();
}


function bsrShoot(target) {
  const s = bsrState;
  if(!s || !s.active || s.animating || s.turn !== 'player') return;
  s.animating = true;
  bsrDisableActions();

  const shell = s.shells[s.shellIndex];
  s.shellIndex++;
  const damage = shell === 'live' ? (s.sawActive ? 2 : 1) : 0;
  if(shell === 'live') s.sawActive = false; 

  
  bsrAnimateShotgun(target === 'dealer' ? 'left' : 'right', shell === 'live');
  bsrSetStatus('💥 ...');

  
  if(shell === 'live') {
    playSound(120, 'sawtooth', 0.35, 0.2);
    setTimeout(() => playSound(80, 'square', 0.2, 0.1), 100);
  } else {
    playSound(600, 'sine', 0.08, 0.06);
  }

  
  setTimeout(() => {
    if(target === 'dealer') {
      if(shell === 'live') {
        s.dealerHP -= damage;
        bsrAnimateHit('dealer');
        bsrLog(`🔫 You shot the Dealer — LIVE! ${damage > 1 ? '🪚 SAW: 2 dmg! ' : ''}Dealer: ${Math.max(0,s.dealerHP)} HP`);
        bsrSetStatus(`💥 LIVE! Dealer takes ${damage} damage!`);
      } else {
        bsrLog('🔫 You shot the Dealer — BLANK. No damage.');
        bsrSetStatus('*click* — BLANK. No damage.');
      }
      s.turn = 'dealer'; 
    } else {
      if(shell === 'live') {
        s.playerHP -= damage;
        bsrAnimateHit('player');
        bsrLog(`🫵 You shot yourself — LIVE! ${damage > 1 ? '🪚 SAW: 2 dmg! ' : ''}You: ${Math.max(0,s.playerHP)} HP`);
        bsrSetStatus(`💥 LIVE! You take ${damage} damage!`);
        s.turn = 'dealer';
      } else {
        bsrLog('🫵 You shot yourself — BLANK! Free extra turn!');
        bsrSetStatus('*click* — BLANK! You get another turn!');
        s.turn = 'player'; 
      }
    }

    s.animating = false;
    bsrRender();

    
    if(s.dealerHP <= 0) {
      setTimeout(() => bsrRoundWin(), 1200);
      return;
    }
    if(s.playerHP <= 0) {
      setTimeout(() => bsrEndGame(false), 1200);
      return;
    }
    if(s.shellIndex >= s.shells.length) {
      bsrLog('📦 All shells spent! Reloading...');
      setTimeout(() => {
        bsrShowRoundSplash(s.round, () => bsrNewRound());
      }, 1500);
      return;
    }

    
    
    if(target === 'self' && shell === 'blank') {
      bsrRender(); 
    } else {
      bsrResolveTurn();
    }
  }, 1100);
}


function bsrResolveTurn() {
  const s = bsrState;
  if(!s || !s.active) return;

  if(s.turn === 'dealer') {
    if(s.handcuffs > 0) {
      s.handcuffs--;
      bsrLog('🔗 Dealer is handcuffed! Skipping turn.');
      bsrSetStatus('Dealer is chained! Skipping...');
      s.turn = 'player';
      setTimeout(() => {
        
        if(s.playerHandcuffed > 0) {
          s.playerHandcuffed--;
          bsrLog('🔗 You are also handcuffed! Skipping turn.');
          bsrSetStatus('You are chained too! Skipping...');
          s.turn = 'dealer';
          bsrRender();
          setTimeout(() => bsrDealerTurn(), 1800);
        } else {
          bsrRender();
        }
      }, 1000);
    } else {
      setTimeout(() => bsrDealerTurn(), 1800);
    }
  } else { 
    if(s.playerHandcuffed > 0) {
      s.playerHandcuffed--;
      bsrLog('🔗 You are handcuffed! Skipping turn.');
      bsrSetStatus('You are chained! Skipping...');
      s.turn = 'dealer';
      bsrRender();
      setTimeout(() => {
        if(s.handcuffs > 0) {
          s.handcuffs--;
          bsrLog('🔗 Dealer also handcuffed! Skipping turn.');
          s.turn = 'player';
          bsrRender();
        } else {
          bsrDealerTurn();
        }
      }, 1800);
    } else {
      bsrRender(); 
    }
  }
}


function bsrDealerTurn() {
  const s = bsrState;
  if(!s || !s.active) return;
  
  if(s.shellIndex >= s.shells.length) {
    bsrLog('📦 All shells spent! Reloading...');
    setTimeout(() => bsrShowRoundSplash(s.round, () => bsrNewRound()), 1000);
    return;
  }

  bsrSetStatus("🤖 Dealer is thinking...");
  s.animating = true;
  bsrDisableActions();
  bsrRender();

  
  setTimeout(() => bsrDealerItemLoop(() => bsrDealerShoot()), 1200);
}

function bsrDealerItemLoop(callback) {
  const s = bsrState;
  if(!s || !s.active || !s.dealerItems.length) { callback(); return; }

  
  let used = false;

  
  const mgIdx = s.dealerItems.indexOf('magnifying');
  if(mgIdx !== -1) {
    s.dealerItems.splice(mgIdx, 1);
    s._dealerKnowsCurrent = s.shells[s.shellIndex];
    bsrLog('🤖🔍 Dealer peers through a magnifying glass...');
    bsrRender();
    used = true;
    setTimeout(() => bsrDealerItemLoop(callback), 1100);
    return;
  }

  
  const sawIdx = s.dealerItems.indexOf('saw');
  if(sawIdx !== -1 && s._dealerKnowsCurrent === 'live') {
    s.dealerItems.splice(sawIdx, 1);
    s.sawActive = true;
    bsrLog('🤖🪚 Dealer saws the barrel! Next live = 2 damage.');
    bsrRender();
    used = true;
    setTimeout(() => bsrDealerItemLoop(callback), 1100);
    return;
  }

  
  const cigIdx = s.dealerItems.indexOf('cigarettes');
  if(cigIdx !== -1 && s.dealerHP < s.dealerMaxHP) {
    s.dealerItems.splice(cigIdx, 1);
    s.dealerHP = Math.min(s.dealerHP + 1, s.dealerMaxHP);
    bsrLog('🤖🚬 Dealer lights a cigarette. +1 HP (' + s.dealerHP + '/' + s.dealerMaxHP + ')');
    bsrRender();
    used = true;
    setTimeout(() => bsrDealerItemLoop(callback), 1100);
    return;
  }

  
  const hcIdx = s.dealerItems.indexOf('handcuffs');
  if(hcIdx !== -1 && s.playerHandcuffed <= 0 && Math.random() < 0.5) {
    s.dealerItems.splice(hcIdx, 1);
    s.playerHandcuffed = 1;
    bsrLog('🤖🔗 Dealer slaps handcuffs on you! Skip next turn.');
    bsrSetStatus('You are handcuffed!');
    bsrRender();
    used = true;
    setTimeout(() => bsrDealerItemLoop(callback), 1100);
    return;
  }

  
  const phoneIdx = s.dealerItems.indexOf('phone');
  if(phoneIdx !== -1 && Math.random() < 0.4) {
    s.dealerItems.splice(phoneIdx, 1);
    bsrLog('🤖📱 Dealer makes a phone call... (intel hidden)');
    
    const rem = s.shells.slice(s.shellIndex);
    if(rem.length > 1) {
      const fi = Math.floor(Math.random() * (rem.length - 1)) + 1;
      
    }
    bsrRender();
    used = true;
    setTimeout(() => bsrDealerItemLoop(callback), 1100);
    return;
  }

  
  const gummyIdx = s.dealerItems.indexOf('gummy');
  if(gummyIdx !== -1 && s.dealerHP < s.dealerMaxHP && Math.random() < 0.3) {
    s.dealerItems.splice(gummyIdx, 1);
    if(Math.random() < 0.4) {
      const heal = Math.min(2, s.dealerMaxHP + 1 - s.dealerHP);
      s.dealerHP += heal;
      bsrLog('🤖🍬 Dealer ate Rotten Gummy... +' + heal + ' HP!');
    } else {
      s.dealerHP -= 1;
      bsrLog('🤖🍬 Dealer ate Rotten Gummy... −1 HP (' + s.dealerHP + ')');
      if(s.dealerHP <= 0) {
        bsrRender();
        setTimeout(() => bsrRoundWin(), 1200);
        return;
      }
    }
    bsrRender();
    used = true;
    setTimeout(() => bsrDealerItemLoop(callback), 1100);
    return;
  }

  
  callback();
}

function bsrDealerShoot() {
  const s = bsrState;
  if(!s || !s.active) return;
  
  if(s.shellIndex >= s.shells.length) {
    bsrLog('📦 All shells spent! Reloading...');
    s.animating = false;
    setTimeout(() => bsrShowRoundSplash(s.round, () => bsrNewRound()), 1000);
    return;
  }

  const shell = s.shells[s.shellIndex];
  s.shellIndex++;
  s.animating = true;

  
  let target = 'player';
  if(s._dealerKnowsCurrent === 'blank') {
    target = 'self';
  } else if(s._dealerKnowsCurrent === 'live') {
    target = 'player';
  } else {
    
    const allRemaining = s.shells.slice(s.shellIndex - 1); 
    const liveR = allRemaining.filter(x => x === 'live').length / allRemaining.length;
    target = liveR < 0.4 ? 'self' : 'player';
  }
  s._dealerKnowsCurrent = null;

  const damage = shell === 'live' ? (s.sawActive ? 2 : 1) : 0;
  if(shell === 'live') s.sawActive = false; 

  bsrSetStatus('🤖 Dealer aims at ' + (target === 'player' ? 'YOU' : 'ITSELF') + '...');

  
  setTimeout(() => {
    
    bsrAnimateShotgun(target === 'player' ? 'left' : 'right', shell === 'live');
    if(shell === 'live') {
      playSound(120, 'sawtooth', 0.35, 0.18);
      setTimeout(() => playSound(80, 'square', 0.2, 0.08), 100);
    } else {
      playSound(600, 'sine', 0.08, 0.05);
    }

    setTimeout(() => {
      if(target === 'player') {
        if(shell === 'live') {
          s.playerHP -= damage;
          bsrAnimateHit('player');
          bsrLog(`🤖🔫 Dealer shot you — LIVE! ${damage > 1 ? '🪚 2 dmg! ' : ''}You: ${Math.max(0,s.playerHP)} HP`);
          bsrSetStatus(`💥 Dealer hits you for ${damage}!`);
        } else {
          bsrLog('🤖🔫 Dealer shot you — BLANK. No damage.');
          bsrSetStatus('*click* — Dealer missed. BLANK!');
        }
        s.turn = 'player';
      } else {
        if(shell === 'live') {
          s.dealerHP -= damage;
          bsrAnimateHit('dealer');
          bsrLog(`🤖🫵 Dealer shot itself — LIVE! ${damage > 1 ? '🪚 2 dmg! ' : ''}Dealer: ${Math.max(0,s.dealerHP)} HP`);
          bsrSetStatus('Dealer shot itself! LIVE!');
          s.turn = 'player';
        } else {
          bsrLog('🤖🫵 Dealer shot itself — BLANK! Extra turn.');
          bsrSetStatus('*click* — Dealer gets another turn.');
          s.turn = 'dealer';
        }
      }

      s.animating = false;
      bsrRender();

      if(s.playerHP <= 0) { setTimeout(() => bsrEndGame(false), 1200); return; }
      if(s.dealerHP <= 0) { setTimeout(() => bsrRoundWin(), 1200); return; }
      if(s.shellIndex >= s.shells.length) {
        bsrLog('📦 All shells spent! Reloading...');
        setTimeout(() => bsrShowRoundSplash(s.round, () => bsrNewRound()), 1500);
        return;
      }

      bsrResolveTurn();
    }, 1100);
  }, 800);
}


function bsrRoundWin() {
  const s = bsrState;
  if(!s || !s.active) return; 
  if(s.round >= s.maxRounds) {
    bsrEndGame(true);
    return;
  }
  bsrLog(`✅ ROUND ${s.round} WON! The Dealer is down.`);
  s.round++;
  
  const diff = BSR_DIFF[s.diff];
  s.dealerHP = diff.hp + (s.round - 1);
  s.dealerMaxHP = diff.hp + (s.round - 1);
  
  s.playerHP = Math.min(s.playerHP + 2, s.playerMaxHP);

  bsrSetStatus('Round won! Advancing...');
  bsrRender();

  setTimeout(() => {
    bsrShowRoundSplash(s.round, () => bsrNewRound());
  }, 1200);
}


function bsrEndGame(won) {
  const s = bsrState;
  if(!s || !s.active) return; 
  s.active = false;

  const overlay = document.getElementById('bsrGameOver');
  overlay.style.display = 'flex';

  if(won) {
    const winnings = Math.floor(s.bet * s.mult);
    balance += winnings;
    updateBalDisplay();
    recordGame('rusroulette', s.bet, winnings);

    
    bsrStats.wins++;
    bsrStats.streak++;
    if(bsrStats.streak > bsrStats.bestStreak) bsrStats.bestStreak = bsrStats.streak;
    if(winnings > bsrStats.biggestWin) bsrStats.biggestWin = winnings;
    bsrSaveStats();

    document.getElementById('bsrGameOverContent').innerHTML = `
      <div style="font-size:72px;margin-bottom:16px;">🏆</div>
      <div style="font-family:'Orbitron';font-size:30px;color:var(--green);font-weight:900;margin-bottom:8px;">YOU WIN!</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:4px;">Survived all ${s.maxRounds} rounds on ${BSR_DIFF[s.diff].label}</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:16px;">${s.mult}× multiplier</div>
      <div style="font-size:28px;color:var(--gold);font-weight:900;margin-bottom:6px;">+$${winnings.toLocaleString()}</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:20px;">Streak: ${bsrStats.streak} 🔥</div>
      <button onclick="bsrCloseGameOver()" class="action-btn primary" style="padding:14px 32px;font-size:15px;font-family:'Orbitron';">PLAY AGAIN</button>
    `;
  } else {
    recordGame('rusroulette', s.bet, 0);
    bsrStats.losses++;
    bsrStats.streak = 0;
    bsrSaveStats();

    document.getElementById('bsrGameOverContent').innerHTML = `
      <div style="font-size:72px;margin-bottom:16px;">💀</div>
      <div style="font-family:'Orbitron';font-size:30px;color:var(--red);font-weight:900;margin-bottom:8px;">YOU DIED</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:4px;">Eliminated in Round ${s.round}/${s.maxRounds} on ${BSR_DIFF[s.diff].label}</div>
      <div style="font-size:28px;color:var(--red);font-weight:900;margin-bottom:20px;">-$${s.bet.toLocaleString()}</div>
      <button onclick="bsrCloseGameOver()" class="action-btn primary" style="padding:14px 32px;font-size:15px;font-family:'Orbitron';">TRY AGAIN</button>
    `;
  }
}

function bsrCloseGameOver() {
  document.getElementById('bsrGameOver').style.display = 'none';
  bsrState = null;
  document.getElementById('bsrLobby').style.display = 'block';
  document.getElementById('bsrGame').style.display = 'none';
  document.getElementById('bsrRoundSplash').style.display = 'none';
  bsrUpdateStats();
}


let rrState = null;
const RR_DIFF = {
  easy:   { rounds: 3, mult: 2, label: 'EASY',   icon: '😎' },
  normal: { rounds: 5, mult: 4, label: 'NORMAL', icon: '💀' },
  hard:   { rounds: 8, mult: 8, label: 'HARD',   icon: '☠️' }
};
let rrDiff = 'easy';
let rrMode = 'bot';

function rrSwitchMode(mode, tab) {
  rrMode = mode;
  document.querySelectorAll('#russianrPanel .inv-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById('rrBotLobby').style.display = mode === 'bot' ? 'block' : 'none';
  document.getElementById('rrPvpLobby').style.display = mode === 'pvp' ? 'block' : 'none';
  document.getElementById('rrGameArea').style.display = 'none';
  document.getElementById('rrGameOver').style.display = 'none';
}

function rrSelectDiff(d, el) {
  rrDiff = d;
  document.querySelectorAll('#rrBotLobby .bsr-diff-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function initRussianRoulette() {
  document.getElementById('rrBotLobby').style.display = rrMode === 'bot' ? 'block' : 'none';
  document.getElementById('rrPvpLobby').style.display = rrMode === 'pvp' ? 'block' : 'none';
  document.getElementById('rrGameArea').style.display = 'none';
  document.getElementById('rrGameOver').style.display = 'none';
  rrUpdateStats();
}

function rrUpdateStats() {
  
}

function rrLog(msg, color) {
  const log = document.getElementById('rrLog');
  const d = document.createElement('div');
  d.style.cssText = 'padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;';
  if (color) d.style.color = color;
  d.textContent = msg;
  log.prepend(d);
}


function rrNewCylinder() {
  
  const chambers = [0, 0, 0, 0, 0, 0];
  chambers[Math.floor(Math.random() * 6)] = 1;
  return { chambers, pos: 0, remaining: 6 };
}

function rrPullChamber(cyl) {
  const hit = cyl.chambers[cyl.pos] === 1;
  cyl.pos = (cyl.pos + 1) % 6;
  cyl.remaining--;
  return hit;
}

function rrSpinCylinderMech(cyl) {
  
  cyl.chambers = [0, 0, 0, 0, 0, 0];
  cyl.chambers[Math.floor(Math.random() * 6)] = 1;
  cyl.pos = 0;
  cyl.remaining = 6;
}


function rrBotDecision(cyl, roundNum, totalRounds) {
  
  const hitChance = 1 / Math.max(1, cyl.remaining);
  
  
  let spinThreshold;
  if (rrDiff === 'easy') spinThreshold = 0.65;
  else if (rrDiff === 'normal') spinThreshold = 0.45;
  else spinThreshold = 0.35;
  
  
  if (hitChance >= spinThreshold && Math.random() < 0.6) return 'spin';
  return 'pull';
}


function rrStartBot() {
  const betEl = document.getElementById('rrBet');
  const bet = parseInt(betEl.value);
  if (!bet || bet < 10) return showToast('Min bet is $10', false);
  if (!checkMaxBet(bet, 'russianr')) return;

  const diff = RR_DIFF[rrDiff];
  rrState = {
    mode: 'bot',
    bet,
    diff: rrDiff,
    totalRounds: diff.rounds,
    currentRound: 1,
    mult: diff.mult,
    cylinder: rrNewCylinder(),
    playerTurn: Math.random() < 0.5,
    playerAlive: true,
    dealerAlive: true,
    roundKills: 0,      
    gameOver: false,
    paused: false
  };

  balance -= bet;
  updateBalDisplay();

  document.getElementById('rrBotLobby').style.display = 'none';
  document.getElementById('rrPvpLobby').style.display = 'none';
  document.getElementById('rrGameArea').style.display = 'block';
  document.getElementById('rrGameOver').style.display = 'none';
  document.getElementById('rrLog').innerHTML = '';
  document.getElementById('rrOpponentLabel').textContent = '🤖 DEALER';

  rrUpdateUI();
  rrLog(`Game started — ${diff.label} difficulty (${diff.rounds} rounds, ${diff.mult}× payout)`, 'var(--gold)');
  rrLog(`Round 1 — New cylinder loaded!`, 'var(--neon)');
  rrAnimateNewRound();

  if (!rrState.playerTurn) {
    rrLog('Dealer goes first...', 'var(--text2)');
    rrDisableActions();
    setTimeout(() => rrBotTurn(), 1500);
  } else {
    rrLog('You go first!', 'var(--green)');
    rrEnableActions();
  }
}

function rrUpdateUI() {
  if (!rrState) return;
  const s = rrState;
  document.getElementById('rrRoundInfo').textContent = `ROUND ${s.currentRound} / ${s.totalRounds}`;
  document.getElementById('rrMultInfo').textContent = `🏆 ${s.mult}× ($${Math.floor(s.bet * s.mult).toLocaleString()})`;
  
  
  const chamberDots = [];
  for (let i = 0; i < 6; i++) {
    if (i < s.cylinder.pos) chamberDots.push('⚫'); 
    else chamberDots.push('🔴'); 
  }
  document.getElementById('rrChamberInfo').textContent = chamberDots.join(' ') + ` (${s.cylinder.remaining} left)`;
  
  
  document.getElementById('rrPlayerStatus').textContent = s.playerAlive ? (s.playerTurn ? '😰' : '😐') : '💀';
  document.getElementById('rrPlayerAlive').textContent = s.playerAlive ? 'ALIVE' : 'DEAD';
  document.getElementById('rrPlayerAlive').style.color = s.playerAlive ? 'var(--green)' : 'var(--red)';
  document.getElementById('rrPlayerCard').style.borderColor = s.playerTurn && !s.gameOver ? 'var(--neon)' : 'var(--border)';
  document.getElementById('rrPlayerCard').style.boxShadow = s.playerTurn && !s.gameOver ? '0 0 20px rgba(0,240,255,.2)' : 'none';
  
  
  document.getElementById('rrDealerStatus').textContent = s.dealerAlive ? (!s.playerTurn ? '😈' : '😐') : '💀';
  document.getElementById('rrDealerAlive').textContent = s.dealerAlive ? 'ALIVE' : 'DEAD';
  document.getElementById('rrDealerAlive').style.color = s.dealerAlive ? 'var(--green)' : 'var(--red)';
  document.getElementById('rrDealerCard').style.borderColor = !s.playerTurn && !s.gameOver ? 'rgba(255,68,68,.5)' : 'var(--border)';
  document.getElementById('rrDealerCard').style.boxShadow = !s.playerTurn && !s.gameOver ? '0 0 20px rgba(255,68,68,.2)' : 'none';
}

function rrEnableActions() {
  document.getElementById('rrPullBtn').disabled = false;
  document.getElementById('rrSpinBtn').disabled = false;
  document.getElementById('rrPullBtn').style.opacity = '1';
  document.getElementById('rrSpinBtn').style.opacity = '1';
}

function rrDisableActions() {
  document.getElementById('rrPullBtn').disabled = true;
  document.getElementById('rrSpinBtn').disabled = true;
  document.getElementById('rrPullBtn').style.opacity = '0.4';
  document.getElementById('rrSpinBtn').style.opacity = '0.4';
}

function rrAnimateNewRound() {
  const rev = document.getElementById('rrRevolver');
  rev.style.transform = 'rotate(0deg)';
  setTimeout(() => { rev.style.transform = 'rotate(720deg)'; }, 50);
  setTimeout(() => { rev.style.transform = 'rotate(0deg)'; }, 600);
}

function rrAnimateShot(hit) {
  const rev = document.getElementById('rrRevolver');
  if (hit) {
    rev.style.transform = 'scale(1.3) rotate(-10deg)';
    setTimeout(() => { rev.style.transform = 'scale(1) rotate(0deg)'; }, 400);
  } else {
    rev.style.transform = 'rotate(15deg)';
    setTimeout(() => { rev.style.transform = 'rotate(0deg)'; }, 300);
  }
}

function rrShakeScreen() {
  const area = document.getElementById('rrGameArea');
  area.style.animation = 'none';
  area.offsetHeight;
  area.style.animation = 'bsr-shake .5s ease-out';
}


function rrPullTrigger() {
  if (!rrState || rrState.gameOver || !rrState.playerTurn || rrState.paused) return;
  rrDisableActions();
  rrState.paused = true;
  
  playSound(200, 'triangle', 0.1, 0.3);
  
  setTimeout(() => {
    const hit = rrPullChamber(rrState.cylinder);
    rrAnimateShot(hit);
    
    if (hit) {
      
      playSound(80, 'sawtooth', 0.4, 0.7);
      rrShakeScreen();
      rrState.playerAlive = false;
      rrState.playerTurn = false;
      rrLog('💥 BANG! The bullet fires — YOU\'RE HIT!', '#ff4444');
      rrUpdateUI();
      setTimeout(() => rrEndRound('dealer'), 1200);
    } else {
      
      playSound(600, 'sine', 0.08, 0.4);
      rrLog('🔘 *click* — Empty chamber. You survive!', 'var(--green)');
      rrState.playerTurn = false;
      rrUpdateUI();
      rrState.paused = false;
      
      setTimeout(() => rrBotTurn(), 1200);
    }
  }, 800);
}

function rrSpinCylinder() {
  if (!rrState || rrState.gameOver || !rrState.playerTurn || rrState.paused) return;
  rrDisableActions();
  rrState.paused = true;
  
  playSound(400, 'sine', 0.3, 0.3);
  rrAnimateNewRound();
  
  setTimeout(() => {
    rrSpinCylinderMech(rrState.cylinder);
    rrLog('🔄 You spin the cylinder — reset to 6 chambers!', 'var(--neon)');
    rrUpdateUI();
    rrState.playerTurn = false;
    rrState.paused = false;
    
    setTimeout(() => rrBotTurn(), 1200);
  }, 800);
}


function rrBotTurn() {
  if (!rrState || rrState.gameOver) return;
  rrDisableActions();
  rrState.paused = true;
  
  const decision = rrBotDecision(rrState.cylinder, rrState.currentRound, rrState.totalRounds);
  
  if (decision === 'spin') {
    rrLog('🤖 Dealer spins the cylinder...', 'var(--text2)');
    playSound(400, 'sine', 0.3, 0.3);
    rrAnimateNewRound();
    setTimeout(() => {
      rrSpinCylinderMech(rrState.cylinder);
      rrLog('🔄 Cylinder reset to 6 chambers!', 'var(--text2)');
      rrUpdateUI();
      rrState.playerTurn = true;
      rrState.paused = false;
      rrUpdateUI();
      rrEnableActions();
      rrLog('Your turn — pull the trigger or spin!', 'var(--gold)');
    }, 1000);
  } else {
    rrLog('🤖 Dealer grabs the gun... pulls the trigger...', 'var(--text2)');
    
    setTimeout(() => {
      const hit = rrPullChamber(rrState.cylinder);
      rrAnimateShot(hit);
      
      if (hit) {
        playSound(80, 'sawtooth', 0.4, 0.7);
        rrShakeScreen();
        rrState.dealerAlive = false;
        rrLog('💥 BANG! The dealer takes the bullet! 💀', '#ff4444');
        rrUpdateUI();
        setTimeout(() => rrEndRound('player'), 1200);
      } else {
        playSound(600, 'sine', 0.08, 0.4);
        rrLog('🔘 *click* — Dealer survives...', 'var(--text2)');
        rrState.playerTurn = true;
        rrUpdateUI();
        rrState.paused = false;
        rrEnableActions();
        rrLog('Your turn — pull the trigger or spin!', 'var(--gold)');
      }
    }, 1200);
  }
}


function rrEndRound(winner) {
  if (!rrState) return;
  const s = rrState;
  
  rrLog(`— Round ${s.currentRound} winner: ${winner === 'player' ? 'YOU' : 'DEALER'} —`, winner === 'player' ? 'var(--green)' : 'var(--red)');
  
  if (s.currentRound >= s.totalRounds) {
    rrEndGame(winner);
    return;
  }
  
  
  if (!s.playerAlive) {
    rrEndGame('dealer');
    return;
  }
  
  
  if (!s.dealerAlive) {
    
    s.currentRound++;
    s.dealerAlive = true;
    s.playerAlive = true;
    s.cylinder = rrNewCylinder();
    s.playerTurn = Math.random() < 0.5;
    
    rrLog(`Round ${s.currentRound} — New cylinder loaded!`, 'var(--neon)');
    rrAnimateNewRound();
    rrUpdateUI();
    
    setTimeout(() => {
      rrState.paused = false;
      if (s.playerTurn) {
        rrLog('You go first!', 'var(--green)');
        rrEnableActions();
      } else {
        rrLog('Dealer goes first...', 'var(--text2)');
        rrBotTurn();
      }
    }, 1000);
    return;
  }
  
  
  rrEndGame('dealer');
}

function rrEndGame(winner) {
  if (!rrState) return;
  rrState.gameOver = true;
  rrDisableActions();
  
  const s = rrState;
  const diff = RR_DIFF[s.diff];
  const won = winner === 'player';
  const winAmount = won ? Math.floor(s.bet * s.mult) : 0;
  
  if (won) {
    balance += winAmount;
    updateBalDisplay();
    if (winAmount > gameStats.russianr.biggestWin) gameStats.russianr.biggestWin = winAmount;
    gameStats.russianr.won++;
  }
  gameStats.russianr.played++;
  recordGame('russianr', s.bet, winAmount);
  
  setTimeout(() => {
    const box = document.getElementById('rrGameOverContent');
    if (won) {
      playWinSound();
      box.innerHTML = `
        <div style="font-size:60px;margin-bottom:12px;">🏆</div>
        <div style="font-family:'Orbitron';font-size:22px;color:var(--green);margin-bottom:8px;">YOU SURVIVED!</div>
        <div style="font-size:14px;color:var(--text2);margin-bottom:8px;">The dealer takes the bullet. You walk away alive.</div>
        <div style="font-family:'Orbitron';font-size:28px;color:var(--gold);margin-bottom:6px;">+$${winAmount.toLocaleString()}</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:16px;">${diff.label} ${diff.icon} • ${diff.mult}× Multiplier</div>
        <button onclick="rrCloseGameOver()" class="action-btn primary" style="padding:14px 32px;font-size:15px;font-family:'Orbitron';">PLAY AGAIN</button>`;
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 40);
      if (winAmount >= s.bet * 4) showBigWin(winAmount);
    } else {
      playLoseSound();
      box.innerHTML = `
        <div style="font-size:60px;margin-bottom:12px;">💀</div>
        <div style="font-family:'Orbitron';font-size:22px;color:var(--red);margin-bottom:8px;">YOU'RE DEAD</div>
        <div style="font-size:14px;color:var(--text2);margin-bottom:8px;">The bullet found you. Better luck next life.</div>
        <div style="font-family:'Orbitron';font-size:28px;color:var(--red);margin-bottom:6px;">-$${s.bet.toLocaleString()}</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:16px;">${diff.label} ${diff.icon} • Round ${s.currentRound}/${s.totalRounds}</div>
        <button onclick="rrCloseGameOver()" class="action-btn primary" style="padding:14px 32px;font-size:15px;font-family:'Orbitron';">TRY AGAIN</button>`;
    }
    document.getElementById('rrGameOver').style.display = 'flex';
  }, 800);
}

function rrCloseGameOver() {
  document.getElementById('rrGameOver').style.display = 'none';
  rrState = null;
  document.getElementById('rrBotLobby').style.display = rrMode === 'bot' ? 'block' : 'none';
  document.getElementById('rrPvpLobby').style.display = rrMode === 'pvp' ? 'block' : 'none';
  document.getElementById('rrGameArea').style.display = 'none';
}


let rrPvpListener = null;
let rrPvpUnsubscribe = null;

async function rrStartPvP() {
  const bet = parseInt(document.getElementById('rrPvpBet').value);
  if (!bet || bet < 10) return showToast('Min bet is $10', false);
  if (!checkMaxBet(bet, 'russianr')) return;
  
  const opName = document.getElementById('rrPvpOpponent').value.trim().toLowerCase();
  if (!opName) return showToast('Enter opponent username', false);
  if (opName === (window._currentUsername || '').toLowerCase()) return showToast('Cannot challenge yourself', false);
  
  const statusEl = document.getElementById('rrPvpStatus');
  statusEl.textContent = 'Sending challenge...';
  
  try {
    const nameSnap = await window._fbGet('casino/usernames/' + opName);
    if (!nameSnap.exists()) { statusEl.textContent = 'Player not found!'; return; }
    const opUid = nameSnap.val();
    if (opUid === window._currentPlayerId) { statusEl.textContent = 'Cannot challenge yourself'; return; }
    
    const gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const gameData = {
      host: window._currentPlayerId,
      hostName: window._currentUsername,
      guest: opUid,
      guestName: opName,
      bet: bet,
      status: 'pending',
      cylinder: null,
      currentTurn: null,
      round: 1,
      totalRounds: 5,
      hostAlive: true,
      guestAlive: true,
      created: Date.now()
    };
    
    await window._fbSet('casino/rrGames/' + gameId, gameData);
    
    balance -= bet;
    updateBalDisplay();
    
    const notifKey = Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
    await window._fbSet('casino/players/' + opUid + '/notifications/' + notifKey, {
      type: 'rr_challenge',
      from: window._currentUsername,
      fromUid: window._currentPlayerId,
      gameId: gameId,
      bet: bet,
      time: Date.now()
    });
    
    statusEl.innerHTML = `Challenge sent to <b>${opName}</b>! Waiting...<br><button class="action-btn" onclick="rrCancelPvP('${gameId}',${bet})" style="margin-top:8px;padding:6px 16px;font-size:11px;">Cancel</button>`;
    
    rrPvpUnsubscribe = window._fbOnValue('casino/rrGames/' + gameId, snap => {
      const g = snap.val();
      if (!g) return;
      if (g.status === 'active') rrJoinPvPGame(gameId);
      if (g.status === 'declined') {
        statusEl.textContent = 'Challenge declined.';
        balance += bet;
        updateBalDisplay();
        rrCleanupPvP();
      }
    });
  } catch(e) {
    statusEl.textContent = 'Error: ' + e.message;
  }
}

function rrCancelPvP(gameId, bet) {
  window._fbRemove('casino/rrGames/' + gameId);
  balance += bet || (rrState ? rrState.bet : parseInt(document.getElementById('rrPvpBet').value));
  updateBalDisplay();
  rrCleanupPvP();
  document.getElementById('rrPvpStatus').textContent = 'Challenge cancelled.';
}

async function rrAcceptPvPChallenge(gameId, bet) {
  if (!checkMaxBet(bet, 'russianr')) return;
  
  balance -= bet;
  updateBalDisplay();
  
  const chambers = [0, 0, 0, 0, 0, 0];
  chambers[Math.floor(Math.random() * 6)] = 1;
  const hostFirst = Math.random() < 0.5;
  
  await window._fbUpdate('casino/rrGames/' + gameId, {
    status: 'active',
    cylinder: chambers.join(','),
    cylinderPos: 0,
    currentTurn: hostFirst ? 'host' : 'guest',
    round: 1,
    hostAlive: true,
    guestAlive: true
  });
  
  switchGame('russianr');
  rrJoinPvPGame(gameId);
}

function rrJoinPvPGame(gameId) {
  document.getElementById('rrBotLobby').style.display = 'none';
  document.getElementById('rrPvpLobby').style.display = 'none';
  document.getElementById('rrGameArea').style.display = 'block';
  document.getElementById('rrGameOver').style.display = 'none';
  document.getElementById('rrLog').innerHTML = '';
  
  rrCleanupPvP();
  
  let endHandled = false;
  
  rrPvpUnsubscribe = window._fbOnValue('casino/rrGames/' + gameId, snap => {
    const g = snap.val();
    if (!g) return;
    
    const myId = window._currentPlayerId;
    const isHost = g.host === myId;
    const opName = isHost ? g.guestName : g.hostName;
    document.getElementById('rrOpponentLabel').textContent = '👤 ' + opName.toUpperCase();
    
    const myTurn = (g.currentTurn === 'host' && isHost) || (g.currentTurn === 'guest' && !isHost);
    const myAlive = isHost ? g.hostAlive : g.guestAlive;
    const opAlive = isHost ? g.guestAlive : g.hostAlive;
    
    rrState = {
      mode: 'pvp',
      bet: g.bet,
      diff: 'normal',
      totalRounds: g.totalRounds || 5,
      currentRound: g.round || 1,
      mult: 2,
      cylinder: { remaining: 6 - (g.cylinderPos || 0), pos: g.cylinderPos || 0 },
      playerTurn: myTurn,
      playerAlive: myAlive,
      dealerAlive: opAlive,
      gameOver: g.status === 'finished',
      pvpGameId: gameId,
      pvpIsHost: isHost
    };
    
    document.getElementById('rrRoundInfo').textContent = `ROUND ${g.round || 1} / ${g.totalRounds || 5}`;
    document.getElementById('rrMultInfo').textContent = `🏆 POT: $${(g.bet * 2).toLocaleString()}`;
    rrUpdateUI();
    
    if (myTurn && !rrState.gameOver && myAlive && opAlive) rrEnableActions();
    else rrDisableActions();
    
    if (g.lastAction) {
      const la = g.lastAction;
      if (la.type === 'pull') {
        if (la.hit) { rrAnimateShot(true); rrShakeScreen(); playSound(80, 'sawtooth', 0.4, 0.7); }
        else { rrAnimateShot(false); playSound(600, 'sine', 0.08, 0.4); }
      } else if (la.type === 'spin') { rrAnimateNewRound(); playSound(400, 'sine', 0.3, 0.3); }
    }
    
    if (g.log) {
      const logEl = document.getElementById('rrLog');
      logEl.innerHTML = '';
      Object.values(g.log).slice(-20).reverse().forEach(l => {
        const d = document.createElement('div');
        d.style.cssText = 'padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;';
        if (l.color) d.style.color = l.color;
        d.textContent = l.msg;
        logEl.appendChild(d);
      });
    }
    
    if (g.status === 'finished' && g.winner && !endHandled) {
      endHandled = true;
      const iWon = (g.winner === 'host' && isHost) || (g.winner === 'guest' && !isHost);
      if (iWon) {
        balance += g.bet * 2;
        updateBalDisplay();
        gameStats.russianr.won++;
        if (g.bet * 2 > gameStats.russianr.biggestWin) gameStats.russianr.biggestWin = g.bet * 2;
      }
      gameStats.russianr.played++;
      recordGame('russianr', g.bet, iWon ? g.bet * 2 : 0);
      
      const box = document.getElementById('rrGameOverContent');
      if (iWon) {
        playWinSound();
        box.innerHTML = `<div style="font-size:60px;margin-bottom:12px;">🏆</div>
          <div style="font-family:'Orbitron';font-size:22px;color:var(--green);margin-bottom:8px;">YOU WIN!</div>
          <div style="font-size:14px;color:var(--text2);margin-bottom:8px;">${opName} took the bullet!</div>
          <div style="font-family:'Orbitron';font-size:28px;color:var(--gold);margin-bottom:16px;">+$${g.bet.toLocaleString()}</div>
          <button onclick="rrCloseGameOver();rrCleanupPvP();" class="action-btn primary" style="padding:14px 32px;">BACK TO LOBBY</button>`;
        spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 30);
      } else {
        playLoseSound();
        box.innerHTML = `<div style="font-size:60px;margin-bottom:12px;">💀</div>
          <div style="font-family:'Orbitron';font-size:22px;color:var(--red);margin-bottom:8px;">YOU LOSE</div>
          <div style="font-size:14px;color:var(--text2);margin-bottom:8px;">The bullet found you...</div>
          <div style="font-family:'Orbitron';font-size:28px;color:var(--red);margin-bottom:16px;">-$${g.bet.toLocaleString()}</div>
          <button onclick="rrCloseGameOver();rrCleanupPvP();" class="action-btn primary" style="padding:14px 32px;">BACK TO LOBBY</button>`;
      }
      document.getElementById('rrGameOver').style.display = 'flex';
    }
  });
}

async function rrPvPAction(actionType) {
  if (!rrState || rrState.mode !== 'pvp' || !rrState.pvpGameId) return;
  const gameId = rrState.pvpGameId;
  const isHost = rrState.pvpIsHost;
  
  const snap = await window._fbGet('casino/rrGames/' + gameId);
  const g = snap.val();
  if (!g || g.status !== 'active') return;
  
  const myTurn = (g.currentTurn === 'host' && isHost) || (g.currentTurn === 'guest' && !isHost);
  if (!myTurn) return;
  
  const chambers = g.cylinder.split(',').map(Number);
  const pos = g.cylinderPos || 0;
  const myName = isHost ? g.hostName : g.guestName;
  const logKey = Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
  
  if (actionType === 'spin') {
    const nc = [0, 0, 0, 0, 0, 0];
    nc[Math.floor(Math.random() * 6)] = 1;
    await window._fbSet('casino/rrGames/' + gameId + '/log/' + logKey, { msg: `🔄 ${myName} spins the cylinder!`, color: 'var(--neon)' });
    await window._fbUpdate('casino/rrGames/' + gameId, {
      cylinder: nc.join(','), cylinderPos: 0,
      currentTurn: isHost ? 'guest' : 'host',
      lastAction: { type: 'spin', by: myName }
    });
  } else {
    const hit = chambers[pos] === 1;
    const updates = { cylinderPos: pos + 1, currentTurn: isHost ? 'guest' : 'host', lastAction: { type: 'pull', by: myName, hit } };
    if (hit) {
      if (isHost) updates.hostAlive = false; else updates.guestAlive = false;
      await window._fbSet('casino/rrGames/' + gameId + '/log/' + logKey, { msg: `💥 BANG! ${myName} takes the bullet! 💀`, color: '#ff4444' });
      updates.status = 'finished';
      updates.winner = isHost ? 'guest' : 'host';
    } else {
      await window._fbSet('casino/rrGames/' + gameId + '/log/' + logKey, { msg: `🔘 *click* — ${myName} survives!`, color: 'var(--green)' });
    }
    await window._fbUpdate('casino/rrGames/' + gameId, updates);
  }
}

let mpbsrGameId = null;
let mpbsrIsHost = false;
let mpbsrChallengeInterval = null;

const MPBSR_ITEMS = [
  { id: 'saw', icon: '🪚', name: 'Saw', desc: 'Next LIVE deals 2× damage' },
  { id: 'mag', icon: '🔍', name: 'Magnifying Glass', desc: 'Peek at current shell' },
  { id: 'cig', icon: '🚬', name: 'Cigarette', desc: 'Heal +1 HP' },
  { id: 'cuff', icon: '🔗', name: 'Handcuffs', desc: 'Opponent skips next turn' },
  { id: 'phone', icon: '📱', name: 'Burner Phone', desc: 'Reveals a random shell' }
];

function initMPBSR() {
  document.getElementById('mpbsrLobby').style.display = 'block';
  document.getElementById('mpbsrGameArea').style.display = 'none';
  document.getElementById('mpbsrGameOver').style.display = 'none';
  mpbsrStartChallengeListener();
}

function mpbsrStartChallengeListener() {
  if (mpbsrChallengeInterval) clearInterval(mpbsrChallengeInterval);
  mpbsrChallengeInterval = setInterval(async () => {
    if (!window._currentPlayerId) return;
    try {
      const snap = await window._fbGet('casino/players/' + window._currentPlayerId + '/notifications');
      if (!snap.exists()) return;
      const notifs = snap.val();
      for (const [key, n] of Object.entries(notifs)) {
        if (n.type === 'mpbsr_challenge' && n.gameId) {
          window._fbRemove('casino/players/' + window._currentPlayerId + '/notifications/' + key);
          const toastDiv = document.createElement('div');
          toastDiv.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);z-index:99999;background:var(--surface);border:2px solid var(--gold);border-radius:16px;padding:24px;text-align:center;min-width:280px;box-shadow:0 0 40px rgba(0,0,0,.5);';
          toastDiv.innerHTML = `
            <div style="font-size:30px;margin-bottom:8px;">💥</div>
            <div style="font-family:'Orbitron';font-size:16px;color:var(--gold);margin-bottom:8px;">BUCKSHOT ROULETTE CHALLENGE</div>
            <div style="font-size:14px;color:var(--text);margin-bottom:4px;"><b>${n.from}</b> challenges you!</div>
            <div style="font-size:13px;color:var(--text2);margin-bottom:14px;">Wager: <span style="color:var(--gold);">$${n.bet.toLocaleString()}</span></div>
            <div style="display:flex;gap:10px;justify-content:center;">
              <button class="action-btn primary" onclick="this.closest('div[style]').remove();mpbsrAccept('${n.gameId}',${n.bet});" style="padding:10px 20px;">✅ ACCEPT</button>
              <button class="action-btn" onclick="this.closest('div[style]').remove();mpbsrDecline('${n.gameId}');" style="padding:10px 20px;">❌ DECLINE</button>
            </div>`;
          document.body.appendChild(toastDiv);
          setTimeout(() => { if (toastDiv.parentNode) toastDiv.remove(); }, 30000);
        }
      }
    } catch(e) {}
  }, 5000);
}

function mpbsrGenerateRound(roundNum) {
  
  const shellCount = 4 + roundNum;
  const liveCount = 1 + Math.floor(Math.random() * Math.min(shellCount - 1, roundNum + 2));
  const blankCount = shellCount - liveCount;
  const shells = [];
  for (let i = 0; i < liveCount; i++) shells.push('live');
  for (let i = 0; i < blankCount; i++) shells.push('blank');
  
  for (let i = shells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shells[i], shells[j]] = [shells[j], shells[i]];
  }
  
  const itemCount = Math.min(2 + roundNum, 4);
  function randItems(n) {
    const items = [];
    for (let i = 0; i < n; i++) items.push(MPBSR_ITEMS[Math.floor(Math.random() * MPBSR_ITEMS.length)].id);
    return items;
  }
  return { shells, hostItems: randItems(itemCount), guestItems: randItems(itemCount), liveCount, blankCount };
}

async function mpbsrChallenge() {
  const bet = parseInt(document.getElementById('mpbsrBet').value);
  if (!bet || bet < 10) return showToast('Min bet is $10', false);
  if (!checkMaxBet(bet, 'mpbsr')) return;
  
  const opName = document.getElementById('mpbsrOpponent').value.trim().toLowerCase();
  if (!opName) return showToast('Enter opponent username', false);
  if (opName === (window._currentUsername || '').toLowerCase()) return showToast('Cannot challenge yourself', false);
  
  const statusEl = document.getElementById('mpbsrStatus');
  statusEl.textContent = 'Sending challenge...';
  
  try {
    const nameSnap = await window._fbGet('casino/usernames/' + opName);
    if (!nameSnap.exists()) { statusEl.textContent = 'Player not found!'; return; }
    const opUid = nameSnap.val();
    if (opUid === window._currentPlayerId) { statusEl.textContent = 'Cannot challenge yourself'; return; }
    
    const gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const round1 = mpbsrGenerateRound(1);
    
    await window._fbSet('casino/bsrGames/' + gameId, {
      host: window._currentPlayerId,
      hostName: window._currentUsername,
      guest: opUid,
      guestName: opName,
      bet,
      status: 'pending',
      round: 1,
      shells: round1.shells.join(','),
      shellIdx: 0,
      liveCount: round1.liveCount,
      blankCount: round1.blankCount,
      hostHP: 4,
      guestHP: 4,
      hostItems: round1.hostItems.join(','),
      guestItems: round1.guestItems.join(','),
      currentTurn: Math.random() < 0.5 ? 'host' : 'guest',
      sawActive: false,
      cuffActive: false,
      created: Date.now()
    });
    
    balance -= bet;
    updateBalDisplay();
    
    const nk = Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
    await window._fbSet('casino/players/' + opUid + '/notifications/' + nk, {
      type: 'mpbsr_challenge',
      from: window._currentUsername,
      fromUid: window._currentPlayerId,
      gameId,
      bet,
      time: Date.now()
    });
    
    statusEl.innerHTML = `Challenge sent to <b>${opName}</b>! Waiting...<br><button class="action-btn" onclick="mpbsrCancelChallenge('${gameId}',${bet})" style="margin-top:8px;padding:6px 16px;font-size:11px;">Cancel</button>`;
    
    mpbsrCleanup();
    mpbsrUnsub = window._fbOnValue('casino/bsrGames/' + gameId, snap => {
      const g = snap.val();
      if (!g) return;
      if (g.status === 'active') {
        mpbsrGameId = gameId;
        mpbsrIsHost = true;
        mpbsrJoinGame(gameId);
      }
      if (g.status === 'declined') {
        statusEl.textContent = 'Challenge declined.';
        balance += bet;
        updateBalDisplay();
        mpbsrCleanup();
      }
    });
  } catch(e) {
    statusEl.textContent = 'Error: ' + e.message;
  }
}

function mpbsrCancelChallenge(gameId, bet) {
  window._fbRemove('casino/bsrGames/' + gameId);
  balance += bet;
  updateBalDisplay();
  mpbsrCleanup();
  document.getElementById('mpbsrStatus').textContent = 'Cancelled.';
}

async function mpbsrAccept(gameId, bet) {
  if (!checkMaxBet(bet, 'mpbsr')) return;
  balance -= bet;
  updateBalDisplay();
  
  await window._fbUpdate('casino/bsrGames/' + gameId, { status: 'active' });
  
  mpbsrGameId = gameId;
  mpbsrIsHost = false;
  switchGame('mpbsr');
  mpbsrJoinGame(gameId);
}

function mpbsrDecline(gameId) {
  window._fbUpdate('casino/bsrGames/' + gameId, { status: 'declined' });
}

function mpbsrJoinGame(gameId) {
  document.getElementById('mpbsrLobby').style.display = 'none';
  document.getElementById('mpbsrGameArea').style.display = 'block';
  document.getElementById('mpbsrGameOver').style.display = 'none';
  document.getElementById('mpbsrLog').innerHTML = '';
  
  mpbsrCleanup();
  let endHandled = false;
  
  mpbsrUnsub = window._fbOnValue('casino/bsrGames/' + gameId, snap => {
    const g = snap.val();
    if (!g) return;
    
    const isHost = g.host === window._currentPlayerId;
    const opName = isHost ? g.guestName : g.hostName;
    document.getElementById('mpbsrOpLabel').textContent = opName.toUpperCase();
    
    const myHP = isHost ? g.hostHP : g.guestHP;
    const opHP = isHost ? g.guestHP : g.hostHP;
    const myItems = (isHost ? g.hostItems : g.guestItems) || '';
    const opItems = (isHost ? g.guestItems : g.hostItems) || '';
    const myTurn = (g.currentTurn === 'host' && isHost) || (g.currentTurn === 'guest' && !isHost);
    const shells = g.shells ? g.shells.split(',') : [];
    const shellIdx = g.shellIdx || 0;
    
    
    document.getElementById('mpbsrRoundInfo').textContent = 'ROUND ' + (g.round || 1);
    document.getElementById('mpbsrPotInfo').textContent = 'POT: $' + (g.bet * 2).toLocaleString();
    document.getElementById('mpbsrShellInfo').textContent = (shells.length - shellIdx) + ' shells left';
    
    
    const rack = document.getElementById('mpbsrShellRack');
    rack.innerHTML = '';
    const rLive = shells.slice(shellIdx).filter(s => s === 'live').length;
    const rBlank = shells.slice(shellIdx).filter(s => s === 'blank').length;
    for (let i = 0; i < rLive; i++) {
      const d = document.createElement('div');
      d.className = 'bsr-shell bsr-shell-live';
      d.textContent = '🔴';
      rack.appendChild(d);
    }
    for (let i = 0; i < rBlank; i++) {
      const d = document.createElement('div');
      d.className = 'bsr-shell bsr-shell-blank';
      d.textContent = '🔵';
      rack.appendChild(d);
    }
    
    
    document.getElementById('mpbsrMyHP').innerHTML = '❤️'.repeat(Math.max(0, myHP)) + '🖤'.repeat(Math.max(0, 4 - myHP));
    document.getElementById('mpbsrOpHP').innerHTML = '❤️'.repeat(Math.max(0, opHP)) + '🖤'.repeat(Math.max(0, 4 - opHP));
    
    
    function renderItems(itemStr, containerId, usable) {
      const el = document.getElementById(containerId);
      el.innerHTML = '';
      if (!itemStr) return;
      itemStr.split(',').filter(Boolean).forEach((id, i) => {
        const item = MPBSR_ITEMS.find(it => it.id === id);
        if (!item) return;
        const btn = document.createElement('button');
        btn.className = 'bsr-item';
        btn.title = item.name + ': ' + item.desc;
        btn.textContent = item.icon;
        btn.style.fontSize = '18px';
        btn.style.padding = '6px 8px';
        btn.style.margin = '2px';
        btn.style.cursor = usable ? 'pointer' : 'default';
        btn.style.opacity = usable ? '1' : '0.5';
        if (usable) btn.onclick = () => mpbsrUseItem(i);
        el.appendChild(btn);
      });
    }
    renderItems(myItems, 'mpbsrMyItems', myTurn && g.status === 'active');
    renderItems(opItems, 'mpbsrOpItems', false);
    
    
    const statusEl = document.getElementById('mpbsrStatusMsg');
    if (g.status === 'active') {
      statusEl.textContent = myTurn ? '🎯 YOUR TURN — Shoot or use an item!' : '⏳ Waiting for opponent...';
      statusEl.style.color = myTurn ? 'var(--gold)' : 'var(--text2)';
    }
    
    
    const canAct = myTurn && g.status === 'active' && myHP > 0 && opHP > 0;
    document.getElementById('mpbsrShootOp').disabled = !canAct;
    document.getElementById('mpbsrShootSelf').disabled = !canAct;
    document.getElementById('mpbsrShootOp').style.opacity = canAct ? '1' : '0.4';
    document.getElementById('mpbsrShootSelf').style.opacity = canAct ? '1' : '0.4';
    
    
    if (g.log) {
      const logEl = document.getElementById('mpbsrLog');
      logEl.innerHTML = '';
      Object.values(g.log).slice(-20).reverse().forEach(l => {
        const d = document.createElement('div');
        d.className = 'bsr-log-line';
        d.style.fontSize = '12px';
        if (l.color) d.style.color = l.color;
        d.textContent = l.msg;
        logEl.appendChild(d);
      });
    }
    
    
    if (g.status === 'finished' && g.winner && !endHandled) {
      endHandled = true;
      const iWon = (g.winner === 'host' && isHost) || (g.winner === 'guest' && !isHost);
      if (iWon) {
        balance += g.bet * 2;
        updateBalDisplay();
        gameStats.mpbsr.won++;
        if (g.bet * 2 > gameStats.mpbsr.biggestWin) gameStats.mpbsr.biggestWin = g.bet * 2;
      }
      gameStats.mpbsr.played++;
      recordGame('mpbsr', g.bet, iWon ? g.bet * 2 : 0);
      
      setTimeout(() => {
        const box = document.getElementById('mpbsrGameOverContent');
        if (iWon) {
          playWinSound();
          box.innerHTML = `<div style="font-size:60px;margin-bottom:12px;">🏆</div>
            <div style="font-family:'Orbitron';font-size:22px;color:var(--green);margin-bottom:8px;">YOU WIN!</div>
            <div style="font-size:14px;color:var(--text2);margin-bottom:8px;">${opName} is eliminated!</div>
            <div style="font-family:'Orbitron';font-size:28px;color:var(--gold);margin-bottom:16px;">+$${g.bet.toLocaleString()}</div>
            <button onclick="mpbsrBackToLobby()" class="action-btn primary" style="padding:14px 32px;">BACK TO LOBBY</button>`;
          spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 30);
        } else {
          playLoseSound();
          box.innerHTML = `<div style="font-size:60px;margin-bottom:12px;">💀</div>
            <div style="font-family:'Orbitron';font-size:22px;color:var(--red);margin-bottom:8px;">YOU LOSE</div>
            <div style="font-size:14px;color:var(--text2);margin-bottom:8px;">You've been eliminated...</div>
            <div style="font-family:'Orbitron';font-size:28px;color:var(--red);margin-bottom:16px;">-$${g.bet.toLocaleString()}</div>
            <button onclick="mpbsrBackToLobby()" class="action-btn primary" style="padding:14px 32px;">BACK TO LOBBY</button>`;
        }
        document.getElementById('mpbsrGameOver').style.display = 'flex';
      }, 1000);
    }
  });
}

async function mpbsrShoot(target) {
  if (!mpbsrGameId) return;
  const gid = mpbsrGameId;
  const snap = await window._fbGet('casino/bsrGames/' + gid);
  const g = snap.val();
  if (!g || g.status !== 'active') return;
  
  const isHost = g.host === window._currentPlayerId;
  const myTurn = (g.currentTurn === 'host' && isHost) || (g.currentTurn === 'guest' && !isHost);
  if (!myTurn) return;
  
  const shells = g.shells.split(',');
  const idx = g.shellIdx || 0;
  if (idx >= shells.length) return; 
  
  const shell = shells[idx];
  const isLive = shell === 'live';
  const myName = isHost ? g.hostName : g.guestName;
  const opName = isHost ? g.guestName : g.hostName;
  const lk = Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
  
  const updates = { shellIdx: idx + 1 };
  let dmg = isLive ? (g.sawActive ? 2 : 1) : 0;
  
  if (g.sawActive) updates.sawActive = false;
  
  if (target === 'opponent') {
    if (isLive) {
      const hpKey = isHost ? 'guestHP' : 'hostHP';
      const newHP = Math.max(0, (isHost ? g.guestHP : g.hostHP) - dmg);
      updates[hpKey] = newHP;
      await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
        msg: `🔫 ${myName} shoots ${opName} — 💥 LIVE! -${dmg} HP`, color: '#ff4444'
      });
      if (newHP <= 0) {
        updates.status = 'finished';
        updates.winner = isHost ? 'host' : 'guest';
        const lk2 = lk + 'w';
        await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk2, {
          msg: `☠️ ${opName} has been eliminated!`, color: '#ff4444'
        });
      } else {
        
        if (g.cuffActive) {
          updates.cuffActive = false;
          updates.currentTurn = g.currentTurn; 
          const lk3 = lk + 'c';
          await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk3, {
            msg: `🔗 ${opName} is handcuffed — skips their turn!`, color: 'var(--neon)'
          });
        } else {
          updates.currentTurn = isHost ? 'guest' : 'host';
        }
      }
    } else {
      await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
        msg: `🔫 ${myName} shoots ${opName} — 🔵 BLANK! Turn passes.`, color: 'var(--text2)'
      });
      if (g.cuffActive) {
        updates.cuffActive = false;
        updates.currentTurn = g.currentTurn;
      } else {
        updates.currentTurn = isHost ? 'guest' : 'host';
      }
    }
  } else {
    
    if (isLive) {
      const hpKey = isHost ? 'hostHP' : 'guestHP';
      const newHP = Math.max(0, (isHost ? g.hostHP : g.guestHP) - dmg);
      updates[hpKey] = newHP;
      await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
        msg: `🤕 ${myName} shoots self — 💥 LIVE! -${dmg} HP`, color: '#ff8800'
      });
      if (newHP <= 0) {
        updates.status = 'finished';
        updates.winner = isHost ? 'guest' : 'host';
      } else {
        if (g.cuffActive) {
          updates.cuffActive = false;
          updates.currentTurn = g.currentTurn;
        } else {
          updates.currentTurn = isHost ? 'guest' : 'host';
        }
      }
    } else {
      await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
        msg: `🤕 ${myName} shoots self — 🔵 BLANK! Bonus turn!`, color: 'var(--green)'
      });
      
      updates.currentTurn = g.currentTurn;
    }
  }
  
  
  if (!updates.status && updates.shellIdx >= shells.length) {
    const newRound = (g.round || 1) + 1;
    const rd = mpbsrGenerateRound(newRound);
    updates.round = newRound;
    updates.shells = rd.shells.join(',');
    updates.shellIdx = 0;
    updates.liveCount = rd.liveCount;
    updates.blankCount = rd.blankCount;
    updates.hostItems = rd.hostItems.join(',');
    updates.guestItems = rd.guestItems.join(',');
    updates.sawActive = false;
    updates.cuffActive = false;
    const lkr = lk + 'r';
    await window._fbSet('casino/bsrGames/' + gid + '/log/' + lkr, {
      msg: `📦 Round ${newRound} — New shells loaded!`, color: 'var(--neon)'
    });
  }
  
  await window._fbUpdate('casino/bsrGames/' + gid, updates);
}

async function mpbsrUseItem(itemIndex) {
  if (!mpbsrGameId) return;
  const gid = mpbsrGameId;
  const snap = await window._fbGet('casino/bsrGames/' + gid);
  const g = snap.val();
  if (!g || g.status !== 'active') return;
  
  const isHost = g.host === window._currentPlayerId;
  const myTurn = (g.currentTurn === 'host' && isHost) || (g.currentTurn === 'guest' && !isHost);
  if (!myTurn) return;
  
  const itemsKey = isHost ? 'hostItems' : 'guestItems';
  const items = (g[itemsKey] || '').split(',').filter(Boolean);
  if (itemIndex >= items.length) return;
  
  const itemId = items[itemIndex];
  const itemInfo = MPBSR_ITEMS.find(it => it.id === itemId);
  if (!itemInfo) return;
  
  const myName = isHost ? g.hostName : g.guestName;
  const opName = isHost ? g.guestName : g.hostName;
  const lk = Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
  
  
  items.splice(itemIndex, 1);
  const updates = { [itemsKey]: items.join(',') };
  
  switch (itemId) {
    case 'saw':
      updates.sawActive = true;
      await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
        msg: `🪚 ${myName} uses Saw — next LIVE deals 2× damage!`, color: 'var(--gold)'
      });
      break;
    case 'mag': {
      const shells = g.shells.split(',');
      const cur = shells[g.shellIdx || 0] || '?';
      await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
        msg: `🔍 ${myName} uses Magnifying Glass...`, color: 'var(--neon)'
      });
      
      showToast(`Current shell: ${cur === 'live' ? '🔴 LIVE' : '🔵 BLANK'}`, cur === 'live' ? false : true);
      break;
    }
    case 'cig': {
      const hpKey = isHost ? 'hostHP' : 'guestHP';
      const curHP = isHost ? g.hostHP : g.guestHP;
      updates[hpKey] = Math.min(curHP + 1, 4);
      await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
        msg: `🚬 ${myName} uses Cigarette — +1 HP!`, color: 'var(--green)'
      });
      break;
    }
    case 'cuff':
      updates.cuffActive = true;
      await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
        msg: `🔗 ${myName} uses Handcuffs on ${opName}!`, color: 'var(--neon)'
      });
      break;
    case 'phone': {
      const shells = g.shells.split(',');
      const remaining = shells.slice(g.shellIdx || 0);
      if (remaining.length > 0) {
        const idx = Math.floor(Math.random() * remaining.length);
        const shellType = remaining[idx];
        const absIdx = (g.shellIdx || 0) + idx + 1;
        await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
          msg: `📱 ${myName} used Burner Phone!`, color: 'var(--gold)'
        });
        showToast(`📱 Shell #${absIdx} is ${shellType === 'live' ? '🔴 LIVE' : '⚪ BLANK'}!`, shellType !== 'live');
      }
      break;
    }
  }
  await window._fbUpdate('casino/bsrGames/' + gid, updates);
}


document.getElementById('rrPullBtn').addEventListener('click', function(e) {
  if (rrState && rrState.mode === 'pvp') { e.stopImmediatePropagation(); rrPvPAction('pull'); }
});
document.getElementById('rrSpinBtn').addEventListener('click', function(e) {
  if (rrState && rrState.mode === 'pvp') { e.stopImmediatePropagation(); rrPvPAction('spin'); }
});

function rrCleanupPvP() {
  if (rrPvpUnsubscribe) {
    try { rrPvpUnsubscribe(); } catch(e) {}
  }
  rrPvpUnsubscribe = null;
}


let rrChallengeInterval = null;
function rrListenForChallenges() {
  if (!window._currentPlayerId) return;
  if (rrChallengeInterval) clearInterval(rrChallengeInterval);
  rrChallengeInterval = setInterval(async () => {
    try {
      const snap = await window._fbGet('casino/players/' + window._currentPlayerId + '/notifications');
      if (!snap.exists()) return;
      const notifs = snap.val();
      for (const [key, n] of Object.entries(notifs)) {
        if (n.type === 'rr_challenge' && n.gameId) {
          window._fbRemove('casino/players/' + window._currentPlayerId + '/notifications/' + key);
          const toastDiv = document.createElement('div');
          toastDiv.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);z-index:99999;background:var(--surface);border:2px solid var(--gold);border-radius:16px;padding:24px;text-align:center;min-width:280px;box-shadow:0 0 40px rgba(0,0,0,.5);';
          toastDiv.innerHTML = `
            <div style="font-size:30px;margin-bottom:8px;">🔫</div>
            <div style="font-family:'Orbitron';font-size:16px;color:var(--gold);margin-bottom:8px;">RUSSIAN ROULETTE CHALLENGE</div>
            <div style="font-size:14px;color:var(--text);margin-bottom:4px;"><b>${n.from}</b> challenges you!</div>
            <div style="font-size:13px;color:var(--text2);margin-bottom:14px;">Wager: <span style="color:var(--gold);">$${n.bet.toLocaleString()}</span></div>
            <div style="display:flex;gap:10px;justify-content:center;">
              <button class="action-btn primary" onclick="this.closest('div[style]').remove();rrAcceptPvPChallenge('${n.gameId}',${n.bet});" style="padding:10px 20px;">✅ ACCEPT</button>
              <button class="action-btn" onclick="this.closest('div[style]').remove();rrDeclinePvPChallenge('${n.gameId}');" style="padding:10px 20px;">❌ DECLINE</button>
            </div>`;
          document.body.appendChild(toastDiv);
          setTimeout(() => { if (toastDiv.parentNode) toastDiv.remove(); }, 30000);
        }
      }
    } catch(e) {}
  }, 5000);
}

function rrDeclinePvPChallenge(gameId) {
  window._fbUpdate('casino/rrGames/' + gameId, { status: 'declined' });
}


let casinoSettings = JSON.parse(localStorage.getItem('casino_settings')) || {
  sound: true,
  particles: true,
  reducedAnim: false,
  theme: 'dark'
};

function openSettingsPanel() {
  document.getElementById('settingsOverlay').style.display = 'block';
  
  const snd = document.getElementById('settingSound');
  const part = document.getElementById('settingParticles');
  const ra = document.getElementById('settingReducedAnim');
  if (snd) { snd.checked = casinoSettings.sound; updateToggleVisual('settingSound', casinoSettings.sound); }
  if (part) { part.checked = casinoSettings.particles; updateToggleVisual('settingParticles', casinoSettings.particles); }
  if (ra) { ra.checked = casinoSettings.reducedAnim; updateToggleVisual('settingReducedAnim', casinoSettings.reducedAnim); }
  
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.style.borderColor = b.dataset.theme === casinoSettings.theme ? 'var(--neon)' : 'var(--border)';
  });
}

function closeSettingsPanel() {
  document.getElementById('settingsOverlay').style.display = 'none';
}

function updateToggleVisual(id, on) {
  const knob = document.getElementById(id + 'Knob');
  if (!knob) return;
  knob.style.left = on ? '25px' : '3px';
  knob.style.background = on ? 'var(--neon)' : 'var(--text2)';
  knob.parentElement.querySelector('span').style.background = on ? 'rgba(0,240,255,.3)' : 'var(--surface2)';
}

function settingToggle(key, val) {
  casinoSettings[key] = val;
  localStorage.setItem('casino_settings', JSON.stringify(casinoSettings));
  updateToggleVisual('setting' + key.charAt(0).toUpperCase() + key.slice(1), val);

  
  if (key === 'sound') {
    soundMuted = !val;
    const mb = document.getElementById('muteBtn');
    if (mb) mb.textContent = val ? '🔊' : '🔇';
  }
  if (key === 'particles') {
    const c = document.getElementById('particles');
    if (c) c.style.display = val ? 'block' : 'none';
  }
  if (key === 'reducedAnim') {
    document.body.style.setProperty('--anim-speed', val ? '0.1s' : '');
    if (val) document.body.classList.add('reduced-motion'); else document.body.classList.remove('reduced-motion');
  }
}

const THEMES = {
  dark: { bg:'#040814', surface1:'#0a0f2e', surface:'rgba(255,255,255,0.03)', surface2:'rgba(255,255,255,0.06)', border:'rgba(255,255,255,0.08)', text:'#e8eaed', text2:'rgba(255,255,255,0.5)', neon:'#00f0ff', gold:'#ffd700', green:'#00e676', red:'#ff4444' },
  midnight: { bg:'#0d0221', surface1:'#150330', surface:'rgba(211,44,230,0.04)', surface2:'rgba(211,44,230,0.08)', border:'rgba(211,44,230,0.15)', text:'#e8d5f5', text2:'rgba(255,255,255,0.5)', neon:'#d32ce6', gold:'#ffd700', green:'#00e676', red:'#ff4444' },
  ocean: { bg:'#001a33', surface1:'#002244', surface:'rgba(0,191,255,0.04)', surface2:'rgba(0,191,255,0.08)', border:'rgba(0,191,255,0.15)', text:'#d4efff', text2:'rgba(255,255,255,0.5)', neon:'#00bfff', gold:'#ffd700', green:'#00e676', red:'#ff4444' },
  forest: { bg:'#0a1f0a', surface1:'#122812', surface:'rgba(0,230,118,0.04)', surface2:'rgba(0,230,118,0.08)', border:'rgba(0,230,118,0.15)', text:'#d4f5d4', text2:'rgba(255,255,255,0.5)', neon:'#00e676', gold:'#ffd700', green:'#00e676', red:'#ff4444' },
  crimson: { bg:'#1a0505', surface1:'#260808', surface:'rgba(255,68,68,0.04)', surface2:'rgba(255,68,68,0.08)', border:'rgba(255,68,68,0.15)', text:'#f5d4d4', text2:'rgba(255,255,255,0.5)', neon:'#ff4444', gold:'#ffd700', green:'#00e676', red:'#ff4444' },
  gold: { bg:'#1a1500', surface1:'#262000', surface:'rgba(255,215,0,0.04)', surface2:'rgba(255,215,0,0.08)', border:'rgba(255,215,0,0.15)', text:'#f5eed4', text2:'rgba(255,255,255,0.5)', neon:'#ffd700', gold:'#ffd700', green:'#00e676', red:'#ff4444' },
};

function setTheme(name) {
  const t = THEMES[name];
  if (!t) return;
  casinoSettings.theme = name;
  localStorage.setItem('casino_settings', JSON.stringify(casinoSettings));
  const root = document.documentElement;
  Object.entries(t).forEach(([k, v]) => {
    root.style.setProperty('--' + k.replace(/([A-Z])/g, m => '-' + m.toLowerCase()), v);
  });
  
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.style.borderColor = b.dataset.theme === name ? 'var(--neon)' : 'var(--border)';
  });
}


(function applySavedSettings() {
  if (!casinoSettings.sound) {
    soundMuted = true;
    setTimeout(() => {
      const mb = document.getElementById('muteBtn');
      if (mb) mb.textContent = '🔇';
    }, 100);
  }
  if (!casinoSettings.particles) {
    const c = document.getElementById('particles');
    if (c) c.style.display = 'none';
  }
  if (casinoSettings.reducedAnim) {
    document.body.classList.add('reduced-motion');
  }
  if (casinoSettings.theme && casinoSettings.theme !== 'dark') {
    setTheme(casinoSettings.theme);
  }
})();


let activePotions = JSON.parse(localStorage.getItem('casino_potions')) || {};


function openShopOverlay() {
  document.getElementById('shopOverlay').style.display = 'block';
  shopRefresh();
}

function closeShopOverlay() {
  document.getElementById('shopOverlay').style.display = 'none';
}

function shopRefresh() {
  document.getElementById('shopBalText').textContent = (typeof balance !== 'undefined' ? balance : 0).toLocaleString();
  
  const lp = activePotions.luck || { stacks: 0, expires: 0 };
  const luckActive = lp.stacks > 0 && lp.expires > Date.now();
  document.getElementById('shopLuckCount').textContent = luckActive ? lp.stacks : '0';
  
  const sp = activePotions.speed || { active: false, expires: 0 };
  document.getElementById('shopSpeedActive').textContent = sp.active && sp.expires > Date.now() ? 'ON' : 'OFF';
  document.getElementById('shopSpeedActive').style.color = sp.active && sp.expires > Date.now() ? 'var(--green)' : 'var(--text2)';
  
  const sh = activePotions.shield || { active: false, expires: 0 };
  document.getElementById('shopShieldActive').textContent = sh.active && sh.expires > Date.now() ? 'ON' : 'OFF';
  document.getElementById('shopShieldActive').style.color = sh.active && sh.expires > Date.now() ? 'var(--green)' : 'var(--text2)';
  
  const xp = activePotions.xp || { active: false, expires: 0 };
  document.getElementById('shopXPActive').textContent = xp.active && xp.expires > Date.now() ? 'ON' : 'OFF';
  document.getElementById('shopXPActive').style.color = xp.active && xp.expires > Date.now() ? 'var(--green)' : 'var(--text2)';

  
  const eff = [];
  if (luckActive) { const rem = Math.ceil((lp.expires - Date.now()) / 60000); eff.push(`<div style="padding:6px;border-radius:6px;background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.2);"><span style="font-size:14px;">🍀</span> Luck ×${lp.stacks} — ${rem}m left</div>`); }
  if (sp.active && sp.expires > Date.now()) { const rem = Math.ceil((sp.expires - Date.now()) / 60000); eff.push(`<div style="padding:6px;border-radius:6px;background:rgba(0,240,255,.1);border:1px solid rgba(0,240,255,.2);"><span style="font-size:14px;">⚡</span> Speed 2× — ${rem}m left</div>`); }
  if (sh.active && sh.expires > Date.now()) { const rem = Math.ceil((sh.expires - Date.now()) / 60000); eff.push(`<div style="padding:6px;border-radius:6px;background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.2);"><span style="font-size:14px;">🛡️</span> Shield — ${rem}m left</div>`); }
  if (xp.active && xp.expires > Date.now()) { const rem = Math.ceil((xp.expires - Date.now()) / 60000); eff.push(`<div style="padding:6px;border-radius:6px;background:rgba(138,43,226,.1);border:1px solid rgba(138,43,226,.2);"><span style="font-size:14px;">📈</span> XP 2× — ${rem}m left</div>`); }
  document.getElementById('shopActiveEffects').innerHTML = eff.length ? eff.join('') : '<div style="color:var(--text2);font-size:12px;text-align:center;">No active effects</div>';
}

function shopBuyPotion(type) {
  const prices = { luck: 2000, speed: 3000, shield: 5000, xp: 4000 };
  const price = prices[type];
  if (!price) return;
  if (balance < price) { showToast('Not enough balance! Need $' + price.toLocaleString(), false); return; }

  balance -= price;
  updateBalDisplay();
  playClickSound();

  if (type === 'luck') {
    if (!activePotions.luck) activePotions.luck = { stacks: 0, expires: 0 };
    if (activePotions.luck.stacks >= 5 && activePotions.luck.expires > Date.now()) {
      showToast('Max 5 luck stacks!', false);
      balance += price; updateBalDisplay(); return;
    }
    activePotions.luck.stacks = Math.min(5, (activePotions.luck.stacks || 0) + 1);
    activePotions.luck.expires = Date.now() + 10 * 60 * 1000; 
    showToast('🍀 Luck Potion active! Stack: ' + activePotions.luck.stacks + '/5', true);
  } else if (type === 'speed') {
    activePotions.speed = { active: true, expires: Date.now() + 15 * 60 * 1000 };
    showToast('⚡ Speed Potion active! 2× speed for 15 min', true);
  } else if (type === 'shield') {
    activePotions.shield = { active: true, expires: Date.now() + 5 * 60 * 1000 };
    showToast('🛡️ Shield active! Loss protection for 5 min', true);
  } else if (type === 'xp') {
    activePotions.xp = { active: true, expires: Date.now() + 20 * 60 * 1000 };
    showToast('📈 XP Boost active! 2× stats for 20 min', true);
  }

  localStorage.setItem('casino_potions', JSON.stringify(activePotions));
  window._firebaseSave && firebaseSave();
  shopRefresh();
}


function getLuckBonus() {
  const lp = activePotions.luck || { stacks: 0, expires: 0 };
  if (lp.stacks > 0 && lp.expires > Date.now()) return 1 + (lp.stacks * 0.05);
  return 1;
}


function isSpeedActive() {
  const sp = activePotions.speed || { active: false, expires: 0 };
  return sp.active && sp.expires > Date.now();
}


function isShieldActive() {
  const sh = activePotions.shield || { active: false, expires: 0 };
  return sh.active && sh.expires > Date.now();
}


let serialCounter = parseInt(localStorage.getItem('casino_serial_counter')) || 100000;

function generateSerial() {
  serialCounter++;
  localStorage.setItem('casino_serial_counter', serialCounter);
  
  const hex = serialCounter.toString(16).toUpperCase().padStart(9, '0');
  return 'SN-' + hex.slice(0, 5) + '-' + hex.slice(5);
}


const _origAddToInventory = addToInventory;
addToInventory = function(itemId) {
  _origAddToInventory(itemId);
  
  if (inventory.length > 0) {
    const lastItem = inventory[inventory.length - 1];
    if (!lastItem.serial) lastItem.serial = generateSerial();
  }
};


let limitedCases = [];
let limitedCaseTimer = null;

function initLimitedCases() {
  
  const saved = JSON.parse(localStorage.getItem('casino_limited_cases')) || [];
  limitedCases = saved.filter(c => c.expires > Date.now());
  if (limitedCases.length === 0) {
    spawnLimitedCase();
  }
  renderLimitedCases();
  
  if (limitedCaseTimer) clearInterval(limitedCaseTimer);
  limitedCaseTimer = setInterval(() => {
    limitedCases = limitedCases.filter(c => c.expires > Date.now());
    if (limitedCases.length === 0) spawnLimitedCase();
    renderLimitedCases();
    localStorage.setItem('casino_limited_cases', JSON.stringify(limitedCases));
  }, 60000);
}

function spawnLimitedCase() {
  const names = ['Neon Surge', 'Void Eclipse', 'Golden Rush', 'Crimson Tide', 'Frost Bite', 'Shadow Drop', 'Star Burst'];
  const icons = ['⚡', '🌑', '🌟', '🔥', '❄️', '🖤', '💫'];
  const idx = Math.floor(Math.random() * names.length);
  const multiplier = 1.5 + Math.random() * 2; 
  const price = Math.floor((Math.random() * 9000 + 1000) / 100) * 100;
  const qty = Math.floor(Math.random() * 20) + 5; 
  const duration = (Math.random() * 20 + 10) * 60 * 1000; 

  
  const possibleItems = Object.keys(ITEM_CATALOG);
  const items = [];
  for (let i = 0; i < 10; i++) {
    const itId = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    const cat = ITEM_CATALOG[itId];
    const rar = RARITY[cat.rarity];
    items.push({ id: itId, w: Math.max(1, 15 - rar.tier * 2) });
  }

  const lc = {
    id: 'ltd_' + Date.now(),
    name: names[idx] + ' Edition',
    icon: icons[idx],
    price: price,
    items: items,
    remaining: qty,
    total: qty,
    expires: Date.now() + duration,
    valueMult: multiplier
  };
  limitedCases.push(lc);
  localStorage.setItem('casino_limited_cases', JSON.stringify(limitedCases));
  showToast('🌟 NEW LIMITED CASE: ' + lc.name + '!', true);
}

function renderLimitedCases() {
  const container = document.getElementById('limitedCasesContainer');
  if (!container) return;
  if (limitedCases.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text2);font-size:12px;padding:20px;">No limited cases available right now. Check back soon!</div>';
    return;
  }
  container.innerHTML = limitedCases.map(lc => {
    const remainMin = Math.max(0, Math.ceil((lc.expires - Date.now()) / 60000));
    return `<div style="background:linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,68,68,.05));border:1px solid rgba(255,215,0,.3);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:32px;margin-bottom:4px;">${lc.icon}</div>
      <div style="font-weight:700;color:var(--gold);font-size:13px;">${lc.name}</div>
      <div style="font-size:10px;color:var(--text2);margin:4px 0;">Boosted: ${lc.valueMult.toFixed(1)}× value</div>
      <div style="font-size:10px;color:var(--red);margin-bottom:6px;">⏱️ ${remainMin}m left · ${lc.remaining}/${lc.total} remaining</div>
      <button onclick="openLimitedCase('${lc.id}')" class="action-btn primary" style="padding:6px 14px;font-size:12px;${lc.remaining <= 0 ? 'opacity:0.4;pointer-events:none;' : ''}" ${lc.remaining <= 0 ? 'disabled' : ''}>$${lc.price.toLocaleString()}</button>
    </div>`;
  }).join('');
}

function openLimitedCase(lcId) {
  const lc = limitedCases.find(c => c.id === lcId);
  if (!lc || lc.remaining <= 0 || lc.expires < Date.now()) { showToast('Case no longer available!', false); return; }
  if (balance < lc.price) { showToast('Not enough balance!', false); return; }
  balance -= lc.price;
  updateBalDisplay();
  lc.remaining--;
  localStorage.setItem('casino_limited_cases', JSON.stringify(limitedCases));

  
  const lucky = getLuckBonus();
  let totalW = lc.items.reduce((s, it) => {
    const cat = ITEM_CATALOG[it.id];
    const rar = RARITY[cat.rarity];
    
    return s + it.w * (rar.tier >= 3 ? lucky : 1);
  }, 0);
  let rng = Math.random() * totalW;
  let wonItem = lc.items[0];
  for (const it of lc.items) {
    const cat = ITEM_CATALOG[it.id];
    const rar = RARITY[cat.rarity];
    rng -= it.w * (rar.tier >= 3 ? lucky : 1);
    if (rng <= 0) { wonItem = it; break; }
  }

  const cat = ITEM_CATALOG[wonItem.id];
  const rar = RARITY[cat.rarity];
  addToInventory(wonItem.id);
  const val = Math.floor(cat.baseValue * lc.valueMult);

  showToast(`${lc.icon} ${cat.icon} ${cat.name} (${rar.label}) — Worth ~$${val.toLocaleString()}!`, true);
  playClickSound();
  renderLimitedCases();
  window._firebaseSave && firebaseSave();
}


let cryptoPortfolio = JSON.parse(localStorage.getItem('casino_crypto')) || {};

let cryptoPrices = {};
let cryptoHistory = {};
let cryptoInterval = null;

const CRYPTO_COINS = [
  { id: 'BTC', name: 'Bitcoin', icon: '₿', basePrice: 45000, volatility: 0.03 },
  { id: 'ETH', name: 'Ethereum', icon: 'Ξ', basePrice: 2800, volatility: 0.04 },
  { id: 'DOGE', name: 'Dogecoin', icon: '🐕', basePrice: 0.15, volatility: 0.08 },
  { id: 'SOL', name: 'Solana', icon: '◎', basePrice: 120, volatility: 0.05 },
  { id: 'PEPE', name: 'PepeCoin', icon: '🐸', basePrice: 0.001, volatility: 0.12 },
  { id: 'ISLAND', name: 'IslandCoin', icon: '🏝️', basePrice: 5.50, volatility: 0.10 },
];

function initCrypto() {
  if (!cryptoInterval) {
    
    CRYPTO_COINS.forEach(c => {
      if (!cryptoPrices[c.id]) {
        cryptoPrices[c.id] = c.basePrice * (0.8 + Math.random() * 0.4);
      }
      if (!cryptoHistory[c.id]) {
        cryptoHistory[c.id] = [];
        
        let p = cryptoPrices[c.id];
        for (let i = 0; i < 30; i++) {
          p *= (1 + (Math.random() - 0.5) * c.volatility);
          cryptoHistory[c.id].push(p);
        }
      }
      if (!cryptoPortfolio[c.id]) {
        cryptoPortfolio[c.id] = { amount: 0, avgBuy: 0, totalInvested: 0 };
      }
    });

    
    cryptoInterval = setInterval(cryptoTick, 3000);
  }
  renderCrypto();
}

function cryptoTick() {
  CRYPTO_COINS.forEach(c => {
    const change = (Math.random() - 0.48) * c.volatility; 
    cryptoPrices[c.id] *= (1 + change);
    cryptoPrices[c.id] = Math.max(c.basePrice * 0.01, cryptoPrices[c.id]); 
    cryptoHistory[c.id].push(cryptoPrices[c.id]);
    if (cryptoHistory[c.id].length > 60) cryptoHistory[c.id].shift();
  });
  
  if (document.querySelector('#cryptoPanel.active')) renderCrypto();
}

function renderCrypto() {
  const panel = document.getElementById('cryptoContent');
  if (!panel) return;

  panel.innerHTML = CRYPTO_COINS.map(c => {
    const price = cryptoPrices[c.id] || c.basePrice;
    const hist = cryptoHistory[c.id] || [];
    const prev = hist.length > 1 ? hist[hist.length - 2] : price;
    const change = prev ? ((price - prev) / prev * 100) : 0;
    const isUp = change >= 0;
    const port = cryptoPortfolio[c.id] || { amount: 0, avgBuy: 0, totalInvested: 0 };
    const holdings = port.amount * price;
    const pnl = port.amount > 0 ? holdings - port.totalInvested : 0;

    
    const sparkline = cryptoSparkline(hist);

    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">${c.icon}</span>
          <div>
            <div style="font-weight:700;color:var(--text);font-size:14px;">${c.name}</div>
            <div style="font-size:10px;color:var(--text2);">${c.id}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Orbitron';font-size:14px;color:var(--text);font-weight:700;">$${cryptoFormatPrice(price)}</div>
          <div style="font-size:11px;color:${isUp ? 'var(--green)' : 'var(--red)'};">${isUp ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%</div>
        </div>
      </div>

      ${sparkline}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <div style="font-size:11px;color:var(--text2);">Holdings: ${port.amount.toFixed(6)} ${c.id} ($${cryptoFormatPrice(holdings)}) <span style="color:${pnl >= 0 ? 'var(--green)' : 'var(--red)'};">${pnl >= 0 ? '+' : ''}$${cryptoFormatPrice(pnl)}</span></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <input type="number" id="cryptoAmt_${c.id}" placeholder="$ amount" min="1" value="100" style="flex:1;padding:6px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:12px;">
        <button onclick="cryptoBuy('${c.id}')" class="action-btn primary" style="padding:6px 14px;font-size:11px;">BUY</button>
        <button onclick="cryptoSell('${c.id}')" class="action-btn danger" style="padding:6px 14px;font-size:11px;">SELL</button>
        <button onclick="cryptoSellAll('${c.id}')" class="action-btn secondary" style="padding:6px 10px;font-size:10px;">SELL ALL</button>
      </div>
    </div>`;
  }).join('');
}

function cryptoSparkline(hist) {
  if (hist.length < 2) return '';
  const w = 200, h = 40;
  const min = Math.min(...hist);
  const max = Math.max(...hist);
  const range = max - min || 1;
  const points = hist.map((v, i) => {
    const x = (i / (hist.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const isUp = hist[hist.length - 1] >= hist[0];
  const color = isUp ? '#00e676' : '#ff4444';
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display:block;max-height:40px;"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" /></svg>`;
}

function cryptoFormatPrice(p) {
  if (Math.abs(p) >= 1) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (Math.abs(p) >= 0.01) return p.toFixed(4);
  return p.toFixed(8);
}

function cryptoBuy(coinId) {
  const coin = CRYPTO_COINS.find(c => c.id === coinId);
  if (!coin) return;
  const amtInput = document.getElementById('cryptoAmt_' + coinId);
  const dollars = parseFloat(amtInput.value) || 0;
  if (dollars <= 0 || dollars > balance) { showToast('Invalid amount!', false); return; }

  const price = cryptoPrices[coinId];
  const coinAmount = dollars / price;

  balance -= dollars;
  updateBalDisplay();

  const port = cryptoPortfolio[coinId];
  port.totalInvested += dollars;
  port.amount += coinAmount;
  port.avgBuy = port.totalInvested / port.amount;

  localStorage.setItem('casino_crypto', JSON.stringify(cryptoPortfolio));
  playClickSound();
  showToast(`Bought ${coinAmount.toFixed(6)} ${coinId} for $${dollars.toLocaleString()}`, true);
  renderCrypto();
  window._firebaseSave && firebaseSave();
}

function cryptoSell(coinId) {
  const coin = CRYPTO_COINS.find(c => c.id === coinId);
  if (!coin) return;
  const amtInput = document.getElementById('cryptoAmt_' + coinId);
  const dollars = parseFloat(amtInput.value) || 0;
  if (dollars <= 0) { showToast('Enter a valid amount!', false); return; }
  const price = cryptoPrices[coinId];
  const coinAmount = dollars / price;

  const port = cryptoPortfolio[coinId];
  if (!port || port.amount <= 0) { showToast('No ' + coinId + ' to sell!', false); return; }
  if (coinAmount > port.amount) { showToast('Not enough ' + coinId + '!', false); return; }

  const originalAmount = port.amount;
  port.amount -= coinAmount;
  const sellPortion = coinAmount / originalAmount;
  port.totalInvested = Math.max(0, port.totalInvested * (1 - sellPortion));

  balance += dollars;
  updateBalDisplay();

  localStorage.setItem('casino_crypto', JSON.stringify(cryptoPortfolio));
  playClickSound();
  showToast(`Sold ${coinAmount.toFixed(6)} ${coinId} for $${dollars.toLocaleString()}`, true);
  renderCrypto();
  window._firebaseSave && firebaseSave();
}

function cryptoSellAll(coinId) {
  const port = cryptoPortfolio[coinId];
  if (!port || port.amount <= 0) { showToast('No ' + coinId + ' to sell!', false); return; }
  const price = cryptoPrices[coinId];
  const dollars = port.amount * price;

  balance += dollars;
  updateBalDisplay();
  port.amount = 0;
  port.totalInvested = 0;
  port.avgBuy = 0;

  localStorage.setItem('casino_crypto', JSON.stringify(cryptoPortfolio));
  playClickSound();
  showToast(`Sold all ${coinId} for $${Math.floor(dollars).toLocaleString()}`, true);
  renderCrypto();
  window._firebaseSave && firebaseSave();
}


setTimeout(initLimitedCases, 1000);
