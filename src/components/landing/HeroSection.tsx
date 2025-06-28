import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, 
  ArrowRight, 
  Play, 
  Star, 
  Users, 
  TrendingUp,
  Shield,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Store
} from "lucide-react";

interface HeroSectionProps {
  user: any;
  onDashboardClick: () => void;
  onAuthClick: () => void;
}

export const HeroSection = ({ user, onDashboardClick, onAuthClick }: HeroSectionProps) => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 px-4 py-2 text-sm font-medium">
                <Zap className="w-3 h-3 mr-2" />
                AI-Powered POS System
              </Badge>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">4.9/5</span>
                <span className="text-gray-500">(2,847 reviews)</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                The Future of
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Retail Technology
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                Transform your business with the most advanced POS system. 
                <span className="font-semibold text-gray-900"> AI-powered insights</span>, 
                <span className="font-semibold text-gray-900"> real-time analytics</span>, and 
                <span className="font-semibold text-gray-900"> seamless operations</span> 
                that scale with your success.
              </p>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>10,000+ businesses trust us</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>₹500M+ monthly transactions</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Button 
                  size="lg" 
                  onClick={onDashboardClick}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg px-8 py-6 h-auto rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <Monitor className="mr-2 h-5 w-5" />
                  Open Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    onClick={onAuthClick}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg px-8 py-6 h-auto rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-6 h-auto rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Bank-grade security</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>99.9% uptime</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Dashboard Mockup */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              {/* Dashboard Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">₹45,230</div>
                    <div className="text-sm text-blue-700">Today's Sales</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">127</div>
                    <div className="text-sm text-green-700">Orders</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">89%</div>
                    <div className="text-sm text-purple-700">Growth</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">Recent Sales</span>
                    <span className="text-sm text-gray-500">View all</span>
                  </div>
                  <div className="space-y-2">
                    {['iPhone 14 Pro', 'MacBook Air', 'AirPods Pro'].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item}</span>
                        <span className="font-medium text-gray-900">₹{['89,999', '1,19,900', '24,999'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-4 shadow-xl">
              <div className="text-white text-center">
                <div className="text-2xl font-bold">₹2.5M</div>
                <div className="text-xs opacity-90">Monthly Revenue</div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-xl border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Mobile Ready</div>
                  <div className="text-xs text-gray-500">iOS & Android</div>
                </div>
              </div>
            </div>

            {/* Device Mockups */}
            <div className="absolute -bottom-8 -right-8 bg-white rounded-xl p-3 shadow-xl border border-gray-200">
              <div className="flex items-center space-x-2">
                <Tablet className="w-6 h-6 text-gray-600" />
                <div className="text-xs">
                  <div className="font-medium text-gray-900">Tablet POS</div>
                  <div className="text-gray-500">Touch optimized</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Active Stores', value: '10,000+', icon: Store },
            { label: 'Monthly Transactions', value: '₹500M+', icon: TrendingUp },
            { label: 'Customer Satisfaction', value: '99.2%', icon: Star },
            { label: 'Countries Served', value: '25+', icon: Globe }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
