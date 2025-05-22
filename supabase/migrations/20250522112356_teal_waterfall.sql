/*
  # Fix Cases RLS Policies

  1. Changes
    - Add RLS policy to allow users to insert their own cases
    - Add RLS policy to allow users to view their own cases
    - Add RLS policy to allow lawyers to view cases assigned to them

  2. Security
    - Enable RLS on cases table (already enabled)
    - Add policies for authenticated users to:
      - Insert cases where they are the user_id
      - View cases where they are the user_id
      - View cases where they are the lawyer_id
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Users can create their own cases" ON cases;
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
DROP POLICY IF EXISTS "Lawyers can view assigned cases" ON cases;

-- Create policy for users to insert their own cases
CREATE POLICY "Users can create their own cases"
ON cases
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Create policy for users to view their own cases
CREATE POLICY "Users can view their own cases"
ON cases
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Create policy for lawyers to view cases assigned to them
CREATE POLICY "Lawyers can view assigned cases"
ON cases
FOR SELECT
TO authenticated
USING (
  auth.uid() = lawyer_id
);