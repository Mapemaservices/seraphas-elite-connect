
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, ArrowLeft, Video, Play, Users, Crown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LiveStream {
  id: string;
  streamer_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  viewer_count: number;
  is_premium_only: boolean;
  created_at: string;
  profiles?: {
    first_name: string | null;
    profile_image_url: string | null;
  };
}

const LiveStreams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    is_premium_only: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const initializeStreams = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(session.user.id);
      await loadStreams();
      setIsLoading(false);
    };

    initializeStreams();
  }, [navigate]);

  const loadStreams = async () => {
    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        profiles!live_streams_streamer_id_fkey (
          first_name,
          profile_image_url
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error loading streams:', error);
      // Fallback query without the join if the foreign key doesn't exist yet
      const { data: streamsData, error: streamsError } = await supabase
        .from('live_streams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (streamsError) {
        toast({
          title: "Error loading streams",
          description: streamsError.message,
          variant: "destructive"
        });
      } else {
        // Manually get profiles for each stream
        const streamsWithProfiles = await Promise.all(
          (streamsData || []).map(async (stream) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, profile_image_url')
              .eq('user_id', stream.streamer_id)
              .single();
            
            return {
              ...stream,
              profiles: profile
            };
          })
        );
        setStreams(streamsWithProfiles);
      }
    } else {
      setStreams(data || []);
    }
  };

  const createStream = async () => {
    if (!newStream.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stream title",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('live_streams')
      .insert({
        streamer_id: currentUserId,
        title: newStream.title,
        description: newStream.description,
        is_premium_only: newStream.is_premium_only,
        is_active: true
      });

    if (error) {
      toast({
        title: "Error creating stream",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Stream created!",
        description: "Your live stream is now active.",
      });
      setIsCreating(false);
      setNewStream({ title: '', description: '', is_premium_only: false });
      await loadStreams();
    }
  };

  const joinStream = (streamId: string) => {
    toast({
      title: "Joining stream...",
      description: "Live streaming feature will be implemented soon!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-pink-100 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-pink-600 hover:bg-pink-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Live Streams
            </span>
          </div>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <Video className="w-4 h-4 mr-2" />
            Go Live
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create Live Stream</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Title
                </label>
                <Input
                  value={newStream.title}
                  onChange={(e) => setNewStream(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter your stream title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={newStream.description}
                  onChange={(e) => setNewStream(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what you'll be streaming about..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="premium"
                  checked={newStream.is_premium_only}
                  onChange={(e) => setNewStream(prev => ({ ...prev, is_premium_only: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="premium" className="text-sm text-gray-700">
                  Premium members only
                </label>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={createStream}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  Start Stream
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No live streams</h3>
              <p className="text-gray-600 mb-4">Be the first to go live!</p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              >
                Start Streaming
              </Button>
            </div>
          ) : (
            streams.map((stream) => (
              <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-video bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-500 text-white animate-pulse">
                      LIVE
                    </Badge>
                  </div>
                  {stream.is_premium_only && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-yellow-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={stream.profiles?.profile_image_url || ""} />
                      <AvatarFallback>
                        {stream.profiles?.first_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {stream.profiles?.first_name || "Unknown"}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        {stream.viewer_count} viewers
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {stream.title}
                  </h3>
                  {stream.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {stream.description}
                    </p>
                  )}
                  <Button
                    onClick={() => joinStream(stream.id)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    size="sm"
                  >
                    Join Stream
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStreams;
