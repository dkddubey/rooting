# RootsConnect Database Setup & Architecture

This directory contains the database design, schema definitions, Common Table Expressions (CTEs), and seed data for **RootsConnect**.

## Tech Stack & Free-Tier Hosting Compatibility
- **PostgreSQL 14+** (Recommended: [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) free tier)
- **Recursive CTEs**: Standard ANSI SQL recursive queries enabling high-speed genealogical tree traversal, ascendant/descendant path discovery, and Lowest Common Ancestor (LCA) resolution.
- **pg_trgm Extension**: Accelerated trigram matching for fuzzy surname and location queries.

---

## File Overview

1. `schema.sql`: Complete DDL for `users`, `ancestors`, `user_connections`, and `ancestor_matches` with foreign key cascades, unique constraints, and optimized b-tree / gin-trigram indexes.
2. `cte_queries.sql`: Recursive Common Table Expressions:
   - Pedigree Ascendant Tree (`ancestor_pedigree`)
   - Descendant Tree (`descendant_tree`)
   - Lowest Common Ancestor (LCA) & Kinship Degree Calculator (e.g. "Second Cousins via Arthur Vance")
3. `seed.sql`: Pre-populated test scenario demonstrating cross-user matching between Eleanor Vance and Marcus Vance.

---

## Quickstart Instructions

### Option 1: Hosted PostgreSQL (Neon / Supabase Free Tier)
1. Create a free PostgreSQL project on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy your connection string: `postgresql://user:password@host/dbname?sslmode=require`.
3. In your PostgreSQL client (psql, DBeaver, or Supabase SQL Editor), execute:
   ```bash
   psql "YOUR_DATABASE_URL" -f schema.sql
   psql "YOUR_DATABASE_URL" -f seed.sql
   ```
4. Set `DATABASE_URL` in `server/.env`.

### Option 2: Local Docker Container
```bash
docker run --name rootsconnect-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rootsconnect \
  -p 5432:5432 -d postgres:15

docker exec -i rootsconnect-postgres psql -U postgres -d rootsconnect < schema.sql
docker exec -i rootsconnect-postgres psql -U postgres -d rootsconnect < seed.sql
```

