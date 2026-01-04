# Fix RLS Infinite Recursion Issue

## Problem
The RLS policies in `auth-schema.sql` cause infinite recursion because they try to read from the `user_profiles` table while checking permissions on the same table.

Error message: `infinite recursion detected in policy for relation "user_profiles"`

## Solution
Use `SECURITY DEFINER` functions to check user roles without triggering RLS recursion.

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the Fix Script**
   - Open the file `supabase/fix-rls-recursion.sql`
   - Copy all the SQL code
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Fix**
   - After running the script, try accessing the frontend again
   - The 500 errors should be resolved
   - Data should load correctly

## What the Fix Does

- Creates `is_admin()` function with `SECURITY DEFINER` to bypass RLS
- Creates `is_admin_or_manager()` function with `SECURITY DEFINER` to bypass RLS
- Updates all RLS policies to use these functions instead of direct queries
- Prevents infinite recursion by using functions that bypass RLS checks

## Important Notes

- The `SECURITY DEFINER` functions run with elevated privileges
- They bypass RLS, which is necessary to check user roles without recursion
- The functions are marked as `STABLE` for better query optimization
- All existing policies are dropped and recreated with the fix

## Testing

After running the fix:
1. Log in to the application
2. Check browser console - 500 errors should be gone
3. Verify that players, courts, and matches load correctly
4. Test admin functionality (adding players, courts, etc.)

