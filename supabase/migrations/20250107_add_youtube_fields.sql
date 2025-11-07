-- Add youtube_url and transcript columns to notes table
-- This migration adds support for YouTube video notes

-- Add youtube_url column if it doesn't exist
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add transcript column if it doesn't exist
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS transcript TEXT;

-- Add index for youtube_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_youtube_url ON notes(youtube_url);

-- Add comment to document the columns
COMMENT ON COLUMN notes.youtube_url IS 'YouTube video URL for video-based notes';
COMMENT ON COLUMN notes.transcript IS 'Original transcript text from YouTube video or audio file';
