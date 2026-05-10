-- Full reset to initial state for the NEW Supabase project.
-- This script removes app schema objects created during troubleshooting,
-- then recreates a clean baseline schema.
-- WARNING: This deletes app data in public tables and storage buckets listed below.

BEGIN;

-- -------------------------------------------------------------------
-- 1) Drop triggers/functions (safe if they do not exist)
-- -------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS reviews_rating_trigger ON public.reviews;
DROP TRIGGER IF EXISTS orders_status_trigger ON public.orders;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_stats() CASCADE;

-- -------------------------------------------------------------------
-- 2) Remove storage data for app buckets
-- -------------------------------------------------------------------
DELETE FROM storage.objects WHERE bucket_id IN ('products', 'avatars', 'reviews');
DELETE FROM storage.buckets WHERE id IN ('products', 'avatars', 'reviews');

-- -------------------------------------------------------------------
-- 3) Drop app tables
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- -------------------------------------------------------------------
-- 4) Recreate clean schema (baseline)
-- -------------------------------------------------------------------
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email           TEXT,
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  city            TEXT,
  birthday        DATE,
  role            TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  loyalty_points  INT NOT NULL DEFAULT 0,
  total_orders    INT NOT NULL DEFAULT 0,
  total_spent     NUMERIC(10,2) NOT NULL DEFAULT 0,
  notify_orders   BOOLEAN DEFAULT TRUE,
  notify_promo    BOOLEAN DEFAULT FALSE,
  notify_new      BOOLEAN DEFAULT TRUE,
  notify_wishlist BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE public.products (
  id               SERIAL PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  name_uk          TEXT NOT NULL,
  subtitle         TEXT,
  price            NUMERIC(10,2) NOT NULL,
  old_price        NUMERIC(10,2),
  category         TEXT NOT NULL,
  subcategory      TEXT,
  tags             TEXT[] DEFAULT '{}',
  description      TEXT,
  description_long TEXT,
  story            TEXT,
  care             TEXT[] DEFAULT '{}',
  composition      TEXT,
  material         TEXT,
  technique        TEXT,
  size             TEXT,
  weight           TEXT,
  origin           TEXT,
  color_options    TEXT[] DEFAULT '{}',
  images           TEXT[] DEFAULT '{}',
  in_stock         BOOLEAN DEFAULT TRUE,
  stock_count      INT DEFAULT 99,
  is_new           BOOLEAN DEFAULT FALSE,
  is_bestseller    BOOLEAN DEFAULT FALSE,
  is_limited       BOOLEAN DEFAULT FALSE,
  rating           NUMERIC(2,1) DEFAULT 5.0,
  review_count     INT DEFAULT 0,
  related_ids      INT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id                SERIAL PRIMARY KEY,
  product_id        INT NOT NULL REFERENCES public.products ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users,
  author            TEXT NOT NULL,
  avatar            TEXT,
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             TEXT,
  text              TEXT NOT NULL,
  images            TEXT[] DEFAULT '{}',
  approved          BOOLEAN DEFAULT TRUE,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful           INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id INT;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE public.products SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM public.reviews WHERE product_id = target_product_id), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = target_product_id)
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

CREATE TABLE public.wishlist (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES public.products ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE public.addresses (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  label       TEXT DEFAULT 'Основна',
  full_name   TEXT NOT NULL,
  phone       TEXT,
  city        TEXT NOT NULL,
  address     TEXT NOT NULL,
  delivery    TEXT DEFAULT 'nova_poshta',
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
  id              TEXT PRIMARY KEY DEFAULT ('BR-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')),
  user_id         UUID REFERENCES public.profiles,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  items           JSONB NOT NULL DEFAULT '[]',
  subtotal        NUMERIC(10,2) NOT NULL,
  delivery_cost   NUMERIC(10,2) DEFAULT 0,
  discount        NUMERIC(10,2) DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  delivery_method TEXT,
  city            TEXT,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  notes           TEXT,
  tracking        TEXT,
  promo_code      TEXT,
  payment_method  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    UPDATE public.profiles SET
      total_orders   = total_orders + 1,
      total_spent    = total_spent + NEW.total,
      loyalty_points = loyalty_points + FLOOR(NEW.total / 20)
    WHERE id = NEW.user_id;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_status_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

CREATE TABLE public.posts (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  excerpt       TEXT,
  content       TEXT,
  image         TEXT,
  gallery       TEXT[] DEFAULT '{}',
  category      TEXT,
  tags          TEXT[] DEFAULT '{}',
  author        TEXT DEFAULT 'Команда Bionerica',
  author_avatar TEXT,
  read_time     TEXT,
  published     BOOLEAN DEFAULT FALSE,
  views         INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.conversations (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users ON DELETE SET NULL,
  user_name   TEXT,
  user_email  TEXT,
  status      TEXT DEFAULT 'open',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES public.conversations ON DELETE CASCADE,
  sender_id       UUID REFERENCES auth.users ON DELETE SET NULL,
  sender_type     TEXT DEFAULT 'user',
  sender_name     TEXT,
  content         TEXT NOT NULL,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------
-- 5) Storage buckets
-- -------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('products', 'products', TRUE),
  ('avatars',  'avatars',  TRUE),
  ('reviews',  'reviews',  TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- -------------------------------------------------------------------
-- 6) RLS + policies
-- -------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles readable" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile editable" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Products public read" ON public.products FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Auth users can review" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())
);
CREATE POLICY "Own review editable" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "Create orders" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Posts public read" ON public.posts FOR SELECT USING (published = TRUE);
CREATE POLICY "Admin manage posts" ON public.posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Conversations all" ON public.conversations FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Messages all" ON public.messages FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Public product images" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public avatar images" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public review images" ON storage.objects FOR SELECT USING (bucket_id = 'reviews');
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Auth upload products" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'products' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Auth upload reviews" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'reviews' AND auth.uid() IS NOT NULL
);

-- Ensure admin role for the owner account if profile exists.
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) = 'aleksandrsmisko63@gmail.com';

COMMIT;
