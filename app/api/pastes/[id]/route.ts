import { NextRequest, NextResponse } from 'next/server';
import { getPaste, getPasteResponse } from '@/lib/db';
import { getTestNowMs, jsonResponse, errorResponse } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const testNowMs = getTestNowMs(request);

    // Get paste and increment views (this is an API fetch)
    const paste = getPaste(id, true, testNowMs);

    if (!paste) {
      return errorResponse('Paste not found', 404);
    }

    const response = getPasteResponse(paste, testNowMs);
    return jsonResponse(response, 200);
  } catch (error: any) {
    console.error('Error fetching paste:', error);
    return errorResponse('Internal server error', 500);
  }
}
