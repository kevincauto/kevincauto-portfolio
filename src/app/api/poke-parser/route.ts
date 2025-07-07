import { NextRequest, NextResponse } from 'next/server';

const SHOWDOWN_PREFIX = 'https://replay.pokemonshowdown.com/';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    // Basic validation: must start with showdown prefix
    if (typeof url !== 'string' || !url.startsWith(SHOWDOWN_PREFIX)) {
      return NextResponse.json(
        { message: 'Please provide a valid Pokémon Showdown replay URL.' },
        { status: 400 }
      );
    }

    // Ensure .log suffix
    const logUrl = url.endsWith('.log') ? url : url + '.log';

    // Fetch log text from Showdown servers
    const resp = await fetch(logUrl);
    if (!resp.ok) {
      return NextResponse.json(
        { message: `Could not fetch log (HTTP ${resp.status}).` },
        { status: 502 }
      );
    }

    const log = await resp.text();
    return NextResponse.json({ log });
  } catch (err: any) {
    console.error('Poke-parser API error:', err);
    return NextResponse.json(
      { message: 'Server error while fetching log.' },
      { status: 500 }
    );
  }
}
