

## Plan: Fix Admin Notification System

This plan addresses the notification system that's stuck on "Loading..." and the edge function build error.

### Problem Summary

Based on my investigation, I found:

1. **3 unread notifications exist in the database** - The data is there
2. **RLS policies are correctly configured** - Admins should be able to read notifications
3. **Edge function build error** - The `check-account-lockout` function has an import error
4. **Race condition in notification component** - The loading state may get stuck

### Root Causes

1. **Edge Function Import Error**: The Supabase JS library import is using a version that returns a 500 error from esm.sh
2. **Component Race Condition**: The `AdminNotificationBell` component has timing issues between:
   - Checking if user is admin (`isAdmin()`)
   - Loading state management
   - The dependency array in useEffect including `isAdmin` function reference

### Fixes to Apply

#### Fix 1: Edge Function Import (fixes build error)

Update all edge functions to use a stable import pattern without a specific version number that might cause 500 errors.

**Files to update:**
- `supabase/functions/check-account-lockout/index.ts`
- Other edge functions using the same import pattern

Change:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
```

This pattern should work, but the esm.sh CDN sometimes has issues with specific versions. We'll ensure all imports are consistent.

#### Fix 2: Notification Component Race Condition

Update `AdminNotificationBell.tsx` to:

1. **Add proper error handling** - Show error state instead of infinite loading
2. **Fix dependency array** - Remove `isAdmin` function from deps (causes re-renders)
3. **Add timeout handling** - Prevent infinite loading state
4. **Improve state management** - Ensure loading is set to false in all code paths

**Changes:**
```typescript
// Add error state
const [error, setError] = useState<string | null>(null);

// Fix useEffect to not depend on isAdmin function reference
useEffect(() => {
  if (!user || rolesLoading) return;
  
  // Check admin status using roles array directly
  const userIsAdmin = roles.includes('admin');
  if (!userIsAdmin) return;

  fetchNotifications();
  // ... setup realtime
}, [user, rolesLoading, roles]); // Use roles array instead of isAdmin function

// Add error display in UI
{error ? (
  <div className="p-4 text-center text-red-400">
    {error}
  </div>
) : loading ? (
  // ... loading UI
)}
```

#### Fix 3: Add Retry Logic

Add a retry mechanism for failed notification fetches:

```typescript
const fetchNotifications = async (retryCount = 0) => {
  try {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (retryCount < 2) {
        setTimeout(() => fetchNotifications(retryCount + 1), 1000);
        return;
      }
      throw error;
    }
    setNotifications(data || []);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    setError('Failed to load notifications');
  } finally {
    setLoading(false);
  }
};
```

### Implementation Steps

| Step | Task | File |
|------|------|------|
| 1 | Fix edge function import | `supabase/functions/check-account-lockout/index.ts` |
| 2 | Add error state to notification component | `src/components/admin/AdminNotificationBell.tsx` |
| 3 | Fix useEffect dependency array | `src/components/admin/AdminNotificationBell.tsx` |
| 4 | Add retry logic for fetch | `src/components/admin/AdminNotificationBell.tsx` |
| 5 | Update UI to show error state | `src/components/admin/AdminNotificationBell.tsx` |
| 6 | Deploy and test | - |

### User Action Required

**Critical:** The system detected that your `package-lock.json` file is corrupted/invalid JSON. You need to fix this manually:

1. Delete `package-lock.json` from your project
2. Run `npm install` to regenerate it

This is required for the project to build correctly.

### Testing

After implementation:
1. Login as an admin user
2. Click the notification bell in the navigation
3. Verify notifications load (should show 3 unread)
4. Test mark as read and delete functions
5. Verify real-time updates work for new notifications

