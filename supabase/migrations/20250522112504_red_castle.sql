/*
  # Fix Cases RLS Policies

  1. Changes
    - Add RLS policy for users to view all cases where they are the user_id
    - Add RLS policy for lawyers to view all cases where they are the lawyer_id
    - Add RLS policy for users to create cases with their own user_id
    - Add RLS policy for users to update their own cases
    - Add RLS policy for lawyers to update cases assigned to them

  2. Security
    - Enable RLS on cases table (already enabled)
    - Add policies for authenticated users
    - Ensure users can only access their own cases
    - Ensure lawyers can only access cases assigned to them
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
DROP POLICY IF EXISTS "Lawyers can view assigned cases" ON cases;
DROP POLICY IF EXISTS "Users can create their own cases" ON cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON cases;

-- Create new policies with correct permissions
CREATE POLICY "Users can view their own cases"
ON cases FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE POLICY "Lawyers can view assigned cases"
ON cases FOR SELECT
TO authenticated
USING (
  auth.uid() = lawyer_id
);

CREATE POLICY "Users can create their own cases"
ON cases FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can update their own cases"
ON cases FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Lawyers can update assigned cases"
ON cases FOR UPDATE
TO authenticated
USING (
  auth.uid() = lawyer_id
)
WITH CHECK (
  auth.uid() = lawyer_id
);