"""
Strip comments from casino.html safely.
Preserves strings (single, double, backtick), URLs, and template literals.
"""

import re

path = r'c:\Users\sebmo\Downloads\island\casino.html'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original_lines = len(content.splitlines())


def strip_line_comment(line):
    i = 0
    in_str = None
    while i < len(line):
        c = line[i]
        if in_str:
            if c == '\\' and i + 1 < len(line):
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ('"', "'", '`'):
            in_str = c
            i += 1
            continue
        if c == '/' and i + 1 < len(line) and line[i + 1] == '/':
            if i > 0 and line[i - 1] == ':':
                i += 1
                continue
            return line[:i]
        i += 1
    return line


def strip_inline_block(line):
    result = []
    i = 0
    in_str = None
    while i < len(line):
        c = line[i]
        if in_str:
            result.append(c)
            if c == '\\' and i + 1 < len(line):
                result.append(line[i + 1])
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ('"', "'", '`'):
            in_str = c
            result.append(c)
            i += 1
            continue
        if c == '/' and i + 1 < len(line) and line[i + 1] == '*':
            end = line.find('*/', i + 2)
            if end != -1:
                i = end + 2
                continue
            else:
                result.append(c)
                i += 1
                continue
        result.append(c)
        i += 1
    return ''.join(result)


def find_unclosed_block_start(line):
    i = 0
    in_str = None
    while i < len(line):
        c = line[i]
        if in_str:
            if c == '\\' and i + 1 < len(line):
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ('"', "'", '`'):
            in_str = c
            i += 1
            continue
        if c == '/' and i + 1 < len(line) and line[i + 1] == '*':
            end = line.find('*/', i + 2)
            if end == -1:
                return i
            else:
                i = end + 2
                continue
        i += 1
    return None


content = re.sub(r'<!--[\s\S]*?-->', '', content)

lines = content.split('\n')
out = []
in_block = False

for line in lines:
    if in_block:
        end_idx = line.find('*/')
        if end_idx != -1:
            in_block = False
            line = line[end_idx + 2:]
        else:
            continue

    line = strip_inline_block(line)

    bc = find_unclosed_block_start(line)
    if bc is not None:
        line = line[:bc]
        in_block = True

    line = strip_line_comment(line)
    out.append(line.rstrip())

final = []
blank = 0
for line in out:
    if line.strip() == '':
        blank += 1
        if blank <= 1:
            final.append(line)
    else:
        blank = 0
        final.append(line)

result = '\n'.join(final)

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(result)

new_lines = len(final)
print(f"Done. {original_lines} -> {new_lines} lines (removed {original_lines - new_lines})")

checks = ['initializeApp', 'firebaseConfig', 'type="module"', 'gstatic.com', '${']
for c in checks:
    if c in result:
        print(f"  OK: '{c}' found")
    else:
        print(f"  MISSING: '{c}' NOT FOUND!")
