-- Create tags index table for unique tag management
CREATE TABLE IF NOT EXISTS public.tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- Create function to get all unique tags from practices table
CREATE OR REPLACE FUNCTION get_unique_tags()
RETURNS TABLE(tag_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(tags) as tag_name
  FROM public.practices
  WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync tags index with practices table
CREATE OR REPLACE FUNCTION sync_tags_index()
RETURNS VOID AS $$
BEGIN
  -- Clear existing tags
  DELETE FROM public.tags;
  
  -- Insert all unique tags from practices
  INSERT INTO public.tags (name)
  SELECT DISTINCT unnest(tags) as tag_name
  FROM public.practices
  WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
