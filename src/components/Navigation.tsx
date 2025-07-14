
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Menu, X, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Seraphas
            </span>
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
              Premium
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-pink-600 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-pink-600 transition-colors">Pricing</a>
            <a href="#about" className="text-gray-700 hover:text-pink-600 transition-colors">About</a>
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              Login
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
            >
              Join Now
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <a href="#features" className="text-gray-700 hover:text-pink-600 py-2">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-pink-600 py-2">Pricing</a>
              <a href="#about" className="text-gray-700 hover:text-pink-600 py-2">About</a>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="border-pink-200 text-pink-600 hover:bg-pink-50 w-full mt-2"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 w-full"
              >
                Join Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
