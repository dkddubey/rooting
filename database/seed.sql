-- =====================================================================
-- RootsConnect: Sample Seed Data (PostgreSQL)
-- Run after schema.sql
-- =====================================================================

-- Clean existing data
TRUNCATE TABLE ancestor_matches, user_connections, ancestors, users CASCADE;

-- Insert Demo Users (bcrypt hash for 'password123': $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
INSERT INTO users (id, email, password_hash, name, bio, origin_places) VALUES
(
    'u1-eleanor-vance',
    'eleanor@rootsconnect.local',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Eleanor Vance',
    'Historian & genealogist researching early 20th-century Irish-American migration routes.',
    ARRAY['County Cork, Ireland', 'Boston, MA']
),
(
    'u2-marcus-vance',
    'marcus@rootsconnect.local',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Marcus Vance',
    'Architect based in Chicago. Mapping the Vance family diaspora across the Midwest.',
    ARRAY['Cork, Ireland', 'Chicago, IL', 'Boston, MA']
),
(
    'u3-clara-miller',
    'clara@rootsconnect.local',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Clara Miller',
    'Archivist tracing New England colonial records and maritime ancestry.',
    ARRAY['Dublin, Ireland', 'Salem, MA']
);

-- ---------------------------------------------------------------------
-- Ancestors for Eleanor Vance (User 1)
-- ---------------------------------------------------------------------
-- Great-Grandparents
INSERT INTO ancestors (id, user_id, first_name, last_name, maiden_name, gender, birth_year, death_year, birth_place, death_place, bio) VALUES
('anc-e-arthur', 'u1-eleanor-vance', 'Arthur', 'Vance', NULL, 'male', 1898, 1965, 'County Cork, Ireland', 'Boston, MA', 'Immigrated through Boston Harbor in 1914; skilled stonemason and harbor worker.'),
('anc-e-mary', 'u1-eleanor-vance', 'Mary', 'Vance', 'O''Connor', 'female', 1902, 1974, 'Galway, Ireland', 'Boston, MA', 'Homemaker and community organizer in South Boston.');

-- Grandparents
INSERT INTO ancestors (id, user_id, first_name, last_name, gender, birth_year, death_year, birth_place, death_place, father_id, mother_id) VALUES
('anc-e-thomas', 'u1-eleanor-vance', 'Thomas', 'Vance', 'male', 1930, 2004, 'Boston, MA', 'Boston, MA', 'anc-e-arthur', 'anc-e-mary'),
('anc-e-helen', 'u1-eleanor-vance', 'Helen', 'Vance', 'female', 1934, 2012, 'Providence, RI', 'Boston, MA', NULL, NULL);

-- Parents
INSERT INTO ancestors (id, user_id, first_name, last_name, gender, birth_year, death_year, birth_place, death_place, father_id, mother_id) VALUES
('anc-e-robert', 'u1-eleanor-vance', 'Robert', 'Vance', 'male', 1960, NULL, 'Boston, MA', NULL, 'anc-e-thomas', 'anc-e-helen'),
('anc-e-sarah', 'u1-eleanor-vance', 'Sarah', 'Vance', 'female', 1963, NULL, 'Portland, ME', NULL, NULL, NULL);

-- Eleanor herself (Root)
INSERT INTO ancestors (id, user_id, first_name, last_name, gender, birth_year, death_year, birth_place, father_id, mother_id, bio) VALUES
('anc-e-eleanor', 'u1-eleanor-vance', 'Eleanor', 'Vance', 'female', 1992, NULL, 'Boston, MA', 'anc-e-robert', 'anc-e-sarah', 'User root node in personal family tree.');


-- ---------------------------------------------------------------------
-- Ancestors for Marcus Vance (User 2)
-- ---------------------------------------------------------------------
-- Great-Grandfather Arthur Vance (Slight spelling/date variance: 1897 vs 1898, 'Cork, Ireland' vs 'County Cork, Ireland')
INSERT INTO ancestors (id, user_id, first_name, last_name, maiden_name, gender, birth_year, death_year, birth_place, death_place, bio) VALUES
('anc-m-arthur', 'u2-marcus-vance', 'Arthur', 'Vance', NULL, 'male', 1897, 1964, 'Cork, Ireland', 'Boston, MA', 'Born in County Cork; immigrated to the USA. Patriarch of the Boston Vance branch.'),
('anc-m-mary', 'u2-marcus-vance', 'Mary', 'Vance', 'O''Connor', 'female', 1901, 1970, 'Galway, Ireland', 'Boston, MA', 'Matriarch of our branch.');

-- Grandparents
INSERT INTO ancestors (id, user_id, first_name, last_name, gender, birth_year, death_year, birth_place, death_place, father_id, mother_id) VALUES
('anc-m-edward', 'u2-marcus-vance', 'Edward', 'Vance', 'male', 1928, 1999, 'Boston, MA', 'Chicago, IL', 'anc-m-arthur', 'anc-m-mary'),
('anc-m-beatrice', 'u2-marcus-vance', 'Beatrice', 'Vance', 'female', 1932, 2015, 'Chicago, IL', 'Chicago, IL', NULL, NULL);

-- Parents
INSERT INTO ancestors (id, user_id, first_name, last_name, gender, birth_year, death_year, birth_place, death_place, father_id, mother_id) VALUES
('anc-m-william', 'u2-marcus-vance', 'William', 'Vance', 'male', 1958, NULL, 'Chicago, IL', NULL, 'anc-m-edward', 'anc-m-beatrice'),
('anc-m-laura', 'u2-marcus-vance', 'Laura', 'Vance', 'female', 1961, NULL, 'Evanston, IL', NULL, NULL, NULL);

-- Marcus himself (Root)
INSERT INTO ancestors (id, user_id, first_name, last_name, gender, birth_year, death_year, birth_place, father_id, mother_id, bio) VALUES
('anc-m-marcus', 'u2-marcus-vance', 'Marcus', 'Vance', 'male', 1989, NULL, 'Chicago, IL', 'anc-m-william', 'anc-m-laura', 'User root node in personal family tree.');


-- ---------------------------------------------------------------------
-- Seed Match Candidate Proposal
-- ---------------------------------------------------------------------
INSERT INTO ancestor_matches (id, user1_id, user2_id, ancestor1_id, ancestor2_id, match_score, status, match_reasons) VALUES
(
    'match-arthur-vance',
    'u1-eleanor-vance',
    'u2-marcus-vance',
    'anc-e-arthur',
    'anc-m-arthur',
    94.50,
    'PENDING',
    '{
        "nameSimilarity": 1.0,
        "phoneticMatch": true,
        "soundex": "V520",
        "metaphone": "FNS",
        "birthplaceMatch": 0.90,
        "yearDelta": 1,
        "yearScore": 0.95
    }'::jsonb
);

