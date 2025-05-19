/*
  # Update messages table ordering

  1. Changes
    - Add index on chat_id and created_at for better performance when fetching latest messages
    - Add index on sender_id for better performance when filtering messages by sender

  2. Security
    - No changes to RLS policies
*/

-- Add index for chat_id and created_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'messages' 
    AND indexname = 'messages_chat_id_created_at_idx'
  ) THEN
    CREATE INDEX messages_chat_id_created_at_idx 
    ON messages(chat_id, created_at DESC);
  END IF;
END $$;

-- Add index for sender_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'messages' 
    AND indexname = 'messages_sender_id_idx'
  ) THEN
    CREATE INDEX messages_sender_id_idx 
    ON messages(sender_id);
  END IF;
END $$;