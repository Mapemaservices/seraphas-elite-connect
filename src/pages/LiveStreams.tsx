
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Users, Crown, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { StreamControls } from "@/components/live/StreamControls";

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  streamer_id: string;
  is_active: boolean;
  is_premium_only: boolean;
  viewer_count: number;
  created_at: string;
  streamer_profile?: {
    first_name: string | null;
    profile_image_url: string | null;
    is_premium: boolean | null;
  } | null;
}

const LiveStreams = () => {
  const { toast } = useToast();
  const { isPremium, createCheckout } = useSubscription();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);

  useEffect(() => {
    initializeStreams();
  }, []);

  const initializeStreams = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUserId(session.user.id);
      await checkActiveStream(session.user.id);
    }
    await loadStreams();
    setIsLoading(false);
  };

  const checkActiveStream = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('streamer_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setActiveStream(data);
    } catch (error) {
      console.error('Error checking active stream:', error);
    }
  };

  const loadStreams = async () => {
    try {
      const { data: streamsData, error: streamsError } = await supabase
        .from('live_streams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (streamsError) throw streamsError;

      if (!streamsData || streamsData.length === 0) {
        setStreams([]);
        return;
      }

      const streamerIds = [...new Set(streamsData.map(stream => stream.streamer_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, profile_image_url, is_premium')
        .in('user_id', streamerIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        setStreams(streamsData.map(stream => ({ ...stream, streamer_profile: null })));
        return;
      }

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      const streamsWithProfiles = streamsData.map(stream => ({
        ...stream,
        streamer_profile: profilesMap.get(stream.streamer_id) || null
      }));

      setStreams(streamsWithProfiles);
    } catch (error) {
      console.error('Error loading streams:', error);
      toast({
        title: "Error loading streams",
        description: error instanceof Error ? error.message : "Failed to load live streams",
        variant: "destructive"
      });
    }
  };

  const handleWatchStream = (stream: LiveStream) => {
    if (stream.is_premium_only && !isPremium) {
      toast({
        title: "Premium Required",
        description: "This stream is for Premium members only. Upgrade to access exclusive content!",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Joining stream",
      description: `Connecting to ${stream.title}...`,
    });
  };

  const handleUpgrade = async () => {
    try {
      await createCheckout('monthly');
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  const handleStreamStarted = async () => {
    await checkActiveStream(currentUserId);
    await loadStreams();
  };

  const handleStreamEnded = async () => {
    setActiveStream(null);
    await loadStreams();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <Play className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading live streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Streams</h1>
        <p className="text-gray-600">Watch and broadcast live streams from our community</p>
      </div>

      {/* Stream Controls */}
      {currentUserId && (
        <StreamControls
          currentUserId={currentUserId}
          activeStream={activeStream}
          onStreamStarted={handleStreamStarted}
          onStreamEnded={handleStreamEnded}
        />
      )}

      {/* Upgrade prompt for non-premium users */}
      {!isPremium && (
        <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown className="w-8 h-8 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Unlock Premium Streams</h3>
                  <p className="text-yellow-700">Upgrade to access exclusive premium content and features!</p>
                </div>
              </div>
              <Button 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              >
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {streams.length === 0 ? (
        <Card className="text-center p-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-10 h-10 text-pink-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Live Streams</h2>
            <p className="text-gray-600 mb-4">There are no active streams right now. Start your own stream!</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white opacity-80" />
                </div>
                
                {stream.is_premium_only && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                
                <div className="absolute bottom-2 left-2">
                  <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                    ● LIVE
                  </Badge>
                </div>
                
                <div className="absolute bottom-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    <Users className="w-3 h-3 mr-1" />
                    {stream.viewer_count}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start space-x-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={stream.streamer_profile?.profile_image_url || ""} />
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      {stream.streamer_profile?.first_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{stream.title}</h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <span>{stream.streamer_profile?.first_name || 'Anonymous'}</span>
                      {stream.streamer_profile?.is_premium && (
                        <Crown className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
                
                {stream.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{stream.description}</p>
                )}
                
                <Button 
                  onClick={() => handleWatchStream(stream)}
                  className={`w-full ${
                    stream.is_premium_only && !isPremium
                      ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                  } text-white transition-all duration-200`}
                  disabled={stream.is_premium_only && !isPremium}
                >
                  {stream.is_premium_only && !isPremium ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Premium Required
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Watch Stream
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveStreams;
