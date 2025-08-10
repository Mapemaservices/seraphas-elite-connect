import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Users, Crown, ArrowLeft, Heart, Share2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LiveStreamChat } from './LiveStreamChat';

interface StreamViewer {
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

interface StreamViewerProps {
  stream: StreamViewer;
  currentUserId: string;
  onBack: () => void;
}

export const StreamViewer = ({ stream, currentUserId, onBack }: StreamViewerProps) => {
  const { toast } = useToast();
  const [viewerCount, setViewerCount] = useState(stream.viewer_count);
  const [isJoined, setIsJoined] = useState(false);
  const [likes, setLikes] = useState(0);
  const [streamConnection, setStreamConnection] = useState<any>(null);
  const [hasStreamAccess, setHasStreamAccess] = useState(false);

  useEffect(() => {
    joinStream();
    loadStreamConnection();
    
    // Real-time subscription for viewer count updates and stream status
    const channel = supabase
      .channel(`stream-viewer-${stream.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_stream_viewers',
          filter: `stream_id=eq.${stream.id}`
        },
        () => {
          updateViewerCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_streams',
          filter: `id=eq.${stream.id}`
        },
        (payload) => {
          // Update stream status if it ends
          if (payload.new && !payload.new.is_active) {
            toast({
              title: "Stream Ended",
              description: "This stream has ended.",
              variant: "default"
            });
            setTimeout(() => onBack(), 2000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stream_connections',
          filter: `stream_id=eq.${stream.id}`
        },
        (payload) => {
          if (payload.new) {
            setStreamConnection(payload.new);
            setHasStreamAccess(true);
          }
        }
      )
      .subscribe();

    return () => {
      leaveStream();
      supabase.removeChannel(channel);
    };
  }, [stream.id]);

  const loadStreamConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_connections')
        .select('*')
        .eq('stream_id', stream.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setStreamConnection(data);
        setHasStreamAccess(true);
      }
    } catch (error) {
      console.error('Error loading stream connection:', error);
    }
  };

  const joinStream = async () => {
    try {
      const { error } = await supabase
        .from('live_stream_viewers')
        .upsert({
          stream_id: stream.id,
          user_id: currentUserId
        });

      if (error) throw error;
      setIsJoined(true);
      await updateViewerCount();
    } catch (error) {
      console.error('Error joining stream:', error);
    }
  };

  const leaveStream = async () => {
    try {
      await supabase
        .from('live_stream_viewers')
        .delete()
        .eq('stream_id', stream.id)
        .eq('user_id', currentUserId);
      
      setIsJoined(false);
    } catch (error) {
      console.error('Error leaving stream:', error);
    }
  };

  const updateViewerCount = async () => {
    try {
      const { count } = await supabase
        .from('live_stream_viewers')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', stream.id);

      if (count !== null) {
        setViewerCount(count);
        
        // Update the stream's viewer count
        await supabase
          .from('live_streams')
          .update({ viewer_count: count })
          .eq('id', stream.id);
      }
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  };

  const handleLike = () => {
    setLikes(prev => prev + 1);
    toast({
      title: "❤️ Liked!",
      description: "Your appreciation has been sent to the streamer",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Stream link has been copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            onClick={onBack}
            variant="ghost"
            className="hover:bg-secondary/50 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Streams
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-sm">
              <div className="relative group">
                {hasStreamAccess && streamConnection ? (
                  <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20">
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold mb-2">Live Camera Feed</h3>
                          <p className="text-white/80 mb-4">Connected to {stream.streamer_profile?.first_name}'s stream</p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Stream Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-primary/30 to-secondary/30"></div>
                    <div className="text-center text-white relative z-10">
                      <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <Play className="w-12 h-12 text-white animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Connecting to Stream...</h3>
                      <p className="text-white/80">Loading camera feed</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay badges */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500/90 text-white backdrop-blur-sm animate-pulse border-0">
                    ● LIVE
                  </Badge>
                </div>
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-black/70 text-white backdrop-blur-sm border-0">
                    <Users className="w-3 h-3 mr-1" />
                    {viewerCount}
                  </Badge>
                  {stream.is_premium_only && (
                    <Badge className="bg-yellow-500/90 text-white backdrop-blur-sm border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>

                {/* Interactive controls overlay */}
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    onClick={handleLike}
                    size="sm"
                    className="bg-red-500/90 hover:bg-red-600/90 text-white backdrop-blur-sm border-0 rounded-full"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {likes}
                  </Button>
                  <Button
                    onClick={handleShare}
                    size="sm"
                    className="bg-black/70 hover:bg-black/80 text-white backdrop-blur-sm border-0 rounded-full"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Stream Info */}
            <Card className="border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                    <AvatarImage src={stream.streamer_profile?.profile_image_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-lg font-bold">
                      {stream.streamer_profile?.first_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                      {stream.title}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">{stream.streamer_profile?.first_name || 'Anonymous'}</span>
                      {stream.streamer_profile?.is_premium && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-xs bg-secondary px-2 py-1 rounded-full">Streamer</span>
                    </div>
                  </div>
                </div>
                
                {stream.description && (
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                    <p className="text-foreground leading-relaxed">{stream.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <LiveStreamChat
                streamId={stream.id}
                currentUserId={currentUserId}
                viewerCount={viewerCount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};