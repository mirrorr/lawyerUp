/*
  # Add lawyer profile creation policy

  1. Security Changes
    - Add RLS policy to allow authenticated users to create their own lawyer profiles
    - Policy ensures users can only create a profile with their own ID
    - Maintains security by preventing users from creating profiles for others

  2. Changes
    - Add INSERT policy for lawyers table
*/

CREATE POLICY "Lawyers can create their own profile"
ON public.lawyers
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());