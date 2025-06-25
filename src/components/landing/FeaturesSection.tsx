
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Store, 
  ShoppingCart, 
  BarChart3, 
  Bluetooth, 
  Users, 
  Smartphone
} from "lucide-react";

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

export const FeaturesSection = () => {
  return (
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
  );
};
