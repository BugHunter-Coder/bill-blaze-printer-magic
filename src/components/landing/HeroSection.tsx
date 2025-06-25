
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  user: any;
  onDashboardClick: () => void;
  onAuthClick: () => void;
}

export const HeroSection = ({ user, onDashboardClick, onAuthClick }: HeroSectionProps) => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto text-center">
        <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Zap className="w-3 h-3 mr-1" />
          Next-Gen POS System
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Revolutionize Your
          <span className="text-blue-600 block">Retail Business</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          BillBlaze is the modern POS solution that helps you manage sales, inventory, 
          and customers with unprecedented ease. Built for the future of retail.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Button 
              size="lg" 
              onClick={onDashboardClick}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              Open Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <>
              <Button 
                size="lg" 
                onClick={onAuthClick}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-3"
              >
                Watch Demo
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
