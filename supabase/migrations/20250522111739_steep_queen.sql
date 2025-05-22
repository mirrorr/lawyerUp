/*
  # Add Cases Feature

  1. New Tables
    - `cases`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `lawyer_id` (uuid, foreign key to lawyers, nullable)
      - `title` (text)
      - `description` (text)
      - `status` (text) - 'open', 'in_progress', 'closed'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `cases` table
    - Add policies for users to manage their cases
    - Add policies for lawyers to view assigned cases
*/

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own cases
CREATE POLICY "Users can create their own cases"
  ON cases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cases"
  ON cases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
  ON cases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lawyers can view cases assigned to them
CREATE POLICY "Lawyers can view assigned cases"
  ON cases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = lawyer_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE
  ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();