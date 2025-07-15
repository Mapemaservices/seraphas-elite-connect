
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, ArrowLeft, Send, MessageCircle, Crown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";

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
    if (isPremium) return true; // Premium users can message anyone
    if (selectedChatProfile?.is_premium) return true; // Can message premium users
    return false; // Free users can't message other free users
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
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Messages
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {chats.length === 0 ? (
                <div className="text-center p-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No conversations yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start by matching with someone!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <div
                      key={chat.user_id}
                      onClick={() => selectChat(chat.user_id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                        selectedChat === chat.user_id 
                          ? 'border-pink-500 bg-pink-50' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={chat.profile_image_url || ""} />
                          <AvatarFallback>{chat.first_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900 truncate">
                              {chat.first_name}
                            </p>
                            {chat.is_premium && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2">
            {selectedChat ? (
              <>
                <CardContent className="flex-1 p-4 overflow-y-auto max-h-96">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === currentUserId
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === currentUserId ? 'text-pink-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="p-4 border-t">
                  {!canSendMessage() && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <Crown className="w-4 h-4 inline mr-1" />
                        Upgrade to Premium to message other users freely!
                      </p>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={canSendMessage() ? "Type a message..." : "Premium required to send messages"}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={!canSendMessage()}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!canSendMessage()}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
