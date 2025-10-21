-- Create usage_logs table for tracking spend per video generation
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID,
  amount_usd NUMERIC(10,4) NOT NULL,
  model TEXT NOT NULL,
  size TEXT NOT NULL,
  seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies: users can see and insert only their own logs
CREATE POLICY "Users can view their own usage logs"
ON public.usage_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs"
ON public.usage_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Helpful indexes for date filtering
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created_at
ON public.usage_logs (user_id, created_at DESC);
