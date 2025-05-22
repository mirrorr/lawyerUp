/*
  # Add reviews functionality

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `lawyer_id` (uuid, references lawyers)
      - `user_id` (uuid, references users)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Changes
    - Add trigger to update lawyer's average rating and review count
    - Add RLS policies for reviews

  3. Security
    - Enable RLS on reviews table
    - Users can only review lawyers they've had chats with
    - Users can only create/update their own reviews
    - Everyone can view reviews
*/

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

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger
CREATE TRIGGER update_lawyer_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_lawyer_stats();