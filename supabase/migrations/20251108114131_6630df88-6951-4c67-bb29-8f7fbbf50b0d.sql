-- Drop the security definer view that was just created
-- This view bypasses RLS which is a security risk
DROP VIEW IF EXISTS public.blogs_public;

-- Instead of using a view, we'll handle author_id exposure at the application layer
-- The blogs table will remain as-is, but the frontend code will not query or display author_id
-- for public blog listings (only author_name will be shown)

-- Add a comment to the blogs table to document this security consideration
COMMENT ON COLUMN public.blogs.author_id IS 'Internal user ID - should not be exposed in public API responses. Use author_name for public display.';