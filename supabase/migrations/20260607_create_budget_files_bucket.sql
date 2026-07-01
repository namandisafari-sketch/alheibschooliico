-- Budget Files Storage Bucket Setup
-- NOTE: The 'budget-files' bucket should be created manually via Supabase Dashboard
-- OR it will be auto-created programmatically on first upload attempt

-- Row-Level Security (RLS) Policies for budget-files bucket
-- These policies allow:
-- 1. Public read access to all files (for downloading quotations)
-- 2. Authenticated users to upload files
-- 3. Users to delete their own files

-- Public Read Access
CREATE POLICY "Public Read Access for Budget Files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'budget-files');

-- Authenticated Upload
CREATE POLICY "Authenticated Users Can Upload Budget Files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'budget-files'
  AND auth.role() = 'authenticated'
);

-- Delete Own Files
CREATE POLICY "Users Can Delete Own Budget Files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'budget-files'
  AND auth.role() = 'authenticated'
);

-- Update files metadata if needed
CREATE POLICY "Users Can Update Own Budget Files"
ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'budget-files'
  AND auth.role() = 'authenticated'
);
