// Test for damage tracking functionality
const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Sample battle log with damage
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

console.log('Testing damage tracking...');

try {
  const result = parseShowdownLog(sampleLog);
  
  if (!result) {
    console.error('❌ Parser returned null');
    process.exit(1);
  }
  
  console.log('✅ Parser completed successfully');
  console.log('Winner:', result.winner);
  console.log('Score:', result.score);
  console.log('KOs:', result.kos);
  
  if (result.pokemonStats) {
    console.log('\n📊 Pokémon Statistics:');
    result.pokemonStats.forEach(pokemon => {
      console.log(`${pokemon.name}: ${pokemon.kos} KOs, Fainted: ${pokemon.fainted ? 'Yes' : 'No'}, Won: ${pokemon.won ? 'Yes' : 'No'}, Damage: ${pokemon.damageDealt.toFixed(1)}%`);
    });
    
    // Verify expected damage results
    const garchomp = result.pokemonStats.find(p => p.name === 'Garchomp');
    const charizard = result.pokemonStats.find(p => p.name === 'Charizard');
    const qwilfish = result.pokemonStats.find(p => p.name === 'Qwilfish-Hisui');
    const blastoise = result.pokemonStats.find(p => p.name === 'Blastoise');
    
    // Garchomp: 75% damage to Charizard (first hit) + 75% damage to Charizard (second hit) = 150%
    if (garchomp && Math.abs(garchomp.damageDealt - 150) < 1) {
      console.log('✅ Garchomp damage correct:', garchomp.damageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Garchomp damage incorrect:', garchomp?.damageDealt);
    }
    
    // Charizard: 40% damage to Garchomp
    if (charizard && Math.abs(charizard.damageDealt - 40) < 1) {
      console.log('✅ Charizard damage correct:', charizard.damageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Charizard damage incorrect:', charizard?.damageDealt);
    }
    
    // Qwilfish: 30% damage to Blastoise
    if (qwilfish && Math.abs(qwilfish.damageDealt - 30) < 1) {
      console.log('✅ Qwilfish-Hisui damage correct:', qwilfish.damageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Qwilfish-Hisui damage incorrect:', qwilfish?.damageDealt);
    }
    
    // Blastoise: 100% damage to Garchomp (KO) + 70% damage to Qwilfish = 170%
    if (blastoise && Math.abs(blastoise.damageDealt - 170) < 1) {
      console.log('✅ Blastoise damage correct:', blastoise.damageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Blastoise damage incorrect:', blastoise?.damageDealt);
    }
    
  } else {
    console.log('❌ No pokemonStats found in result');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
} 