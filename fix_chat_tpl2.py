#!/usr/bin/env python3
"""Fix the corrupted template literals in chat rendering - use string concat approach"""

FILE = r'c:\Users\sebmo\Downloads\island\casino.html'

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the corrupted block
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if "const adminDel = modIsStaff()" in line and "mod-chat-admin-btn" in line:
        start_idx = i
        print(f"Found start at line {i+1}")
    if start_idx is not None and "container.appendChild(el)" in line:
        end_idx = i  # this line itself stays
        print(f"Found end at line {i+1}")
        break

if start_idx is None:
    print("ERROR: Could not find corrupted block")
    exit(1)

print(f"Replacing lines {start_idx+1} to {end_idx} (exclusive)")
print(f"Old content:")
for i in range(start_idx, end_idx):
    print(f"  {i+1}: {lines[i].rstrip()}")

# Build replacement using simple string building (no nested templates)
replacement = '''      let chatAdminHtml = '';
      if (modIsStaff()) {
        chatAdminHtml += '<button class="mod-chat-admin-btn" onclick="modDeleteChatMsg(\\'' + m.id + '\\')" title="Delete message">\\ud83d\\uddd1</button>';
      }
      let modBtnHtml = '';
      if (modIsStaff() && m.uid && m.uid !== window._currentPlayerId) {
        modBtnHtml = ' <button style="font-size:9px;padding:1px 5px;background:rgba(255,50,50,.15);border:1px solid rgba(255,50,50,.3);border-radius:4px;color:#ff6644;cursor:pointer;margin-left:4px;" onclick="modOpenActionOnUser(\\'' + m.uid + '\\',\\'' + escapeHtml(m.user||'Guest') + '\\')">MOD</button>';
      }
      el.innerHTML = chatAdminHtml + '<div class="chat-msg-avatar">' + avatarContent + '</div>' +
        '<div class="chat-msg-body">' +
          '<div class="chat-msg-name' + (isGuest ? ' guest-name' : '') + '">' + escapeHtml(m.user||'Guest') + roleBadge + pBadge + ' <span class="chat-msg-time">' + timeStr + '</span>' + modBtnHtml + '</div>' +
          '<div class="chat-msg-text">' + escapeHtml(m.text) + '</div>' +
        '</div>';
'''

new_lines = [l + '\n' for l in replacement.split('\n')]
lines[start_idx:end_idx] = new_lines

with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Verify
import re
content = ''.join(lines)
scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
all_js = '\n'.join(scripts)
o = all_js.count('{')
c = all_js.count('}')
p = all_js.count('(') - all_js.count(')')
b = all_js.count('[') - all_js.count(']')
print(f"\nBraces: {o}/{c} diff={o-c}")
print(f"Parens diff: {p}, Brackets diff: {b}")
print(f"Total lines: {len(lines)}")
if o==c and p==0 and b==0:
    print("\\u2705 ALL BALANCED")
else:
    print("\\u26a0\\ufe0f MISMATCH")
