// Debug script to examine log format
const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Sample log with damage lines
const sampleLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Garchomp
|poke|p1|Qwilfish-Hisui
|poke|p2|Charizard
|poke|p2|Blastoise
|switch|p1a: Garchomp|Garchomp, M|100/100
|switch|p2a: Charizard|Charizard, M|100/100
|move|p1a: Garchomp|Earthquake|p2a: Charizard
|-damage|p2a: Charizard|100/100 → 25/100
|move|p2a: Charizard|Flamethrower|p1a: Garchomp
|-damage|p1a: Garchomp|100/100 → 60/100
|move|p1a: Garchomp|Earthquake|p2a: Charizard
|faint|p2a: Charizard
|switch|p2a: Blastoise|Blastoise, M|100/100
|move|p2a: Blastoise|Hydro Pump|p1a: Garchomp
|-damage|p1a: Garchomp|60/100 → 0 fnt
|faint|p1a: Garchomp
|switch|p1a: Qwilfish-Hisui|Qwilfish-Hisui, M|100/100
|move|p1a: Qwilfish-Hisui|Spikes
|-sidestart|p2: Player2|Spikes
|move|p2a: Blastoise|Ice Beam|p1a: Qwilfish-Hisui
|-damage|p1a: Qwilfish-Hisui|100/100 → 30/100
|move|p1a: Qwilfish-Hisui|Liquidation|p2a: Blastoise
|-damage|p2a: Blastoise|100/100 → 70/100
|move|p2a: Blastoise|Ice Beam|p1a: Qwilfish-Hisui
|faint|p1a: Qwilfish-Hisui
|win|Player2`;

console.log('Examining log format...\n');

const lines = sampleLog.split('\n');
let moveIndex = -1;

lines.forEach((line, idx) => {
  if (line.startsWith('|move|')) {
    console.log(`Move at line ${idx}: ${line}`);
    moveIndex = idx;
  }
  
  if (line.startsWith('|-damage|')) {
    console.log(`Damage at line ${idx}: ${line}`);
    if (moveIndex !== -1) {
      console.log(`  Previous move was at line ${moveIndex}: ${lines[moveIndex]}`);
      
      // Parse the move line
      const moveParts = lines[moveIndex].split('|');
      const atkNick = moveParts[2].split(':')[1].trim();
      const defNick = moveParts[4]?.split(':')[1]?.trim();
      
      // Parse the damage line
      const damageParts = line.split('|');
      const victimField = damageParts[2];
      const victimNick = victimField.split(':')[1].trim();
      
      console.log(`  Attacker: ${atkNick}, Defender: ${defNick}, Damage victim: ${victimNick}`);
      console.log(`  Match: ${defNick === victimNick ? 'YES' : 'NO'}\n`);
    }
  }
});

console.log('\nTesting parser...');
const result = parseShowdownLog(sampleLog);
if (result && result.pokemonStats) {
  console.log('\nPokémon Stats:');
  result.pokemonStats.forEach(pokemon => {
    console.log(`${pokemon.name}: ${pokemon.damageDealt.toFixed(1)}% damage`);
  });
} 