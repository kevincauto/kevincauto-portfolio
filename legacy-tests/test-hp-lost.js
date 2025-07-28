const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Test log with various HP loss sources
const testLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Charizard
|poke|p1|Blastoise
|poke|p2|Venusaur
|poke|p2|Pikachu
|turn|1
|move|p1a: Charizard|Substitute|p1a: Charizard
|-start|p1a: Charizard|Substitute
|-damage|p1a: Charizard|75/100
|move|p2a: Venusaur|Sludge Bomb|p1a: Charizard
|-damage|p1a: Charizard|75/100 → 50/100
|turn|2
|move|p1a: Charizard|Belly Drum|p1a: Charizard
|-damage|p1a: Charizard|50/100 → 25/100
|move|p2a: Venusaur|Sludge Bomb|p1a: Charizard
|-damage|p1a: Charizard|25/100 → 0 fnt
|faint|p1a: Charizard
|switch|p1a: Blastoise|Blastoise, M|100/100
|move|p1a: Blastoise|Hydro Pump|p2a: Venusaur
|-damage|p2a: Venusaur|100/100 → 60/100
|move|p2a: Venusaur|Sludge Bomb|p1a: Blastoise
|-damage|p1a: Blastoise|100/100 → 80/100
|turn|3
|-damage|p2a: Venusaur|60/100 → 50/100|[from] status: poison
|move|p2a: Venusaur|Sludge Bomb|p1a: Blastoise
|-damage|p1a: Blastoise|80/100 → 60/100
|win|Player1`;

console.log('Testing HP Lost tracking...\n');

const result = parseShowdownLog(testLog);

if (result && result.pokemonStats) {
  console.log('Pokémon Statistics:');
  result.pokemonStats.forEach(pokemon => {
    console.log(`${pokemon.name}:`);
    console.log(`  KOs: ${pokemon.kos}`);
    console.log(`  Fainted: ${pokemon.fainted ? 'Yes' : 'No'}`);
    console.log(`  Won: ${pokemon.won ? 'Yes' : 'No'}`);
    console.log(`  Damage Dealt: ${pokemon.damageDealt.toFixed(1)}%`);
    console.log(`  Damage Taken: ${pokemon.damageTaken.toFixed(1)}%`);
    console.log(`  HP Lost: ${pokemon.hpLost.toFixed(1)}%`);
    console.log('');
  });
} else {
  console.log('Failed to parse log');
} 