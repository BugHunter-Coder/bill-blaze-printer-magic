import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Shield, Users, Globe } from "lucide-react";

interface PricingSectionProps {
  onAuthClick: () => void;
}

const plans = [
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    description: "Perfect for small businesses getting started",
    features: [
      "Up to 2 stores",
      "Basic POS features",
      "Mobile app access",
      "Email support",
      "Basic reporting",
      "UPI & card payments"
    ],
    popular: false,
    color: "from-gray-500 to-gray-600"
  },
  {
    name: "Professional",
    price: "₹2,499",
    period: "/month",
    description: "Ideal for growing businesses with multiple locations",
    features: [
      "Up to 10 stores",
      "Advanced analytics",
      "Multi-user access",
      "Priority support",
      "Inventory management",
      "Bluetooth printing",
      "Customer loyalty",
      "Advanced reporting"
    ],
    popular: true,
    color: "from-blue-500 to-indigo-600"
  },
  {
    name: "Enterprise",
    price: "₹4,999",
    period: "/month",
    description: "For large businesses with complex requirements",
    features: [
      "Unlimited stores",
      "AI-powered insights",
      "Custom integrations",
      "24/7 phone support",
      "Advanced security",
      "White-label options",
      "API access",
      "Dedicated account manager"
    ],
    popular: false,
    color: "from-purple-500 to-purple-600"
  }
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process transactions in under 2 seconds"
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "256-bit encryption and PCI DSS compliance"
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Role-based access for your entire team"
  },
  {
    icon: Globe,
    title: "Cloud-Based",
    description: "Access from anywhere, anytime"
  }
];

export const PricingSection = ({ onAuthClick }: PricingSectionProps) => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 border-0">
            Pricing
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business. All plans include our core features 
            with no hidden fees or setup costs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-2">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </CardTitle>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full mt-6 bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all duration-200`}
                  onClick={onAuthClick}
                >
                  {plan.popular ? 'Start Free Trial' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
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

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
                <p className="text-gray-600">Yes! All plans come with a 14-day free trial. No credit card required.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h4>
                <p className="text-gray-600">Absolutely! You can upgrade or downgrade your plan at any time.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-600">We accept all major credit cards, UPI, and bank transfers for annual plans.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is there a setup fee?</h4>
                <p className="text-gray-600">No setup fees! Get started immediately with our instant setup process.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Transform Your Business?
              </h3>
              <p className="text-blue-100 mb-6">
                Join 10,000+ businesses that trust BillBlaze for their POS needs. 
                Start your free trial today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={onAuthClick}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3"
                >
                  Start Free Trial
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3"
                >
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}; 