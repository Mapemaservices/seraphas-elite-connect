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

  useEffect(() => {
    joinStream();
    
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
      .subscribe();

    return () => {
      leaveStream();
      supabase.removeChannel(channel);
    };
  }, [stream.id]);

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
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-4">
        <Button 
          onClick={onBack}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Streams
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stream Area */}
        <div className="lg:col-span-2">
          <Card className="mb-4">
            <div className="relative">
              <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-20 h-20 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-semibold">Live Stream</p>
                  <p className="text-sm opacity-80">Camera feed would appear here</p>
                </div>
              </div>
              
              <div className="absolute top-4 left-4">
                <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                  ● LIVE
                </Badge>
              </div>
              
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  <Users className="w-3 h-3 mr-1" />
                  {viewerCount}
                </Badge>
              </div>

              {stream.is_premium_only && (
                <div className="absolute bottom-4 right-4">
                  <Badge className="bg-yellow-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Stream Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={stream.streamer_profile?.profile_image_url || ""} />
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      {stream.streamer_profile?.first_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      {stream.title}
                    </h1>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span>{stream.streamer_profile?.first_name || 'Anonymous'}</span>
                      {stream.streamer_profile?.is_premium && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleLike}
                    variant="outline"
                    size="sm"
                    className="text-pink-600 border-pink-200 hover:bg-pink-50"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {likes}
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="sm"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {stream.description && (
                <p className="text-gray-700 leading-relaxed">{stream.description}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-1">
          <LiveStreamChat
            streamId={stream.id}
            currentUserId={currentUserId}
            viewerCount={viewerCount}
          />
        </div>
      </div>
    </div>
  );
};