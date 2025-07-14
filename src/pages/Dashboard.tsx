
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Crown, Video, MessageCircle, Users, Settings, LogOut, Play } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  city: string;
  bio: string;
  isSubscribed: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      setUserProfile(JSON.parse(profileData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate('/');
  };

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Seraphas
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className={userProfile.isSubscribed ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0" : "bg-gray-100 text-gray-600"}>
                {userProfile.isSubscribed ? <Crown className="w-4 h-4 mr-1" /> : null}
                {userProfile.isSubscribed ? "Premium" : "Free"}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 shadow-lg">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-2xl">
                    {userProfile.firstName[0]}{userProfile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {userProfile.firstName} {userProfile.lastName}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {userProfile.age} years old • {userProfile.city}
                </CardDescription>
                <Badge variant="secondary" className="w-fit mx-auto mt-2">
                  {userProfile.gender === 'male' ? 'Male' : 'Female'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">About Me</h4>
                  <p className="text-gray-600 text-sm">
                    {userProfile.bio || "Tell others about yourself..."}
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/profile')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription Status */}
            {!userProfile.isSubscribed && (
              <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Crown className="w-6 h-6 text-pink-500" />
                    <CardTitle className="text-xl text-gray-900">Upgrade to Premium</CardTitle>
                  </div>
                  <CardDescription>
                    Unlock unlimited messaging, live streaming, and advanced features for just $10/month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleUpgrade}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                  >
                    Start Premium Trial
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" 
                    onClick={() => navigate('/matches')}>
                <CardHeader className="text-center">
                  <Users className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                  <CardTitle className="text-lg text-gray-900">Find Matches</CardTitle>
                  <CardDescription>
                    Discover compatible people in your area
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className={`border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${userProfile.isSubscribed ? 'cursor-pointer' : 'opacity-60'}`}
                    onClick={() => userProfile.isSubscribed ? navigate('/messages') : handleUpgrade()}>
                <CardHeader className="text-center">
                  <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <CardTitle className="text-lg text-gray-900">Messages</CardTitle>
                  <CardDescription>
                    {userProfile.isSubscribed ? "Chat with your matches" : "Premium feature - Upgrade to unlock"}
                  </CardDescription>
                  {!userProfile.isSubscribed && (
                    <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 w-fit mx-auto">
                      Premium
                    </Badge>
                  )}
                </CardHeader>
              </Card>

              <Card className={`border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${userProfile.isSubscribed ? 'cursor-pointer' : 'opacity-60'}`}
                    onClick={() => userProfile.isSubscribed ? navigate('/live') : handleUpgrade()}>
                <CardHeader className="text-center">
                  <Video className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <CardTitle className="text-lg text-gray-900">Live Streams</CardTitle>
                  <CardDescription>
                    {userProfile.isSubscribed ? "Watch or start live streams" : "Premium feature - Upgrade to unlock"}
                  </CardDescription>
                  {!userProfile.isSubscribed && (
                    <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 w-fit mx-auto">
                      Premium
                    </Badge>
                  )}
                </CardHeader>
              </Card>

              {userProfile.gender === 'female' && userProfile.isSubscribed && (
                <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                      onClick={() => navigate('/go-live')}>
                  <CardHeader className="text-center">
                    <Play className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                    <CardTitle className="text-lg text-gray-900">Go Live</CardTitle>
                    <CardDescription>
                      Start your own live stream
                    </CardDescription>
                    <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 w-fit mx-auto">
                      Female Only
                    </Badge>
                  </CardHeader>
                </Card>
              )}
            </div>

            {/* Recent Activity */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start exploring to see your activity here!</p>
                  <Button 
                    className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                    onClick={() => navigate('/matches')}
                  >
                    Find Matches
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
