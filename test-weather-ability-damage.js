const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

const sampleLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Tyranitar, M
|poke|p1|Ferrothorn, F
|poke|p1|Charizard, M
|poke|p2|Garchomp, M
|poke|p2|Talonflame, F
|poke|p2|Blastoise, M
|start
|turn|1
|move|p1a: Tyranitar|Sandstorm|p2a: Garchomp
|-weather|Sandstorm|[upkeep]
|move|p2a: Garchomp|Earthquake|p1a: Tyranitar
|-damage|p1a: Tyranitar|75/100
|-damage|p2a: Garchomp|90/100|[from] Sandstorm
|turn|2
|move|p1a: Ferrothorn|Spikes|p2a: Garchomp
|-sidestart|p2: Garchomp|Spikes
|move|p2a: Garchomp|Dragon Claw|p1a: Ferrothorn
|-damage|p1a: Ferrothorn|85/100
|-damage|p2a: Garchomp|70/100|[from] Iron Barbs
|turn|3
|move|p1a: Charizard|Flamethrower|p2a: Garchomp
|-damage|p2a: Garchomp|0 fnt
|faint|p2a: Garchomp
|win|Player1`;

console.log('🧪 Testing weather and ability damage attribution...\n');

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
      console.log(`${pokemon.name}:`);
      console.log(`  KOs: ${pokemon.kos}, Fainted: ${pokemon.fainted ? 'Yes' : 'No'}, Won: ${pokemon.won ? 'Yes' : 'No'}`);
      console.log(`  Direct Damage Dealt: ${pokemon.directDamageDealt.toFixed(1)}%`);
      console.log(`  Indirect Damage Dealt: ${pokemon.indirectDamageDealt.toFixed(1)}%`);
      console.log(`  Total Damage Dealt: ${pokemon.totalDamageDealt.toFixed(1)}%`);
      console.log(`  Direct Damage Taken: ${pokemon.directDamageTaken.toFixed(1)}%`);
      console.log(`  Indirect Damage Taken: ${pokemon.indirectDamageTaken.toFixed(1)}%`);
      console.log(`  HP Lost: ${pokemon.hpLost.toFixed(1)}%`);
      console.log('');
    });
    
    // Verify expected results
    const tyranitar = result.pokemonStats.find(p => p.name === 'Tyranitar');
    const ferrothorn = result.pokemonStats.find(p => p.name === 'Ferrothorn');
    const charizard = result.pokemonStats.find(p => p.name === 'Charizard');
    const garchomp = result.pokemonStats.find(p => p.name === 'Garchomp');
    
    // Tyranitar: 10% weather damage to Garchomp
    if (tyranitar && Math.abs(tyranitar.indirectDamageDealt - 10) < 1) {
      console.log('✅ Tyranitar weather damage correct:', tyranitar.indirectDamageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Tyranitar weather damage incorrect:', tyranitar?.indirectDamageDealt);
    }
    
    // Ferrothorn: 20% ability damage to Garchomp
    if (ferrothorn && Math.abs(ferrothorn.indirectDamageDealt - 20) < 1) {
      console.log('✅ Ferrothorn ability damage correct:', ferrothorn.indirectDamageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Ferrothorn ability damage incorrect:', ferrothorn?.indirectDamageDealt);
    }
    
    // Charizard: 70% direct damage to Garchomp (KO)
    if (charizard && Math.abs(charizard.directDamageDealt - 70) < 1) {
      console.log('✅ Charizard direct damage correct:', charizard.directDamageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Charizard direct damage incorrect:', charizard?.directDamageDealt);
    }
    
    // Garchomp: 25% direct damage to Tyranitar + 15% direct damage to Ferrothorn = 40% total
    if (garchomp && Math.abs(garchomp.totalDamageDealt - 40) < 1) {
      console.log('✅ Garchomp total damage correct:', garchomp.totalDamageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Garchomp total damage incorrect:', garchomp?.totalDamageDealt);
    }
  }
  
  console.log('\n🎉 Test completed!');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
} 