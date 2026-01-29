import { NextRequest, NextResponse } from 'next/server';

export function getTestNowMs(request: NextRequest): number | undefined {
  if (process.env.TEST_MODE === '1') {
    const header = request.headers.get('x-test-now-ms');
    if (header) {
      const ms = parseInt(header, 10);
      if (!isNaN(ms)) {
        return ms;
      }
    }
  }
  return undefined;
}

export function jsonResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
