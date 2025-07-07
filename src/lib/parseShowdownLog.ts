export interface KO {
  attacker: string;   // species
  victim:   string;   // species
}
export interface DraftResult {
  p1: { name: string; team: string[] };
  p2: { name: string; team: string[] };
  kos: KO[];
}

export function parseShowdownLog(log: string): DraftResult | null {
  // --- player names --------------------------------------------------------
  const p1Match = log.match(/\|player\|p1\|([^\|\n]+)/);
  const p2Match = log.match(/\|player\|p2\|([^\|\n]+)/);
  if (!p1Match || !p2Match) return null;
  const p1Name = p1Match[1].trim();
  const p2Name = p2Match[1].trim();

  // --- helpers -------------------------------------------------------------
  const p1Team: string[] = [];
  const p2Team: string[] = [];
  const kos: KO[] = [];

  /** nickname → species */
  const nickToSpecies: Record<string, string> = {};
  /** victimSpecies → lastAttackerSpecies */
  const lastHit: Record<string, string> = {};

  // --- log scan ------------------------------------------------------------
  log.split('\n').forEach((line) => {
    /* A) initial team: |poke|p1|Klefki, M|item */
    if (line.startsWith('|poke|')) {
      const [, , player, raw] = line.split('|');
      const species = raw.split(',')[0].trim();
      (player === 'p1' ? p1Team : p2Team).push(species);
    }

    /* B) switch gives us nickname ↔ species */
    if (line.startsWith('|switch|')) {
      // |switch|p2a: Doc|Aromatisse, F|100/100
      const parts = line.split('|');
      if (parts.length >= 4) {
        const nick = parts[2].split(':')[1].trim();
        const species = parts[3].split(',')[0].trim();
        nickToSpecies[nick] = species;
      }
    }

    /* C) move line: remember last attacker → target */
    if (line.startsWith('|move|')) {
      // |move|p2a: Jolteon|Volt Switch|p1a: Blissey
      const parts = line.split('|');
      if (parts.length >= 5) {
        const atkNick  = parts[2].split(':')[1].trim();
        const defNick  = parts[4].split(':')[1].trim();
        const atkSpec  = nickToSpecies[atkNick] || atkNick;
        const defSpec  = nickToSpecies[defNick] || defNick;
        lastHit[defSpec] = atkSpec;
      }
    }

    /* D) faint line: record KO from lastHit map */
    if (line.startsWith('|faint|')) {
      // |faint|p1a: Klefki
      const victimNick = line.split('|')[2].split(':')[1].trim();
      const victimSpec = nickToSpecies[victimNick] || victimNick;
      const attackerSpec = lastHit[victimSpec];
      if (attackerSpec) kos.push({ attacker: attackerSpec, victim: victimSpec });
    }
  });

  return {
    p1: { name: p1Name, team: p1Team },
    p2: { name: p2Name, team: p2Team },
    kos,
  };
}
