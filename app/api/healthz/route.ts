import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check - in a real app, we'd check database connectivity
    const response = {
      ok: true,
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Health check failed' }, { status: 500 });
  }
}
