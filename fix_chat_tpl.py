#!/usr/bin/env python3
"""Fix the corrupted template literals in chat rendering"""

FILE = r'c:\Users\sebmo\Downloads\island\casino.html'

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()


for i, line in enumerate(lines):
    if "const adminDel = modIsStaff()" in line and "mod-chat-admin-btn" in line:
        print(f"Found corrupted adminDel at line {i+1}: {line.rstrip()[:80]}...")


        end_idx = i
        for j in range(i, min(i+10, len(lines))):
            if "container.appendChild(el)" in lines[j]:
                end_idx = j
                break

        print(f"Replacing lines {i+1} through {end_idx}")


        new_lines = [
            '      const adminDel = modIsStaff() ? `<button class="mod-chat-admin-btn" onclick="modDeleteChatMsg(\'` + m.id + `\')" title="Delete message">\ud83d\uddd1</button>` : \'\';\n',
            '      const modBtn = (modIsStaff() && m.uid && m.uid !== window._currentPlayerId) ? ` <button style="font-size:9px;padding:1px 5px;background:rgba(255,50,50,.15);border:1px solid rgba(255,50,50,.3);border-radius:4px;color:#ff6644;cursor:pointer;margin-left:4px;" onclick="modOpenActionOnUser(\'` + m.uid + `\',\'` + escapeHtml(m.user||\'Guest\') + `\')">MOD</button>` : \'\';\n',
            '      el.innerHTML = adminDel + `<div class="chat-msg-avatar">${avatarContent}</div>\n',
            '        <div class="chat-msg-body">\n',
            '          <div class="chat-msg-name${isGuest?\' guest-name\':\'\'}">${escapeHtml(m.user||\'Guest\')}${roleBadge}${pBadge} <span class="chat-msg-time">${timeStr}</span>` + modBtn + `</div>\n',
            '          <div class="chat-msg-text">${escapeHtml(m.text)}</div>\n',
            '        </div>`;\n',
        ]

        lines[i:end_idx] = new_lines
        print(f"Replaced with {len(new_lines)} lines")
        break

with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(lines)


import re
content = ''.join(lines)
scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
all_js = '\n'.join(scripts)
o = all_js.count('{')
c = all_js.count('}')
print(f"Braces: {o} open, {c} close, diff={o-c}")
print(f"Total lines: {len(lines)}")
