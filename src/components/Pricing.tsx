
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Heart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from "@/contexts/SubscriptionContext";

const Pricing = () => {
  const navigate = useNavigate();
  const { createCheckout, isPremium } = useSubscription();

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 mb-4">
            <Crown className="w-4 h-4 mr-2" />
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of successful matches with our premium membership. Cancel anytime.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="border-gray-200 relative">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
                <Heart className="w-6 h-6 text-gray-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Free</CardTitle>
              <CardDescription className="text-gray-600">
                Get started with basic features
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Create profile</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Browse profiles (limited)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Basic matching</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Receive messages from Premium users</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => navigate('/signup')}
              >
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plans */}
          <div className="space-y-4">
            {/* Monthly Plan */}
            <Card className="border-pink-200 relative bg-gradient-to-br from-pink-50 to-purple-50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-fit">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Premium Monthly</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">$9.99</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Unlimited messaging</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Watch live streams</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Advanced filters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Priority support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Go live (females only)</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                  onClick={() => createCheckout('monthly')}
                  disabled={isPremium}
                >
                  {isPremium ? 'Already Premium' : 'Choose Monthly'}
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="border-pink-200 relative bg-gradient-to-br from-pink-50 to-purple-50">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Best Value
                </Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-6">
                <CardTitle className="text-xl font-bold text-gray-900">Premium Yearly</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">$99</span>
                  <span className="text-gray-600">/year</span>
                </div>
                <p className="text-sm text-green-600 font-medium">Save $20.88 per year!</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Everything in Monthly</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">2 months free</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                  onClick={() => createCheckout('yearly')}
                  disabled={isPremium}
                >
                  {isPremium ? 'Already Premium' : 'Choose Yearly'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include a 7-day free trial. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
