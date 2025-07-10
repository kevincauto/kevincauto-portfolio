const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Test log with direct KOs and hazard KOs
const testLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Garchomp|Garchomp|100/100
|poke|p1|Muk|Muk|100/100
|poke|p2|Talonflame|Talonflame|100/100
|poke|p2|Meloetta|Meloetta|100/100
|poke|p2|Qwilfish|Qwilfish|100/100
|start
|turn|1
|move|p1a: Garchomp|Outrage|p2a: Talonflame
|-damage|p2a: Talonflame|0 fnt
|faint|p2a: Talonflame
|move|p2a: Meloetta|Spikes
|-sidestart|p1: Player1|Spikes
|turn|2
|switch|p1a: Muk|Muk|100/100
|-damage|p1a: Muk|87/100|[from] Spikes
|move|p1a: Muk|Sludge Bomb|p2a: Meloetta
|-damage|p2a: Meloetta|0 fnt
|faint|p2a: Meloetta
|turn|3
|switch|p2a: Qwilfish|Qwilfish|100/100
|-damage|p2a: Qwilfish|0 fnt|[from] Spikes
|faint|p2a: Qwilfish
|win|Player1`;

console.log('Testing KO move tracking...\n');

const result = parseShowdownLog(testLog);

if (result) {
  console.log('Teams:');
  console.log('P1:', result.p1.team);
  console.log('P2:', result.p2.team);
  console.log('\nKOs:');
  result.kos.forEach((ko, i) => {
    console.log(`${i + 1}. ${ko.attacker} KO's ${ko.victim}${ko.move ? ` with ${ko.move}` : ''}${ko.hazard ? ` (${ko.hazard})` : ''}`);
  });
  console.log('\nWinner:', result.winner);
  console.log('Score:', result.score);
} else {
  console.log('Failed to parse log');
} 