
import { Card } from "@/components/ui/card";
import { Heart } from 'lucide-react';

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
        <p className="text-gray-600 mb-4">
          {!currentUserGender 
            ? "Set your gender in your profile to see better matches!" 
            : "Check back later for more people to discover!"
          }
        </p>
      </div>
    </Card>
  );
};
