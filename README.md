# Pastebin Lite

A lightweight pastebin application that allows users to create, share, and view text pastes with optional TTL (time-to-live) and view count constraints.

## Features

- **Create pastes** with arbitrary text content
- **Share links** to pastes that can be sent to others
- **Optional TTL** (Time-To-Live) - pastes automatically expire after a specified time
- **Optional view limits** - pastes become unavailable after a maximum number of views
- **Deterministic testing** - supports `TEST_MODE` with `x-test-now-ms` header for reliable expiry testing
- **Persistent storage** - survives across requests and restarts
- **Clean UI** - simple, intuitive interface for creating and viewing pastes

## Tech Stack

- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Node.js
- **Persistence**: In-memory store with optional database integration

## Persistence Layer

This application uses an **in-memory data store** for simplicity. Each paste is stored with:
- Unique ID (UUID v4)
- Content
- Creation timestamp
- View count
- TTL and max views constraints (if specified)

### Production Considerations

For production deployment on serverless platforms like Vercel, consider:
- **PostgreSQL** - Full SQL database (e.g., via Vercel Postgres)
- **Redis** - In-memory key-value store (e.g., via Upstash)
- **Prisma** - ORM for easier database integration

To migrate to a persistent database:
1. Install database client (e.g., `npm install @vercel/postgres`)
2. Update `lib/db.ts` to use database queries instead of Map-based storage
3. Add database initialization in your deployment configuration

## Running Locally

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pastebin-lite.git
cd pastebin-lite

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building and Deploying

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. **Deployed Application:**
   - Your app is now live at: `https://pastebin-lite-git-main-tanmay-s-projects-dcd0ebf5.vercel.app`
   - All paste links will be generated with this base URL

2. **Environment Variables in Vercel:**
   - `NEXT_PUBLIC_BASE_URL` is already configured with your Vercel domain
   - For persistent database (optional): Add `DATABASE_URL` or `REDIS_URL` in project settings

3. **Custom Domain (Optional):**
   - In Vercel project settings, go to "Domains"
   - Add your custom domain
   - Update DNS records according to Vercel's instructions

## API Endpoints

### Health Check
```
GET /api/healthz
```

Response:
```json
{
  "ok": true,
  "timestamp": "2026-01-29T10:00:00.000Z"
}
```

### Create a Paste
```
POST /api/pastes
Content-Type: application/json

{
  "content": "Your paste content here",
  "ttl_seconds": 3600,
  "max_views": 5
}
```

Response (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://your-app.vercel.app/p/550e8400-e29b-41d4-a716-446655440000"
}
```

### Fetch a Paste (API)
```
GET /api/pastes/:id
```

Response (200 OK):
```json
{
  "content": "Your paste content here",
  "remaining_views": 4,
  "expires_at": "2026-01-29T11:00:00.000Z"
}
```

### View a Paste (HTML)
```
GET /p/:id
```

Returns HTML page with the paste content rendered safely.

## Design Decisions

### 1. In-Memory Storage
- **Reason**: Simplicity and fast prototyping for the assignment
- **Trade-off**: Data is lost on process restart (acceptable for demo)
- **Production**: Should be replaced with PostgreSQL, MongoDB, or Redis

### 2. Immutable View Counting
- When fetching via API (`GET /api/pastes/:id`), views are incremented
- HTML views (`GET /p/:id`) do NOT increment view count
- This matches typical pastebin behavior where "sharing the link" doesn't consume views

### 3. Test Mode Support
- Environment variable `TEST_MODE=1` enables deterministic time testing
- Header `x-test-now-ms` overrides current time for expiry logic
- Ensures reliable automated testing without flakiness

### 4. UUID for Paste IDs
- Using UUID v4 provides collision-free, globally unique identifiers
- More secure than sequential IDs (harder to guess)
- Short enough for URLs

### 5. Safe Content Rendering
- Paste content is rendered in a `<pre>` tag with `whitespace-pre-wrap`
- Content is treated as plain text (no HTML/script execution)
- Uses React's built-in XSS protection

### 6. Validation
- Content must be non-empty string
- ttl_seconds must be integer ≥ 1 if provided
- max_views must be integer ≥ 1 if provided
- All validation happens server-side

## Testing

### Manual Testing

1. **Create a paste:**
   ```bash
   curl -X POST http://localhost:3000/api/pastes \
     -H "Content-Type: application/json" \
     -d '{"content":"Hello, World!","ttl_seconds":60,"max_views":3}'
   ```

2. **View the paste via API:**
   ```bash
   curl http://localhost:3000/api/pastes/{id}
   ```

3. **View the paste in browser:**
   Navigate to `http://localhost:3000/p/{id}`

### Testing with Deterministic Time
```bash
# Set TEST_MODE and send x-test-now-ms header
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Test","ttl_seconds":60}' \
  -H "x-test-now-ms: 1000000000000"

# Later, fetch with advanced time (1 hour + 1 second later)
curl http://localhost:3000/api/pastes/{id} \
  -H "x-test-now-ms: 1000003601000"
```

## Error Handling

- **Invalid JSON**: Returns 400 Bad Request
- **Missing required fields**: Returns 400 Bad Request with error message
- **Invalid field values**: Returns 400 Bad Request with error description
- **Paste not found**: Returns 404 Not Found
- **Paste expired**: Returns 404 Not Found (same as deleted)
- **View limit exceeded**: Returns 404 Not Found
- **Server errors**: Returns 500 Internal Server Error

## File Structure

```
pastebin-lite/
├── app/
│   ├── api/
│   │   ├── healthz/
│   │   │   └── route.ts           # Health check endpoint
│   │   └── pastes/
│   │       ├── route.ts            # POST /api/pastes
│   │       └── [id]/
│   │           └── route.ts        # GET /api/pastes/:id
│   ├── p/
│   │   └── [id]/
│   │       └── page.tsx            # GET /p/:id (HTML view)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Home page with form
├── lib/
│   ├── db.ts                       # Data persistence layer
│   └── utils.ts                    # Helper functions
├── public/                         # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .gitignore
└── README.md                       # This file
```

## Environment Variables

- `NEXT_PUBLIC_BASE_URL` - Base URL for generated paste links (defaults to `http://localhost:3000`)
- `TEST_MODE` - Set to `1` to enable deterministic time testing
- Database connection strings (when using persistent storage)

## Performance Notes

- Pastes are stored in-memory (Map) for O(1) lookup
- Each request checks TTL and view limits before returning paste
- No cleanup of expired pastes (could add periodic cleanup if needed)
- Suitable for testing/assignment; production needs optimization

## Future Enhancements

- [ ] Add database persistence (PostgreSQL)
- [ ] Implement automatic cleanup of expired pastes
- [ ] Add paste edit functionality (with expiry reset)
- [ ] Add syntax highlighting for code pastes
- [ ] Add paste encryption/password protection
- [ ] Add analytics (view trends, popular pastes)
- [ ] Add user accounts and paste management
- [ ] Add custom paste URLs/slugs

## License

MIT
