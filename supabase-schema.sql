-- ══════════════════════════════════════════════════════════
-- Broiderie v3 — Supabase Schema
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- PROFILES (extends auth.users — supports Google OAuth)
CREATE TABLE profiles (
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

-- Auto-create profile on signup (works with Google OAuth too)
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
      WHEN LOWER(COALESCE(NEW.email, '')) = 'sasha1984dontwora@gmail.com' THEN 'admin'
      ELSE 'customer'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    role       = CASE
      WHEN LOWER(COALESCE(EXCLUDED.email, '')) = 'sasha1984dontwora@gmail.com' THEN 'admin'
      ELSE profiles.role
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRODUCTS
CREATE TABLE products (
  id              SERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  name_uk         TEXT NOT NULL,
  subtitle        TEXT,
  price           NUMERIC(10,2) NOT NULL,
  old_price       NUMERIC(10,2),
  category        TEXT NOT NULL,
  subcategory     TEXT,
  tags            TEXT[] DEFAULT '{}',
  description     TEXT,
  description_long TEXT,
  story           TEXT,
  care            TEXT[] DEFAULT '{}',
  composition     TEXT,
  material        TEXT,
  technique       TEXT,
  size            TEXT,
  weight          TEXT,
  origin          TEXT,
  color_options   TEXT[] DEFAULT '{}',
  images          TEXT[] DEFAULT '{}',
  in_stock        BOOLEAN DEFAULT TRUE,
  stock_count     INT DEFAULT 99,
  is_new          BOOLEAN DEFAULT FALSE,
  is_bestseller   BOOLEAN DEFAULT FALSE,
  is_limited      BOOLEAN DEFAULT FALSE,
  rating          NUMERIC(2,1) DEFAULT 5.0,
  review_count    INT DEFAULT 0,
  related_ids     INT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE reviews (
  id                SERIAL PRIMARY KEY,
  product_id        INT NOT NULL REFERENCES products ON DELETE CASCADE,
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

-- Auto-update product rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id INT;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE products SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM reviews WHERE product_id = target_product_id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = target_product_id)
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- WISHLIST
CREATE TABLE wishlist (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ADDRESSES
CREATE TABLE addresses (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  label       TEXT DEFAULT 'Основна',
  full_name   TEXT NOT NULL,
  phone       TEXT,
  city        TEXT NOT NULL,
  address     TEXT NOT NULL,
  delivery    TEXT DEFAULT 'nova_poshta',
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE orders (
  id              TEXT PRIMARY KEY DEFAULT ('BR-' || LPAD(FLOOR(RANDOM()*9000+1000)::TEXT, 4, '0')),
  user_id         UUID REFERENCES profiles,
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

-- Auto-update user stats on order delivered
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    UPDATE profiles SET
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
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- BLOG POSTS
CREATE TABLE posts (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  excerpt     TEXT,
  content     TEXT,
  image       TEXT,
  gallery     TEXT[] DEFAULT '{}',
  category    TEXT,
  tags        TEXT[] DEFAULT '{}',
  author      TEXT DEFAULT 'Команда Broiderie',
  author_avatar TEXT,
  read_time   TEXT,
  published   BOOLEAN DEFAULT FALSE,
  views       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('products', 'products', TRUE),
  ('avatars',  'avatars',  TRUE),
  ('reviews',  'reviews',  TRUE)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════

ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist  ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts     ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Own profile insert"      ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile editable"     ON profiles FOR UPDATE USING (auth.uid() = id);

-- Products (public read, admin write)
CREATE POLICY "Products public read"   ON products FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage products"  ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews
CREATE POLICY "Reviews public read"  ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Auth users can review" ON reviews FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())
);
CREATE POLICY "Own review editable"   ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin manage reviews"  ON reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Wishlist
CREATE POLICY "Own wishlist"         ON wishlist FOR ALL USING (auth.uid() = user_id);

-- Addresses
CREATE POLICY "Own addresses"        ON addresses FOR ALL USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "Own orders"           ON orders FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "Create orders"        ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin orders"         ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Posts (public read, admin write)
CREATE POLICY "Posts public read"    ON posts FOR SELECT USING (published = TRUE);
CREATE POLICY "Admin manage posts"   ON posts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Storage policies
CREATE POLICY "Public product images" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public avatar images"  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars"   ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]
);

-- ══════════════════════════════════════════════════════════
-- GOOGLE OAUTH SETUP (run after creating project)
-- In Supabase Dashboard:
-- 1. Authentication → Providers → Google → Enable
-- 2. Add Client ID and Client Secret from Google Cloud Console
-- 3. Add redirect URL: https://your-project.supabase.co/auth/v1/callback
-- 4. In Google Cloud Console add Authorized redirect URI:
--    https://your-project.supabase.co/auth/v1/callback
-- ══════════════════════════════════════════════════════════

-- Make first user admin (run manually after registration):
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';

-- Grant admin access to sasha1984dontwora@gmail.com:
-- Run this in Supabase SQL Editor after the user has registered:
UPDATE profiles SET role = 'admin' WHERE LOWER(email) = 'sasha1984dontwora@gmail.com';
