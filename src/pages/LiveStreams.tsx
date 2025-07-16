
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Video, Users, Crown, Play, Plus, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface LiveStream {
  id: string;
  streamer_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  is_premium_only: boolean;
  viewer_count: number;
  created_at: string;
  profiles?: {
    first_name: string | null;
    profile_image_url: string | null;
    is_premium: boolean | null;
  };
}

const LiveStreams = () => {
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    is_premium_only: false
  });

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          profiles:streamer_id (
            first_name,
            profile_image_url,
            is_premium
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      toast({
        title: "Error loading streams",
        description: error instanceof Error ? error.message : "Failed to load live streams",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createStream = async () => {
    if (!newStream.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your stream",
        variant: "destructive"
      });
      return;
    }

    if (!isPremium) {
      toast({
        title: "Premium Required",
        description: "Upgrade to Premium to create live streams",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('live_streams')
        .insert({
          streamer_id: session.user.id,
          title: newStream.title,
          description: newStream.description,
          is_premium_only: newStream.is_premium_only,
          is_active: true,
          viewer_count: 0
        });

      if (error) throw error;

      toast({
        title: "Stream created",
        description: "Your live stream has been started successfully!",
      });

      setNewStream({ title: '', description: '', is_premium_only: false });
      setShowCreateForm(false);
      loadStreams();
    } catch (error) {
      toast({
        title: "Error creating stream",
        description: error instanceof Error ? error.message : "Failed to create stream",
        variant: "destructive"
      });
    }
  };

  const joinStream = (stream: LiveStream) => {
    if (stream.is_premium_only && !isPremium) {
      toast({
        title: "Premium Required",
        description: "This is a premium-only stream. Upgrade to access it.",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would open the video stream
    toast({
      title: "Joining stream",
      description: `Connecting to ${stream.title}...`,
    });
  };

  const canAccessStream = (stream: LiveStream) => {
    return !stream.is_premium_only || isPremium;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">
          <Video className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading live streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Streams</h1>
          <p className="text-gray-600">Watch live streams from our community</p>
        </div>
        
        {isPremium && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Stream
          </Button>
        )}
      </div>

      {/* Create Stream Form */}
      {showCreateForm && (
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-5 h-5 mr-2 text-pink-500" />
              Create Live Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stream Title
              </label>
              <Input
                value={newStream.title}
                onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
                placeholder="Enter stream title..."
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <Textarea
                value={newStream.description}
                onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                placeholder="Describe your stream..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="premium-only"
                checked={newStream.is_premium_only}
                onChange={(e) => setNewStream({ ...newStream, is_premium_only: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="premium-only" className="text-sm text-gray-700">
                Premium members only
              </label>
            </div>

            <div className="flex space-x-2">
              <Button onClick={createStream} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                Start Stream
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Upgrade Notice */}
      {!isPremium && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">
                Upgrade to Premium to create your own live streams and access premium-only content!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Streams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streams.map((stream) => (
          <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gradient-to-br from-pink-100 to-purple-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-16 h-16 text-pink-500 opacity-70" />
              </div>
              
              {/* Live Badge */}
              <div className="absolute top-3 left-3">
                <Badge className="bg-red-500 text-white animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                  LIVE
                </Badge>
              </div>

              {/* Premium Badge */}
              {stream.is_premium_only && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}

              {/* Viewer Count */}
              <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-sm">
                <Eye className="w-3 h-3 inline mr-1" />
                {stream.viewer_count}
              </div>
            </div>

            <CardContent className="p-4">
              <div className="flex items-start space-x-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={stream.profiles?.profile_image_url || ""} />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                    {stream.profiles?.first_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{stream.title}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <span>{stream.profiles?.first_name || 'Anonymous'}</span>
                    {stream.profiles?.is_premium && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>

              {stream.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {stream.description}
                </p>
              )}

              <Button
                onClick={() => joinStream(stream)}
                disabled={!canAccessStream(stream)}
                className={`w-full transition-all duration-200 ${
                  canAccessStream(stream)
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transform hover:scale-105"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Play className="w-4 h-4 mr-2" />
                {canAccessStream(stream) ? 'Join Stream' : 'Premium Required'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {streams.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No live streams</h3>
            <p className="text-gray-600 mb-4">Be the first to start streaming!</p>
            {!isPremium && (
              <p className="text-sm text-gray-500">
                Upgrade to Premium to create live streams
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveStreams;
