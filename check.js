const c = require('fs').readFileSync('c:\\Users\\sebmo\\Downloads\\island\\casino.html', 'utf-8');
const lines = c.split('\n');
console.log('Lines:', lines.length);
console.log('HOW TO PLAY:', (c.match(/HOW TO PLAY/g) || []).length);


const idMatches = c.match(/id="[^"]+"/g) || [];
const idCounts = {};
idMatches.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });
const dupes = Object.entries(idCounts).filter(([_, ct]) => ct > 1);
if (dupes.length) {
  console.log('\nDuplicate IDs:');
  dupes.forEach(([id, ct]) => console.log('  ', id, 'x' + ct));
} else {
  console.log('No duplicate IDs');
}


const funcs = ['spinSlots','startCrash','cashOut','spinRoulette','openCase','dropPlinkoBall',
  'bjDeal','bjHit','bjStand','minesStart','minesCashout','diceRoll','towerStart','towerCashout',
  'coinFlip','kenoDraw','limboGo','pokerDeal','pokerDrawCards','pokerEvaluate',
  'horseRace','scratchBuy','scratchReveal','scratchRevealAll','wheelSpin','baccDeal',
  'hiloStart','hiloGuess','hiloCashout','renderStocks','addResultDot','htpToggle',
  'switchGame','adjustBet','showToast','playClickSound','playWinSound','playLoseSound',
  'spawnParticles','recordGame','updateBalDisplay'];
const missing = funcs.filter(fn => !c.includes('function ' + fn));
if (missing.length) {
  console.log('\nMissing functions:', missing.join(', '));
} else {
  console.log('All', funcs.length, 'required functions found');
}


const issues = [];
if (c.includes('<hrclass=')) issues.push('Corrupted <hr> tag');
if (c.includes('<button clhtp')) issues.push('Corrupted button tag');
if (c.includes('"ass="')) issues.push('Corrupted class attr');
if (c.match(/<div cla\s+ss=/)) issues.push('Split <div class> tag');


const scriptOpens = (c.match(/<script/g) || []).length;
const scriptCloses = (c.match(/<\/script>/g) || []).length;
if (scriptOpens !== scriptCloses) issues.push('Mismatched <script> tags: ' + scriptOpens + ' opens, ' + scriptCloses + ' closes');


const panels = (c.match(/class="game-panel/g) || []).length;
console.log('Game panels:', panels);


const scriptStart = c.indexOf('<script>');
const scriptEnd = c.lastIndexOf('</script>');
if (scriptStart > -1 && scriptEnd > -1) {
  const js = c.substring(scriptStart + 8, scriptEnd);
  let opens = 0, closes = 0;
  
  for (const ch of js) {
    if (ch === '{') opens++;
    if (ch === '}') closes++;
  }
  if (opens !== closes) issues.push('Brace mismatch in JS: ' + opens + ' opens, ' + closes + ' closes');
  else console.log('JS braces balanced:', opens, 'pairs');
}

if (issues.length) {
  console.log('\nISSUES FOUND:');
  issues.forEach(i => console.log('  ❌', i));
} else {
  console.log('\nNo structural issues found!');
}
