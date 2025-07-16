
-- Create profile images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create policy to allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow public read access to profile images
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Create policy to allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
