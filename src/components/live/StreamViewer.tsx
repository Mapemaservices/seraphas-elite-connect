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
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="absolute top-3 sm:top-4 left-3 sm:left-4 z-50 w-8 sm:w-10 h-8 sm:h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
      </button>

      {/* Full-screen video */}
      <div className="h-full relative">
        {hasStreamAccess && streamConnection ? (
          <div className="h-full bg-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white px-4">
                  <div className="w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 backdrop-blur-sm">
                    <Play className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                  </div>
                  <div className="w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded-full animate-pulse mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-purple-800 via-pink-800 to-blue-800"></div>
            <div className="text-center text-white relative z-10 px-4">
              <div className="w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 backdrop-blur-sm">
                <Play className="w-12 sm:w-16 h-12 sm:h-16 text-white animate-pulse" />
              </div>
              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded-full animate-pulse mx-auto"></div>
            </div>
          </div>
        )}

        {/* Right side actions (TikTok-style) */}
        <div className="absolute right-2 sm:right-4 bottom-24 sm:bottom-32 flex flex-col gap-3 sm:gap-4 z-20">
          <div className="flex flex-col items-center">
            <Avatar className="w-12 sm:w-14 h-12 sm:h-14 ring-2 ring-white">
              <AvatarImage src={stream.streamer_profile?.profile_image_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm sm:text-lg">
                {stream.streamer_profile?.first_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="w-6 sm:w-7 h-6 sm:h-7 bg-red-500 rounded-full flex items-center justify-center -mt-1.5 sm:-mt-2 border-2 border-white">
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>

          <button 
            onClick={handleLike}
            className="w-12 sm:w-14 h-12 sm:h-14 bg-black/50 rounded-full flex flex-col items-center justify-center backdrop-blur-sm active:scale-95 transition-transform"
          >
            <Heart className="w-6 sm:w-7 h-6 sm:h-7 text-white mb-0.5 sm:mb-1" />
            <span className="text-white text-xs font-bold">{likes}</span>
          </button>

          <button 
            onClick={handleShare}
            className="w-12 sm:w-14 h-12 sm:h-14 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform"
          >
            <Share2 className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
          </button>

          <div className="w-12 sm:w-14 h-12 sm:h-14 bg-black/50 rounded-full flex flex-col items-center justify-center backdrop-blur-sm">
            <Users className="w-5 sm:w-6 h-5 sm:h-6 text-white mb-0.5 sm:mb-1" />
            <span className="text-white text-xs font-bold">{viewerCount}</span>
          </div>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-14 sm:right-16 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <span className="text-white font-bold text-base sm:text-lg">
                @{stream.streamer_profile?.first_name || 'anonymous'}
              </span>
              {stream.streamer_profile?.is_premium && (
                <Crown className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400" />
              )}
            </div>
            <h2 className="text-white text-lg sm:text-xl font-bold mb-1 sm:mb-2 leading-tight">
              {stream.title}
            </h2>
            {stream.description && (
              <p className="text-white/80 text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
                {stream.description}
              </p>
            )}
          </div>

          {/* Live badges */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
            <div className="px-2 sm:px-3 py-1 bg-red-500 rounded-full flex items-center gap-1">
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
            {stream.is_premium_only && (
              <div className="px-2 sm:px-3 py-1 bg-yellow-500 rounded-full">
                <span className="text-black text-xs font-bold">Premium</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-up chat overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-72 sm:h-96 bg-gradient-to-t from-black via-black/90 to-transparent transform translate-y-64 sm:translate-y-80 hover:translate-y-0 transition-transform duration-300 z-30 touch-pan-y">
        <div className="h-full p-3 sm:p-4 pt-6 sm:pt-8">
          <div className="w-12 h-1 bg-white/50 rounded-full mx-auto mb-3 sm:mb-4"></div>
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