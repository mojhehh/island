import re

path = r'c:\Users\sebmo\Downloads\island\casino.html'
lines = open(path, 'r', encoding='utf-8').readlines()

# Find the phone case line
phone_line = None
pvp_overrides_line = None
for i, line in enumerate(lines):
    if "case 'phone': {" in line and i > 11700:
        phone_line = i
        print(f"Phone case at line {i+1}")
    if '// PvP overrides for buttons' in line:
        pvp_overrides_line = i
        print(f"PvP overrides at line {i+1}")

if phone_line is None:
    print("ERROR: Could not find phone case")
    exit(1)
if pvp_overrides_line is None:
    print("ERROR: Could not find PvP overrides")
    exit(1)

# The phone case starts at phone_line (0-indexed)
# Everything from phone_line+1 to pvp_overrides_line-1 is corrupted RR PvP code
# We need to:
# 1. Replace phone case body with correct MPBSR phone logic
# 2. Close the case, switch, and function
# 3. Have PvP overrides at top level (they already are in the file, just need proper context)

# Build the replacement for lines phone_line through pvp_overrides_line-1
new_phone_block = """    case 'phone': {
      const shells = g.shells.split(',');
      const remaining = shells.slice(g.shellIdx || 0);
      if (remaining.length > 1) {
        const randIdx = 1 + Math.floor(Math.random() * (remaining.length - 1));
        const reveal = remaining[randIdx];
        await window._fbSet('casino/bsrGames/' + gid + '/log/' + lk, {
          msg: `📱 ${myName} uses Burner Phone...`, color: 'var(--neon)'
        });
        showToast(`Shell #${(g.shellIdx || 0) + randIdx + 1}: ${reveal === 'live' ? '🔴 LIVE' : '🔵 BLANK'}`, reveal !== 'live');
      } else {
        showToast('No other shells to reveal!', false);
      }
      break;
    }
  }
  await window._fbUpdate('casino/bsrGames/' + gid, updates);
}

"""

# Replace from phone_line to pvp_overrides_line (exclusive)
new_lines = lines[:phone_line] + [new_phone_block] + lines[pvp_overrides_line:]

open(path, 'w', encoding='utf-8').writelines(new_lines)
print(f"Replaced lines {phone_line+1} to {pvp_overrides_line} with corrected phone case + closing braces")
print(f"New total lines: {len(open(path, 'r', encoding='utf-8').readlines())}")
