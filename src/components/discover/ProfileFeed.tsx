import { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, MapPin, Crown, Loader2 } from 'lucide-react';

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

interface ProfileFeedProps {
  profiles: Profile[];
  isPremium: boolean;
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  existingMatches: Set<string>;
  onLike: (profile: Profile) => void;
  onMessage: (profile: Profile) => void;
  onLoadMore: () => void;
}

export const ProfileFeed = ({
  profiles,
  isPremium,
  currentUserId,
  isLoading,
  hasMore,
  existingMatches,
  onLike,
  onMessage,
  onLoadMore
}: ProfileFeedProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (profiles.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No profiles to discover
        </h3>
        <p className="text-gray-600">
          Check back later for new members!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {profiles.map((profile) => (
        <ProfileFeedCard
          key={profile.user_id}
          profile={profile}
          isPremium={isPremium}
          currentUserId={currentUserId}
          isLiked={existingMatches.has(profile.user_id)}
          onLike={() => onLike(profile)}
          onMessage={() => onMessage(profile)}
        />
      ))}
      
      {/* Loading indicator and trigger for infinite scroll */}
      <div ref={loadMoreRef} className="py-8">
        {isLoading && (
          <div className="flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
            <span className="ml-2 text-gray-600">Loading more profiles...</span>
          </div>
        )}
        {!hasMore && profiles.length > 0 && (
          <div className="text-center text-gray-500">
            <p>That's everyone for now! Check back later for new members.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ProfileFeedCardProps {
  profile: Profile;
  isPremium: boolean;
  currentUserId: string;
  isLiked: boolean;
  onLike: () => void;
  onMessage: () => void;
}

const ProfileFeedCard = ({
  profile,
  isPremium,
  currentUserId,
  isLiked,
  onLike,
  onMessage
}: ProfileFeedCardProps) => {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in w-full">
      <div className="relative h-80 sm:h-96 bg-gradient-to-b from-transparent to-black/50">
        <Avatar className="w-full h-full rounded-none">
          <AvatarImage 
            src={profile.profile_image_url || ""} 
            className="object-cover w-full h-full"
          />
          <AvatarFallback className="rounded-none text-4xl sm:text-6xl bg-gradient-to-r from-pink-500 to-purple-600 text-white w-full h-full flex items-center justify-center">
            {profile.first_name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        
        {/* Floating action buttons */}
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col space-y-2">
          <Button
            size="lg"
            onClick={onLike}
            disabled={isLiked}
            className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg transition-all duration-200 ${
              isLiked 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:scale-110'
            }`}
          >
            <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <Button
            size="lg"
            onClick={onMessage}
            className="rounded-full w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg transition-all duration-200 hover:scale-110"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>
        
        {/* Profile info overlay */}
        <div className="absolute bottom-2 left-2 right-16 sm:bottom-4 sm:left-4 sm:right-20 text-white">
          <h2 className="text-lg sm:text-2xl font-bold mb-1 drop-shadow-lg">
            {profile.first_name}
            {profile.age && (
              <span className="text-sm sm:text-lg font-normal ml-2">{profile.age}</span>
            )}
            {profile.is_premium && (
              <Crown className="inline w-4 h-4 sm:w-5 sm:h-5 ml-2 text-yellow-400 drop-shadow-lg" />
            )}
          </h2>
          {profile.location && (
            <p className="flex items-center text-xs sm:text-sm opacity-90 drop-shadow-md">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {profile.location}
            </p>
          )}
        </div>
      </div>
      
      <CardContent className="p-6">
        {profile.bio && (
          <p className="text-gray-700 mb-4 line-clamp-3">{profile.bio}</p>
        )}
        
        {profile.interests && profile.interests.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 8).map((interest, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-pink-600 border-pink-200 hover:bg-pink-50 transition-colors"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {!isPremium && !profile.is_premium && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              <Crown className="w-4 h-4 inline mr-1" />
              Upgrade to Premium to message anyone directly!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};