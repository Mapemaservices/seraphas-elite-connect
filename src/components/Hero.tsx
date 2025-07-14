
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Shield, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 mb-6">
            <Heart className="w-4 h-4 mr-2" />
            Premium Dating Experience
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent block">
              Soulmate
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join Seraphas, the exclusive dating platform where meaningful connections happen. 
            Experience premium features including live streaming, advanced matching, and secure messaging.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 px-8 py-4 text-lg"
            >
              Start Your Journey
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-pink-200 text-pink-600 hover:bg-pink-50 px-8 py-4 text-lg"
            >
              I Have an Account
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Shield className="w-5 h-5 text-pink-500" />
              <span>Verified Profiles</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Users className="w-5 h-5 text-purple-500" />
              <span>Gender-Based Matching</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Star className="w-5 h-5 text-pink-500" />
              <span>Premium Features</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
        <Heart className="w-96 h-96 text-pink-500" />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 opacity-10">
        <Heart className="w-64 h-64 text-purple-500" />
      </div>
    </div>
  );
};

export default Hero;
