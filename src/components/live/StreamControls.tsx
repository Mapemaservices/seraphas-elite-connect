
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Stop, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StreamControlsProps {
  currentUserId: string;
  activeStream?: {
    id: string;
    title: string;
    description: string | null;
    is_premium_only: boolean;
  } | null;
  onStreamStarted: () => void;
  onStreamEnded: () => void;
}

export const StreamControls = ({ 
  currentUserId, 
  activeStream, 
  onStreamStarted, 
  onStreamEnded 
}: StreamControlsProps) => {
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);

  const startStream = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your stream",
        variant: "destructive"
      });
      return;
    }

    setIsStarting(true);
    try {
      const { error } = await supabase
        .from('live_streams')
        .insert({
          streamer_id: currentUserId,
          title: title.trim(),
          description: description.trim() || null,
          is_active: true,
          is_premium_only: isPremiumOnly
        });

      if (error) throw error;

      toast({
        title: "Stream started!",
        description: "Your live stream is now active.",
      });

      // Clear form
      setTitle('');
      setDescription('');
      setIsPremiumOnly(false);
      
      onStreamStarted();
    } catch (error) {
      toast({
        title: "Error starting stream",
        description: error instanceof Error ? error.message : "Failed to start stream",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const endStream = async () => {
    if (!activeStream) return;

    setIsEnding(true);
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', activeStream.id);

      if (error) throw error;

      toast({
        title: "Stream ended",
        description: "Your live stream has been ended.",
      });

      onStreamEnded();
    } catch (error) {
      toast({
        title: "Error ending stream",
        description: error instanceof Error ? error.message : "Failed to end stream",
        variant: "destructive"
      });
    } finally {
      setIsEnding(false);
    }
  };

  if (activeStream) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
            Currently Live
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <h3 className="font-semibold">{activeStream.title}</h3>
            {activeStream.description && (
              <p className="text-gray-600">{activeStream.description}</p>
            )}
            {activeStream.is_premium_only && (
              <div className="text-yellow-600 text-sm">Premium Only Stream</div>
            )}
          </div>
          <Button 
            onClick={endStream} 
            disabled={isEnding}
            variant="destructive"
            className="w-full"
          >
            <Stop className="w-4 h-4 mr-2" />
            {isEnding ? 'Ending...' : 'End Stream'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Start Live Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="stream-title">Stream Title</Label>
          <Input
            id="stream-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter stream title"
            maxLength={100}
          />
        </div>
        
        <div>
          <Label htmlFor="stream-description">Description (Optional)</Label>
          <Textarea
            id="stream-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your stream"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="premium-only"
            checked={isPremiumOnly}
            onCheckedChange={setIsPremiumOnly}
          />
          <Label htmlFor="premium-only">Premium Only Stream</Label>
        </div>

        <Button 
          onClick={startStream} 
          disabled={isStarting || !title.trim()}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          {isStarting ? 'Starting...' : 'Start Stream'}
        </Button>
      </CardContent>
    </Card>
  );
};
