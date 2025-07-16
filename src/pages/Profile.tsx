
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, X, Crown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  age: number | null;
  location: string | null;
  interests: string[] | null;
  profile_image_url: string | null;
  is_premium: boolean | null;
}

const Profile = () => {
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create new profile
        const newProfile = {
          user_id: session.user.id,
          email: session.user.email,
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          bio: '',
          age: null,
          location: '',
          interests: [],
          profile_image_url: null,
          is_premium: isPremium
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
      }
    } catch (error) {
      toast({
        title: "Error loading profile",
        description: error instanceof Error ? error.message : "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          age: profile.age,
          location: profile.location,
          interests: profile.interests,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: error instanceof Error ? error.message : "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addInterest = () => {
    if (!newInterest.trim() || !profile) return;
    
    const currentInterests = profile.interests || [];
    if (currentInterests.includes(newInterest.trim())) {
      toast({
        title: "Interest already added",
        description: "This interest is already in your list.",
        variant: "destructive"
      });
      return;
    }

    setProfile({
      ...profile,
      interests: [...currentInterests, newInterest.trim()]
    });
    setNewInterest('');
  };

  const removeInterest = (interest: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      interests: (profile.interests || []).filter(i => i !== interest)
    });
  };

  const handleImageUpdate = (url: string | null) => {
    if (profile) {
      setProfile({
        ...profile,
        profile_image_url: url
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-pulse">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Unable to load profile</p>
          <Button onClick={loadProfile} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Complete your profile to attract better matches</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              Profile Photo
              {isPremium && <Crown className="w-5 h-5 ml-2 text-yellow-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <ProfileImageUpload
              currentImageUrl={profile.profile_image_url}
              firstName={profile.first_name}
              onImageUpdate={handleImageUpdate}
            />

            {isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                Premium Member
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  value={profile.first_name || ''}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  value={profile.last_name || ''}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <Input
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Enter your location"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <Textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell others about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(profile.bio || '').length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(profile.interests || []).map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100 group"
                  onClick={() => removeInterest(interest)}
                >
                  {interest}
                  <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              />
              <Button onClick={addInterest} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-2"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
