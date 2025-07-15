
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Crown } from 'lucide-react';

interface Chat {
  user_id: string;
  first_name: string | null;
  profile_image_url: string | null;
  is_premium: boolean | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: string | null;
  onSelectChat: (partnerId: string) => void;
}

export const ChatList = ({ chats, selectedChat, onSelectChat }: ChatListProps) => {
  return (
    <Card className="lg:col-span-1 h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-pink-500" />
          Conversations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {chats.length === 0 ? (
          <div className="text-center p-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No conversations yet</p>
            <p className="text-sm text-gray-500 mt-2">Start by matching with someone!</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.user_id}
                onClick={() => onSelectChat(chat.user_id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 transition-all duration-200 ${
                  selectedChat === chat.user_id 
                    ? 'border-pink-500 bg-pink-50 shadow-sm' 
                    : 'border-transparent hover:border-pink-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="ring-2 ring-white shadow-sm">
                      <AvatarImage src={chat.profile_image_url || ""} />
                      <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                        {chat.first_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {chat.is_premium && (
                      <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 drop-shadow-sm" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {chat.first_name || 'Unknown'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <div className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
