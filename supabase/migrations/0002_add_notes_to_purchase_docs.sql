-- Add notes column to purchase_docs table
-- This migration adds the missing notes column that's needed for the purchase documents functionality

ALTER TABLE purchase_docs
ADD COLUMN IF NOT EXISTS notes text;

-- Add comment for documentation
COMMENT ON COLUMN purchase_docs.notes IS 'Additional notes or observations for the purchase document';