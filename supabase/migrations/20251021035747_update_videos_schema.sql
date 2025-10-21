-- Update videos table to match the TypeScript interface
-- Add missing columns
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS enhanced_prompt TEXT,
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS openai_task_id TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS cost NUMERIC(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Change duration from TEXT to INTEGER (number of seconds)
ALTER TABLE public.videos 
ALTER COLUMN duration TYPE INTEGER USING duration::INTEGER;

-- Make video_url nullable since it's only set when completed
ALTER TABLE public.videos 
ALTER COLUMN video_url DROP NOT NULL;

-- Add profiles columns that are missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 100;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for videos table
DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing videos to have default status
UPDATE public.videos 
SET status = 'completed' 
WHERE status IS NULL AND video_url IS NOT NULL;

UPDATE public.videos 
SET status = 'pending' 
WHERE status IS NULL AND video_url IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_model ON public.videos(model);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);