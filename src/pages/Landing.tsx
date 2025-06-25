
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  ShoppingCart, 
  BarChart3, 
  Bluetooth, 
  Users, 
  Settings,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Smartphone
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Store,
      title: "Multi-Shop Management",
      description: "Manage multiple store locations from a single dashboard with ease.",
      color: "bg-blue-500"
    },
    {
      icon: ShoppingCart,
      title: "Smart POS System",
      description: "Lightning-fast checkout with barcode scanning and inventory tracking.",
      color: "bg-green-500"
    },
    {
      icon: Bluetooth,
      title: "Wireless Printing",
      description: "Connect to Bluetooth printers for instant receipt printing.",
      color: "bg-purple-500"
    },
    {
      icon: BarChart3,
      title: "Sales Analytics",
      description: "Real-time sales reports and business insights at your fingertips.",
      color: "bg-orange-500"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Role-based access control for staff and administrators.",
      color: "bg-indigo-500"
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Works perfectly on tablets, phones, and desktop computers.",
      color: "bg-pink-500"
    }
  ];

  const benefits = [
    "Real-time inventory tracking",
    "Multiple payment methods",
    "Cloud-based data storage",
    "24/7 customer support",
    "Easy setup & training",
    "Secure & reliable"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
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
              <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')} className="bg-blue-600 hover:bg-blue-700">
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
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
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Open Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
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

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to streamline your operations and boost your profits.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why Choose BillBlaze?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of retailers who trust BillBlaze to power their business operations.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-blue-100">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">Total Sales Today</span>
                    <span className="text-2xl font-bold">₹45,230</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">Orders Processed</span>
                    <span className="text-2xl font-bold">127</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">Active Products</span>
                    <span className="text-2xl font-bold">1,247</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full mt-6">
                    <div className="h-2 bg-green-400 rounded-full w-3/4"></div>
                  </div>
                  <span className="text-sm text-blue-200">75% of daily target achieved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Access Your Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
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

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">BillBlaze</span>
          </div>
          <p className="text-gray-500">
            © 2024 BillBlaze. All rights reserved. Built with ❤️ for retailers everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
