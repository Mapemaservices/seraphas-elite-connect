
import { useState, useEffect } from 'react';
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
  gender: string | null;
}

export const useDiscoverProfiles = (currentUserId: string) => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserGender, setCurrentUserGender] = useState<string | null>(null);
  const [existingMatches, setExistingMatches] = useState<Set<string>>(new Set());

  const getCurrentUserGender = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gender')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user gender:', error);
        return;
      }

      if (data) {
        setCurrentUserGender(data.gender);
        console.log('Current user gender:', data.gender);
      }
    } catch (error) {
      console.error('Error getting current user gender:', error);
    }
  };

  const getProfiles = async (userId: string) => {
    try {
      console.log('Fetching profiles for user:', userId);
      
      // Get existing matches to avoid duplicates
      const { data: matchesData } = await supabase
        .from('matches')
        .select('matched_user_id')
        .eq('user_id', userId);

      const matchedUserIds = new Set(matchesData?.map(match => match.matched_user_id) || []);
      setExistingMatches(matchedUserIds);
      console.log('Existing matches:', matchedUserIds);

      // Get current user's gender within the same query flow
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('gender')
        .eq('user_id', userId)
        .single();

      const userGender = currentUserProfile?.gender;
      console.log('User gender for filtering:', userGender);

      // Build query to get profiles excluding already matched users and current user
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', userId)
        .limit(20);

      // Show profiles regardless of gender if user hasn't set their gender
      // This allows discovery to work for all users
      if (userGender && userGender !== '') {
        const targetGender = userGender === 'male' ? 'female' : 'male';
        query = query.eq('gender', targetGender);
        console.log('Filtering for gender:', targetGender);
      } else {
        // Show all profiles with any gender (including null)
        console.log('User has no gender set, showing all profiles');
      }

      // Exclude already matched users
      if (matchedUserIds.size > 0) {
        query = query.not('user_id', 'in', `(${Array.from(matchedUserIds).join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }
      
      console.log('Fetched profiles count:', data?.length || 0);
      console.log('Fetched profiles:', data);
      setProfiles(data || []);
      setCurrentIndex(0);
      
      if (data && data.length > 0) {
        console.log('First profile to show:', data[0]);
      }
    } catch (error) {
      console.error('Error in getProfiles:', error);
      toast({
        title: "Error loading profiles",
        description: error instanceof Error ? error.message : "Failed to load profiles",
        variant: "destructive"
      });
    }
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
    }
  };

  useEffect(() => {
    if (currentUserId) {
      getCurrentUserGender(currentUserId);
      getProfiles(currentUserId);
    }
  }, [currentUserId]);

  return {
    profiles,
    currentIndex,
    currentUserGender,
    existingMatches,
    setExistingMatches,
    getProfiles,
    nextProfile,
    currentProfile: profiles[currentIndex]
  };
};
