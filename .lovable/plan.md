

## Plan: Blog Comments System

### What We're Building
A threaded comment system on blog posts where authenticated users can post comments, edit/delete their own, and admins can moderate all comments.

### Database

**New table: `blog_comments`**
- `id` (uuid, PK, default gen_random_uuid())
- `blog_id` (uuid, NOT NULL, references blogs.id ON DELETE CASCADE)
- `user_id` (uuid, NOT NULL)
- `parent_id` (uuid, nullable, self-reference for replies)
- `content` (text, NOT NULL)
- `is_edited` (boolean, default false)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**RLS Policies:**
- Anyone can SELECT comments (public blog feature)
- Authenticated users can INSERT (with `auth.uid() = user_id`)
- Users can UPDATE their own comments (`auth.uid() = user_id`)
- Users can DELETE their own comments (`auth.uid() = user_id`)
- Admins can do everything (`has_role(auth.uid(), 'admin')`)

**Trigger:** `update_updated_at_column` on UPDATE

### New Component: `BlogComments.tsx`

A self-contained component added to the bottom of `BlogPost.tsx` that handles:

1. **Comment list** - Fetches and displays all comments for a blog post, showing commenter name (from profiles), timestamp, and content. Replies are nested with indent.
2. **Add comment form** - Textarea + submit button, visible only to authenticated users. Unauthenticated users see a "Login to comment" prompt.
3. **Reply** - Each comment has a "Reply" button that opens an inline reply form.
4. **Edit/Delete** - Users see edit/delete controls on their own comments. Admins see delete on all comments.
5. **Real-time count** - Comment count displayed in the section header.

### UI Design
- Terminal-themed styling consistent with the rest of the app (brand-dark, brand-green, brand-red colors)
- Comments displayed in a card-like format with `bg-brand-darker` background and `border-brand-green/20` borders
- Nested replies indented with a left border accent

### Changes Summary

| File | Change |
|------|--------|
| Migration SQL | Create `blog_comments` table with RLS |
| `src/components/BlogComments.tsx` | New component (comment list, form, edit, delete, reply) |
| `src/pages/BlogPost.tsx` | Import and render `BlogComments` below blog content |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

### Security
- Input validation: max 2000 chars, trimmed, non-empty
- XSS prevention: content rendered as plain text (no HTML/markdown)
- RLS ensures users can only modify their own comments
- Admin override via `has_role()` security definer function

