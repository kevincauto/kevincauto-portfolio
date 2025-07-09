const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');
const fs = require('fs');

// Read the real log
const log = fs.readFileSync('real-log.txt', 'utf8');

console.log('Testing real log with Klefki Spikes...\n');

const result = parseShowdownLog(log);

if (result && result.pokemonStats) {
  console.log('Pokémon Statistics:');
  result.pokemonStats.forEach(pokemon => {
    if (pokemon.name === 'Klefki' || pokemon.name === 'Aromatisse') {
      console.log(`${pokemon.name}:`);
      console.log(`  KOs: ${pokemon.kos}`);
      console.log(`  Fainted: ${pokemon.fainted ? 'Yes' : 'No'}`);
      console.log(`  Won: ${pokemon.won ? 'Yes' : 'No'}`);
      console.log(`  Direct Damage Dealt: ${pokemon.directDamageDealt.toFixed(1)}%`);
      console.log(`  Indirect Damage Dealt: ${pokemon.indirectDamageDealt.toFixed(1)}%`);
      console.log(`  Direct Damage Taken: ${pokemon.directDamageTaken.toFixed(1)}%`);
      console.log(`  Indirect Damage Taken: ${pokemon.indirectDamageTaken.toFixed(1)}%`);
      console.log(`  HP Lost: ${pokemon.hpLost.toFixed(1)}%`);
      console.log('');
    }
  });
} else {
  console.log('Failed to parse log');
}
