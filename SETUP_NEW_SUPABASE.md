# New Supabase Setup (Working Reviews)

1. Create a new Supabase project in dashboard.
2. Open SQL Editor in that project.
3. Run `supabase-schema.sql`.
4. Run `supabase-seed.sql`.
5. In project API settings, copy:
- Project URL
- Publishable (anon) key
6. Put them into `.env`:

VITE_SUPABASE_URL=YOUR_NEW_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_NEW_PUBLISHABLE_KEY

7. Restart dev server.

## If current project is broken and you do NOT want to recreate everything
Run `supabase-reviews-fix.sql` in SQL Editor of current project.

This fixes:
- reviews.user_id foreign key mismatch
- trigger issues for rating updates
- RLS insert policy for authenticated users
