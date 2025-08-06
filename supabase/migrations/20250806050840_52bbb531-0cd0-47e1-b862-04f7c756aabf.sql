-- Drop existing storage policies and recreate with correct logic
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Create new policies that match the actual upload path structure
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update profile images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete profile images"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);