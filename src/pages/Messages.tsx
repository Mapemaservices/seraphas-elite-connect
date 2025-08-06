
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ChatList } from "@/components/messages/ChatList";
import { MessageArea } from "@/components/messages/MessageArea";
import { ChatWindow } from "@/components/chat/ChatWindow";

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
    initializeMessages();
  }, []);

  const initializeMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setCurrentUserId(session.user.id);
    await loadChats(session.user.id);
    setIsLoading(false);
  };

  const loadChats = async (userId: string) => {
    try {
      // Load from both tables to ensure compatibility
      const [messagesData, betweenUsersData] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('messages_between_users')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false })
      ]);

      // Combine messages from both tables
      const allMessages = [
        ...(messagesData.data || []),
        ...(betweenUsersData.data || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const chatMap = new Map<string, any>();
      
      allMessages.forEach(message => {
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
    } catch (error) {
      toast({
        title: "Error loading chats",
        description: error instanceof Error ? error.message : "Failed to load chats",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async (partnerId: string) => {
    try {
      // Load from both tables
      const [messagesData, betweenUsersData] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true }),
        supabase
          .from('messages_between_users')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true })
      ]);

      // Combine and sort messages
      const allMessages = [
        ...(messagesData.data || []),
        ...(betweenUsersData.data || [])
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setMessages(allMessages);
      
      // Mark messages as read in both tables
      await Promise.all([
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', partnerId)
          .eq('receiver_id', currentUserId),
        supabase
          .from('messages_between_users')
          .update({ is_read: true })
          .eq('sender_id', partnerId)
          .eq('receiver_id', currentUserId)
      ]);
    } catch (error) {
      toast({
        title: "Error loading messages",
        description: error instanceof Error ? error.message : "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const canSendMessage = () => {
    return true; // Allow all users to send messages
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;


    try {
      // Use the new messages_between_users table
      const { error } = await supabase
        .from('messages_between_users')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedChat,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedChat);
      await loadChats(currentUserId);
    } catch (error) {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const selectChat = (partnerId: string) => {
    setSelectedChat(partnerId);
    const chatProfile = chats.find(chat => chat.user_id === partnerId);
    setSelectedChatProfile(chatProfile || null);
    loadMessages(partnerId);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
    setSelectedChatProfile(null);
    setMessages([]);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <Heart className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Connect with your matches</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-250px)]">
        {/* Show chat window on mobile when chat is selected */}
        {selectedChat && selectedChatProfile ? (
          <div className="lg:hidden col-span-1">
            <ChatWindow
              partner={selectedChatProfile}
              currentUserId={currentUserId}
              onClose={handleCloseChat}
            />
          </div>
        ) : (
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={selectChat}
          />
        )}
        
        {/* Desktop view - always show both */}
        <div className="hidden lg:block">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={selectChat}
          />
        </div>
        
        <div className="hidden lg:block lg:col-span-2">
          {selectedChat && selectedChatProfile ? (
            <ChatWindow
              partner={selectedChatProfile}
              currentUserId={currentUserId}
              onClose={handleCloseChat}
            />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
