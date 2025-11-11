-- Enable Row Level Security on folders table
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own folders
CREATE POLICY "Users can view own folders"
ON folders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own folders
CREATE POLICY "Users can insert own folders"
ON folders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own folders
CREATE POLICY "Users can update own folders"
ON folders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own folders
CREATE POLICY "Users can delete own folders"
ON folders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
