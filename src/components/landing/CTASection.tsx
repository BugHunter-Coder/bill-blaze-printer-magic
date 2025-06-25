
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

interface CTASectionProps {
  user: any;
  onDashboardClick: () => void;
  onAuthClick: () => void;
}

export const CTASection = ({ user, onDashboardClick, onAuthClick }: CTASectionProps) => {
  return (
    <section className="py-20 px-4 bg-gray-900 text-white">
      <div className="container mx-auto text-center">
        <Shield className="h-16 w-16 text-blue-400 mx-auto mb-6" />
        <h2 className="text-4xl font-bold mb-6">
          Ready to Transform Your Business?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join the retail revolution. Start your free trial today and see the difference BillBlaze can make.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Button 
              size="lg" 
              onClick={onDashboardClick}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              Access Your Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <>
              <Button 
                size="lg" 
                onClick={onAuthClick}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-3 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Contact Sales
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
