
import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Heart } from 'lucide-react';
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
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [existingMatches, setExistingMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    initializeDiscover();
  }, []);

  const initializeDiscover = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUserId(session.user.id);
      await getProfiles(session.user.id);
    }
    setIsLoading(false);
  };

  const getProfiles = async (userId: string) => {
    try {
      // Get existing matches to avoid duplicates
      const { data: matchesData } = await supabase
        .from('matches')
        .select('matched_user_id')
        .eq('user_id', userId);

      const matchedUserIds = new Set(matchesData?.map(match => match.matched_user_id) || []);
      setExistingMatches(matchedUserIds);

      // Get profiles excluding already matched users and current user
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', userId)
        .limit(10);

      if (matchedUserIds.size > 0) {
        query = query.not('user_id', 'in', `(${Array.from(matchedUserIds).join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      toast({
        title: "Error loading profiles",
        description: error instanceof Error ? error.message : "Failed to load profiles",
        variant: "destructive"
      });
    }
  };

  const handleLike = async () => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    if (existingMatches.has(currentProfile.user_id)) {
      toast({
        title: "Already liked",
        description: "You've already liked this person!",
        variant: "destructive"
      });
      nextProfile();
      return;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .insert({
          user_id: currentUserId,
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
        setExistingMatches(prev => new Set([...prev, currentProfile.user_id]));
        
        // Check if it's a mutual match
        const { data: mutualMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('user_id', currentProfile.user_id)
          .eq('matched_user_id', currentUserId);

        if (mutualMatch && mutualMatch.length > 0) {
          toast({
            title: "It's a Match! 🎉",
            description: "You can now message each other!",
          });
        } else {
          toast({
            title: "Match sent!",
            description: "We'll let you know if they're interested too.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send match",
        variant: "destructive"
      });
    }
    
    nextProfile();
  };

  const handleMessage = async () => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    // Check premium restrictions
    if (!isPremium && !currentProfile.is_premium) {
      toast({
        title: "Premium Required",
        description: "Upgrade to Premium to message other users, or wait for a Premium member to message you first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a match/connection if one doesn't exist
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          user_id: currentUserId,
          matched_user_id: currentProfile.user_id,
          status: 'pending'
        });

      if (matchError && matchError.code !== '23505') {
        console.error('Match error:', matchError);
      }

      // Send an initial message to start the conversation
      const { error: messageError } = await supabase
        .from('messages_between_users')
        .insert({
          sender_id: currentUserId,
          receiver_id: currentProfile.user_id,
          content: 'Hi! I found your profile interesting. Would you like to chat?'
        });

      if (messageError) {
        console.error('Message error:', messageError);
      }

      toast({
        title: "Connection created!",
        description: "Your message has been sent. Check your messages to continue the conversation.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create connection",
        variant: "destructive"
      });
    }
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Load more profiles
      toast({
        title: "Loading more profiles...",
        description: "Finding more people for you to discover!",
      });
      getProfiles(currentUserId);
      setCurrentIndex(0);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-center py-8">
          <Heart className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Finding people for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Discover</h1>
        <p className="text-gray-600">Find your perfect match</p>
      </div>

      {currentProfile ? (
        <ProfileCard
          profile={currentProfile}
          isPremium={isPremium}
          currentUserId={currentUserId}
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
        </Card>
      )}
    </div>
  );
};

export default Discover;
