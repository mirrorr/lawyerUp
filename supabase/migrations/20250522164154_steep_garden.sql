/*
  # Add pro bono periods tracking

  1. New Tables
    - `pro_bono_periods`
      - `id` (uuid, primary key)
      - `lawyer_id` (uuid, references lawyers)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamptz)

  2. Changes
    - Remove `pro_bono` boolean from lawyers table
    - Add RLS policies for pro bono periods

  3. Security
    - Enable RLS on pro_bono_periods table
    - Add policies for lawyers to manage their pro bono periods
*/

-- Remove the simple pro_bono boolean
ALTER TABLE lawyers DROP COLUMN IF EXISTS pro_bono;

-- Create pro bono periods table
CREATE TABLE pro_bono_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (start_date <= end_date)
);

-- Enable RLS
ALTER TABLE pro_bono_periods ENABLE ROW LEVEL SECURITY;

-- Lawyers can manage their own pro bono periods
CREATE POLICY "Lawyers can manage their pro bono periods"
ON pro_bono_periods
FOR ALL
TO authenticated
USING (auth.uid() = lawyer_id)
WITH CHECK (auth.uid() = lawyer_id);

-- Anyone can view pro bono periods
CREATE POLICY "Anyone can view pro bono periods"
ON pro_bono_periods
FOR SELECT
TO public
USING (true);