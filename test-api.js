#!/usr/bin/env node

/**
 * Test script for Pastebin Lite API
 * Run: npm run test:api
 */

const BASE_URL = 'http://localhost:3000';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('Testing Pastebin Lite API\n');

  // Test 1: Health check
  await test('GET /api/healthz returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/healthz`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error('Expected ok: true');
  });

  // Test 2: Create paste
  let pasteId = '';
  await test('POST /api/pastes creates a paste', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello, World!' }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (!data.id) throw new Error('Expected id in response');
    if (!data.url) throw new Error('Expected url in response');
    pasteId = data.id;
  });

  // Test 3: Get paste via API
  await test('GET /api/pastes/:id retrieves paste', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes/${pasteId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.content !== 'Hello, World!') throw new Error('Content mismatch');
  });

  // Test 4: View paste HTML
  await test('GET /p/:id returns HTML', async () => {
    const res = await fetch(`${BASE_URL}/p/${pasteId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes('Hello, World!')) throw new Error('Content not in HTML');
  });

  // Test 5: Create paste with TTL
  let ttlPasteId = '';
  await test('POST /api/pastes with TTL', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Expiring paste', ttl_seconds: 3600 }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    ttlPasteId = data.id;
  });

  // Test 6: Fetch TTL paste shows expires_at
  await test('GET /api/pastes/:id shows expires_at for TTL paste', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes/${ttlPasteId}`);
    const data = await res.json();
    if (!data.expires_at) throw new Error('Expected expires_at in response');
  });

  // Test 7: Create paste with max_views
  let maxViewsPasteId = '';
  await test('POST /api/pastes with max_views', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Limited views', max_views: 2 }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    maxViewsPasteId = data.id;
  });

  // Test 8: First fetch of limited paste succeeds
  await test('First fetch of limited paste succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes/${maxViewsPasteId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.remaining_views !== 1) throw new Error(`Expected remaining_views: 1, got ${data.remaining_views}`);
  });

  // Test 9: Second fetch of limited paste succeeds
  await test('Second fetch of limited paste succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes/${maxViewsPasteId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.remaining_views !== 0) throw new Error(`Expected remaining_views: 0, got ${data.remaining_views}`);
  });

  // Test 10: Third fetch of limited paste fails
  await test('Third fetch of limited paste returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes/${maxViewsPasteId}`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // Test 11: Invalid content fails
  await test('POST with empty content fails', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 12: Invalid TTL fails
  await test('POST with invalid ttl_seconds fails', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test', ttl_seconds: 0 }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 13: Missing paste returns 404
  await test('GET /api/pastes/:id for non-existent paste returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/pastes/00000000-0000-0000-0000-000000000000`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  console.log('\nAll tests passed!');
}

main();
