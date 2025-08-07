import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StreamMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  user_profile?: {
    first_name: string | null;
    profile_image_url: string | null;
    is_premium: boolean | null;
  } | null;
}

interface LiveStreamChatProps {
  streamId: string;
  currentUserId: string;
  viewerCount: number;
}

export const LiveStreamChat = ({ streamId, currentUserId, viewerCount }: LiveStreamChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    // Real-time subscription for new messages
    const channel = supabase
      .channel(`stream-chat-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_stream_messages',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch user profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, profile_image_url, is_premium')
            .eq('user_id', newMsg.user_id)
            .single();

          const messageWithProfile = {
            ...newMsg,
            user_profile: profile
          };

          // Only add if it's not from the current user (to prevent duplicates)
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === messageWithProfile.id);
            if (exists) return prev;
            return [...prev, messageWithProfile];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('live_stream_messages')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      const userIds = [...new Set(messagesData.map(msg => msg.user_id))];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, profile_image_url, is_premium')
        .in('user_id', userIds);

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      const messagesWithProfiles = messagesData.map(msg => ({
        ...msg,
        user_profile: profilesMap.get(msg.user_id) || null
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('live_stream_messages')
        .insert({
          stream_id: streamId,
          user_id: currentUserId,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Live Chat</span>
          <Badge variant="secondary" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {viewerCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={message.user_profile?.profile_image_url || ""} />
                  <AvatarFallback className="text-xs bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                    {message.user_profile?.first_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-gray-900">
                      {message.user_profile?.first_name || 'Anonymous'}
                    </span>
                    {message.user_profile?.is_premium && (
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 break-words">{message.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              maxLength={200}
              disabled={isSending}
            />
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};