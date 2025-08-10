
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Modern Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Live Now
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4 animate-fade-in">
            Live Streams
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in">
            Connect with creators in real-time. Watch, interact, and discover amazing content from our community.
          </p>
        </div>

        {/* Stream Controls */}
        {currentUserId && (
          <div className="animate-fade-in">
            <StreamControls
              currentUserId={currentUserId}
              activeStream={activeStream}
              onStreamStarted={handleStreamStarted}
              onStreamEnded={handleStreamEnded}
            />
          </div>
        )}

        {streams.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm border border-border/50">
                <Play className="w-16 h-16 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">0</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">No Live Streams</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Be the first to go live! Start streaming and connect with your audience.
            </p>
            {currentUserId && (
              <div className="text-sm text-muted-foreground">
                Use the controls above to start your first stream
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-8 p-4 rounded-2xl bg-card border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-foreground">{streams.length} Live</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{streams.reduce((total, stream) => total + stream.viewer_count, 0)} watching</span>
                </div>
              </div>
            </div>

            {/* Stream Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {streams.map((stream, index) => (
                <Card 
                  key={stream.id} 
                  className="group overflow-hidden border-0 bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative overflow-hidden">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-secondary/60 opacity-80"></div>
                      <Play className="w-16 h-16 text-white opacity-90 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                      
                      {/* Animated overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500/90 text-white backdrop-blur-sm border-0 animate-pulse">
                        ● LIVE
                      </Badge>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex gap-2">
                      {stream.is_premium_only && (
                        <Badge className="bg-yellow-500/90 text-white backdrop-blur-sm border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <Badge className="bg-black/70 text-white backdrop-blur-sm border-0">
                        <Users className="w-3 h-3 mr-1" />
                        {stream.viewer_count}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    {/* Streamer Info */}
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                        <AvatarImage src={stream.streamer_profile?.profile_image_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                          {stream.streamer_profile?.first_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-lg leading-tight mb-1 group-hover:text-primary transition-colors duration-200">
                          {stream.title}
                        </h3>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="text-sm">{stream.streamer_profile?.first_name || 'Anonymous'}</span>
                          {stream.streamer_profile?.is_premium && (
                            <Crown className="w-3 h-3 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {stream.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">
                        {stream.description}
                      </p>
                    )}
                    
                    {/* Watch Button */}
                    <Button 
                      onClick={() => handleWatchStream(stream)}
                      className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 group-hover:scale-[1.02]"
                      disabled={stream.is_premium_only && !isPremium}
                    >
                      {stream.is_premium_only && !isPremium ? (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Premium Required
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Watch Stream
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreams;
