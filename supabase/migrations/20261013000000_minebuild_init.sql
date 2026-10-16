-- ============================================================================
-- MineBuild Database Migration
-- Tables: contact_messages, community_builds
-- Row Level Security (RLS) and Access Policies
-- ============================================================================

-- 1. Contact Messages Table (Private, Owner-Only Access)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    reply_email TEXT NOT NULL,
    inquiry_type TEXT NOT NULL DEFAULT 'general',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'reviewed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for efficient owner filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Deny public reading completely (Service Role only can read)
DROP POLICY IF EXISTS "Deny public select on contact_messages" ON public.contact_messages;
CREATE POLICY "Service role full access on contact_messages"
    ON public.contact_messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated or anon API submission inserts
DROP POLICY IF EXISTS "Allow anon inserts on contact_messages" ON public.contact_messages;
CREATE POLICY "Allow anon inserts on contact_messages"
    ON public.contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);


-- 2. Community Builds Table (Moderated Community Gallery)
CREATE TABLE IF NOT EXISTS public.community_builds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    creator_name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    dimensions JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
    region_count INT NOT NULL DEFAULT 1,
    solid_block_count INT NOT NULL DEFAULT 0,
    minecraft_version TEXT NOT NULL DEFAULT '1.20.4',
    top_block_names TEXT[] NOT NULL DEFAULT '{}',
    downloadable BOOLEAN NOT NULL DEFAULT false,
    source_url TEXT,
    schematic_storage_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    published_at TIMESTAMPTZ
);

-- Indexes for search, category filtering, and status filtering
CREATE INDEX IF NOT EXISTS idx_community_builds_status ON public.community_builds (status);
CREATE INDEX IF NOT EXISTS idx_community_builds_category ON public.community_builds (category);
CREATE INDEX IF NOT EXISTS idx_community_builds_published_at ON public.community_builds (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_builds_slug ON public.community_builds (slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.community_builds ENABLE ROW LEVEL SECURITY;

-- Public can ONLY view builds that are marked as 'published'
DROP POLICY IF EXISTS "Public can view published community builds" ON public.community_builds;
CREATE POLICY "Public can view published community builds"
    ON public.community_builds
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Public users can submit new builds, but they MUST have status 'pending'
DROP POLICY IF EXISTS "Public can insert pending community builds" ON public.community_builds;
CREATE POLICY "Public can insert pending community builds"
    ON public.community_builds
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'pending');

-- Service role has full management access (moderation, publishing, deleting)
DROP POLICY IF EXISTS "Service role full access on community_builds" ON public.community_builds;
CREATE POLICY "Service role full access on community_builds"
    ON public.community_builds
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
