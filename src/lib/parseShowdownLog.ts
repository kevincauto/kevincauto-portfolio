// src/lib/parseShowdownLog.ts
export interface DraftResult {
  p1: { name: string; team: string[] };
  p2: { name: string; team: string[] };
}

export function parseShowdownLog(log: string): DraftResult | null {
  // --- player names --------------------------------------------------------
  const p1Match = log.match(/\|player\|p1\|([^\|\n]+)/);
  const p2Match = log.match(/\|player\|p2\|([^\|\n]+)/);
  if (!p1Match || !p2Match) return null;

  const p1Name = p1Match[1].trim();
  const p2Name = p2Match[1].trim();

  // --- drafted Pokémon -----------------------------------------------------
  const p1Team: string[] = [];
  const p2Team: string[] = [];

  log.split('\n').forEach((line) => {
    if (!line.startsWith('|poke|')) return;

    // |poke|p1|Klefki, M|item
    const parts = line.split('|');
    if (parts.length >= 4) {
      const player = parts[2] as 'p1' | 'p2';
      const poke   = parts[3].split(',')[0].trim(); // strip gender/form
      if (player === 'p1') p1Team.push(poke);
      else                 p2Team.push(poke);
    }
  });

  return {
    p1: { name: p1Name, team: p1Team },
    p2: { name: p2Name, team: p2Team },
  };
}
