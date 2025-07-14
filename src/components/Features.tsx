
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Video, MessageCircle, Shield, Users, Crown, Star, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8 text-pink-500" />,
      title: "Smart Gender Matching",
      description: "Our advanced algorithm ensures you only see compatible matches based on your preferences and gender settings.",
      badge: "Core Feature"
    },
    {
      icon: <Video className="w-8 h-8 text-purple-500" />,
      title: "Live Streaming",
      description: "Watch exclusive live streams from verified female members or go live yourself to connect with potential matches.",
      badge: "Premium"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      title: "Secure Messaging",
      description: "Send and receive messages with end-to-end encryption. See when someone is online and get instant notifications.",
      badge: "Premium"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Verified Profiles",
      description: "Every profile is manually verified to ensure authenticity and create a safe dating environment.",
      badge: "Security"
    },
    {
      icon: <Crown className="w-8 h-8 text-yellow-500" />,
      title: "Premium Membership",
      description: "Unlock all features with our affordable monthly subscription. Cancel anytime with full control.",
      badge: "Subscription"
    },
    {
      icon: <Star className="w-8 h-8 text-indigo-500" />,
      title: "Advanced Filters",
      description: "Filter by age, location, interests, and more to find exactly what you're looking for.",
      badge: "Premium"
    }
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 mb-4">
            <Zap className="w-4 h-4 mr-2" />
            Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Premium Dating Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover why Seraphas is the premium choice for serious daters looking for meaningful connections.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {feature.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
