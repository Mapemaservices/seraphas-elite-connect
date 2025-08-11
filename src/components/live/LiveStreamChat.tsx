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
    <div className="h-full flex flex-col bg-transparent">
      <div className="mb-4">
        <div className="flex items-center justify-between text-white">
          <span className="font-bold">Live Chat</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full backdrop-blur-sm">
            <Users className="w-3 h-3" />
            <span className="text-xs font-bold">{viewerCount}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage src={message.user_profile?.profile_image_url || ""} />
                  <AvatarFallback className="text-xs bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                    {message.user_profile?.first_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-white truncate">
                      {message.user_profile?.first_name || 'Anonymous'}
                    </span>
                    {message.user_profile?.is_premium && (
                      <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <p className="text-sm text-white/90 break-words leading-tight">{message.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a comment..."
              maxLength={200}
              disabled={isSending}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm"
            />
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};