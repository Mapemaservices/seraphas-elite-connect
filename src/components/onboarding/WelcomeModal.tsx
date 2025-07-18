
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, User, Search, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Heart,
      title: "Welcome to Seraphas!",
      description: "Find meaningful connections with people who share your interests and values.",
      action: "Get Started"
    },
    {
      icon: User,
      title: "Complete Your Profile",
      description: "Add photos, interests, and personal details to help others discover you.",
      action: "Go to Profile"
    },
    {
      icon: Search,
      title: "Start Discovering",
      description: "Browse through profiles and like people you're interested in meeting.",
      action: "Start Discovering"
    },
    {
      icon: MessageCircle,
      title: "Connect & Chat",
      description: "When you match with someone, start a conversation and get to know each other.",
      action: "Finish"
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      navigate('/profile');
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Icon className="w-8 h-8 text-white" />
              </div>
            </div>
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          <p className="text-gray-600">
            {currentStepData.description}
          </p>

          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-pink-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              {currentStepData.action}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
