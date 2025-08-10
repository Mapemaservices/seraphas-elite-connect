import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Square, Settings, Camera, CameraOff, Crown, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setStream(mediaStream);
      setIsCameraOn(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      toast({
        title: "Camera started",
        description: "Your camera is now active",
      });
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to start streaming",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const startStream = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your stream",
        variant: "destructive"
      });
      return;
    }

    if (!isCameraOn) {
      toast({
        title: "Camera required",
        description: "Please start your camera before going live",
        variant: "destructive"
      });
      return;
    }

    setIsStarting(true);
    try {
      // Create a blob URL from the camera stream for sharing
      let streamUrl = null;
      if (stream) {
        // In a real implementation, this would be handled by a WebRTC signaling server
        // For now, we'll simulate by creating a unique stream identifier
        streamUrl = `stream_${currentUserId}_${Date.now()}`;
      }

      const { data, error } = await supabase
        .from('live_streams')
        .insert({
          streamer_id: currentUserId,
          title: title.trim(),
          description: description.trim() || null,
          is_active: true,
          is_premium_only: isPremiumOnly,
          stream_url: streamUrl
        })
        .select();

      if (error) throw error;

      // Store stream connection data for WebRTC sharing
      if (data && data[0] && stream) {
        await supabase
          .from('stream_connections')
          .insert({
            stream_id: data[0].id,
            connection_data: {
              stream_id: streamUrl,
              video_constraints: { width: 1280, height: 720 },
              audio_enabled: true
            }
          });
      }

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

      // Stop camera when ending stream
      stopCamera();

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

  useEffect(() => {
    return () => {
      // Cleanup camera when component unmounts
      stopCamera();
    };
  }, []);

  if (activeStream) {
    return (
      <Card className="mb-8 border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 p-6 border-b border-border/50">
          <CardTitle className="flex items-center text-xl">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center mr-3">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            </div>
            You're Live!
          </CardTitle>
          <p className="text-muted-foreground mt-2">Your stream is broadcasting to viewers</p>
        </div>
        <CardContent className="p-6">
          {/* Live camera preview */}
          {isCameraOn && (
            <div className="mb-6 relative rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500/90 text-white backdrop-blur-sm animate-pulse">
                  ● LIVE
                </Badge>
              </div>
            </div>
          )}
          
          {/* Stream Info */}
          <div className="space-y-4 mb-6 p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <h3 className="font-bold text-lg text-foreground">{activeStream.title}</h3>
            {activeStream.description && (
              <p className="text-muted-foreground leading-relaxed">{activeStream.description}</p>
            )}
            <div className="flex items-center gap-2">
              {activeStream.is_premium_only && (
                <Badge className="bg-yellow-500/90 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium Only
                </Badge>
              )}
              <Badge variant="secondary" className="bg-background/50">
                <Users className="w-3 h-3 mr-1" />
                Live viewers
              </Badge>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex gap-3">
            <Button 
              onClick={endStream} 
              disabled={isEnding}
              variant="destructive"
              className="flex-1 h-12 rounded-xl font-semibold"
            >
              <Square className="w-5 h-5 mr-2" />
              {isEnding ? 'Ending Stream...' : 'End Stream'}
            </Button>
            <Button
              onClick={isCameraOn ? stopCamera : startCamera}
              variant="outline"
              className="px-6 h-12 rounded-xl"
            >
              {isCameraOn ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-border/50">
        <CardTitle className="flex items-center text-xl">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mr-3">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          Start Your Live Stream
        </CardTitle>
        <p className="text-muted-foreground mt-2">Set up your camera and go live to connect with your audience</p>
      </div>
      <CardContent className="p-6 space-y-6">
        {/* Camera preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Camera Setup</Label>
            <Badge variant={isCameraOn ? "default" : "secondary"} className="px-3 py-1">
              {isCameraOn ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          {isCameraOn ? (
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500/90 text-white backdrop-blur-sm animate-pulse">
                  ● Recording
                </Badge>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-muted/50 to-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">Camera preview will appear here</p>
                <p className="text-sm text-muted-foreground/80 mt-1">Start your camera to see the preview</p>
              </div>
            </div>
          )}
          
          <Button
            onClick={isCameraOn ? stopCamera : startCamera}
            variant={isCameraOn ? "destructive" : "default"}
            className="w-full h-12 rounded-xl font-semibold"
          >
            {isCameraOn ? <CameraOff className="w-5 h-5 mr-2" /> : <Camera className="w-5 h-5 mr-2" />}
            {isCameraOn ? 'Stop Camera' : 'Start Camera'}
          </Button>
        </div>
        
        {/* Stream Details */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Stream Details</Label>
          
          <div className="space-y-2">
            <Label htmlFor="stream-title" className="text-sm font-medium">Title *</Label>
            <Input
              id="stream-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your stream about?"
              maxLength={100}
              className="h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stream-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="stream-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what to expect..."
              rows={3}
              maxLength={500}
              className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/50">
            <div className="space-y-1">
              <Label htmlFor="premium-only" className="text-sm font-medium">Premium Only Stream</Label>
              <p className="text-xs text-muted-foreground">Limit access to premium members only</p>
            </div>
            <Switch
              id="premium-only"
              checked={isPremiumOnly}
              onCheckedChange={setIsPremiumOnly}
            />
          </div>
        </div>

        <Button 
          onClick={startStream} 
          disabled={isStarting || !title.trim() || !isCameraOn}
          className="w-full h-14 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5 mr-3" />
          {isStarting ? 'Going Live...' : 'Go Live'}
        </Button>
      </CardContent>
    </Card>
  );
};
