# Migration Guide: In-Memory to Persistent Storage

## Problem

The current in-memory storage works locally but **does not persist on Vercel** because:
- Each serverless function invocation gets a fresh container
- In-memory data is lost between requests/deployments
- Different preview deployments have separate storage

## Solution: Use Vercel KV (Redis)

### Step 1: Set Up Vercel KV

1. Go to https://vercel.com/dashboard
2. Click on your "pastebin-lite" project
3. Go to **Storage** tab
4. Click **Create Database** → Select **KV (Redis)**
5. Name it `pastebin-kv` and select your region
6. Click **Create**

### Step 2: Install Client

```bash
npm install @vercel/kv
```

### Step 3: Replace Database Module

The new implementation is already in `lib/db-vercel-kv.ts`. To use it:

**Option A: Quick Switch (Rename)**
```bash
# Backup the old one
mv lib/db.ts lib/db-in-memory.ts

# Use the KV version
mv lib/db-vercel-kv.ts lib/db.ts
```

**Option B: Manual Update**
Copy the contents of `lib/db-vercel-kv.ts` into `lib/db.ts`

### Step 4: Update TypeScript

Since `@vercel/kv` calls are async, update your API routes to handle async operations properly:

**`app/api/pastes/route.ts`**: Already handles async `createPaste()`

**`app/api/pastes/[id]/route.ts`**: Already handles async `getPaste()`

**`app/p/[id]/page.tsx`**: This is a Server Component, update to async:

```typescript
import { getPaste } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PastePage({ params }: PageProps) {
  const { id } = params;
  const paste = await getPaste(id, false); // Now async!

  if (!paste) {
    notFound();
  }

  return (
    // ... rest of component
  );
}
```

### Step 5: Redeploy

```bash
git add .
git commit -m "Migrate to Vercel KV for persistent storage"
git push origin main
```

Vercel will automatically detect the KV database and inject connection details.

### Step 6: Test

1. Create a paste at your Vercel URL
2. Refresh the page
3. The paste should still exist! ✅

## Advantages

| Feature | In-Memory | Vercel KV |
|---------|-----------|-----------|
| Works Locally | ✅ | ✅ |
| Persists on Vercel | ❌ | ✅ |
| Data survives deployments | ❌ | ✅ |
| Works across instances | ❌ | ✅ |
| Free tier | ✅ | ✅ (100 commands/day) |
| Complexity | Low | Low |

## Troubleshooting

### "Cannot find module '@vercel/kv'"
```bash
npm install @vercel/kv
```

### "KV database not connected"
- Check that you created the KV database in Vercel dashboard
- Wait a few minutes for Vercel to initialize
- Redeploy from Vercel dashboard (force redeploy)

### "Still losing data"
- Make sure you're using the same deployment URL
- Check that `lib/db.ts` contains the KV implementation
- Verify `@vercel/kv` is installed

## Rollback

If you need to go back to in-memory storage:

```bash
# Restore the backup
mv lib/db.ts lib/db-vercel-kv.ts
mv lib/db-in-memory.ts lib/db.ts

git add .
git commit -m "Rollback to in-memory storage"
git push origin main
```

## Next Steps

- **For higher usage**: Migrate to PostgreSQL with `@vercel/postgres`
- **For global reach**: Use Upstash Redis instead
- **For free option**: Use MongoDB Atlas (free tier)

See README.md for more options.
