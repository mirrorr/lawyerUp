/*
  # Fix Cases RLS Policies

  1. Changes
    - Add RLS policy to allow users to create their own cases
    - Add RLS policy to allow users to view their own cases
    - Add RLS policy to allow lawyers to view cases assigned to them

  2. Security
    - Enable RLS on cases table
    - Add policies for authenticated users and lawyers
*/

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own cases
CREATE POLICY "Users can create their own cases"
ON cases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own cases
CREATE POLICY "Users can view their own cases"
ON cases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow lawyers to view cases assigned to them
CREATE POLICY "Lawyers can view assigned cases"
ON cases
FOR SELECT
TO authenticated
USING (auth.uid() = lawyer_id);