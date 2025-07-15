import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, LogOut, User as UserIcon, Settings, MessageCircle, Video } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { User } from '@supabase/supabase-js';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isPremium, checkSubscription, createCheckout, manageBilling } = useSubscription();

  useEffect(() => {
    // Check for success/canceled params from Stripe
    if (searchParams.get('success')) {
      toast({
        title: "Payment successful!",
        description: "Welcome to Seraphas Premium! Your subscription is now active.",
      });
      checkSubscription(); // Refresh subscription status
    } else if (searchParams.get('canceled')) {
      toast({
        title: "Payment canceled",
        description: "Your subscription was not activated.",
        variant: "destructive"
      });
    }
  }, [searchParams, toast, checkSubscription]);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        navigate('/login');
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-pink-100 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Seraphas
            </span>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
                Premium
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.user_metadata?.first_name || user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to your Dashboard
          </h1>
          <p className="text-gray-600">
            Start your journey to find meaningful connections
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <UserIcon className="w-5 h-5 mr-2 text-pink-500" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Complete your profile to attract better matches
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/discover')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Heart className="w-5 h-5 mr-2 text-pink-500" />
                Discover
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Browse profiles and find your perfect match
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/messages')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <MessageCircle className="w-5 h-5 mr-2 text-pink-500" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Chat with your matches and start conversations
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/live-streams')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Video className="w-5 h-5 mr-2 text-pink-500" />
                Live Streams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Watch live streams from premium members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-pink-500" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                {isPremium ? (
                  <>
                    <p className="text-sm text-gray-600 mb-2">
                      You have access to all premium features
                    </p>
                    <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
                      Premium Member
                    </Badge>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-2">
                      Upgrade to Premium to unlock all features
                    </p>
                    <Badge variant="outline" className="text-gray-600">
                      Free Account
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex space-x-2">
                {isPremium ? (
                  <Button 
                    onClick={manageBilling}
                    variant="outline"
                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    Manage Billing
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => createCheckout('monthly')}
                      variant="outline"
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      Monthly ($9.99)
                    </Button>
                    <Button 
                      onClick={() => createCheckout('yearly')}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    >
                      Yearly ($99)
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              No recent activity. Start by completing your profile!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
