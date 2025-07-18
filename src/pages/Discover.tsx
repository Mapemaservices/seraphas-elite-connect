
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ProfileCard } from "@/components/discover/ProfileCard";
import { DiscoverHeader } from "@/components/discover/DiscoverHeader";
import { EmptyState } from "@/components/discover/EmptyState";
import { useDiscoverProfiles } from "@/hooks/useDiscoverProfiles";

const Discover = () => {
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const {
    profiles,
    currentIndex,
    currentUserGender,
    existingMatches,
    setExistingMatches,
    getProfiles,
    nextProfile,
    currentProfile
  } = useDiscoverProfiles(currentUserId);

  useEffect(() => {
    initializeDiscover();
  }, []);

  const initializeDiscover = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUserId(session.user.id);
    }
    setIsLoading(false);
  };

  const handleLike = async () => {
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
      <DiscoverHeader 
        currentUserGender={currentUserGender}
        profilesCount={profiles.length}
        isLoading={isLoading}
      />

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
        <EmptyState currentUserGender={currentUserGender} />
      )}
    </div>
  );
};

export default Discover;
