
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export const QuickActionCard = ({ title, description, icon: Icon, onClick }: QuickActionCardProps) => {
  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-pink-100 hover:border-pink-200"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Icon className="w-5 h-5 mr-2 text-pink-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
