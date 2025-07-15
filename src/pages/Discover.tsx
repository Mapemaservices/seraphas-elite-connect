import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ProfileCard } from "@/components/discover/ProfileCard";

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
  const { isPremium } = useSubscription();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [existingMatches, setExistingMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    const getProfiles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }

      // Get existing matches to avoid duplicates
      const { data: matchesData } = await supabase
        .from('matches')
        .select('matched_user_id')
        .eq('user_id', session.user.id);

      const matchedUserIds = new Set(matchesData?.map(match => match.matched_user_id) || []);
      setExistingMatches(matchedUserIds);

      // Get profiles excluding already matched users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', session.user.id)
        .not('user_id', 'in', `(${Array.from(matchedUserIds).join(',') || 'null'})`)
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

    // Check if match already exists
    if (existingMatches.has(currentProfile.user_id)) {
      toast({
        title: "Already liked",
        description: "You've already liked this person!",
        variant: "destructive"
      });
      nextProfile();
      return;
    }

    const { error } = await supabase
      .from('matches')
      .insert({
        user_id: session.user.id,
        matched_user_id: currentProfile.user_id,
        status: 'pending'
      });

    if (error) {
      console.error('Match error:', error);
      if (error.code === '23505') {
        toast({
          title: "Already liked",
          description: "You've already liked this person!",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } else {
      // Add to existing matches to prevent future duplicates
      setExistingMatches(prev => new Set([...prev, currentProfile.user_id]));
      
      toast({
        title: "Match sent!",
        description: "We'll let you know if they're interested too.",
      });
    }
    nextProfile();
  };

  const handleMessage = async () => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Check if user can message (premium users can message anyone)
    if (!isPremium && !currentProfile.is_premium) {
      toast({
        title: "Premium Required",
        description: "Upgrade to Premium to message other users, or wait for a Premium member to message you first.",
        variant: "destructive"
      });
      return;
    }

    // First, create a match if it doesn't exist
    const { error: matchError } = await supabase
      .from('matches')
      .insert({
        user_id: session.user.id,
        matched_user_id: currentProfile.user_id,
        status: 'pending'
      });

    if (matchError && matchError.code !== '23505') {
      toast({
        title: "Error",
        description: "Failed to create connection",
        variant: "destructive"
      });
      return;
    }

    // Navigate to messages
    navigate('/messages');
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

  const currentProfile = profiles[currentIndex];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-pink-100 p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-pink-600 hover:bg-pink-50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Discover
            </span>
          </div>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </nav>

      <div className="max-w-md mx-auto p-4 sm:p-6">
        {currentProfile ? (
          <ProfileCard
            profile={currentProfile}
            isPremium={isPremium}
            onLike={handleLike}
            onPass={handlePass}
            onMessage={handleMessage}
          />
        ) : (
          <Card className="text-center p-6 sm:p-8 shadow-xl">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-pink-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No more profiles</h2>
              <p className="text-gray-600 mb-4">Check back later for more people to discover!</p>
            </div>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transition-all duration-200 transform hover:scale-105"
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
