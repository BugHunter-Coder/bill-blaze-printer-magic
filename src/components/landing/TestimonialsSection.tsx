import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, TechMart Electronics",
    company: "TechMart",
    avatar: "RK",
    rating: 5,
    content: "BillBlaze transformed our business completely. The AI insights helped us increase sales by 40% in just 3 months. The mobile POS is a game-changer for our staff.",
    location: "Mumbai, India",
    revenue: "₹2.5M monthly"
  },
  {
    name: "Priya Sharma",
    role: "CEO, Fashion Forward",
    company: "Fashion Forward",
    avatar: "PS",
    rating: 5,
    content: "The multi-shop management feature is incredible. We can now manage all 8 of our stores from one dashboard. The inventory tracking is spot-on.",
    location: "Delhi, India",
    revenue: "₹8.2M monthly"
  },
  {
    name: "Amit Patel",
    role: "Founder, Fresh Groceries",
    company: "Fresh Groceries",
    avatar: "AP",
    rating: 5,
    content: "Customer support is outstanding. The Bluetooth printer integration works flawlessly. Our checkout time reduced from 3 minutes to 45 seconds.",
    location: "Bangalore, India",
    revenue: "₹1.8M monthly"
  },
  {
    name: "Sneha Reddy",
    role: "Manager, Beauty Haven",
    company: "Beauty Haven",
    avatar: "SR",
    rating: 5,
    content: "The analytics dashboard gives us insights we never had before. We can track which products sell best and optimize our inventory accordingly.",
    location: "Hyderabad, India",
    revenue: "₹3.1M monthly"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-green-100 text-green-800 border-0">
            Customer Success
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Trusted by 10,000+ Businesses
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how BillBlaze is helping businesses across India transform their operations 
            and achieve remarkable growth.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <div className="mb-6">
                  <Quote className="w-8 h-8 text-blue-200 mb-2" />
                  <p className="text-gray-700 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>

                {/* Customer Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.location}</div>
                  </div>
                </div>

                {/* Revenue Badge */}
                <div className="mt-4">
                  <Badge variant="outline" className="text-xs">
                    {testimonial.revenue}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">40%</div>
            <div className="text-gray-600">Average Sales Increase</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">2.5x</div>
            <div className="text-gray-600">Faster Checkout</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
            <div className="text-gray-600">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  );
}; 