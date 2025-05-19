/*
  # Add lawyer validation status

  1. Changes
    - Add validation_status column to lawyers table
    - Add validated_at timestamp column
    - Add validation status check constraint
    - Add RLS policies for validation status updates

  2. Security
    - Only authenticated users can update their own validation status
    - Validation status can only be set to 'pending', 'approved', or 'rejected'
*/

-- Add validation status columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'validation_status'
  ) THEN
    ALTER TABLE lawyers 
    ADD COLUMN validation_status text DEFAULT 'pending'::text,
    ADD COLUMN validated_at timestamptz DEFAULT NULL;

    -- Add validation status check constraint
    ALTER TABLE lawyers
    ADD CONSTRAINT lawyers_validation_status_check 
    CHECK (validation_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));
  END IF;
END $$;

-- Update RLS policies
CREATE POLICY "Lawyers can update their own validation status"
ON public.lawyers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());