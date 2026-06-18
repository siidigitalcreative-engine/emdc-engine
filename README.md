# EMDC Engine

E-commerce × Marketing × Digital Creative operations hub for Sunbeams Lifestyle.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Hosting | Vercel |
| Database | Upstash Redis (REST) |
| Language | TypeScript + React 18 |

---

## Setup — Step by Step

### 1. Clone & install

```bash
git clone https://github.com/YOUR_ORG/emdc-engine.git
cd emdc-engine
npm install
```

---

### 2. Create your Upstash Redis database

1. Go to [console.upstash.com](https://console.upstash.com) and sign in
2. Click **Create Database**
3. Name it `emdc-engine`, choose the region closest to your Vercel deployment (usually **Singapore** for PH teams)
4. Click **Create**
5. In the database dashboard, go to **REST API** tab
6. Copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**

---

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
UPSTASH_REDIS_REST_URL=https://YOUR_ENDPOINT.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN

# Optional: set a team password (shown on first visit)
NEXT_PUBLIC_APP_PASSWORD=yourteampassword
```

---

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

### 5. Deploy to Vercel

#### Option A — Vercel CLI (fastest)

```bash
npm i -g vercel
vercel
# Follow the prompts — it detects Next.js automatically
```

#### Option B — GitHub integration (recommended)

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. In **Environment Variables**, add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_APP_PASSWORD` (optional)
5. Click **Deploy**

> **Tip:** In Vercel → Storage, you can also use the **Upstash Redis integration** which auto-injects the env vars for you.

---

### 6. Connect Upstash directly in Vercel (alternative to manual env vars)

1. In your Vercel project, go to **Storage** tab
2. Click **Connect Store** → **Upstash Redis**
3. Select your `emdc-engine` database
4. Vercel automatically adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to all environments

---

## Data Architecture

All app state is persisted in Upstash Redis as JSON strings.

| Redis Key | Contents |
|-----------|----------|
| `emdc:calendar:events` | Manual calendar events array |
| `emdc:calendar:types` | Event type definitions (label + color) |
| `emdc:events:seasonal` | Seasonal events (user edits + custom) |
| `emdc:checklists:groups` | Checklist group metadata |
| `emdc:checklists:items:{id}` | Per-group checklist items (3 depts) |
| `emdc:checklists:statuses` | Custom status definitions |
| `emdc:skus:brands` | Brand list |
| `emdc:skus:items` | Full SKU catalog |

### How saving works

- On app mount → `GET /api/load` fetches all keys in parallel
- On any state change → `usePersist()` debounces 800ms then `POST /api/save` with only the changed slice
- Rapid edits (e.g. typing in a field) batch into a single write

---

## Project Structure

```
emdc-engine/
├── app/
│   ├── layout.tsx          # Root layout + Inter font
│   ├── page.tsx            # Entry point (renders EMDCApp)
│   └── api/
│       ├── load/route.ts   # GET  — fetch all state from Redis
│       └── save/route.ts   # POST — persist state patches to Redis
├── components/
│   ├── EMDCApp.tsx         # Client wrapper: loads data, shows spinner, wires save
│   └── emdc-engine.tsx     # The full app UI (adapted from emdc-engine.tsx)
├── lib/
│   ├── redis.ts            # Upstash Redis client singleton
│   ├── store-keys.ts       # All Redis key names
│   └── use-persist.ts      # usePersist() debounced save hook + loadAll()
├── .env.local              # Your secrets (never committed)
├── .env.example            # Template for teammates
└── .gitignore
```

---

## Sharing with teammates

Since this is an internal tool, you have two options:

**Option 1 — Vercel password protection** (simplest)
- In Vercel project settings → **Deployment Protection** → enable Password Protection
- Share the URL + password with your team

**Option 2 — NEXT_PUBLIC_APP_PASSWORD** (built-in)
- Set `NEXT_PUBLIC_APP_PASSWORD=yourpassword` in Vercel env vars
- The app shows a password prompt on first visit (stored in localStorage)

---

## Updating the app

```bash
# Make changes locally
npm run dev   # test

# Deploy
git add .
git commit -m "your update"
git push      # Vercel auto-deploys on push to main
```

