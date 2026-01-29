/**
 * Alternative database module using Vercel KV (Redis)
 * 
 * To use this instead of in-memory storage:
 * 1. Set up Vercel KV in your Vercel dashboard
 * 2. npm install @vercel/kv
 * 3. Rename this file to db.ts and replace the existing one
 * 4. Update imports in your API routes
 */

import { v4 as uuidv4 } from 'uuid';
import { kv } from '@vercel/kv';

export interface Paste {
  id: string;
  content: string;
  ttl_seconds?: number;
  max_views?: number;
  created_at: number;
  views: number;
}

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

const PASTE_PREFIX = 'paste:';

export function getCurrentTime(): number {
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

  // Store in Vercel KV with optional TTL
  const ttl = request.ttl_seconds || undefined;
  if (ttl) {
    await kv.setex(`${PASTE_PREFIX}${id}`, ttl, JSON.stringify(paste));
  } else {
    await kv.set(`${PASTE_PREFIX}${id}`, JSON.stringify(paste));
  }

  return paste;
}

export async function getPaste(id: string, increment: boolean = false, testNowMs?: number): Promise<Paste | null> {
  const pasteJson = await kv.get(`${PASTE_PREFIX}${id}`);
  
  if (!pasteJson) {
    return null;
  }

  const paste: Paste = JSON.parse(pasteJson as string);
  const now = testNowMs || getCurrentTime();

  // Check if paste has expired
  if (paste.ttl_seconds !== undefined) {
    const expiryTime = paste.created_at + (paste.ttl_seconds * 1000);
    if (now >= expiryTime) {
      await kv.del(`${PASTE_PREFIX}${id}`);
      return null;
    }
  }

  // Check if view limit exceeded
  if (paste.max_views !== undefined && paste.views >= paste.max_views) {
    return null;
  }

  // Increment views if requested
  if (increment) {
    paste.views += 1;
    await kv.set(`${PASTE_PREFIX}${id}`, JSON.stringify(paste));
  }

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

export async function clearAllPastes(): Promise<void> {
  const keys = await kv.keys(`${PASTE_PREFIX}*`);
  if (keys.length > 0) {
    await kv.del(...keys);
  }
}
