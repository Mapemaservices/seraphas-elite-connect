
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
      const { data: matchesData, error: matchError } = await supabase
        .from('matches')
        .select('matched_user_id')
        .eq('user_id', userId);

      if (matchError) {
        console.error('Error fetching matches:', matchError);
      }

      const matchedUserIds = new Set(matchesData?.map(match => match.matched_user_id) || []);
      setExistingMatches(matchedUserIds);

      // Get current user's gender
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      const userGender = currentUserProfile?.gender;
      console.log('User gender for filtering:', userGender);

      // Build query to get profiles excluding current user
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', userId)
        .limit(20);

      // Filter by opposite gender if user has set their gender
      if (userGender && userGender.trim() !== '') {
        const targetGender = userGender.toLowerCase() === 'male' ? 'female' : 'male';
        query = query.ilike('gender', targetGender);
        console.log('Filtering for gender:', targetGender);
      } else {
        console.log('User has no gender set, showing all profiles');
      }

      // Exclude already matched users
      if (matchedUserIds.size > 0) {
        const matchedArray = Array.from(matchedUserIds);
        query = query.not('user_id', 'in', `(${matchedArray.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching profiles:', error);
        // Don't throw error, just show empty state
        setProfiles([]);
        setCurrentIndex(0);
        return;
      }
      
      console.log('Fetched profiles count:', data?.length || 0);
      setProfiles(data || []);
      setCurrentIndex(0);
      
    } catch (error) {
      console.error('Error in getProfiles:', error);
      setProfiles([]);
      setCurrentIndex(0);
      toast({
        title: "Error loading profiles",
        description: "Unable to load profiles. Please try again.",
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
