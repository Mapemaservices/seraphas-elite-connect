import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Square, Settings, Camera, CameraOff } from 'lucide-react';
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
      const { data, error } = await supabase
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
            Currently Live
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Live camera preview */}
          {isCameraOn && (
            <div className="mb-4">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-48 bg-black rounded-lg object-cover"
              />
            </div>
          )}
          
          <div className="space-y-2 mb-4">
            <h3 className="font-semibold">{activeStream.title}</h3>
            {activeStream.description && (
              <p className="text-gray-600">{activeStream.description}</p>
            )}
            {activeStream.is_premium_only && (
              <div className="text-yellow-600 text-sm">Premium Only Stream</div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={endStream} 
              disabled={isEnding}
              variant="destructive"
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              {isEnding ? 'Ending...' : 'End Stream'}
            </Button>
            <Button
              onClick={isCameraOn ? stopCamera : startCamera}
              variant="outline"
              className="px-4"
            >
              {isCameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </Button>
          </div>
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
        {/* Camera preview */}
        {isCameraOn && (
          <div className="mb-4">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-48 bg-black rounded-lg object-cover"
            />
          </div>
        )}
        
        {/* Camera controls */}
        <div className="flex space-x-2 mb-4">
          <Button
            onClick={isCameraOn ? stopCamera : startCamera}
            variant={isCameraOn ? "destructive" : "default"}
            className="flex-1"
          >
            {isCameraOn ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
            {isCameraOn ? 'Stop Camera' : 'Start Camera'}
          </Button>
        </div>
        
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
          disabled={isStarting || !title.trim() || !isCameraOn}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          {isStarting ? 'Starting...' : 'Start Stream'}
        </Button>
      </CardContent>
    </Card>
  );
};
