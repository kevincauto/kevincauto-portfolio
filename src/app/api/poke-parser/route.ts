import { NextRequest, NextResponse } from 'next/server';
import { parseShowdownLog } from '@/lib/parseShowdownLog';

const PREFIX = 'https://replay.pokemonshowdown.com/';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !url.startsWith(PREFIX)) {
      return NextResponse.json({ message: 'Invalid replay URL.' }, { status: 400 });
    }

    const logUrl = url.endsWith('.log') ? url : url + '.log';
    const resp = await fetch(logUrl);
    if (!resp.ok) {
      return NextResponse.json(
        { message: `Could not fetch log (HTTP ${resp.status}).` },
        { status: 502 }
      );
    }

    const log = await resp.text();
    const parsed = parseShowdownLog(log);
    if (!parsed) {
      return NextResponse.json({ message: 'Failed to parse draft log.' }, { status: 422 });
    }

    return NextResponse.json({ parsed });
  } catch (err) {
    console.error('Poke-parser error:', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
