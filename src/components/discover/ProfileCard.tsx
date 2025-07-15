
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, X, MapPin, MessageCircle, Crown } from 'lucide-react';

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

interface ProfileCardProps {
  profile: Profile;
  isPremium: boolean;
  onLike: () => void;
  onPass: () => void;
  onMessage: () => void;
}

export const ProfileCard = ({ profile, isPremium, onLike, onPass, onMessage }: ProfileCardProps) => {
  return (
    <div className="w-full max-w-sm mx-auto">
      <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
        <div className="relative h-80 sm:h-96 bg-gradient-to-b from-transparent to-black/50">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage 
              src={profile.profile_image_url || ""} 
              className="object-cover"
            />
            <AvatarFallback className="rounded-none text-6xl bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              {profile.first_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-2xl font-bold mb-1 drop-shadow-lg">
              {profile.first_name}
              {profile.age && (
                <span className="text-lg font-normal ml-2">{profile.age}</span>
              )}
              {profile.is_premium && (
                <Crown className="inline w-5 h-5 ml-2 text-yellow-400 drop-shadow-lg" />
              )}
            </h2>
            {profile.location && (
              <p className="flex items-center text-sm opacity-90 drop-shadow-md">
                <MapPin className="w-4 h-4 mr-1" />
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
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 6).map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-pink-600 border-pink-200 hover:bg-pink-50 transition-colors">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-2">
            <Button
              size="lg"
              variant="outline"
              onClick={onPass}
              className="flex-1 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <X className="w-5 h-5 mr-2" />
              Pass
            </Button>
            <Button
              size="lg"
              onClick={onLike}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transition-all duration-200 transform hover:scale-105"
            >
              <Heart className="w-5 h-5 mr-2" />
              Like
            </Button>
            {(isPremium || profile.is_premium) && (
              <Button
                size="lg"
                onClick={onMessage}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message
              </Button>
            )}
          </div>
          
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
    </div>
  );
};
