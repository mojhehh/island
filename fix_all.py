import re

file_path = r"c:\Users\sebmo\Downloads\island\casino.html"

with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()

orig_len = len(c)
fixes = 0

# ── FIX 1: Roulette readback ──
# Replace the corrupted section with correct predetermined payout
old_roul = """      document.getElementById('roulSpinBtn').disabled=false;
Use the PREDETERMINED winner \u2014 not visual readback \u2014 to avoid mismatch bugs
      const fNum=winNum;
      const fRed=isActuallyRed;
      const fGreen=isActuallyGreenas(fNum);
      const fGreen=fNum===0;

      const colorLabel=fGreen?'\U0001f49a Green':(fRed?'\U0001f534 Red':'\u26ab Black');
      const colorCSS=fGreen?'var(--green)':(fRed?'#ff5555':'#ccc');
      document.getElementById('rouletteResult').innerHTML=
        '<span style="color:'+colorCSS+'">'+fNum+' \u2014 '+colorLabel+'</span>';

      let won=false;
      if(selectedRoulBet==='red'&&fRed)won=true;
      if(selectedRoulBet==='black'&&!fRed&&!fGreen)won=true;
      if(selectedRoulBet==='green'&&fGreen)won=true;
      if(selectedRoulBet==='odd'&&fNum>0&&fNum%2===1)won=true;
      if(selectedRoulBet==='even'&&fNum>0&&fNum%2===0)won=true;
      if(selectedRoulBet==='1-18'&&fNum>=1&&fNum<=18)won=true;
      if(selectedRoulBet==='19-36'&&fNum>=19&&fNum<=36)won=true;"""

new_roul = """      document.getElementById('roulSpinBtn').disabled=false;

      // Use predetermined result (winNum) for payout, not visual readback
      const colorLabel=isActuallyGreen?'\U0001f49a Green':(isActuallyRed?'\U0001f534 Red':'\u26ab Black');
      const colorCSS=isActuallyGreen?'var(--green)':(isActuallyRed?'#ff5555':'#ccc');
      document.getElementById('rouletteResult').innerHTML=
        '<span style="color:'+colorCSS+'">'+winNum+' \u2014 '+colorLabel+'</span>';

      let won=false;
      if(selectedRoulBet==='red'&&isActuallyRed)won=true;
      if(selectedRoulBet==='black'&&!isActuallyRed&&!isActuallyGreen)won=true;
      if(selectedRoulBet==='green'&&isActuallyGreen)won=true;
      if(selectedRoulBet==='odd'&&winNum>0&&winNum%2===1)won=true;
      if(selectedRoulBet==='even'&&winNum>0&&winNum%2===0)won=true;
      if(selectedRoulBet==='1-18'&&winNum>=1&&winNum<=18)won=true;
      if(selectedRoulBet==='19-36'&&winNum>=19&&winNum<=36)won=true;"""

if old_roul in c:
    c = c.replace(old_roul, new_roul, 1)
    fixes += 1
    print("Fix 1 (roulette readback): APPLIED")
else:
    print("Fix 1 (roulette readback): NOT FOUND")
    # Debug
    if "PREDETERMINED" in c:
        idx = c.index("PREDETERMINED")
        print(f"  PREDETERMINED at {idx}, context: {repr(c[idx-50:idx+100])}")

# ── FIX 2: Wheel readback ──
old_wheel = """      /* visual readback \u2014 find which segment the top pointer actually sits on */
      const twTotal=WHEEL_SEGMENTS.reduce((s,sg)=>s+sg.weight,0);
      const pointerAng=((-Math.PI/2-wheelAngle)%(Math.PI*2)+Math.PI*4)%(Math.PI*2);
      let acc=0,visSeg=WHEEL_SEGMENTS[0];
      for(let i=0;i<WHEEL_SEGMENTS.length;i++){acc+=(WHEEL_SEGMENTS[i].weight/twTotal)*Math.PI*2;if(pointerAng<acc){visSeg=WHEEL_SEGMENTS[i];break;}}
      const payout=bet*visSeg.mult;
      if(payout>0){balance+=payout;updateBalDisplay();showBigWin(payout);showToast(visSeg.label+' +$'+payout.toFixed(2));if(visSeg.mult>=2)playWinSound();else playClickSound();
        if(visSeg.mult>=5)spawnParticles(window.innerWidth/2,window.innerHeight/2,30+visSeg.mult*5);
        document.getElementById('wheelResult').innerHTML='<span style="color:var(--green)">'+visSeg.label+' \u2014 +$'+payout.toFixed(2)+'</span>';recordGame('wheel',bet,payout);}
      else{showToast(visSeg.label,false);playLoseSound();document.getElementById('wheelResult').innerHTML='<span style="color:var(--red)">'+visSeg.label+'</span>';recordGame('wheel',bet,0);}"""

new_wheel = """      /* Use predetermined segment (seg) for payout, not visual readback */
      const payout=bet*seg.mult;
      if(payout>0){balance+=payout;updateBalDisplay();showBigWin(payout);showToast(seg.label+' +$'+payout.toFixed(2));if(seg.mult>=2)playWinSound();else playClickSound();
        if(seg.mult>=5)spawnParticles(window.innerWidth/2,window.innerHeight/2,30+seg.mult*5);
        document.getElementById('wheelResult').innerHTML='<span style="color:var(--green)">'+seg.label+' \u2014 +$'+payout.toFixed(2)+'</span>';recordGame('wheel',bet,payout);}
      else{showToast(seg.label,false);playLoseSound();document.getElementById('wheelResult').innerHTML='<span style="color:var(--red)">'+seg.label+'</span>';recordGame('wheel',bet,0);}"""

if old_wheel in c:
    c = c.replace(old_wheel, new_wheel, 1)
    fixes += 1
    print("Fix 2 (wheel readback): APPLIED")
else:
    print("Fix 2 (wheel readback): NOT FOUND")
    if "visSeg" in c:
        idx = c.index("visSeg")
        print(f"  visSeg at {idx}")

# ── FIX 3: Horse racing selection lock ──
old_horse_sel = """/* \u2500\u2500 SELECT HORSE \u2500\u2500 */
function hrSelectHorse(idx) {
  hrSelected = idx;
  playClickSound();"""

new_horse_sel = """/* \u2500\u2500 SELECT HORSE \u2500\u2500 */
function hrSelectHorse(idx) {
  if (hrRacing) return; // Cannot change horse mid-race
  hrSelected = idx;
  playClickSound();"""

if old_horse_sel in c:
    c = c.replace(old_horse_sel, new_horse_sel, 1)
    fixes += 1
    print("Fix 3 (horse select lock): APPLIED")
else:
    print("Fix 3 (horse select lock): NOT FOUND")

# ── FIX 4: Horse racing locked selection at race start ──
old_horse_race = """  hrRacing = true;
  balance -= bet;
  updateBalDisplay();firebaseSaveBet();
  document.getElementById('horseRaceBtn').disabled = true;
  document.getElementById('horseResult').textContent = '';
  playClickSound();"""

new_horse_race = """  hrRacing = true;
  const hrLockedSelection = hrSelected; // Lock selection at race start
  balance -= bet;
  updateBalDisplay();firebaseSaveBet();
  document.getElementById('horseRaceBtn').disabled = true;
  document.getElementById('horseResult').textContent = '';
  playClickSound();"""

if old_horse_race in c:
    c = c.replace(old_horse_race, new_horse_race, 1)
    fixes += 1
    print("Fix 4 (horse race lock): APPLIED")
else:
    print("Fix 4 (horse race lock): NOT FOUND")

# ── FIX 5: Horse racing payout uses locked selection ──
old_horse_payout = """      const myHorse = hrRaceHorses.find(h => h.idx === hrSelected);
      const myFinish = finishOrder.findIndex(f => f.idx === hrSelected) + 1;
      const odds = myHorse.displayOdds;

      if (winner === hrSelected) {"""

new_horse_payout = """      const myHorse = hrRaceHorses.find(h => h.idx === hrLockedSelection);
      const myFinish = finishOrder.findIndex(f => f.idx === hrLockedSelection) + 1;
      const odds = myHorse.displayOdds;

      if (winner === hrLockedSelection) {"""

if old_horse_payout in c:
    c = c.replace(old_horse_payout, new_horse_payout, 1)
    fixes += 1
    print("Fix 5 (horse payout lock): APPLIED")
else:
    print("Fix 5 (horse payout lock): NOT FOUND")

# ── FIX 6: Define mpbsrCleanup and mpbsrBackToLobby ──
old_mpbsr = """let mpbsrGameId = null;
let mpbsrIsHost = false;
let mpbsrChallengeInterval = null;"""

new_mpbsr = """let mpbsrGameId = null;
let mpbsrIsHost = false;
let mpbsrChallengeInterval = null;
let mpbsrUnsub = null;

function mpbsrCleanup() {
  if (mpbsrUnsub && typeof mpbsrUnsub === 'function') {
    mpbsrUnsub();
    mpbsrUnsub = null;
  }
}

function mpbsrBackToLobby() {
  mpbsrCleanup();
  mpbsrGameId = null;
  mpbsrIsHost = false;
  document.getElementById('mpbsrLobby').style.display = 'block';
  document.getElementById('mpbsrGameArea').style.display = 'none';
  document.getElementById('mpbsrGameOver').style.display = 'none';
}"""

if old_mpbsr in c:
    c = c.replace(old_mpbsr, new_mpbsr, 1)
    fixes += 1
    print("Fix 6 (mpbsr functions): APPLIED")
else:
    print("Fix 6 (mpbsr functions): NOT FOUND")

# ── FIX 7: MAX_BALANCE from 1e18 to 1e30 ──
old_max = "const MAX_BALANCE = 1e18; // $1 Quintillion hard cap"
new_max = "const MAX_BALANCE = 1e30; // $1 Nonillion hard cap"

if old_max in c:
    c = c.replace(old_max, new_max, 1)
    fixes += 1
    print("Fix 7 (MAX_BALANCE): APPLIED")
else:
    print("Fix 7 (MAX_BALANCE): NOT FOUND")

# ── FIX 8: formatBalance extended tiers ──
old_fmt = """  if(abs>=1e18)return sign+(abs/1e18).toFixed(2)+'Qi';
  if(abs>=1e15)return sign+(abs/1e15).toFixed(2)+'Q';
  if(abs>=1e12)return sign+(abs/1e12).toFixed(2)+'T';
  if(abs>=1e9)return sign+(abs/1e9).toFixed(2)+'B';
  if(abs>=1e6)return sign+(abs/1e6).toFixed(2)+'M';
  if(abs>=1e4)return sign+(abs/1e3).toFixed(1)+'K';
  return v.toFixed(2);
}"""

new_fmt = """  if(abs>=1e30)return sign+(abs/1e30).toFixed(2)+'No';
  if(abs>=1e27)return sign+(abs/1e27).toFixed(2)+'Oc';
  if(abs>=1e24)return sign+(abs/1e24).toFixed(2)+'Sp';
  if(abs>=1e21)return sign+(abs/1e21).toFixed(2)+'Sx';
  if(abs>=1e18)return sign+(abs/1e18).toFixed(2)+'Qi';
  if(abs>=1e15)return sign+(abs/1e15).toFixed(2)+'Q';
  if(abs>=1e12)return sign+(abs/1e12).toFixed(2)+'T';
  if(abs>=1e9)return sign+(abs/1e9).toFixed(2)+'B';
  if(abs>=1e6)return sign+(abs/1e6).toFixed(2)+'M';
  if(abs>=1e4)return sign+(abs/1e3).toFixed(1)+'K';
  return v.toFixed(2);
}"""

if old_fmt in c:
    c = c.replace(old_fmt, new_fmt, 1)
    fixes += 1
    print("Fix 8 (formatBalance tiers): APPLIED")
else:
    print("Fix 8 (formatBalance tiers): NOT FOUND")

# ── FIX 9: fmtBig in leaderboard extended tiers ──
old_fmtbig = """const fmtBig = (v) => {
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
    };"""

new_fmtbig = """const fmtBig = (v) => {
      const abs = Math.abs(v);
      if (abs >= 1e30) return '$' + (v/1e30).toFixed(2) + 'No';
      if (abs >= 1e27) return '$' + (v/1e27).toFixed(2) + 'Oc';
      if (abs >= 1e24) return '$' + (v/1e24).toFixed(2) + 'Sp';
      if (abs >= 1e21) return '$' + (v/1e21).toFixed(2) + 'Sx';
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
      if (abs >= 1e30) return sign + '$' + (abs/1e30).toFixed(2) + 'No';
      if (abs >= 1e27) return sign + '$' + (abs/1e27).toFixed(2) + 'Oc';
      if (abs >= 1e24) return sign + '$' + (abs/1e24).toFixed(2) + 'Sp';
      if (abs >= 1e21) return sign + '$' + (abs/1e21).toFixed(2) + 'Sx';
      if (abs >= 1e18) return sign + '$' + (abs/1e18).toFixed(2) + 'Qi';
      if (abs >= 1e15) return sign + '$' + (abs/1e15).toFixed(2) + 'Q';
      if (abs >= 1e12) return sign + '$' + (abs/1e12).toFixed(2) + 'T';
      if (abs >= 1e9)  return sign + '$' + (abs/1e9).toFixed(2) + 'B';
      if (abs >= 1e6)  return sign + '$' + (abs/1e6).toFixed(2) + 'M';
      if (abs >= 1e4)  return sign + '$' + (abs/1e3).toFixed(1) + 'K';
      return (v >= 0 ? '+$' : '-$') + abs.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    };"""

if old_fmtbig in c:
    c = c.replace(old_fmtbig, new_fmtbig, 1)
    fixes += 1
    print("Fix 9 (fmtBig/fmtProfit tiers): APPLIED")
else:
    print("Fix 9 (fmtBig/fmtProfit tiers): NOT FOUND")

# ── FIX 10: Leaderboard auto-refresh ──
old_lb = """let currentLBCategory = 'richest';

function switchLB(category, btn) {
  currentLBCategory = category;
  document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadLeaderboard(category);
}"""

new_lb = """let currentLBCategory = 'richest';
let lbAutoInterval = null;

function switchLB(category, btn) {
  currentLBCategory = category;
  document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadLeaderboard(category);
  startLBAutoRefresh();
}

function startLBAutoRefresh() {
  if (lbAutoInterval) clearInterval(lbAutoInterval);
  lbAutoInterval = setInterval(() => {
    const lbPanel = document.getElementById('leaderboardPanel');
    if (lbPanel && lbPanel.classList.contains('active')) {
      loadLeaderboard(currentLBCategory);
    } else {
      clearInterval(lbAutoInterval);
      lbAutoInterval = null;
    }
  }, 15000);
}"""

if old_lb in c:
    c = c.replace(old_lb, new_lb, 1)
    fixes += 1
    print("Fix 10 (LB auto-refresh): APPLIED")
else:
    print("Fix 10 (LB auto-refresh): NOT FOUND")

# ── FIX 11: switchGame leaderboard auto-refresh ──
old_switch = "  if(game==='leaderboard')loadLeaderboard(currentLBCategory);"
new_switch = "  if(game==='leaderboard'){loadLeaderboard(currentLBCategory);startLBAutoRefresh();}\n  else if(lbAutoInterval){clearInterval(lbAutoInterval);lbAutoInterval=null;}"

if old_switch in c:
    c = c.replace(old_switch, new_switch, 1)
    fixes += 1
    print("Fix 11 (switchGame LB refresh): APPLIED")
else:
    print("Fix 11 (switchGame LB refresh): NOT FOUND")

# Write back
print(f"\nTotal fixes applied: {fixes}/11")
print(f"Size change: {orig_len} -> {len(c)} chars")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(c)
print("File written to disk.")
