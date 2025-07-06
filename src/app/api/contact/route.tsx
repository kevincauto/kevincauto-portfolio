import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    const { error } = await supabase
      .from('contacts')
      .insert([{ name, email, message }]);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact insert error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
