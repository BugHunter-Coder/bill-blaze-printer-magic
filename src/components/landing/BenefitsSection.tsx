
import { CheckCircle } from "lucide-react";

const benefits = [
  "Real-time inventory tracking",
  "Multiple payment methods",
  "Cloud-based data storage",
  "24/7 customer support",
  "Easy setup & training",
  "Secure & reliable"
];

export const BenefitsSection = () => {
  return (
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
  );
};
