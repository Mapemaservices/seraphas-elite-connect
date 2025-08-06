
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
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserGender, setCurrentUserGender] = useState<string | null>(null);
  const [existingMatches, setExistingMatches] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

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

  const getProfiles = async (userId: string, loadMore = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
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
        .range(loadMore ? offset : 0, loadMore ? offset + LIMIT - 1 : LIMIT - 1)
        .order('created_at', { ascending: false });

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
        if (!loadMore) {
          setProfiles([]);
        }
        return;
      }
      
      console.log('Fetched profiles count:', data?.length || 0);
      
      if (loadMore) {
        setProfiles(prev => [...prev, ...(data || [])]);
      } else {
        setProfiles(data || []);
        setOffset(0);
      }
      
      if (data && data.length < LIMIT) {
        setHasMore(false);
      }
      
      if (loadMore) {
        setOffset(prev => prev + LIMIT);
      }
      
    } catch (error) {
      console.error('Error in getProfiles:', error);
      if (!loadMore) {
        setProfiles([]);
      }
      toast({
        title: "Error loading profiles",
        description: "Unable to load profiles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreProfiles = () => {
    if (currentUserId && hasMore && !isLoading) {
      getProfiles(currentUserId, true);
    }
  };

  const refreshProfiles = () => {
    if (currentUserId) {
      setOffset(0);
      setHasMore(true);
      getProfiles(currentUserId, false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      getCurrentUserGender(currentUserId);
      getProfiles(currentUserId, false);
    }
  }, [currentUserId]);

  // Set up real-time subscription for new profiles
  useEffect(() => {
    if (!currentUserId) return;

    console.log('Setting up real-time subscription for new profiles...');

    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('New profile created:', payload.new);
          // Refresh profiles when a new user joins
          refreshProfiles();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload.new);
          // Update the specific profile in our list
          setProfiles(prev => prev.map(profile => 
            profile.user_id === payload.new.user_id 
              ? { ...profile, ...payload.new }
              : profile
          ));
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up profiles real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return {
    profiles,
    isLoading,
    currentUserGender,
    existingMatches,
    setExistingMatches,
    getProfiles,
    loadMoreProfiles,
    refreshProfiles,
    hasMore
  };
};
