#!/usr/bin/env python3
"""
Add admin ban/warn/mute moderation system to casino.html
"""

import re

FILE = r'c:\Users\sebmo\Downloads\island\casino.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()


MOD_CSS = """
/* ============ MODERATION SYSTEM ============ */


@keyframes modShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-8px)}30%{transform:translateX(8px)}45%{transform:translateX(-5px)}60%{transform:translateX(5px)}75%{transform:translateX(-2px)}90%{transform:translateX(2px)}}
.mod-popup-icon{font-size:52px;margin-bottom:10px;}
.mod-popup-title{font-family:'Orbitron';font-size:18px;font-weight:900;letter-spacing:2px;margin-bottom:10px;}
.mod-popup-reason{font-size:13px;color:var(--text2);margin-bottom:14px;line-height:1.5;}
.mod-popup-timer{font-family:'Orbitron';font-size:22px;font-weight:700;color:var(--red);margin-bottom:8px;}
.mod-popup-sub{font-size:11px;color:var(--text2);}

.mod-warn-check{display:flex;align-items:center;gap:8px;justify-content:center;margin:14px 0 10px;cursor:pointer;font-size:12px;color:var(--text);}
.mod-warn-check input[type=checkbox]{width:16px;height:16px;accent-color:var(--gold);}


.mod-reason-btn{display:block;width:100%;padding:10px;margin-bottom:6px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;cursor:pointer;transition:all .15s;text-align:left;}
.mod-reason-btn:hover{border-color:var(--neon);background:rgba(0,240,255,.05);}
.mod-reason-input{width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;margin-bottom:8px;outline:none;box-sizing:border-box;}
.mod-reason-input:focus{border-color:var(--neon);}
.mod-dur-row{display:flex;gap:6px;margin:10px 0;flex-wrap:wrap;}
.mod-dur-btn{flex:1;min-width:60px;padding:8px 4px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:11px;cursor:pointer;text-align:center;transition:all .15s;}
.mod-dur-btn:hover,.mod-dur-btn.active{border-color:var(--neon);color:var(--neon);background:rgba(0,240,255,.08);}
.mod-dur-cancel{padding:8px 16px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text2);font-size:11px;cursor:pointer;margin-top:6px;}
.mod-dur-cancel:hover{border-color:var(--red);color:var(--red);}


.mod-panel-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,rgba(255,0,0,.06),rgba(255,136,0,.06));}
.mod-panel-title{font-family:'Orbitron';font-size:15px;color:var(--gold);letter-spacing:2px;}
.mod-panel-close{padding:6px 14px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer;font-size:12px;}
.mod-panel-close:hover{border-color:var(--red);color:var(--red);}
.mod-panel-tabs{display:flex;border-bottom:1px solid var(--border);background:rgba(0,0,0,.1);}
.mod-panel-tab{flex:1;padding:10px;text-align:center;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text2);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;}
.mod-panel-tab:hover{color:var(--text);}
.mod-panel-tab.active{color:var(--neon);border-bottom-color:var(--neon);}
.mod-panel-content{padding:16px;overflow-y:auto;max-height:calc(80vh - 120px);}
.mod-panel-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;}
.mod-panel-item-info{flex:1;min-width:0;}
.mod-panel-item-name{font-weight:700;font-size:13px;color:var(--text);}
.mod-panel-item-detail{font-size:10px;color:var(--text2);margin-top:2px;}
.mod-panel-item-actions{display:flex;gap:6px;}
.mod-panel-action{padding:5px 10px;border-radius:6px;border:none;font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;}
.mod-panel-action.red{background:rgba(255,50,50,.15);color:
.mod-panel-action.red:hover{background:rgba(255,50,50,.3);}
.mod-panel-action.green{background:rgba(0,255,136,.1);color:var(--green);border:1px solid rgba(0,255,136,.2);}
.mod-panel-action.green:hover{background:rgba(0,255,136,.2);}
.mod-panel-action.blue{background:rgba(0,150,255,.1);color:
.mod-panel-action.blue:hover{background:rgba(0,150,255,.2);}
.mod-panel-empty{text-align:center;color:var(--text2);padding:30px;font-size:13px;}
.mod-panel-search{width:100%;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;outline:none;margin-bottom:12px;box-sizing:border-box;}
.mod-panel-search:focus{border-color:var(--neon);}
.mod-chat-admin-btn{position:absolute;top:4px;right:4px;width:20px;height:20px;background:rgba(255,50,50,.7);border:none;border-radius:50%;color:
.mod-chat-admin-btn:hover{background:rgba(255,50,50,1);transform:scale(1.1);}
.chat-msg{position:relative;}
.chat-msg:hover .mod-chat-admin-btn{display:flex;}

"""

content = content.replace('\n</style>', MOD_CSS + '</style>', 1)
print("✅ CSS styles added")


MOD_HTML = """
<!-- ============ MODERATION OVERLAYS ============ -->
<!-- Ban Popup -->
<div id="modBanOverlay">
  <div class="mod-popup">
    <div class="mod-popup-icon">🚫</div>
    <div class="mod-popup-title" style="color:#ff3333;">YOU ARE BANNED</div>
    <div class="mod-popup-reason" id="modBanReason">Violation of community rules.</div>
    <div class="mod-popup-timer" id="modBanTimer"></div>
    <div class="mod-popup-sub">You will be signed out automatically.</div>
  </div>
</div>

<!-- Warning Popup -->
<div id="modWarnOverlay">
  <div class="mod-popup">
    <div class="mod-popup-icon">⚠️</div>
    <div class="mod-popup-title" style="color:#ffaa00;">YOU HAVE BEEN WARNED</div>
    <div class="mod-popup-reason" id="modWarnReason">Please follow the rules.</div>
    <label class="mod-warn-check">
      <input type="checkbox" id="modWarnAgree" onchange="document.getElementById('modWarnCloseBtn').disabled=!this.checked;">
      I understand and will follow the rules
    </label>
    <button id="modWarnCloseBtn" disabled onclick="modDismissWarning()" class="action-btn primary" style="padding:10px 24px;font-size:12px;">CLOSE</button>
  </div>
</div>

<!-- Reason Modal (shared for ban/mute/warn) -->
<div id="modReasonModal">
  <div class="mod-reason-box">
    <div class="mod-reason-title" id="modReasonTitle">SELECT REASON</div>
    <button class="mod-reason-btn" onclick="modPickReason('Spamming')">💬 Spamming</button>
    <button class="mod-reason-btn" onclick="modPickReason('Abusive Language')">🤬 Abusive Language</button>
    <button class="mod-reason-btn" onclick="modPickReason('Disruption')">💥 Disruption</button>
    <button class="mod-reason-btn" onclick="modPickReason('Harassment')">😡 Harassment</button>
    <button class="mod-reason-btn" onclick="modPickReason('Exploiting / Cheating')">🎮 Exploiting / Cheating</button>
    <input type="text" class="mod-reason-input" id="modReasonCustom" placeholder="Or type a custom reason..." maxlength="100">
    <div id="modDurationRow" class="mod-dur-row" style="display:none;">
      <button class="mod-dur-btn" onclick="modPickDuration(60)">1h</button>
      <button class="mod-dur-btn" onclick="modPickDuration(1440)">1d</button>
      <button class="mod-dur-btn active" onclick="modPickDuration(10080)">1w</button>
      <button class="mod-dur-btn" onclick="modPickDuration(43200)">30d</button>
      <button class="mod-dur-btn" onclick="modPickDuration(0)" style="color:var(--red);">PERM</button>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
      <button class="action-btn primary" onclick="modConfirmReason()" style="padding:8px 20px;font-size:12px;">CONFIRM</button>
      <button class="mod-dur-cancel" onclick="modCancelReason()">Cancel</button>
    </div>
  </div>
</div>

<!-- Moderation Panel -->
<div id="modPanel">
  <div class="mod-panel-box">
    <div class="mod-panel-header">
      <div class="mod-panel-title">🛡️ MODERATION</div>
      <button class="mod-panel-close" onclick="modClosePanel()">✕ CLOSE</button>
    </div>
    <div class="mod-panel-tabs">
      <div class="mod-panel-tab active" onclick="modSwitchTab('banned')">BANNED</div>
      <div class="mod-panel-tab" onclick="modSwitchTab('muted')">MUTED</div>
      <div class="mod-panel-tab" onclick="modSwitchTab('actions')">ACTIONS</div>
    </div>
    <div class="mod-panel-content" id="modPanelContent">
      <div class="mod-panel-empty">Loading...</div>
    </div>
  </div>
</div>

"""

content = content.replace('\n</body>', MOD_HTML + '</body>', 1)
print("✅ HTML overlays added")


mute_banner_html = '    <div id="modMuteBanner">🔇 You are muted: <span id="modMuteReason"></span> — <span id="modMuteTimer"></span></div>\n'
content = content.replace(
    '    <input class="chat-input" id="chatInput"',
    mute_banner_html + '    <input class="chat-input" id="chatInput"',
    1
)
print("✅ Mute banner added to chat")


ban_check_code = """
    // === MODERATION: Check ban status ===
    const banSnap = await get(ref(db, 'casino/bannedUsers/' + playerId));
    if (banSnap.exists()) {
      const banData = banSnap.val();
      const isPerm = !banData.until || banData.until >= 9999999999999;
      if (isPerm || banData.until > Date.now()) {
        // User is banned — sign out
        window._modShowBan && window._modShowBan(banData);
        setTimeout(() => signOut(auth), 4000);
        return;
      } else {
        // Ban expired — auto-remove
        await set(ref(db, 'casino/bannedUsers/' + playerId), null);
      }
    }
"""


content = content.replace(
    "    // Set up session ID for multiplayer\n    let pylSessionId",
    ban_check_code + "    // Set up session ID for multiplayer\n    let pylSessionId",
    1
)
print("✅ Ban check added to login flow")


mod_panel_button = """      <div style="margin-top:12px;">
        <button onclick="modOpenPanel()" style="width:100%;padding:10px;background:linear-gradient(135deg,#ff0000,#ff6600);border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:900;font-size:12px;font-family:'Orbitron';letter-spacing:1px;">🛡️ MODERATION PANEL</button>
      </div>
"""

content = content.replace(
    '    </div>\n  </div>\n</div>\n\n<!-- ============ INVENTORY OVERLAY',
    mod_panel_button + '    </div>\n  </div>\n</div>\n\n<!-- ============ INVENTORY OVERLAY',
    1
)
print("✅ Mod panel button added to admin panel")


content = content.replace(
    "function sendChatMessage() {\n  const input = document.getElementById('chatInput');\n  let text = input.value.trim();\n  if (!text) return;\n  if (isGuestMode) { showToast('Sign in to chat', false); return; }",
    "function sendChatMessage() {\n  const input = document.getElementById('chatInput');\n  let text = input.value.trim();\n  if (!text) return;\n  if (isGuestMode) { showToast('Sign in to chat', false); return; }\n  if (window._modIsMuted) { showToast('🔇 You are muted!', false); return; }",
    1
)
print("✅ Mute check added to sendChatMessage")


old_chat_el = """el.innerHTML = `<div class="chat-msg-avatar">${avatarContent}</div>
        <div class="chat-msg-body">
          <div class="chat-msg-name${isGuest?' guest-name':''}">${escapeHtml(m.user||'Guest')}${roleBadge}${pBadge} <span class="chat-msg-time">${timeStr}</span></div>
          <div class="chat-msg-text">${escapeHtml(m.text)}</div>
        </div>`;"""
new_chat_el = """const adminDel = modIsStaff() ? \`<button class="mod-chat-admin-btn" onclick="modDeleteChatMsg('\${m.key}')" title="Delete message">🗑</button>\` : '';
      el.innerHTML = \`\${adminDel}<div class="chat-msg-avatar">\${avatarContent}</div>
        <div class="chat-msg-body">
          <div class="chat-msg-name\${isGuest?' guest-name':''}">\${escapeHtml(m.user||'Guest')}\${roleBadge}\${pBadge} <span class="chat-msg-time">\${timeStr}</span>\${modIsStaff() && m.uid && m.uid !== window._currentPlayerId ? \` <button style="font-size:9px;padding:1px 5px;background:rgba(255,50,50,.15);border:1px solid rgba(255,50,50,.3);border-radius:4px;color:#ff6644;cursor:pointer;margin-left:4px;" onclick="modOpenActionOnUser('\${m.uid}','\${escapeHtml(m.user||'Guest')}')">MOD</button>\` : ''}</div>
          <div class="chat-msg-text">\${escapeHtml(m.text)}</div>
        </div>\`;"""
content = content.replace(old_chat_el, new_chat_el, 1)
print("✅ Admin buttons added to chat messages")


content = content.replace(
    "    user: username || 'Guest',\n    text: text.slice(0, 200),\n    type: type || 'msg', // 'msg', 'win', 'system'\n    ts: Date.now(),",
    "    user: username || 'Guest',\n    text: text.slice(0, 200),\n    type: type || 'msg', // 'msg', 'win', 'system'\n    uid: playerId || '',\n    ts: Date.now(),",
    1
)
print("✅ Added uid to chat messages")


chat_listener_match = re.search(r'const _chatMsgs = \[\];', content)
if chat_listener_match:
    print(f"  Found chat msgs array at pos {chat_listener_match.start()}")


old_chat_parse = "snap.forEach(child => {\n      const val = child.val();\n      _chatMsgs.push(val);"
new_chat_parse = "snap.forEach(child => {\n      const val = child.val();\n      val.key = child.key;\n      _chatMsgs.push(val);"

if old_chat_parse in content:
    content = content.replace(old_chat_parse, new_chat_parse, 1)
    print("✅ Added key to chat message objects")
else:

    print("⚠️ Could not find chat parse pattern, searching...")

    idx = content.find('_chatMsgs.push(val)')
    if idx > 0:

        context = content[max(0,idx-200):idx+50]
        print(f"  Context around push: ...{repr(context[-100:])}...")


content = content.replace(
    "  // Listen for RR PvP challenges\n  if (typeof rrListenForChallenges === 'function') rrListenForChallenges();\n};",
    "  // Listen for RR PvP challenges\n  if (typeof rrListenForChallenges === 'function') rrListenForChallenges();\n  // Start moderation watchers\n  if (typeof modStartWatchers === 'function') modStartWatchers();\n};",
    1
)
print("✅ Mod watchers added to _onAuthReady")


MOD_JS = r"""
// ============ MODERATION SYSTEM ============
const MOD_ADMINS = ['mojheh', 'terpez']; // hardcoded staff

function modIsStaff() {
  const name = (window._currentUsername || '').toLowerCase();
  return MOD_ADMINS.includes(name);
}

function modGetStaffLevel() {
  const name = (window._currentUsername || '').toLowerCase();
  if (name === 'mojheh') return 'owner';
  if (name === 'terpez') return 'co-owner';
  return null;
}

// === Show Ban Popup ===
window._modShowBan = function(banData) {
  const overlay = document.getElementById('modBanOverlay');
  const reasonEl = document.getElementById('modBanReason');
  const timerEl = document.getElementById('modBanTimer');
  reasonEl.textContent = banData.reason || 'Violation of community rules.';
  const isPerm = !banData.until || banData.until >= 9999999999999;
  if (isPerm) {
    timerEl.textContent = 'PERMANENT';
    timerEl.style.color = '#ff3333';
  } else {
    const remaining = banData.until - Date.now();
    function updateBanTimer() {
      const left = banData.until - Date.now();
      if (left <= 0) { timerEl.textContent = 'Expired'; return; }
      const h = Math.floor(left / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      timerEl.textContent = `${h}h ${m}m ${s}s remaining`;
    }
    updateBanTimer();
    setInterval(updateBanTimer, 1000);
  }
  overlay.style.display = 'flex';
};

// === Mute State ===
window._modIsMuted = false;
let _modMuteUnsub = null;
let _modBanUnsub = null;
let _modWarnUnsub = null;

function modStartWatchers() {
  const uid = window._currentPlayerId;
  if (!uid) return;

  // Watch ban status
  if (_modBanUnsub) { try { _modBanUnsub(); } catch(e){} }
  _modBanUnsub = window._fbOnValue('casino/bannedUsers/' + uid, (snap) => {
    if (!snap.exists()) return;
    const d = snap.val();
    const isPerm = !d.until || d.until >= 9999999999999;
    if (isPerm || d.until > Date.now()) {
      window._modShowBan(d);
      setTimeout(() => { if (window._authLogout) window._authLogout(); }, 4000);
    }
  });

  // Watch mute status
  if (_modMuteUnsub) { try { _modMuteUnsub(); } catch(e){} }
  _modMuteUnsub = window._fbOnValue('casino/mutedUsers/' + uid, (snap) => {
    if (!snap.exists()) {
      window._modIsMuted = false;
      document.getElementById('modMuteBanner').style.display = 'none';
      const ci = document.getElementById('chatInput');
      const cb = document.getElementById('chatSendBtn');
      if (ci) ci.disabled = false;
      if (cb) cb.disabled = false;
      return;
    }
    const d = snap.val();
    if (d.until && d.until <= Date.now()) {
      // Expired — remove it
      window._fbRemove('casino/mutedUsers/' + uid);
      window._modIsMuted = false;
      return;
    }
    window._modIsMuted = true;
    const banner = document.getElementById('modMuteBanner');
    document.getElementById('modMuteReason').textContent = d.reason || 'No reason given';
    banner.style.display = 'block';
    const ci = document.getElementById('chatInput');
    const cb = document.getElementById('chatSendBtn');
    if (ci) { ci.disabled = true; ci.placeholder = 'You are muted...'; }
    if (cb) cb.disabled = true;
    // Timer
    if (d.until) {
      const updateMuteTimer = () => {
        const left = d.until - Date.now();
        if (left <= 0) {
          window._fbRemove('casino/mutedUsers/' + uid);
          return;
        }
        const m = Math.floor(left / 60000);
        const s = Math.floor((left % 60000) / 1000);
        document.getElementById('modMuteTimer').textContent = `${m}m ${s}s left`;
      };
      updateMuteTimer();
      const iv = setInterval(() => {
        if (!window._modIsMuted) { clearInterval(iv); return; }
        updateMuteTimer();
      }, 1000);
    } else {
      document.getElementById('modMuteTimer').textContent = 'Permanent';
    }
  });

  // Watch warnings
  if (_modWarnUnsub) { try { _modWarnUnsub(); } catch(e){} }
  _modWarnUnsub = window._fbOnValue('casino/warnings/' + uid, (snap) => {
    if (!snap.exists()) return;
    const d = snap.val();
    if (!d.active) return;
    const overlay = document.getElementById('modWarnOverlay');
    document.getElementById('modWarnReason').textContent = d.reason || 'Please follow the rules.';
    document.getElementById('modWarnAgree').checked = false;
    document.getElementById('modWarnCloseBtn').disabled = true;
    overlay.style.display = 'flex';
  });
}

function modDismissWarning() {
  document.getElementById('modWarnOverlay').style.display = 'none';
  const uid = window._currentPlayerId;
  if (uid) window._fbRemove('casino/warnings/' + uid);
}

// === Admin Actions ===
let _modActionType = null; // 'ban', 'mute', 'warn'
let _modActionTargetUid = null;
let _modActionTargetName = null;
let _modSelectedDuration = 10080; // default 1 week (in minutes)

function modOpenActionOnUser(uid, username) {
  if (!modIsStaff()) { showToast('Staff only!', false); return; }
  // Show a quick action menu
  const menu = document.createElement('div');
  menu.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);z-index:100002;background:var(--surface);border:2px solid var(--gold);border-radius:16px;padding:20px;text-align:center;min-width:260px;box-shadow:0 0 40px rgba(0,0,0,.5);';
  menu.innerHTML = `
    <div style="font-family:'Orbitron';font-size:13px;color:var(--gold);margin-bottom:4px;">🛡️ MOD ACTIONS</div>
    <div style="font-size:12px;color:var(--text);margin-bottom:14px;">Target: <b>${username}</b></div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="action-btn" style="padding:10px;font-size:12px;background:linear-gradient(135deg,#ff3333,#cc0000);" onclick="this.closest('div[style]').remove();modStartAction('ban','${uid}','${username}');">🚫 BAN</button>
      <button class="action-btn" style="padding:10px;font-size:12px;background:linear-gradient(135deg,#ff8800,#cc6600);" onclick="this.closest('div[style]').remove();modStartAction('mute','${uid}','${username}');">🔇 MUTE</button>
      <button class="action-btn" style="padding:10px;font-size:12px;background:linear-gradient(135deg,#ffaa00,#cc8800);" onclick="this.closest('div[style]').remove();modStartAction('warn','${uid}','${username}');">⚠️ WARN</button>
      <button style="padding:8px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text2);cursor:pointer;font-size:11px;" onclick="this.closest('div[style]').remove();">Cancel</button>
    </div>`;
  document.body.appendChild(menu);
  setTimeout(() => { if (menu.parentNode) menu.remove(); }, 30000);
}

function modStartAction(type, uid, username) {
  if (!modIsStaff()) return;
  _modActionType = type;
  _modActionTargetUid = uid;
  _modActionTargetName = username;
  _modSelectedDuration = 10080;

  const modal = document.getElementById('modReasonModal');
  const titleEl = document.getElementById('modReasonTitle');
  const durRow = document.getElementById('modDurationRow');
  document.getElementById('modReasonCustom').value = '';

  if (type === 'ban') {
    titleEl.textContent = '🚫 BAN — ' + username;
    durRow.style.display = 'flex';
  } else if (type === 'mute') {
    titleEl.textContent = '🔇 MUTE — ' + username;
    durRow.style.display = 'flex';
  } else {
    titleEl.textContent = '⚠️ WARN — ' + username;
    durRow.style.display = 'none';
  }

  // Reset duration buttons
  durRow.querySelectorAll('.mod-dur-btn').forEach(b => b.classList.remove('active'));
  durRow.querySelector('.mod-dur-btn:nth-child(3)').classList.add('active'); // 1w default

  modal.style.display = 'flex';
}

function modPickReason(reason) {
  document.getElementById('modReasonCustom').value = reason;
}

function modPickDuration(mins) {
  _modSelectedDuration = mins;
  const durRow = document.getElementById('modDurationRow');
  durRow.querySelectorAll('.mod-dur-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function modCancelReason() {
  document.getElementById('modReasonModal').style.display = 'none';
  _modActionType = null;
  _modActionTargetUid = null;
  _modActionTargetName = null;
}

async function modConfirmReason() {
  if (!modIsStaff()) return;
  const reason = document.getElementById('modReasonCustom').value.trim() || 'No reason specified';
  const uid = _modActionTargetUid;
  const username = _modActionTargetName;
  const type = _modActionType;

  if (!uid || !type) { modCancelReason(); return; }

  document.getElementById('modReasonModal').style.display = 'none';

  try {
    if (type === 'ban') {
      const until = _modSelectedDuration === 0 ? 9999999999999 : Date.now() + _modSelectedDuration * 60000;
      await window._fbSet('casino/bannedUsers/' + uid, {
        until: until,
        reason: reason,
        bannedBy: window._currentUsername || 'Admin',
        bannedAt: Date.now(),
        username: username
      });
      const durText = _modSelectedDuration === 0 ? 'PERMANENTLY' : `for ${formatDuration(_modSelectedDuration * 60000)}`;
      showToast(`🚫 Banned ${username} ${durText}`, true);
    } else if (type === 'mute') {
      const until = _modSelectedDuration === 0 ? 9999999999999 : Date.now() + _modSelectedDuration * 60000;
      await window._fbSet('casino/mutedUsers/' + uid, {
        until: until,
        reason: reason,
        mutedBy: window._currentUsername || 'Admin',
        mutedAt: Date.now(),
        username: username
      });
      const durText = _modSelectedDuration === 0 ? 'PERMANENTLY' : `for ${formatDuration(_modSelectedDuration * 60000)}`;
      showToast(`🔇 Muted ${username} ${durText}`, true);
    } else if (type === 'warn') {
      await window._fbSet('casino/warnings/' + uid, {
        active: true,
        reason: reason,
        warnedBy: window._currentUsername || 'Admin',
        warnedAt: Date.now(),
        username: username
      });
      showToast(`⚠️ Warning sent to ${username}`, true);
    }
  } catch(e) {
    console.error('Mod action error:', e);
    showToast('❌ Failed: ' + (e.message || 'Unknown error'), false);
  }

  _modActionType = null;
  _modActionTargetUid = null;
  _modActionTargetName = null;
}

function formatDuration(ms) {
  if (ms >= 86400000) return Math.floor(ms / 86400000) + 'd';
  if (ms >= 3600000) return Math.floor(ms / 3600000) + 'h';
  if (ms >= 60000) return Math.floor(ms / 60000) + 'm';
  return Math.floor(ms / 1000) + 's';
}

// === Delete Chat Message ===
async function modDeleteChatMsg(key) {
  if (!modIsStaff()) return;
  try {
    await window._fbRemove('casino/chat/' + key);
    showToast('🗑 Message deleted', true);
  } catch(e) {
    showToast('❌ Failed to delete', false);
  }
}

// === Moderation Panel ===
let _modPanelTab = 'banned';

function modOpenPanel() {
  if (!modIsStaff()) { showToast('Staff only!', false); return; }
  document.getElementById('modPanel').style.display = 'flex';
  modSwitchTab('banned');
}

function modClosePanel() {
  document.getElementById('modPanel').style.display = 'none';
}

function modSwitchTab(tab) {
  _modPanelTab = tab;
  document.querySelectorAll('.mod-panel-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mod-panel-tab').forEach(t => {
    if (t.textContent.trim().toLowerCase() === tab ||
        (tab === 'banned' && t.textContent.includes('BANNED')) ||
        (tab === 'muted' && t.textContent.includes('MUTED')) ||
        (tab === 'actions' && t.textContent.includes('ACTIONS'))) {
      t.classList.add('active');
    }
  });
  modRenderPanel();
}

async function modRenderPanel() {
  const container = document.getElementById('modPanelContent');
  container.innerHTML = '<div class="mod-panel-empty">Loading...</div>';

  try {
    if (_modPanelTab === 'banned') {
      const snap = await window._fbGet('casino/bannedUsers');
      if (!snap.exists()) { container.innerHTML = '<div class="mod-panel-empty">No banned users</div>'; return; }
      let html = '';
      const data = snap.val();
      for (const [uid, d] of Object.entries(data)) {
        const isPerm = !d.until || d.until >= 9999999999999;
        const expired = !isPerm && d.until <= Date.now();
        if (expired) { window._fbRemove('casino/bannedUsers/' + uid); continue; }
        const timeLeft = isPerm ? '<span style="color:#ff3333;">PERMANENT</span>' : formatDuration(d.until - Date.now()) + ' left';
        html += `<div class="mod-panel-item">
          <div class="mod-panel-item-info">
            <div class="mod-panel-item-name">${d.username || uid.slice(0,8)}</div>
            <div class="mod-panel-item-detail">Reason: ${d.reason || '—'} · ${timeLeft} · By: ${d.bannedBy || '?'}</div>
          </div>
          <div class="mod-panel-item-actions">
            <button class="mod-panel-action green" onclick="modUnbanUser('${uid}')">UNBAN</button>
          </div>
        </div>`;
      }
      container.innerHTML = html || '<div class="mod-panel-empty">No banned users</div>';
    } else if (_modPanelTab === 'muted') {
      const snap = await window._fbGet('casino/mutedUsers');
      if (!snap.exists()) { container.innerHTML = '<div class="mod-panel-empty">No muted users</div>'; return; }
      let html = '';
      const data = snap.val();
      for (const [uid, d] of Object.entries(data)) {
        const isPerm = !d.until || d.until >= 9999999999999;
        const expired = !isPerm && d.until <= Date.now();
        if (expired) { window._fbRemove('casino/mutedUsers/' + uid); continue; }
        const timeLeft = isPerm ? '<span style="color:#ff8800;">PERMANENT</span>' : formatDuration(d.until - Date.now()) + ' left';
        html += `<div class="mod-panel-item">
          <div class="mod-panel-item-info">
            <div class="mod-panel-item-name">${d.username || uid.slice(0,8)}</div>
            <div class="mod-panel-item-detail">Reason: ${d.reason || '—'} · ${timeLeft} · By: ${d.mutedBy || '?'}</div>
          </div>
          <div class="mod-panel-item-actions">
            <button class="mod-panel-action green" onclick="modUnmuteUser('${uid}')">UNMUTE</button>
          </div>
        </div>`;
      }
      container.innerHTML = html || '<div class="mod-panel-empty">No muted users</div>';
    } else if (_modPanelTab === 'actions') {
      container.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:var(--text2);letter-spacing:1px;margin-bottom:8px;">QUICK ACTION BY USERNAME</div>
          <div style="display:flex;gap:6px;">
            <input type="text" id="modActionUsername" placeholder="Enter username..." class="mod-panel-search" style="margin-bottom:0;">
            <button class="mod-panel-action blue" style="white-space:nowrap;padding:8px 14px;" onclick="modLookupUser()">LOOKUP</button>
          </div>
        </div>
        <div id="modLookupResult"></div>
        <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">
          <div style="font-size:11px;color:var(--text2);letter-spacing:1px;margin-bottom:8px;">BULK ACTIONS</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="mod-panel-action red" onclick="modUnbanAll()">UNBAN ALL</button>
            <button class="mod-panel-action red" onclick="modUnmuteAll()">UNMUTE ALL</button>
          </div>
        </div>`;
    }
  } catch(e) {
    container.innerHTML = '<div class="mod-panel-empty">Error: ' + (e.message || 'Unknown') + '</div>';
  }
}

async function modLookupUser() {
  const username = document.getElementById('modActionUsername').value.trim();
  if (!username) { showToast('Enter a username', false); return; }
  const resultDiv = document.getElementById('modLookupResult');
  resultDiv.innerHTML = '<div style="color:var(--text2);font-size:12px;">Looking up...</div>';
  try {
    const snap = await window._fbGet('casino/usernames/' + username.toLowerCase());
    if (!snap.exists()) { resultDiv.innerHTML = '<div style="color:var(--red);font-size:12px;">User not found</div>'; return; }
    const uid = snap.val();
    // Check current status
    const [banSnap, muteSnap] = await Promise.all([
      window._fbGet('casino/bannedUsers/' + uid),
      window._fbGet('casino/mutedUsers/' + uid)
    ]);
    const isBanned = banSnap.exists();
    const isMuted = muteSnap.exists();
    resultDiv.innerHTML = `
      <div class="mod-panel-item" style="margin:0;">
        <div class="mod-panel-item-info">
          <div class="mod-panel-item-name">${username} <span style="font-size:10px;color:var(--text2);">${uid.slice(0,12)}...</span></div>
          <div class="mod-panel-item-detail">
            Status: ${isBanned ? '<span style="color:#ff3333;">BANNED</span>' : '<span style="color:var(--green);">Not banned</span>'} ·
            ${isMuted ? '<span style="color:#ff8800;">MUTED</span>' : '<span style="color:var(--green);">Not muted</span>'}
          </div>
        </div>
        <div class="mod-panel-item-actions" style="flex-wrap:wrap;">
          ${isBanned ? `<button class="mod-panel-action green" onclick="modUnbanUser('${uid}');modLookupUser();">UNBAN</button>` : `<button class="mod-panel-action red" onclick="modStartAction('ban','${uid}','${username}')">BAN</button>`}
          ${isMuted ? `<button class="mod-panel-action green" onclick="modUnmuteUser('${uid}');modLookupUser();">UNMUTE</button>` : `<button class="mod-panel-action red" onclick="modStartAction('mute','${uid}','${username}')">MUTE</button>`}
          <button class="mod-panel-action blue" onclick="modStartAction('warn','${uid}','${username}')">WARN</button>
        </div>
      </div>`;
  } catch(e) {
    resultDiv.innerHTML = '<div style="color:var(--red);font-size:12px;">Error: ' + (e.message || 'Unknown') + '</div>';
  }
}

async function modUnbanUser(uid) {
  if (!modIsStaff()) return;
  try {
    await window._fbRemove('casino/bannedUsers/' + uid);
    showToast('✅ User unbanned', true);
    if (_modPanelTab === 'banned') modRenderPanel();
  } catch(e) { showToast('❌ Failed', false); }
}

async function modUnmuteUser(uid) {
  if (!modIsStaff()) return;
  try {
    await window._fbRemove('casino/mutedUsers/' + uid);
    showToast('✅ User unmuted', true);
    if (_modPanelTab === 'muted') modRenderPanel();
  } catch(e) { showToast('❌ Failed', false); }
}

async function modUnbanAll() {
  if (!modIsStaff()) return;
  if (!confirm('Unban ALL users?')) return;
  try {
    await window._fbRemove('casino/bannedUsers');
    showToast('✅ All users unbanned', true);
    modRenderPanel();
  } catch(e) { showToast('❌ Failed', false); }
}

async function modUnmuteAll() {
  if (!modIsStaff()) return;
  if (!confirm('Unmute ALL users?')) return;
  try {
    await window._fbRemove('casino/mutedUsers');
    showToast('✅ All users unmuted', true);
    modRenderPanel();
  } catch(e) { showToast('❌ Failed', false); }
}

"""

content = content.replace(
    '// ============ SETTINGS ============',
    MOD_JS + '// ============ SETTINGS ============',
    1
)
print("✅ Moderation JavaScript added")


with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)


lines = content.splitlines()
print(f"\n📊 Final file: {len(lines)} lines")


import re
scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
all_js = '\n'.join(scripts)
o = all_js.count('{')
c = all_js.count('}')
p = all_js.count('(') - all_js.count(')')
b = all_js.count('[') - all_js.count(']')
print(f"Braces: {o} open, {c} close, diff={o-c}")
print(f"Parens diff: {p}, Brackets diff: {b}")

if o == c and p == 0 and b == 0:
    print("\n✅ ALL BRACKETS BALANCED — File is clean!")
else:
    print("\n⚠️ BRACKET MISMATCH DETECTED")
