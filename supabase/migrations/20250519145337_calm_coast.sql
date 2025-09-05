/*
  # Add users and reviews tables
  
  1. New Tables
    - `users` table for storing user information
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      
    - `reviews` table for lawyer reviews
      - `id` (uuid, primary key)
      - `lawyer_id` (uuid, references lawyers)
      - `user_id` (uuid, references users)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing reviews
    
  3. Triggers
    - Add trigger to update lawyer stats on review changes
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lawyer_id, user_id)
);

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create reviews for lawyers they've chatted with"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.lawyer_id = reviews.lawyer_id
      AND chats.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update lawyer stats
CREATE OR REPLACE FUNCTION update_lawyer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE lawyers
    SET 
      rating = (
        SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
        FROM reviews
        WHERE lawyer_id = NEW.lawyer_id
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE lawyer_id = NEW.lawyer_id
      )
    WHERE id = NEW.lawyer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lawyers
    SET 
      rating = (
        SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
        FROM reviews
        WHERE lawyer_id = OLD.lawyer_id
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE lawyer_id = OLD.lawyer_id
      )
    WHERE id = OLD.lawyer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating lawyer stats
CREATE TRIGGER update_lawyer_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_lawyer_stats();