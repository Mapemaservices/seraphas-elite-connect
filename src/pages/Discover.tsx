
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, ArrowLeft, X, MapPin, Calendar } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  bio: string | null;
  age: number | null;
  location: string | null;
  interests: string[] | null;
  profile_image_url: string | null;
  is_premium: boolean | null;
}

const Discover = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getProfiles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', session.user.id)
        .limit(10);

      if (error) {
        toast({
          title: "Error loading profiles",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setProfiles(data || []);
      }

      setIsLoading(false);
    };

    getProfiles();
  }, [navigate, toast]);

  const handleLike = async () => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('matches')
      .insert({
        user_id: session.user.id,
        matched_user_id: currentProfile.user_id,
        status: 'pending'
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Match sent!",
        description: "We'll let you know if they're interested too.",
      });
      nextProfile();
    }
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({
        title: "No more profiles",
        description: "Check back later for more people to discover!",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Finding people for you...</p>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

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
              Discover
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto p-6">
        {currentProfile ? (
          <Card className="overflow-hidden">
            <div className="relative h-96 bg-gradient-to-b from-transparent to-black/50">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage 
                  src={currentProfile.profile_image_url || ""} 
                  className="object-cover"
                />
                <AvatarFallback className="rounded-none text-6xl bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  {currentProfile.first_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-2xl font-bold mb-1">
                  {currentProfile.first_name}
                  {currentProfile.age && (
                    <span className="text-lg font-normal ml-2">{currentProfile.age}</span>
                  )}
                </h2>
                {currentProfile.location && (
                  <p className="flex items-center text-sm opacity-90">
                    <MapPin className="w-4 h-4 mr-1" />
                    {currentProfile.location}
                  </p>
                )}
              </div>
            </div>
            
            <CardContent className="p-6">
              {currentProfile.bio && (
                <p className="text-gray-700 mb-4">{currentProfile.bio}</p>
              )}
              
              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-pink-600 border-pink-200">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePass}
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  <X className="w-5 h-5 mr-2" />
                  Pass
                </Button>
                <Button
                  size="lg"
                  onClick={handleLike}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Like
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center p-8">
            <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No more profiles</h2>
            <p className="text-gray-600 mb-4">Check back later for more people to discover!</p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              Back to Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Discover;
