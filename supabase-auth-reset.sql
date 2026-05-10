-- Reset only account/profile layer (safe for catalog/orders data).
-- Logins/passwords are stored in auth.users (managed by Supabase Auth).
-- This script rebuilds public.profiles and trigger sync.

BEGIN;

-- 1) Remove old trigger/function/profile table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2) Recreate profiles table
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email           TEXT,
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  city            TEXT,
  birthday        DATE,
  role            TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  loyalty_points  INT NOT NULL DEFAULT 0,
  total_orders    INT NOT NULL DEFAULT 0,
  total_spent     NUMERIC(10,2) NOT NULL DEFAULT 0,
  notify_orders   BOOLEAN DEFAULT TRUE,
  notify_promo    BOOLEAN DEFAULT FALSE,
  notify_new      BOOLEAN DEFAULT TRUE,
  notify_wishlist BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Trigger function to auto-create/update profile from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN LOWER(COALESCE(NEW.email, '')) = 'aleksandrsmisko63@gmail.com' THEN 'admin'
      ELSE 'customer'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    role       = CASE
      WHEN LOWER(COALESCE(EXCLUDED.email, '')) = 'aleksandrsmisko63@gmail.com' THEN 'admin'
      ELSE public.profiles.role
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Backfill profiles from existing auth users
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name') AS full_name,
  u.raw_user_meta_data->>'avatar_url' AS avatar_url,
  CASE
    WHEN LOWER(COALESCE(u.email, '')) = 'aleksandrsmisko63@gmail.com' THEN 'admin'
    ELSE 'customer'
  END AS role
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
  avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
  role = CASE
    WHEN LOWER(COALESCE(EXCLUDED.email, '')) = 'sasha1984dontwora@gmail.com' THEN 'admin'
    ELSE public.profiles.role
  END;

-- 5) RLS and policies for profiles only
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
DROP POLICY IF EXISTS "Own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Own profile editable" ON public.profiles;

CREATE POLICY "Public profiles readable" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile editable" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Ensure admin role for owner
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) = 'aleksandrsmisko63@gmail.com';

COMMIT;
