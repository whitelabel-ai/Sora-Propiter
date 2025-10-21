-- Add missing UPDATE policy for videos table
CREATE POLICY "Users can update their own videos"
  ON public.videos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);