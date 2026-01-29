import { v4 as uuidv4 } from 'uuid';

interface Paste {
  id: string;
  content: string;
  ttl_seconds?: number;
  max_views?: number;
  created_at: number;
  views: number;
}

// In-memory storage for development/testing
// In production with Vercel, we'd use a proper database like PostgreSQL or a KV store
const pasteStore = new Map<string, Paste>();

export interface CreatePasteRequest {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
}

export interface PasteResponse {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
}

export function getCurrentTime(): number {
  // Support deterministic time for testing
  const testMode = process.env.TEST_MODE === '1';
  if (testMode) {
    // This will be read from the x-test-now-ms header in the API route
    return Date.now();
  }
  return Date.now();
}

export async function createPaste(request: CreatePasteRequest, testNowMs?: number): Promise<Paste> {
  // Validate input
  if (!request.content || typeof request.content !== 'string' || request.content.trim() === '') {
    throw new Error('content is required and must be a non-empty string');
  }

  if (request.ttl_seconds !== undefined) {
    if (!Number.isInteger(request.ttl_seconds) || request.ttl_seconds < 1) {
      throw new Error('ttl_seconds must be an integer >= 1');
    }
  }

  if (request.max_views !== undefined) {
    if (!Number.isInteger(request.max_views) || request.max_views < 1) {
      throw new Error('max_views must be an integer >= 1');
    }
  }

  const id = uuidv4();
  const now = testNowMs || getCurrentTime();
  
  const paste: Paste = {
    id,
    content: request.content,
    ttl_seconds: request.ttl_seconds,
    max_views: request.max_views,
    created_at: now,
    views: 0,
  };

  pasteStore.set(id, paste);
  return paste;
}

export async function getPaste(id: string, increment: boolean = false, testNowMs?: number): Promise<Paste | null> {
  const paste = pasteStore.get(id);
  
  if (!paste) {
    return null;
  }

  const now = testNowMs || getCurrentTime();

  // Check if paste has expired
  if (paste.ttl_seconds !== undefined) {
    const expiryTime = paste.created_at + (paste.ttl_seconds * 1000);
    if (now >= expiryTime) {
      return null;
    }
  }

  // Check if view limit exceeded
  if (paste.max_views !== undefined && paste.views >= paste.max_views) {
    return null;
  }

  // Increment views if requested
  if (increment && paste.max_views !== undefined) {
    paste.views += 1;
    // Check if we've just hit the limit
    if (paste.views >= paste.max_views) {
      pasteStore.set(id, paste);
      return paste;
    }
  } else if (increment) {
    paste.views += 1;
  }

  pasteStore.set(id, paste);
  return paste;
}

export function getPasteResponse(paste: Paste): PasteResponse {
  let remaining_views: number | null = null;
  if (paste.max_views !== undefined) {
    remaining_views = Math.max(0, paste.max_views - paste.views);
  }

  let expires_at: string | null = null;
  if (paste.ttl_seconds !== undefined) {
    const expiryTime = new Date(paste.created_at + (paste.ttl_seconds * 1000));
    expires_at = expiryTime.toISOString();
  }

  return {
    content: paste.content,
    remaining_views,
    expires_at,
  };
}

// For testing/debugging - clear all pastes
export function clearAllPastes(): void {
  pasteStore.clear();
}

// For testing/debugging - get store size
export function getStoreSize(): number {
  return pasteStore.size;
}
