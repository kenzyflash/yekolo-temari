-- Fix existing blogs that have email addresses as author_name
-- Update author_name to use display names from profiles table

UPDATE blogs b
SET author_name = COALESCE(
  NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''),
  'Anonymous'
)
FROM profiles p
WHERE b.author_id = p.user_id
AND (b.author_name LIKE '%@%' OR b.author_name IS NULL OR b.author_name = '');

-- Add a comment explaining the author_name field should never contain emails
COMMENT ON COLUMN blogs.author_name IS 'Display name for blog author. Should never contain email addresses - use profiles.first_name/last_name instead.';