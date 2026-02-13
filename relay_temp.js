// ============================================
//  EPSTEIN CHAT RELAY — runs on your PC
//  Watches Firebase for chat requests,
//  sends them to Ollama, writes responses back.
//  Keep this running while you want the chat online.
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, set, onChildAdded, onValue, remove } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

// Can't use ES modules directly in Node, so let's use a plain Node script instead.
