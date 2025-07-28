import fs from 'fs';
import path from 'path';
import { parseShowdownLog } from '@/lib/parseShowdownLog';

const logs = {
  forretress: 'gen6draft-2152683246-1n181mf9pxi84k8jh923h8y2yczkxdwpw.log',
  bronzong: 'gen6draft-2145329527-6gux630fwvson8m8o5nwt9v2h2kzr82pw.log',
  klefki: 'gen6draft-2312670604-tbden1garkng2uv0s7y5ickxovxmn8opw.log'
};

describe('Indirect KO Attribution', () => {
  test('Forretress should get 2 KOs from Toxic Spikes', () => {
    const log = fs.readFileSync(path.join('public', logs.forretress), 'utf8');
    const result = parseShowdownLog(log);
    const stats = result?.pokemonStats?.find(p => p.name === 'Forretress');
    expect(stats?.kos).toBe(2);
  });

  test('Bronzong should get 1 KO from Trick Toxic Orb', () => {
    const log = fs.readFileSync(path.join('public', logs.bronzong), 'utf8');
    const result = parseShowdownLog(log);
    const stats = result?.pokemonStats?.find(p => p.name === 'Bronzong');
    expect(stats?.kos).toBe(1);
  });

  test('Klefki should get 1 KO from Switcheroo Toxic Orb', () => {
    const log = fs.readFileSync(path.join('public', logs.klefki), 'utf8');
    const result = parseShowdownLog(log);
    const stats = result?.pokemonStats?.find(p => p.name === 'Klefki');
    expect(stats?.kos).toBe(1);
  });
}); 