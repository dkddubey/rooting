-- =====================================================================
-- RootsConnect: Database Schema (PostgreSQL)
-- Compatible with PostgreSQL 14+, Neon, Supabase, and AWS RDS
-- =====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy string search and trigram matching

-- ---------------------------------------------------------------------
-- 1. Users Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    origin_places TEXT[], -- e.g. ARRAY['Dublin, Ireland', 'Boston, MA']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ---------------------------------------------------------------------
-- 2. Ancestors Table (Nodes in the Family Graph)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ancestors (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    maiden_name VARCHAR(100),
    gender VARCHAR(20) DEFAULT 'other', -- 'male', 'female', 'other', 'unknown'
    birth_year INTEGER,
    death_year INTEGER,
    birth_place VARCHAR(255),
    death_place VARCHAR(255),
    bio TEXT,
    photo_url VARCHAR(500),
    
    -- Hierarchical pedigree pointers
    father_id VARCHAR(36) REFERENCES ancestors(id) ON DELETE SET NULL,
    mother_id VARCHAR(36) REFERENCES ancestors(id) ON DELETE SET NULL,
    spouse_id VARCHAR(36) REFERENCES ancestors(id) ON DELETE SET NULL,
    
    -- Metadata & Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_ancestors_user ON ancestors(user_id);
CREATE INDEX IF NOT EXISTS idx_ancestors_father ON ancestors(father_id);
CREATE INDEX IF NOT EXISTS idx_ancestors_mother ON ancestors(mother_id);
CREATE INDEX IF NOT EXISTS idx_ancestors_spouse ON ancestors(spouse_id);
CREATE INDEX IF NOT EXISTS idx_ancestors_names ON ancestors(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_ancestors_birth_year ON ancestors(birth_year);
CREATE INDEX IF NOT EXISTS idx_ancestors_birth_place ON ancestors(birth_place);

-- Trigram index for ultra-fast name fuzzy matching in PostgreSQL
CREATE INDEX IF NOT EXISTS idx_ancestors_name_trgm ON ancestors USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- ---------------------------------------------------------------------
-- 3. User Connections Table (Social & Relative Network)
-- ---------------------------------------------------------------------
CREATE TYPE connection_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');
CREATE TYPE connection_type AS ENUM ('RELATIVE', 'FRIEND');

CREATE TABLE IF NOT EXISTS user_connections (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    requester_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'
    relation_type VARCHAR(20) NOT NULL DEFAULT 'RELATIVE', -- 'RELATIVE', 'FRIEND'
    kinship_title VARCHAR(150), -- e.g. 'Second Cousins via Arthur Vance'
    common_ancestor_id VARCHAR(36) REFERENCES ancestors(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate pairing in same direction
    CONSTRAINT unique_connection_pair UNIQUE (requester_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_users ON user_connections(requester_id, receiver_id, status);

-- ---------------------------------------------------------------------
-- 4. Ancestor Matches Table (Smart Matching Engine Output)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ancestor_matches (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user1_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ancestor1_id VARCHAR(36) NOT NULL REFERENCES ancestors(id) ON DELETE CASCADE,
    ancestor2_id VARCHAR(36) NOT NULL REFERENCES ancestors(id) ON DELETE CASCADE,
    match_score NUMERIC(5, 2) NOT NULL, -- percentage score: e.g. 92.50
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DISMISSED'
    match_reasons JSONB DEFAULT '{}'::jsonb, -- details: { nameScore, phoneticMatch, birthPlaceMatch, yearDelta }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate match proposals for the same ancestor pair
    CONSTRAINT unique_ancestor_match_pair UNIQUE (ancestor1_id, ancestor2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_users ON ancestor_matches(user1_id, user2_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_ancestors ON ancestor_matches(ancestor1_id, ancestor2_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON ancestor_matches(match_score DESC);

