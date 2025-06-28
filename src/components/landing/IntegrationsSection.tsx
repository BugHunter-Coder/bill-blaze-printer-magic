import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Building2, 
  Truck, 
  Calculator, 
  Smartphone, 
  Globe,
  Zap,
  Shield,
  ArrowRight
} from "lucide-react";

const integrations = [
  {
    category: "Payment Gateways",
    items: [
      { name: "Razorpay", icon: "💳", description: "Seamless UPI & card payments" },
      { name: "Paytm", icon: "📱", description: "Digital wallet integration" },
      { name: "PhonePe", icon: "📲", description: "UPI payment processing" },
      { name: "Stripe", icon: "💳", description: "International payments" }
    ]
  },
  {
    category: "Accounting & ERP",
    items: [
      { name: "Tally", icon: "📊", description: "Automated accounting sync" },
      { name: "QuickBooks", icon: "📈", description: "Real-time financial data" },
      { name: "Zoho Books", icon: "📋", description: "Cloud accounting integration" },
      { name: "SAP", icon: "🏢", description: "Enterprise resource planning" }
    ]
  },
  {
    category: "E-commerce",
    items: [
      { name: "Shopify", icon: "🛒", description: "Online store sync" },
      { name: "WooCommerce", icon: "🛍️", description: "WordPress integration" },
      { name: "Magento", icon: "🛒", description: "Enterprise e-commerce" },
      { name: "Amazon", icon: "📦", description: "Marketplace integration" }
    ]
  },
  {
    category: "Logistics & Shipping",
    items: [
      { name: "Delhivery", icon: "🚚", description: "Automated shipping labels" },
      { name: "Blue Dart", icon: "📦", description: "Express delivery tracking" },
      { name: "DTDC", icon: "🚛", description: "Courier service integration" },
      { name: "Shiprocket", icon: "🚀", description: "Multi-courier platform" }
    ]
  }
];

const features = [
  {
    icon: Zap,
    title: "One-Click Setup",
    description: "Connect your favorite tools in seconds with our automated setup process."
  },
  {
    icon: Shield,
    title: "Secure Sync",
    description: "Bank-level encryption ensures your data stays safe during integration."
  },
  {
    icon: Globe,
    title: "Real-time Updates",
    description: "All your data stays synchronized across platforms in real-time."
  },
  {
    icon: Smartphone,
    title: "Mobile Access",
    description: "Manage all integrations from your mobile device anywhere, anytime."
  }
];

export const IntegrationsSection = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-800 border-0">
            Integrations
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Connect Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            BillBlaze integrates seamlessly with your existing tools and platforms. 
            No more manual data entry or switching between systems.
          </p>
        </div>

        {/* Integration Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {integrations.map((category, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 mb-4">
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="text-2xl">{item.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Connect Your Business?
              </h3>
              <p className="text-blue-100 mb-6">
                Join thousands of businesses that have streamlined their operations 
                with BillBlaze integrations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
                  View All Integrations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  Contact Sales
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}; 