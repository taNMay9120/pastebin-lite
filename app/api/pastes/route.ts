import { NextRequest } from 'next/server';
import { createPaste, CreatePasteRequest } from '@/lib/db';
import { getTestNowMs, jsonResponse, errorResponse } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const testNowMs = getTestNowMs(request);
    
    let body: CreatePasteRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON', 400);
    }

    try {
      const paste = createPaste(body, testNowMs);
      
      const response = {
        id: paste.id,
        url: `${BASE_URL}/p/${paste.id}`,
      };

      return jsonResponse(response, 201);
    } catch (error: any) {
      return errorResponse(error.message, 400);
    }
  } catch (error: any) {
    console.error('Error creating paste:', error);
    return errorResponse('Internal server error', 500);
  }
}
