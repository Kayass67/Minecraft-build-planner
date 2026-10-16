# MineBuild — Minecraft Build Planner, Recipes & Community

MineBuild is a fast, atmospheric Minecraft build-planning web application. It turns `.litematic` schematics into exact survival gathering plans, displays version-specific crafting recipe guides, and features an open Explore gallery of community creations.

> **Disclaimer:** MineBuild is an independent fan-made project and is not affiliated with, associated with, or endorsed by Mojang Studios or Microsoft Corporation. Minecraft is a registered trademark of Mojang Synergies AB.

---

## Key Features

- **Local-First Build Planner (`/planner`):** Upload any `.litematic` schematic up to 50MB. Web Workers parse the GZIP/NBT data safely in your browser without uploading raw files to remote servers.
- **Material Intelligence Engine:** Calculates dimensions, volume, solid block counts, and categorized resource requirements (Building, Redstone, Organic, Natural).
- **Crafting Recipe Guide (`/recipes`):** Minecraft Java Edition (1.20+) recipe index with 3×3 interactive crafting tables, furnace smelting paths, stonecutter steps, and direct craftable badges from analyzed builds.
- **Explore Community Gallery (`/explore`):** Browse 20+ verified community builds with 3D isometric voxel previews, key materials, and transparent creator licensing.
- **Community Submissions:** Submit creations with explicit creator rights confirmation and download permission opt-ins. Submissions enter human moderation before publishing.
- **Secure Contact & Sponsorships (`/contact`):** Private message delivery for bug reports, feedback, and sponsorships with spam prevention.
- **Persistent Local History:** Analyzed builds and inventory quantities are automatically saved in local IndexedDB (`blockplan_builds_db`) so you can resume planning anytime.

---

## Architecture & Routes

| Route | Purpose |
|---|---|
| `/` | Rich scrolling landing page with starfield, feature walkthroughs, and community highlights |
| `/planner` | Full Build Planner with schematic upload, materials dashboard, and recent builds |
| `/recipes` | Crafting and recipe guide with search and 3×3 grid previews |
| `/explore` | Community gallery with search, category filtering, and sorting |
| `/explore/[slug]` | Build detail page with specs, material breakdown, and download/creator links |
| `/contact` | Contact and sponsorship inquiry form |
| `/privacy` | Privacy policy detailing local storage and data practices |
| `/guidelines` | Community guidelines on attribution, sharing, and content standards |
| `/report` | Copyright and content removal reporting process |

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Backend (Optional for local testing, required for durable submissions)
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```

Run the database migration found in `supabase/migrations/20261013000000_minebuild_init.sql` in your Supabase SQL editor.

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Testing

Run the automated test suites:
```bash
# Recipes test suite
npx tsx test-recipes.ts

# Parser & Web Worker test suite
npx tsx test-parser.ts

# Material Intelligence Engine test suite
npx tsx test-engine.ts

# Recent Builds & Persistence test suite
npx tsx test-build-storage.ts

# Community & Explore test suite
npx tsx test-community.ts

# Contact & API test suite
npx tsx test-contact.ts
```
