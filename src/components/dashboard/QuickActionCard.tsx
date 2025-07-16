
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, User as UserIcon, MessageCircle, Video } from 'lucide-react';

export const QuickActionCard = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "My Profile",
      description: "Complete your profile to attract better matches",
      icon: UserIcon,
      onClick: () => navigate('/profile'),
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      title: "Discover",
      description: "Browse profiles and find your perfect match",
      icon: Heart,
      onClick: () => navigate('/discover'),
      gradient: "from-pink-500 to-rose-600"
    },
    {
      title: "Messages",
      description: "Chat with your matches and start conversations",
      icon: MessageCircle,
      onClick: () => navigate('/messages'),
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      title: "Live Streams",
      description: "Watch live streams from premium members",
      icon: Video,
      onClick: () => navigate('/live-streams'),
      gradient: "from-green-500 to-teal-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {quickActions.map((action) => (
        <Card
          key={action.title}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-0 shadow-md"
          onClick={action.onClick}
        >
          <CardContent className="p-6 text-center">
            <div className={`w-16 h-16 bg-gradient-to-r ${action.gradient} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <action.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
