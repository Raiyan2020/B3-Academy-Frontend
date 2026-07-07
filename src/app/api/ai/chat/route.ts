import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      text:
        'B3 Assistant is keyword-based in this frontend build. Please use the on-page assistant widget for configured keyword answers.',
    },
    { status: 200 },
  );
}
