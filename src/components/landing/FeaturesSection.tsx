import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  ShoppingCart, 
  BarChart3, 
  Bluetooth, 
  Users, 
  Smartphone,
  Zap,
  Shield,
  Globe,
  Brain,
  TrendingUp,
  Clock,
  Database,
  Smartphone as Mobile,
  Tablet,
  Monitor,
  Cloud,
  Lock,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Multi-Shop Management",
    description: "Manage multiple store locations from a single dashboard with centralized control and real-time synchronization.",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    details: [
      "Centralized inventory management",
      "Cross-store reporting",
      "Unified customer database",
      "Role-based access control"
    ]
  },
  {
    icon: ShoppingCart,
    title: "AI-Powered POS System",
    description: "Lightning-fast checkout with intelligent product suggestions, barcode scanning, and automated inventory tracking.",
    color: "bg-gradient-to-br from-green-500 to-green-600",
    details: [
      "2-second transaction processing",
      "Smart product recommendations",
      "Automatic stock updates",
      "Multi-payment support"
    ]
  },
  {
    icon: Brain,
    title: "Advanced Analytics",
    description: "AI-driven insights and predictive analytics to optimize your business performance and drive growth.",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    details: [
      "Predictive inventory management",
      "Sales trend analysis",
      "Customer behavior insights",
      "Performance forecasting"
    ]
  },
  {
    icon: Bluetooth,
    title: "Wireless Printing",
    description: "Seamless Bluetooth printer integration for instant receipt printing and label generation.",
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    details: [
      "Auto-connect to printers",
      "Custom receipt templates",
      "Barcode label printing",
      "Multi-format support"
    ]
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with end-to-end encryption, PCI DSS compliance, and advanced fraud protection.",
    color: "bg-gradient-to-br from-red-500 to-red-600",
    details: [
      "256-bit encryption",
      "PCI DSS compliance",
      "Fraud detection system",
      "Regular security audits"
    ]
  },
  {
    icon: Globe,
    title: "Cloud-Based Platform",
    description: "Access your business data from anywhere with our reliable cloud infrastructure and automatic backups.",
    color: "bg-gradient-to-br from-cyan-500 to-cyan-600",
    details: [
      "99.9% uptime guarantee",
      "Automatic data backup",
      "Real-time synchronization",
      "Global CDN access"
    ]
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Comprehensive role-based access control with detailed permissions and activity monitoring.",
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
    details: [
      "Granular permissions",
      "Activity tracking",
      "Shift management",
      "Performance metrics"
    ]
  },
  {
    icon: Mobile,
    title: "Mobile-First Design",
    description: "Optimized for all devices with responsive design, touch-friendly interface, and offline capabilities.",
    color: "bg-gradient-to-br from-pink-500 to-pink-600",
    details: [
      "iOS & Android apps",
      "Offline functionality",
      "Touch-optimized UI",
      "Cross-device sync"
    ]
  }
];

const highlights = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process transactions in under 2 seconds"
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Access your business data anytime, anywhere"
  },
  {
    icon: Database,
    title: "Real-time Sync",
    description: "All data synchronized across devices instantly"
  },
  {
    icon: TrendingUp,
    title: "Scalable Growth",
    description: "Grow from 1 to 100+ stores seamlessly"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 px-4 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-800 border-0">
            Features
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to streamline your operations, boost your profits, 
            and scale your business to new heights.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white hover:scale-105"
            >
              <CardHeader className="pb-4">
                <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Highlights Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-12 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose BillBlaze?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built for modern businesses with cutting-edge technology and proven reliability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((highlight, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <highlight.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{highlight.title}</h4>
                <p className="text-gray-600">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Device Support */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">
            Works on Every Device
          </h3>
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2 text-gray-600">
              <Monitor className="w-6 h-6" />
              <span className="font-medium">Desktop</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Tablet className="w-6 h-6" />
              <span className="font-medium">Tablet</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Smartphone className="w-6 h-6" />
              <span className="font-medium">Mobile</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Experience the Future of POS?
              </h3>
              <p className="text-blue-100 mb-6">
                Join thousands of businesses that have transformed their operations with BillBlaze.
              </p>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center mx-auto">
                Explore All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
