
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Crown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Profile {
  user_id: string;
  first_name: string | null;
  profile_image_url: string | null;
  is_premium: boolean | null;
}

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Profile;
  currentUserId: string;
}

export const MessagingModal = ({ isOpen, onClose, recipient, currentUserId }: MessagingModalProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && recipient.user_id) {
      loadMessages();
      
      // Set up real-time subscription for this conversation
      console.log('Setting up modal real-time subscription for:', recipient.user_id);
      
      const channel = supabase
        .channel(`modal-chat-${currentUserId}-${recipient.user_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages_between_users',
            filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},receiver_id.eq.${currentUserId}))`
          },
          (payload) => {
            console.log('Real-time message in modal:', payload.new);
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        console.log('Cleaning up modal real-time subscription...');
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, recipient.user_id, currentUserId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages_between_users')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages_between_users')
        .update({ is_read: true })
        .eq('sender_id', recipient.user_id)
        .eq('receiver_id', currentUserId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "Failed to load conversation history",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('messages_between_users')
        .insert({
          sender_id: currentUserId,
          receiver_id: recipient.user_id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      
      toast({
        title: "Message sent!",
        description: "Your message has been delivered.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={recipient.profile_image_url || ""} />
              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                {recipient.first_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <span>
              Chat with {recipient.first_name || 'Unknown'}
              {recipient.is_premium && (
                <Crown className="w-4 h-4 inline ml-1 text-yellow-500" />
              )}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-96">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 rounded-lg">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500">Start your conversation!</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender_id === currentUserId
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-white text-gray-900 border'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === currentUserId ? 'text-pink-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex space-x-2 mt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
