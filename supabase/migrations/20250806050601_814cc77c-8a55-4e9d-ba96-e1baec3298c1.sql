-- Fix storage policies for profile images
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their profile images" ON storage.objects;

-- Create permissive policies for profile images
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);