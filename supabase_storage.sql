-- ============================================
-- Supabase Storage Setup for Face Recognition
-- ============================================
-- This is OPTIONAL - the system works with base64 images by default
-- Use this only if you want to store images in Supabase Storage
-- ============================================

-- Create storage bucket for face images
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-images', 'face-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies
-- ============================================

-- Policy 1: Allow public uploads to face-images bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES ('Allow public uploads', 'face-images', 'bucket_id = ''face-images''')
ON CONFLICT DO NOTHING;

-- Policy 2: Allow public reads from face-images bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES ('Allow public reads', 'face-images', 'bucket_id = ''face-images''')
ON CONFLICT DO NOTHING;

-- ============================================
-- Alternative: More Secure Policies (for production)
-- ============================================

/*
-- Delete the public policies first
DELETE FROM storage.policies WHERE bucket_id = 'face-images';

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'face-images');

-- Allow everyone to read
CREATE POLICY "Public can read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'face-images');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'face-images' AND auth.uid() = owner);
*/

-- ============================================
-- Verify Storage Setup
-- ============================================

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'face-images';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'face-images';

-- ============================================
-- NOTES:
-- 1. This is OPTIONAL - system uses base64 by default
-- 2. Storage is better for large number of images
-- 3. Base64 is simpler and works out of the box
-- 4. To use Storage, you need to modify faceRecognitionService.js
-- ============================================
