
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { SystemHealthCheck } from "@/components/debug/SystemHealthCheck";

const Dashboard = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [showHealthCheck, setShowHealthCheck] = useState(false);
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Welcome to Seraphas
        </h1>
        <p className="text-lg text-gray-600">
          Start your journey to find meaningful connections
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActionCard />

      {/* Subscription Status */}
      <SubscriptionCard
        isPremium={isPremium}
        onCreateCheckout={createCheckout}
        onManageBilling={manageBilling}
      />

      {/* System Health Check */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Status</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHealthCheck(!showHealthCheck)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showHealthCheck ? 'Hide' : 'Show'} Health Check
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showHealthCheck ? (
            <SystemHealthCheck />
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-gray-600 mb-2">System Status Check</p>
              <p className="text-sm text-gray-500">Click "Show Health Check" to verify all systems are working</p>
            </div>
          )}
        </CardContent>
      </Card>

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
            <p className="text-sm text-gray-500">Start by completing your profile and discovering new people!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
