-- Update usage_logs table to match the expected schema
-- Add missing columns and rename existing ones

-- Add the 'action' column
ALTER TABLE public.usage_logs 
ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT 'generate';

-- Rename amount_usd to cost for consistency
ALTER TABLE public.usage_logs 
RENAME COLUMN amount_usd TO cost;

-- Add metadata column for storing additional request information
ALTER TABLE public.usage_logs 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Rename seconds to duration for consistency
ALTER TABLE public.usage_logs 
RENAME COLUMN seconds TO duration;

-- Update the index to use the new column name
DROP INDEX IF EXISTS idx_usage_logs_user_created_at;
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created_at
ON public.usage_logs (user_id, created_at DESC);

-- Add index for action column
CREATE INDEX IF NOT EXISTS idx_usage_logs_action
ON public.usage_logs (action);