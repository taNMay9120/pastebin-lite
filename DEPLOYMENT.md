# Deployment Guide

## Deploying to Vercel

### Prerequisites
- GitHub account with the repository pushed
- Vercel account (free tier available at https://vercel.com)

### Deployment Steps

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com and sign in/sign up
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Select "Next.js" as the framework
   - Click "Deploy"

3. **Configure Environment Variables (optional):**
   - In Vercel project settings, go to "Environment Variables"
   - Add `NEXT_PUBLIC_BASE_URL` with your Vercel domain (e.g., `https://pastebin-lite.vercel.app`)
   - If using persistent storage, add database connection strings

### Production Notes

The current in-memory storage works fine for testing but will **lose all pastes on redeploy**. For production:

#### Option 1: Use Vercel PostgreSQL (Recommended)
```bash
npm install @vercel/postgres
```

Update `lib/db.ts` to use PostgreSQL instead of Map-based storage.

#### Option 2: Use Upstash Redis
```bash
npm install redis
```

Redis provides faster performance for read-heavy workloads.

#### Option 3: Use a simple database
- **MongoDB**: npm install mongodb
- **Prisma ORM**: npm install @prisma/client prisma

### Monitoring Deployments
- Check deployment status in Vercel dashboard
- View logs in "Deployments" → "View Build Logs"
- Test your deployed app at `https://your-domain.vercel.app`

### Custom Domain
1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records according to Vercel's instructions
4. Update `NEXT_PUBLIC_BASE_URL` environment variable with your custom domain

### Rollback
If something goes wrong:
- Vercel keeps deployment history
- Click on previous deployment and select "Promote to Production"
- Or redeploy from a previous commit

## Local Development Persistence (Optional)

If you want persistent storage locally without a database, you can use SQLite:

```bash
npm install better-sqlite3
```

Then modify `lib/db.ts` to use SQLite instead of Map. A simple example:

```typescript
import Database from 'better-sqlite3';

const db = new Database('pastes.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS pastes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    ttl_seconds INTEGER,
    max_views INTEGER,
    created_at INTEGER NOT NULL,
    views INTEGER DEFAULT 0
  )
`);

// Then update getPaste, createPaste, etc. to use SQL queries
```

## Scaling Considerations

For high-traffic deployments:

1. **Rate Limiting:** Add middleware to limit pastes per IP
2. **CDN:** Enable Vercel's Edge Network for faster content delivery
3. **Database Optimization:** Add indexes on `id` and `created_at` columns
4. **TTL Cleanup:** Add scheduled job to clean expired pastes
5. **Caching:** Add response caching headers for fetches

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Build failed" | Check build logs in Vercel, ensure npm run build works locally |
| "502 Bad Gateway" | App crashed; check Vercel logs |
| "Pastes disappeared after redeploy" | Using in-memory storage; migrate to persistent DB |
| "Slow response times" | Add database indexes, enable caching |
| "Cannot connect to database" | Check DATABASE_URL environment variable |

## Security Checklist

- [ ] No secrets/tokens committed to git
- [ ] CORS headers configured if needed
- [ ] Rate limiting implemented for production
- [ ] Input validation for all endpoints (✓ Already done)
- [ ] HTTPS enabled on custom domain (✓ Automatic with Vercel)
- [ ] Content Security Policy headers set (optional)
- [ ] SQL injection prevention (✓ Using parameterized queries)
