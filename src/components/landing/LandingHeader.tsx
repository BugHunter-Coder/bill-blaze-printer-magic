
import { Button } from "@/components/ui/button";
import { Store, ArrowRight } from "lucide-react";

interface LandingHeaderProps {
  user: any;
  onDashboardClick: () => void;
  onAuthClick: () => void;
}

export const LandingHeader = ({ user, onDashboardClick, onAuthClick }: LandingHeaderProps) => {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">BillBlaze</span>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Button onClick={onDashboardClick} className="bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onAuthClick} className="bg-blue-600 hover:bg-blue-700">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
