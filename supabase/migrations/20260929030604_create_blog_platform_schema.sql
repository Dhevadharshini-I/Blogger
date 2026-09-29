/*
# Blog Platform Schema — Posts, Comments, Profiles

Creates the full database schema for a multi-user blogging platform.

## 1. New Tables

### `profiles`
- `id` (uuid, PK, references auth.users) — one row per registered user
- `username` (text, unique, not null) — display name shown on posts and comments
- `bio` (text, nullable) — optional author bio
- `created_at` (timestamptz, default now())

### `posts`
- `id` (uuid, PK)
- `title` (text, not null)
- `content` (text, not null)
- `excerpt` (text, nullable) — short summary for the feed
- `author_id` (uuid, not null, default auth.uid(), references profiles ON DELETE CASCADE)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### `comments`
- `id` (uuid, PK)
- `post_id` (uuid, not null, references posts ON DELETE CASCADE)
- `author_id` (uuid, not null, default auth.uid(), references profiles ON DELETE CASCADE)
- `content` (text, not null)
- `created_at` (timestamptz, default now())

## 2. Security (RLS + Policies)

### profiles
- SELECT: public to authenticated users (so anyone can see author info)
- INSERT: a user can only insert their own profile row
- UPDATE: a user can only update their own profile

### posts
- SELECT: public to all (anon + authenticated) — blog posts are readable by everyone
- INSERT: authenticated users can insert posts they own (author_id defaults to auth.uid())
- UPDATE: only the post owner
- DELETE: only the post owner

### comments
- SELECT: public to all — comments are readable by everyone
- INSERT: authenticated users can insert comments they own
- UPDATE: only the comment owner
- DELETE: only the comment owner

## 3. Indexes
- `posts.created_at` desc — for feed ordering
- `comments.post_id` + `comments.created_at` — for loading comments on a post

## 4. Notes
- The `author_id` columns default to `auth.uid()` so frontend inserts that omit
  the column still satisfy the INSERT policy's WITH CHECK.
- Posts and comments are publicly readable (TO anon, authenticated) so non-logged-in
  visitors can browse the blog. Writing requires authentication.
*/

-- ===== profiles =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===== posts =====
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all"
  ON posts FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own"
  ON posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- ===== comments =====
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all"
  ON comments FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own"
  ON comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own"
  ON comments FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- ===== indexes =====
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id, created_at);
