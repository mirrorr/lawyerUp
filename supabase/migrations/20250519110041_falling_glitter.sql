/*
  # Add users foreign key relationship

  1. Changes
    - Add foreign key relationship between chats and users tables
    - Add RLS policies for users to manage their chats

  2. Security
    - Enable RLS on chats table (if not already enabled)
    - Add policies for users to manage their own chats
*/

-- First check if the users table exists and create it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users'
  ) THEN
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chats_user_id_fkey'
  ) THEN
    ALTER TABLE chats
    ADD CONSTRAINT chats_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure RLS is enabled on chats table
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for users if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chats' AND policyname = 'Users can view their own chats'
  ) THEN
    CREATE POLICY "Users can view their own chats"
      ON chats
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chats' AND policyname = 'Users can create their own chats'
  ) THEN
    CREATE POLICY "Users can create their own chats"
      ON chats
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;