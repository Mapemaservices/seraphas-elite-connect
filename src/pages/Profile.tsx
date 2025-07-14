
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, ArrowLeft, Camera, MapPin, Calendar, User as UserIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }

      setUser(session.user);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive"
        });
      } else if (profileData) {
        setProfile(profileData);
      }

      setIsLoading(false);
    };

    getProfile();
  }, [navigate, toast]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        email: profile.email,
        first_name: profile.first_name,
        bio: profile.bio,
        age: profile.age,
        location: profile.location,
        interests: profile.interests,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-pink-100 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-pink-600 hover:bg-pink-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Seraphas
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="relative mx-auto mb-4">
              <Avatar className="w-32 h-32 mx-auto">
                <AvatarImage src={profile?.profile_image_url || ""} />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  {profile?.first_name?.[0] || user?.email?.[0] || <UserIcon />}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full"
                  variant="outline"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            <CardTitle className="text-2xl mb-2">
              {profile?.first_name || "Your Profile"}
            </CardTitle>
            {profile?.is_premium && (
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                Premium Member
              </Badge>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              {isEditing ? (isSaving ? "Saving..." : "Save") : "Edit Profile"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <Input
                  value={profile?.first_name || ""}
                  onChange={(e) => setProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                  disabled={!isEditing}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <Input
                  type="number"
                  value={profile?.age || ""}
                  onChange={(e) => setProfile(prev => prev ? {...prev, age: parseInt(e.target.value) || null} : null)}
                  disabled={!isEditing}
                  placeholder="Your age"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <Input
                value={profile?.location || ""}
                onChange={(e) => setProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                disabled={!isEditing}
                placeholder="Where are you located?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <Textarea
                value={profile?.bio || ""}
                onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests (comma separated)
              </label>
              <Input
                value={profile?.interests?.join(", ") || ""}
                onChange={(e) => setProfile(prev => prev ? {...prev, interests: e.target.value.split(",").map(s => s.trim()).filter(Boolean)} : null)}
                disabled={!isEditing}
                placeholder="music, travel, cooking, etc."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
