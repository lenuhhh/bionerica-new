-- Broiderie: reviews emergency fix for existing Supabase project
-- Run this in Supabase SQL Editor (current project)

BEGIN;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT TRUE;

UPDATE public.reviews SET approved = TRUE WHERE approved IS NULL;

-- FIX: drop FK constraint on product_id (products live in frontend only, not in DB)
-- and make product_id nullable so general reviews work too
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'reviews'
      AND constraint_name = 'reviews_product_id_fkey'
  ) THEN
    ALTER TABLE public.reviews DROP CONSTRAINT reviews_product_id_fkey;
  END IF;
END $$;

ALTER TABLE public.reviews ALTER COLUMN product_id DROP NOT NULL;

-- 1) Ensure user_id in reviews points to auth.users (not profiles)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'reviews'
      AND tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  ) THEN
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
  END IF;
END $$;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2) Recreate safe trigger function for product rating updates
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id INT;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE public.products
  SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM public.reviews WHERE product_id = target_product_id), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = target_product_id)
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_rating_trigger ON public.reviews;
CREATE TRIGGER reviews_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- 3) RLS policies for inserts by authenticated users
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews public read" ON public.reviews;
DROP POLICY IF EXISTS "Auth users can review" ON public.reviews;
DROP POLICY IF EXISTS "Own review editable" ON public.reviews;
DROP POLICY IF EXISTS "Admin manage reviews" ON public.reviews;

CREATE POLICY "Reviews public read"
  ON public.reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "Auth users can review"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Own review editable"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin manage reviews"
  ON public.reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

COMMIT;

-- Optional but recommended for auth/profile stability:
-- allow authenticated user to create own profile row if trigger missed it.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own profile insert" ON public.profiles;
CREATE POLICY "Own profile insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure blog posts admin CRUD policies exist
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts public read" ON public.posts;
DROP POLICY IF EXISTS "Admin manage posts" ON public.posts;

CREATE POLICY "Posts public read"
  ON public.posts FOR SELECT
  USING (published = TRUE OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Admin manage posts"
  ON public.posts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Reserve admin role for the requested account email
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) = 'sasha1984dontwora@gmail.com';
