import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/libs/google-sheets';

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}
