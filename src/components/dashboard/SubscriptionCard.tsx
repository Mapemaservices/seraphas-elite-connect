
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Crown } from "lucide-react";

interface SubscriptionCardProps {
  isPremium: boolean;
  onCreateCheckout: (type: 'monthly' | 'yearly') => void;
  onManageBilling: () => void;
}

export const SubscriptionCard = ({ isPremium, onCreateCheckout, onManageBilling }: SubscriptionCardProps) => {
  return (
    <Card className="mb-8 border-gradient-to-r from-pink-200 to-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2 text-pink-500" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            {isPremium ? (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  You have access to all premium features
                </p>
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 animate-pulse">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium Member
                </Badge>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Upgrade to Premium to unlock all features
                </p>
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                  Free Account
                </Badge>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isPremium ? (
              <Button 
                onClick={onManageBilling}
                variant="outline"
                className="border-pink-200 text-pink-600 hover:bg-pink-50 transition-all duration-200"
              >
                Manage Billing
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => onCreateCheckout('monthly')}
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 transition-all duration-200"
                >
                  Monthly ($9.99)
                </Button>
                <Button 
                  onClick={() => onCreateCheckout('yearly')}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transition-all duration-200 transform hover:scale-105"
                >
                  Yearly ($99) - Save 17%
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
