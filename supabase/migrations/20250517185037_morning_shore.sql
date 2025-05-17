/*
  # Create lawyers and chats tables

  1. New Tables
    - `lawyers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `specialty` (text)
      - `rating` (numeric)
      - `reviews_count` (integer)
      - `image_url` (text)
      - `location` (text)
      - `experience` (text)
      - `languages` (text[])
      - `education` (text)
      - `consultation_fee` (text)
      - `availability` (text)
      - `about` (text)
      - `created_at` (timestamptz)

    - `chats`
      - `id` (uuid, primary key)
      - `lawyer_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, foreign key)
      - `sender_id` (uuid, foreign key)
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create lawyers table
CREATE TABLE lawyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  rating numeric NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  image_url text NOT NULL,
  location text NOT NULL,
  experience text NOT NULL,
  languages text[] NOT NULL DEFAULT '{}',
  education text NOT NULL,
  consultation_fee text NOT NULL,
  availability text NOT NULL,
  about text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create chats table
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid NOT NULL REFERENCES lawyers(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id),
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Lawyers policies
CREATE POLICY "Anyone can view lawyers"
  ON lawyers
  FOR SELECT
  TO public
  USING (true);

-- Chats policies
CREATE POLICY "Users can view their own chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );