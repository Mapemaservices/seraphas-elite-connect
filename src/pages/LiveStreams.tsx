
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Users, Crown, Lock, Heart, Share2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { StreamControls } from "@/components/live/StreamControls";
import { StreamViewer } from "@/components/live/StreamViewer";

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  streamer_id: string;
  is_active: boolean;
  is_premium_only: boolean;
  viewer_count: number;
  created_at: string;
  stream_url: string | null;
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
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  useEffect(() => {
    initializeStreams();
    
    // Real-time subscription for stream updates
    const channel = supabase
      .channel('live-streams-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams'
        },
        () => {
          loadStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        .select('*, stream_url')
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

    setSelectedStream(stream);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Stream link has been copied to clipboard",
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

  if (selectedStream) {
    return (
      <StreamViewer
        stream={selectedStream}
        currentUserId={currentUserId}
        onBack={() => setSelectedStream(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Header (minimal, TikTok-style) */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold">LIVE</span>
          </div>
          {currentUserId && (
            <StreamControls
              currentUserId={currentUserId}
              activeStream={activeStream}
              onStreamStarted={handleStreamStarted}
              onStreamEnded={handleStreamEnded}
            />
          )}
        </div>
      </div>

      {streams.length === 0 ? (
        <div className="h-screen flex flex-col items-center justify-center text-white">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
            <Play className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Live Streams</h2>
          <p className="text-white/70 text-center max-w-xs">
            Be the first to go live and connect with your audience
          </p>
        </div>
      ) : (
        <div className="h-screen overflow-y-auto snap-y snap-mandatory">
          {streams.map((stream, index) => (
            <div
              key={stream.id}
              className="h-screen snap-start relative flex"
              onClick={() => handleWatchStream(stream)}
            >
              {/* Full-screen video background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900">
                <div className="w-full h-full bg-black/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mx-auto"></div>
                  </div>
                </div>
              </div>

              {/* Right side actions (TikTok-style) */}
              <div className="absolute right-4 bottom-20 flex flex-col gap-4 z-20">
                <div className="flex flex-col items-center">
                  <Avatar className="w-12 h-12 ring-2 ring-white">
                    <AvatarImage src={stream.streamer_profile?.profile_image_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                      {stream.streamer_profile?.first_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center -mt-2">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                </div>

                <button className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Heart className="w-6 h-6 text-white" />
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <Share2 className="w-6 h-6 text-white" />
                </button>

                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-sm font-bold text-center">
                  {stream.viewer_count}
                </span>
              </div>

              {/* Bottom info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-bold text-lg">
                      @{stream.streamer_profile?.first_name || 'anonymous'}
                    </span>
                    {stream.streamer_profile?.is_premium && (
                      <Crown className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <h2 className="text-white text-xl font-bold mb-2 leading-tight">
                    {stream.title}
                  </h2>
                  {stream.description && (
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
                      {stream.description}
                    </p>
                  )}
                </div>

                {/* Live badges */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-red-500 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-bold">LIVE</span>
                  </div>
                  <div className="px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm">
                    <span className="text-white text-xs">{stream.viewer_count} watching</span>
                  </div>
                  {stream.is_premium_only && (
                    <div className="px-3 py-1 bg-yellow-500 rounded-full">
                      <span className="text-black text-xs font-bold">Premium</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tap to watch overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 cursor-pointer z-5">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveStreams;
