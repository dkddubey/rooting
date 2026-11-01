# RootsConnect 🌳

> **Genealogy-based social network** where users map ancestral trees, discover shared heritage, and connect with living relatives using smart fuzzy & phonetic matching algorithms.

---

## 🏛️ System Architecture & Tech Stack

RootsConnect is built entirely on **100% free and open-source software** (no commercial licenses required):

1. **Frontend (`client/`):**
   - **React 18** with **Vite** & **TypeScript**
   - **Tailwind CSS** with custom parchment/forest genealogical aesthetic
   - **Lucide Icons**
   - **Socket.io Client** for real-time WebSocket notifications of incoming match proposals
   - Interactive generational family tree canvas with zoom, pan, and pedigree node connectors
   - Deployable free on Vercel or Netlify

2. **Backend API (`server/`):**
   - **Node.js** + **Express.js** + **TypeScript**
   - **Socket.io** WebSocket server for instant match alerts and connection requests
   - **Prisma ORM** supporting SQLite for zero-setup instant local execution, and production PostgreSQL (Neon or Supabase free tiers)
   - JWT authentication with bcrypt password hashing
   - RESTful API endpoints for ancestors, connections, kinship, and matches

3. **Database & Graph Engine (`database/`):**
   - **PostgreSQL Schema (`database/schema.sql`):** Tables for `users`, `ancestors`, `user_connections`, and `ancestor_matches` with foreign key cascades and trigram indexes
   - **Recursive Common Table Expressions (`database/cte_queries.sql`):** ANSI SQL recursive CTEs for high-speed pedigree ascendant traversal, descendant tree exploration, and Lowest Common Ancestor (LCA) resolution
   - **Seed Data (`database/seed.sql`):** Realistic Vance and Miller family trees with 2nd and 3rd cousin lineages

4. **Smart Matching Engine (`server/src/services/matchingService.ts`):**
   - **String Similarity:** Jaro-Winkler distance + normalized Levenshtein ratio for ancestor surnames and given names
   - **Phonetic Matching:** American Soundex algorithm combined with Metaphone phonetic rules to catch spelling variations across census and immigration records (e.g. *Vance* vs *Vans*, *Connor* vs *O'Connor*)
   - **Birthplace Fuzzy Matching:** Token overlap analysis handling geographical prefixes (e.g. *"County Cork, Ireland"* vs *"Cork, Ireland"*)
   - **Year Proximity Window:** Generational date scoring with a tolerance window of ±3 years
   - **Automated Background Job:** Scans across other users' ancestral trees automatically on every ancestor creation or update

5. **Kinship & LCA Traversal Engine (`server/src/services/kinshipService.ts`):**
   - Discovers the **Lowest Common Ancestor (LCA)** between two users
   - Calculates exact generational distances ($d_1$ and $d_2$)
   - Computes human-readable genealogical relationships:
     - *Parent / Child*
     - *Siblings*
     - *Aunt/Uncle & Niece/Nephew*
     - *First Cousins*
     - *First Cousins Once Removed*
     - *Second Cousins via Arthur Vance*
     - *Third Cousins*

---

## 📁 Directory Structure

```
rooting/
├── database/
│   ├── schema.sql             # PostgreSQL DDL with foreign keys, constraints & trigram indexes
│   ├── cte_queries.sql        # Recursive Common Table Expressions for tree & LCA traversal
│   ├── seed.sql               # PostgreSQL sample seed data (Vance family branches)
│   └── README.md              # Supabase, Neon & Docker database deployment guide
├── server/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema
│   │   └── seed.ts            # Seeder script
│   ├── src/
│   │   ├── config/            # JWT & environment settings
│   │   ├── controllers/       # Auth, Ancestor, Match, and Connection controllers
│   │   ├── middleware/        # JWT auth verification
│   │   ├── routes/            # Express router modules
│   │   ├── services/
│   │   │   ├── matchingService.ts  # Fuzzy & phonetic smart matching worker
│   │   │   ├── kinshipService.ts   # Graph traversal & kinship calculator
│   │   │   └── socketService.ts    # Socket.io real-time dispatcher
│   │   ├── utils/
│   │   │   └── stringAlgorithms.ts # Levenshtein, Jaro-Winkler, Soundex, Metaphone
│   │   ├── types/             # Domain TypeScript interfaces
│   │   └── index.ts           # Express server entrypoint
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── FamilyTreeCanvas.tsx     # Interactive genealogical canvas
│   │   │   ├── AncestorNodeCard.tsx     # Card with birth/death & pedigree links
│   │   │   ├── AddAncestorModal.tsx     # Form with parent linking
│   │   │   ├── MatchNotificationBanner.tsx # Floating real-time alert banner
│   │   │   ├── MatchDetailsModal.tsx    # Side-by-side comparison modal
│   │   │   ├── MatchesView.tsx          # Smart match list & manual scan
│   │   │   ├── ConnectionsView.tsx      # Relatives & connection requests
│   │   │   ├── KinshipViewerModal.tsx   # Common ancestor hierarchy visualizer
│   │   │   └── AuthModal.tsx            # Login, register & demo switcher
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── package.json               # Root monorepo workspace scripts
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
Run the install command from the root directory:
```bash
npm run install:all
```
*(Or run `npm install` inside `server/` and `client/` respectively).*

### 2. Initialize the Database
```bash
npm run db:push
npm run db:seed
```
*By default, the server uses a local SQLite database (`dev.db`) with zero external prerequisites. To connect to PostgreSQL on Supabase or Neon, simply set `DATABASE_URL` in `server/.env` and run `npm run db:push`.*

### 3. Run the Development Servers
Open two terminal tabs:

**Terminal 1 (Backend API & WebSocket Server):**
```bash
npm run dev:server
```
Runs at: `http://localhost:4000`

**Terminal 2 (Frontend React Client):**
```bash
npm run dev:client
```
Runs at: `http://localhost:5173`

---

## 🧪 Interactive Demo Walkthrough

The seeded database comes pre-configured with two interconnected Vance family branches:

1. **Eleanor Vance** (`eleanor@rootsconnect.local`):
   - Boston branch.
   - Great-grandfather: **Arthur Vance** (Born 1898 in County Cork, Ireland; Died 1965 in Boston, MA).
2. **Marcus Vance** (`marcus@rootsconnect.local`):
   - Chicago branch.
   - Great-grandfather: **Arthur Vance** (Recorded as born 1897 in Cork, Ireland; Died 1964 in Boston, MA).

### Testing Smart Matching & Kinship Linking:
1. Open `http://localhost:5173`. You will automatically be signed in as **Eleanor Vance**.
2. Notice the **Match Found!** banner at the top showing a **94.5% match** for Arthur Vance.
3. Click **"Review & Connect"** to open the side-by-side comparison modal.
4. Inspect the algorithmic breakdown:
   - Jaro-Winkler name similarity: `100%`
   - Phonetic match: `Exact Soundex (V520)`
   - Birthplace token overlap: `92%`
   - Birth year gap: `1 year`
5. Click **"Connect as Relatives & Link Trees"**.
6. Switch to the **"Kinship & Relatives"** tab:
   - Notice the verified connection: *"Second Cousins via common ancestor Arthur Vance"*.
   - Click **"Explore Kinship Path"** to view the step-by-step generational descent tree connecting both users!
7. Switch to **Marcus Vance** using the demo persona switcher in the top-right navbar to view the reciprocal relationship.
8. Add any new ancestor in Eleanor's tree: the automated background matching worker scans Marcus's tree and triggers instant live notifications over WebSocket!

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Sign in & receive JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `POST` | `/api/auth/switch-demo` | Instant demo account switch |
| `GET` | `/api/ancestors` | List all ancestors for current user |
| `GET` | `/api/ancestors/tree` | Hierarchical graph data (nodes & edges) |
| `POST` | `/api/ancestors` | Add ancestor & trigger background matching job |
| `PUT` | `/api/ancestors/:id` | Update ancestor details & re-run matching |
| `DELETE` | `/api/ancestors/:id` | Remove ancestor node |
| `GET` | `/api/matches` | List smart ancestor matches & metrics |
| `POST` | `/api/matches/:id/accept` | Accept match & link user family trees |
| `POST` | `/api/matches/:id/dismiss` | Dismiss match proposal |
| `POST` | `/api/matches/scan` | Trigger full database cross-matching scan |
| `GET` | `/api/connections` | List friends & connected relatives |
| `POST` | `/api/connections/request` | Send connection request as Friend or Relative |
| `PUT` | `/api/connections/respond/:id` | Accept or reject connection request |
| `GET` | `/api/connections/kinship/:otherUserId` | Traverses graph & calculates common ancestor hierarchy |
| `POST` | `/api/seed/reset-seed` | Reset demo genealogies |

---

## 📄 License
This project is licensed under the **MIT License** — 100% free and open source.

