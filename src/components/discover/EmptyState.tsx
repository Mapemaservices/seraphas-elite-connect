
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  currentUserGender: string | null;
}

export const EmptyState = ({ currentUserGender }: EmptyStateProps) => {
  return (
    <Card className="text-center p-6 sm:p-8 shadow-xl">
      <div className="mb-6">
        <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-pink-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No more profiles</h2>
        <p className="text-gray-600 mb-6">
          {!currentUserGender 
            ? "Set your gender in your profile to see better matches!" 
            : "Check back later for more people to discover!"
          }
        </p>
        
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh profiles
          </Button>
          
          {!currentUserGender && (
            <Button 
              className="w-full"
              onClick={() => window.location.href = '/profile'}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Complete profile
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
