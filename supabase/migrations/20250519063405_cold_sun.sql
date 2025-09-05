/*
  # Add lawyer validation fields

  1. Changes
    - Add validation status to lawyers table
    - Add license number field
    - Add validation date field
    
  2. Security
    - Update RLS policies for lawyer access
*/

ALTER TABLE lawyers
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Allow lawyers to update their own profiles
CREATE POLICY "Lawyers can update their own profiles"
ON lawyers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow lawyers to read messages in their chats
CREATE POLICY "Lawyers can view messages in their chats"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND chats.lawyer_id = auth.uid()
  )
);

-- Allow lawyers to send messages in their chats
CREATE POLICY "Lawyers can send messages in their chats"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_id
    AND chats.lawyer_id = auth.uid()
  )
);