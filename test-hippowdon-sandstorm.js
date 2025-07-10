const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

const sampleLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Hippowdon, M
|poke|p1|Ferrothorn, F
|poke|p2|Latios, M
|poke|p2|Sableye, F
|start
|turn|1
|-weather|Sandstorm|[from] ability: Sand Stream|[of] p1a: Hippowdon
|move|p1a: Hippowdon|Earthquake|p2a: Latios
|-damage|p2a: Latios|75/100
|-damage|p2a: Latios|69/100|[from] Sandstorm
|turn|2
|move|p2a: Sableye|Shadow Ball|p1a: Hippowdon
|-damage|p1a: Hippowdon|85/100
|-damage|p2a: Sableye|94/100|[from] Sandstorm
|win|Player1`;

console.log('🧪 Testing Hippowdon Sandstorm damage attribution...\n');

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
      console.log(`  Sandstorm Damage: ${pokemon.damageDealtBySandstorm.toFixed(1)}%`);
      console.log('');
    });
    
    // Verify expected results
    const hippowdon = result.pokemonStats.find(p => p.name === 'Hippowdon');
    const latios = result.pokemonStats.find(p => p.name === 'Latios');
    const sableye = result.pokemonStats.find(p => p.name === 'Sableye');
    
    // Hippowdon: 25% direct damage + 6% Sandstorm damage + 6% Sandstorm damage = 37% total
    if (hippowdon && Math.abs(hippowdon.totalDamageDealt - 37) < 1) {
      console.log('✅ Hippowdon total damage correct:', hippowdon.totalDamageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Hippowdon total damage incorrect:', hippowdon?.totalDamageDealt);
    }
    
    // Hippowdon: 12% Sandstorm damage (6% + 6%)
    if (hippowdon && Math.abs(hippowdon.damageDealtBySandstorm - 12) < 1) {
      console.log('✅ Hippowdon Sandstorm damage correct:', hippowdon.damageDealtBySandstorm.toFixed(1) + '%');
    } else {
      console.log('❌ Hippowdon Sandstorm damage incorrect:', hippowdon?.damageDealtBySandstorm);
    }
    
    // Latios: 25% direct damage taken + 6% Sandstorm damage taken = 31% total
    if (latios && Math.abs(latios.directDamageTaken - 25) < 1 && Math.abs(latios.indirectDamageTaken - 6) < 1) {
      console.log('✅ Latios damage taken correct: Direct:', latios.directDamageTaken.toFixed(1) + '%, Indirect:', latios.indirectDamageTaken.toFixed(1) + '%');
    } else {
      console.log('❌ Latios damage taken incorrect');
    }
    
    // Sableye: 6% Sandstorm damage taken
    if (sableye && Math.abs(sableye.indirectDamageTaken - 6) < 1) {
      console.log('✅ Sableye Sandstorm damage taken correct:', sableye.indirectDamageTaken.toFixed(1) + '%');
    } else {
      console.log('❌ Sableye Sandstorm damage taken incorrect:', sableye?.indirectDamageTaken);
    }
  }
  
  console.log('\n🎉 Test completed!');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
} 