import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ChatList } from "@/components/messages/ChatList";
import { MessageArea } from "@/components/messages/MessageArea";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Chat {
  user_id: string;
  first_name: string | null;
  profile_image_url: string | null;
  is_premium: boolean | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatProfile, setSelectedChatProfile] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeMessages = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(session.user.id);
      await loadChats(session.user.id);
      setIsLoading(false);
    };

    initializeMessages();
  }, [navigate]);

  const loadChats = async (userId: string) => {
    // Get all messages for the current user
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading chats",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    // Group messages by conversation partner
    const chatMap = new Map<string, any>();
    
    messagesData?.forEach(message => {
      const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      
      if (!chatMap.has(partnerId)) {
        chatMap.set(partnerId, {
          user_id: partnerId,
          messages: [],
          unreadCount: 0
        });
      }
      
      chatMap.get(partnerId).messages.push(message);
      
      if (message.receiver_id === userId && !message.is_read) {
        chatMap.get(partnerId).unreadCount++;
      }
    });

    // Get profile info for each chat partner
    const partnerIds = Array.from(chatMap.keys());
    if (partnerIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, profile_image_url, is_premium')
        .in('user_id', partnerIds);

      const chatsArray = Array.from(chatMap.entries()).map(([partnerId, chatData]) => {
        const profile = profilesData?.find(p => p.user_id === partnerId);
        const lastMessage = chatData.messages[0];
        
        return {
          user_id: partnerId,
          first_name: profile?.first_name || 'Unknown',
          profile_image_url: profile?.profile_image_url,
          is_premium: profile?.is_premium || false,
          lastMessage: lastMessage?.content || '',
          lastMessageTime: lastMessage?.created_at || '',
          unreadCount: chatData.unreadCount
        };
      });

      setChats(chatsArray);
    }
  };

  const loadMessages = async (partnerId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setMessages(data || []);
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', currentUserId);
    }
  };

  const canSendMessage = () => {
    if (isPremium) return true;
    if (selectedChatProfile?.is_premium) return true;
    return false;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    if (!canSendMessage()) {
      toast({
        title: "Premium Required",
        description: "Upgrade to Premium to message other users, or wait for a Premium member to message you first.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: selectedChat,
        content: newMessage.trim()
      });

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setNewMessage('');
      await loadMessages(selectedChat);
      await loadChats(currentUserId);
    }
  };

  const selectChat = (partnerId: string) => {
    setSelectedChat(partnerId);
    const chatProfile = chats.find(chat => chat.user_id === partnerId);
    setSelectedChatProfile(chatProfile || null);
    loadMessages(partnerId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Responsive Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-pink-100 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-pink-600 hover:bg-pink-50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Messages
            </span>
          </div>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </nav>

      {/* Main Content - Responsive Layout */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-200px)]">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={selectChat}
          />
          
          <MessageArea
            selectedChat={selectedChat}
            selectedChatProfile={selectedChatProfile}
            messages={messages}
            newMessage={newMessage}
            currentUserId={currentUserId}
            canSendMessage={canSendMessage()}
            onMessageChange={setNewMessage}
            onSendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
