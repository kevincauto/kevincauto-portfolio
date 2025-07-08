import { NextRequest, NextResponse } from 'next/server';
import { parseShowdownLog } from '@/lib/parseShowdownLog';

const PREFIX = 'https://replay.pokemonshowdown.com/';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !url.startsWith(PREFIX)) {
      return NextResponse.json({ message: 'Invalid replay URL.' }, { status: 400 });
    }

    // Normalize the URL - remove any query parameters and ensure proper format
    let normalizedUrl = url.split('?')[0]; // Remove query params
    normalizedUrl = normalizedUrl.trim(); // Remove any whitespace
    
    // If it doesn't already end with .log, add it
    if (!normalizedUrl.endsWith('.log')) {
      normalizedUrl = normalizedUrl + '.log';
    }
    
    console.log('Original URL:', url);
    console.log('Normalized URL:', normalizedUrl);
    console.log('Attempting to fetch log from:', normalizedUrl);
    
    // Try with different headers to avoid potential blocking
    const resp = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      // Add a timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log('Response status:', resp.status, 'Response ok:', resp.ok);
    console.log('Response headers:', Object.fromEntries(resp.headers.entries()));
    
    if (!resp.ok) {
      if (resp.status === 404) {
        return NextResponse.json(
          { message: 'Replay log not found. The replay may be too old or the URL may be incorrect.' },
          { status: 404 }
        );
      }
      if (resp.status === 403) {
        return NextResponse.json(
          { message: 'Access denied. The replay may be private or restricted.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { message: `Could not fetch log (HTTP ${resp.status}).` },
        { status: 502 }
      );
    }

    const log = await resp.text();
    console.log('Log length:', log.length, 'characters');
    
    if (log.length === 0) {
      return NextResponse.json(
        { message: 'Replay log is empty or invalid.' },
        { status: 422 }
      );
    }
    
    // Log the first few lines to help debug
    const firstLines = log.split('\n').slice(0, 5).join('\n');
    console.log('First 5 lines of log:', firstLines);
    
    const parsed = parseShowdownLog(log);
    if (!parsed) {
      return NextResponse.json({ message: 'Failed to parse draft log.' }, { status: 422 });
    }

    return NextResponse.json({ parsed });
  } catch (err) {
    console.error('Poke-parser error:', err);
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json({ message: 'Request timed out. Please try again.' }, { status: 408 });
    }
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
