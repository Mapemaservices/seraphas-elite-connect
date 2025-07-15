import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, LogOut, User as UserIcon, MessageCircle, Video } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
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

  const quickActions = [
    {
      title: "My Profile",
      description: "Complete your profile to attract better matches",
      icon: UserIcon,
      onClick: () => navigate('/profile')
    },
    {
      title: "Discover",
      description: "Browse profiles and find your perfect match",
      icon: Heart,
      onClick: () => navigate('/discover')
    },
    {
      title: "Messages",
      description: "Chat with your matches and start conversations",
      icon: MessageCircle,
      onClick: () => navigate('/messages')
    },
    {
      title: "Live Streams",
      description: "Watch live streams from premium members",
      icon: Video,
      onClick: () => navigate('/live-streams')
    }
  ];

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
      {/* Header - Responsive */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-pink-100 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Seraphas
            </span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Welcome, {user?.user_metadata?.first_name || user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-pink-200 text-pink-600 hover:bg-pink-50 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content - Responsive Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome to your Dashboard
          </h1>
          <p className="text-gray-600">
            Start your journey to find meaningful connections
          </p>
        </div>

        {/* Quick Actions - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
            />
          ))}
        </div>

        {/* Subscription Status */}
        <SubscriptionCard
          isPremium={isPremium}
          onCreateCheckout={createCheckout}
          onManageBilling={manageBilling}
        />

        {/* Recent Activity */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-500" />
              </div>
              <p className="text-gray-600 mb-2">No recent activity</p>
              <p className="text-sm text-gray-500">Start by completing your profile!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
