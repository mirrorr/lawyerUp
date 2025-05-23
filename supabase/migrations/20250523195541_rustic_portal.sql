/*
  # Add appointments table

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `lawyer_id` (uuid, references lawyers)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `time` (time)
      - `type` (text) - 'video' or 'in-person'
      - `notes` (text)
      - `status` (text) - 'pending', 'confirmed', 'cancelled'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `appointments` table
    - Add policies for lawyers and users to manage their appointments
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  type text NOT NULL CHECK (type IN ('video', 'in-person')),
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own appointments
CREATE POLICY "Users can view their own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow lawyers to view appointments where they are the lawyer
CREATE POLICY "Lawyers can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = lawyer_id);

-- Allow users to create appointments
CREATE POLICY "Users can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow both users and lawyers to update appointment status
CREATE POLICY "Users and lawyers can update appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (user_id, lawyer_id))
  WITH CHECK (auth.uid() IN (user_id, lawyer_id));