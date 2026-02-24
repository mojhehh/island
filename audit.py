import re
c = open(r'c:\Users\sebmo\Downloads\island\casino.html', 'r', encoding='utf-8').read()
lines = c.split('\n')
print(f'Total lines: {len(lines)}')
print()

# 1. Missing firebaseSave after balance wins
print('=== Balance changes without firebaseSave nearby ===')
for i, line in enumerate(lines):
    s = line.strip()
    if ('balance+=' in s.replace(' ','') or 'balance +=' in s) and 'payout' not in s.lower() and 'safeNum' not in s:
        ctx = '\n'.join(lines[i:min(i+6, len(lines))])
        if 'firebaseSave' not in ctx and 'recordGame' not in ctx:
            if 'balance+=0' not in s.replace(' ','') and '//' not in s[:s.index('balance')] if 'balance' in s else True:
                print(f'  L{i+1}: {s[:100]}')

print()

# 2. Missing onclick handlers
print('=== onclick references to undefined functions ===')
onclicks = set(re.findall(r'onclick="(\w+)\(', c))
func_defs = set(re.findall(r'function\s+(\w+)\s*\(', c))
window_defs = set(re.findall(r'window\.(\w+)\s*=\s*(?:function|\()', c))
all_defs = func_defs | window_defs
for f in sorted(onclicks - all_defs):
    if len(f) > 2:
        count = c.count(f'onclick="{f}(')
        print(f'  {f}() - {count} onclick refs, NOT DEFINED')

print()

# 3. getElementById on elements that might not exist
print('=== IDs referenced but not in HTML ===')
html_ids = set(re.findall(r'id="(\w+)"', c[:4000])) | set(re.findall(r"id='(\w+)'", c[:4000]))
# Get all id= from full file
all_html_ids = set(re.findall(r'id="([^"]+)"', c)) | set(re.findall(r"id='([^']+)'", c))
js_ids = set(re.findall(r"getElementById\('([^']+)'\)", c))
missing_ids = js_ids - all_html_ids
for mid in sorted(missing_ids)[:20]:
    locs = [i+1 for i,l in enumerate(lines) if f"getElementById('{mid}')" in l]
    print(f'  #{mid} - referenced at lines {locs[:3]}, NOT IN HTML')

print()

# 4. Unclosed/leaked listeners
print('=== Firebase listeners without cleanup ===')
onvalue_calls = [(i+1, lines[i].strip()[:80]) for i,l in enumerate(lines) if '_fbOnValue(' in l or 'onValue(' in l]
print(f'  Total onValue listeners: {len(onvalue_calls)}')
for ln, txt in onvalue_calls:
    print(f'  L{ln}: {txt}')

print()

# 5. Check for dangerous eval/innerHTML XSS
print('=== innerHTML with user input (XSS risk) ===')
for i, line in enumerate(lines):
    if '.innerHTML' in line and ('username' in line.lower() or 'chatMsg' in line.lower() or 'input' in line.lower()):
        if 'textContent' not in line:
            print(f'  L{i+1}: {line.strip()[:100]}')

print()

# 6. Crash game issues
print('=== Crash game checks ===')
crash_start = None
for i, line in enumerate(lines):
    if 'CRASH' in line and 'function' in line:
        crash_start = i
    if crash_start and i < crash_start + 200:
        if 'NaN' in line or 'Infinity' in line:
            print(f'  L{i+1}: {line.strip()[:100]}')

# 7. Check for negative bet exploits
print()
print('=== Negative/zero bet exploits ===')
for i, line in enumerate(lines):
    s = line.strip()
    if 'balance-=bet' in s.replace(' ','') or 'balance -= bet' in s:
        # Check for bet <= 0 guard
        prev = '\n'.join(lines[max(0,i-10):i])
        if 'bet<=0' not in prev.replace(' ','') and 'bet<=' not in prev and 'bet>0' not in prev.replace(' ',''):
            print(f'  L{i+1}: No bet>0 check before: {s[:80]}')

# 8. Check parseFloat without fallback leading to NaN
print()
print('=== parseFloat without NaN guard ===')
for i, line in enumerate(lines):
    if 'parseFloat(' in line and '||' not in line and 'NaN' not in line:
        s = line.strip()
        if ('bet' in s.lower() or 'amount' in s.lower()) and 'const bet' not in s and 'let bet' not in s:
            print(f'  L{i+1}: {s[:100]}')

# 9. Check for games that don't disable buttons during play
print()
print('=== Games missing in-progress lock ===')
game_funcs = ['playMines','towerClick','kenoPlay','limboBet','coinFlip','baccDeal','playPlinko','hiloGuess','pokerDeal']
for gf in game_funcs:
    # Find function and check first few lines for a lock
    pattern = f'function {gf}'
    for i, line in enumerate(lines):
        if pattern in line:
            body = '\n'.join(lines[i:i+8])
            has_lock = any(w in body for w in ['return;','spinning','running','playing','active','inProgress','dealing','disabled','isPlaying'])
            if not has_lock:
                print(f'  {gf}() at L{i+1}: No in-progress guard found')
            break

# 10. Double bet deduction 
print()
print('=== Potential double-deduction (balance -= bet appears multiple times in same function) ===')
func_starts = [(m.start(), m.group(1)) for m in re.finditer(r'function\s+(\w+)\s*\(', c)]
for idx, (pos, name) in enumerate(func_starts):
    end = func_starts[idx+1][0] if idx+1 < len(func_starts) else len(c)
    body = c[pos:end]
    deductions = len(re.findall(r'balance\s*-=\s*bet', body))
    if deductions > 1:
        print(f'  {name}(): {deductions} bet deductions')

# 11. Check for missing game stat tracking
print()
print('=== Games without recordGame call ===')
game_names = ['slots','crash','roulette','blackjack','plinko','mines','dice','tower','coinflip','keno','limbo','poker','horses','scratch','wheel','baccarat','hilo']
for gn in game_names:
    count = c.count(f"recordGame('{gn}'")
    if count == 0:
        print(f'  {gn}: NO recordGame calls')

# 12. Check for maxBet bypass
print()
print('=== Games without checkMaxBet ===')
bet_games = [('spinSlots','Slots'),('spinRoulette','Roulette'),('playMines','Mines'),('diceBet','Dice'),('wheelSpin','Wheel'),('baccDeal','Baccarat'),('kenoPlay','Keno'),('limboBet','Limbo'),('coinFlip','Coinflip'),('towerBet','Tower'),('pokerDeal','Poker'),('hiloStart','Hilo'),('crashBet','Crash')]
for func, label in bet_games:
    for i, line in enumerate(lines):
        if f'function {func}' in line:
            body = '\n'.join(lines[i:i+15])
            if 'checkMaxBet' not in body:
                print(f'  {func}(): No checkMaxBet for {label}')
            break

# 13. Check for stock market issues
print()
print('=== Stock market checks ===')
for i, line in enumerate(lines):
    if 'stockPrice' in line and ('NaN' in line or '<0' in line or '< 0' in line or 'negative' in line):
        print(f'  L{i+1}: {line.strip()[:100]}')
# Check if stocks can go negative
for i, line in enumerate(lines):
    if 'stockPrice' in line and '-=' in line:
        print(f'  L{i+1} stock price decrement: {line.strip()[:100]}')

print()
print('=== DONE ===')
