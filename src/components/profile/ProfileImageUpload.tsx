
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  firstName?: string | null;
  onImageUpdate: (url: string | null) => void;
}

export const ProfileImageUpload = ({ 
  currentImageUrl, 
  firstName, 
  onImageUpdate 
}: ProfileImageUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    
    try {
      console.log('Getting user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User error:', userError);
        throw new Error('Failed to get user: ' + userError.message);
      }
      
      if (!user) {
        console.error('No user found');
        throw new Error('User not authenticated');
      }

      console.log('User found:', user.id);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Remove the profile-images/ prefix as it's already in the bucket name

      console.log('Uploading file to path:', filePath);

      // Simplified upload without bucket check

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting if file exists
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');
      onImageUpdate(publicUrl);
      toast({
        title: "Profile image updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_image_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      onImageUpdate(null);
      setPreviewUrl(null);
      toast({
        title: "Profile image removed",
        description: "Your profile picture has been removed",
      });
    } catch (error) {
      toast({
        title: "Error removing image",
        description: error instanceof Error ? error.message : "Failed to remove image",
        variant: "destructive"
      });
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
          <AvatarImage src={displayUrl || ""} className="object-cover" />
          <AvatarFallback className="text-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            {firstName?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        
        {displayUrl && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
            onClick={handleRemoveImage}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={isUploading}
          className="relative overflow-hidden"
        >
          <Camera className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Change Photo'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />
        </Button>
      </div>
    </div>
  );
};
