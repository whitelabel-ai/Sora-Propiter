-- Remove obsolete columns from usage_logs table
-- The model, size information is now stored in the metadata JSONB column

-- Drop the model column (no longer needed, stored in metadata)
ALTER TABLE public.usage_logs 
DROP COLUMN IF EXISTS model;

-- Drop the size column (no longer needed, stored in metadata)
ALTER TABLE public.usage_logs 
DROP COLUMN IF EXISTS size;

-- Drop any indexes that might reference the removed columns
DROP INDEX IF EXISTS idx_usage_logs_model;
DROP INDEX IF EXISTS idx_usage_logs_size;