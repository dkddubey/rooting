# Role and Objective
You are an expert Full-Stack Software Architect and AI Engineer. Your task is to build a complete, production-ready full-stack web application called **"RootsConnect"** — a genealogy-based social network where users map their ancestral trees, discover shared heritage, and connect with relatives based on smart matching algorithms.

---

# Tech Stack (100% Free & Open Source / No Commercial Licenses)
1. **Frontend:** React.js (Vite) + Tailwind CSS + Lucide Icons (deployed free on Vercel or Netlify).
2. **Backend:** Node.js with Express.js (REST API + WebSocket/Socket.io for real-time notifications).
3. **Database & Graph Engine:** 
   - **PostgreSQL** (Hosted free on Supabase or Neon) with recursive Common Table Expressions (CTEs) for fast family tree and graph traversal.
   - Alternatively, **Neo4j Aura Free Tier** (Graph Database) for mapping complex kinship relationships.
4. **Smart Matching Engine:** Node.js/Python worker using string similarity algorithms (Levenshtein Distance / Jaro-Winkler) combined with phonetic matching (Soundex / Metaphone) for ancestor name and birthplace matching.

---

# Core Functional Requirements

## 1. User Authentication & Profile Management
* Secure JWT-based authentication (Sign up, Login, Password Reset).
* User profiles with basic information, bio, and ancestral origin locations.

## 2. Ancestor Tree Management
* Users can add nodes representing known ancestors (First Name, Last Name, Maiden Name, Birth Year, Death Year, Birthplace, Death Place, Gender, Bio).
* Hierarchical parent-child relationship linking.
* Visual interactive family tree canvas (using `react-flow-renderer` or `d3-hierarchy`).

## 3. Direct Connection & Relationship Sharing
* Users can send connection requests to other users as **"Friend"** or **"Relative"**.
* When connected as relatives, the system computes and displays the common ancestor hierarchy (e.g., "Third Cousins via common great-grandfather John Doe").

## 4. Smart Ancestor Matching & Connection Proposer
* **Automated Background Job:** Whenever a user adds or updates an ancestor, the system scans the database for matching nodes using fuzzy logic (Name similarity > 85%, Birthplace match, Date proximity within +/- 3 years).
* **Match Notification / Proposal:** The app flags potential matches and prompts both users: *"We found a match for your ancestor [Ancestor Name]. Would you like to connect with [User Name]?"*
* Once accepted, the users are linked, and their family trees connect visually.

---

# Deliverables Required
1. **Directory Structure:** Clean folder layout for client, server, and matching service.
2. **Database Schema:** PostgreSQL SQL scripts (`users`, `ancestors`, `user_connections`, `ancestor_matches`).
3. **Backend API Code (Node.js/Express):** Core endpoints for adding ancestors and running matching logic.
4. **Frontend Components (React):** Dashboard, Tree visualizer, and Match Notification banner.