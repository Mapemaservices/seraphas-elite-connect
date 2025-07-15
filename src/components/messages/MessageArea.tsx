
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Crown } from 'lucide-react';

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

interface MessageAreaProps {
  selectedChat: string | null;
  selectedChatProfile: Chat | null;
  messages: Message[];
  newMessage: string;
  currentUserId: string;
  canSendMessage: boolean;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

export const MessageArea = ({ 
  selectedChat, 
  selectedChatProfile, 
  messages, 
  newMessage, 
  currentUserId, 
  canSendMessage,
  onMessageChange, 
  onSendMessage 
}: MessageAreaProps) => {
  return (
    <Card className="lg:col-span-2 flex flex-col h-full">
      {selectedChat ? (
        <>
          <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-gray-900">
                {selectedChatProfile?.first_name || 'Unknown'}
              </h3>
              {selectedChatProfile?.is_premium && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>
          
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-80">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl transition-all duration-200 ${
                      message.sender_id === currentUserId
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
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
              ))}
            </div>
          </CardContent>
          
          <div className="p-4 border-t bg-gray-50">
            {!canSendMessage && (
              <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  <Crown className="w-4 h-4 inline mr-1" />
                  Upgrade to Premium to message other users freely!
                </p>
              </div>
            )}
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder={canSendMessage ? "Type a message..." : "Premium required to send messages"}
                onKeyPress={(e) => e.key === 'Enter' && canSendMessage && onSendMessage()}
                disabled={!canSendMessage}
                className="flex-1 border-pink-200 focus:border-pink-400 transition-colors"
              />
              <Button
                onClick={onSendMessage}
                disabled={!canSendMessage || !newMessage.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
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
  );
};
