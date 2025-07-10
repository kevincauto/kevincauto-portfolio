const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

const sampleLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Ferrothorn, M
|poke|p1|Garchomp, F
|poke|p2|Latios, M
|poke|p2|Sableye, F
|start
|turn|1
|move|p2a: Latios|Dragon Claw|p1a: Ferrothorn
|-damage|p1a: Ferrothorn|85/100
|-damage|p2a: Latios|82/100|[from] ability: Iron Barbs|[of] p1a: Ferrothorn
|turn|2
|move|p2a: Sableye|Shadow Ball|p1a: Garchomp
|-damage|p1a: Garchomp|79/100
|-damage|p2a: Sableye|94/100|[from] ability: Rough Skin|[of] p1a: Garchomp
|turn|3
|move|p2a: Latios|Earthquake|p1a: Garchomp
|-damage|p1a: Garchomp|62/100
|-damage|p2a: Latios|88/100|[from] item: Rocky Helmet|[of] p1a: Garchomp
|win|Player1`;

console.log('🧪 Testing ability and item damage attribution...\n');

try {
  const result = parseShowdownLog(sampleLog);
  
  if (!result) {
    console.error('❌ Parser returned null');
    process.exit(1);
  }
  
  console.log('✅ Parser completed successfully');
  
  if (result.pokemonStats) {
    console.log('\n📊 Pokémon Statistics:');
    result.pokemonStats.forEach(pokemon => {
      console.log(`${pokemon.name}:`);
      console.log(`  Total Damage Dealt: ${pokemon.totalDamageDealt.toFixed(1)}%`);
      console.log(`  Direct Damage: ${pokemon.directDamageDealt.toFixed(1)}%`);
      console.log(`  Indirect Damage: ${pokemon.indirectDamageDealt.toFixed(1)}%`);
      console.log(`  Contact Ability: ${pokemon.damageDealtByContactAbility.toFixed(1)}%`);
      console.log(`  Rocky Helmet: ${pokemon.damageDealtByRockyHelmet.toFixed(1)}%`);
      console.log('');
    });
    
    // Verify expected results
    const ferrothorn = result.pokemonStats.find(p => p.name === 'Ferrothorn');
    const garchomp = result.pokemonStats.find(p => p.name === 'Garchomp');
    const latios = result.pokemonStats.find(p => p.name === 'Latios');
    const sableye = result.pokemonStats.find(p => p.name === 'Sableye');
    
    // Ferrothorn: 18% Iron Barbs damage
    if (ferrothorn && Math.abs(ferrothorn.damageDealtByContactAbility - 18) < 1) {
      console.log('✅ Ferrothorn Iron Barbs damage correct:', ferrothorn.damageDealtByContactAbility.toFixed(1) + '%');
    } else {
      console.log('❌ Ferrothorn Iron Barbs damage incorrect:', ferrothorn?.damageDealtByContactAbility);
    }
    
    // Garchomp: 21% Rough Skin damage + 12% Rocky Helmet damage = 33% total indirect
    if (garchomp && Math.abs(garchomp.damageDealtByContactAbility - 21) < 1) {
      console.log('✅ Garchomp Rough Skin damage correct:', garchomp.damageDealtByContactAbility.toFixed(1) + '%');
    } else {
      console.log('❌ Garchomp Rough Skin damage incorrect:', garchomp?.damageDealtByContactAbility);
    }
    
    if (garchomp && Math.abs(garchomp.damageDealtByRockyHelmet - 12) < 1) {
      console.log('✅ Garchomp Rocky Helmet damage correct:', garchomp.damageDealtByRockyHelmet.toFixed(1) + '%');
    } else {
      console.log('❌ Garchomp Rocky Helmet damage incorrect:', garchomp?.damageDealtByRockyHelmet);
    }
    
    // Latios: 18% Iron Barbs damage taken + 12% Rocky Helmet damage taken = 30% indirect
    if (latios && Math.abs(latios.indirectDamageTaken - 30) < 1) {
      console.log('✅ Latios indirect damage taken correct:', latios.indirectDamageTaken.toFixed(1) + '%');
    } else {
      console.log('❌ Latios indirect damage taken incorrect:', latios?.indirectDamageTaken);
    }
    
    // Sableye: 21% Rough Skin damage taken
    if (sableye && Math.abs(sableye.indirectDamageTaken - 21) < 1) {
      console.log('✅ Sableye Rough Skin damage taken correct:', sableye.indirectDamageTaken.toFixed(1) + '%');
    } else {
      console.log('❌ Sableye Rough Skin damage taken incorrect:', sableye?.indirectDamageTaken);
    }
  }
  
  console.log('\n🎉 Test completed!');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
} 