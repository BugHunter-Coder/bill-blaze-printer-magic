import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Lightbulb, TrendingUp, Package, Loader2 } from 'lucide-react';

interface AIInventoryAssistantProps {
  shopData: any;
  products: any[];
  transactions: any[];
}

export const AIInventoryAssistant = ({ shopData, products, transactions }: AIInventoryAssistantProps) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  const callAIFunction = async (action: string, data: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('ai-inventory-assistant', {
        body: { action, data }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('AI function error:', error);
      throw error;
    }
  };

  const generateProductSuggestions = async () => {
    setLoading(true);
    try {
      const businessData = {
        shopName: shopData.name,
        category: shopData.category || 'General',
        currentProducts: products.map(p => ({ name: p.name, category: p.category })),
        location: shopData.address
      };

      const response = await callAIFunction('suggest_products', businessData);
      
      if (response.success) {
        try {
          const parsedSuggestions = JSON.parse(response.result);
          setSuggestions(parsedSuggestions);
          toast({
            title: "AI Suggestions Generated",
            description: "Smart product recommendations are ready!",
          });
        } catch (e) {
          setSuggestions({ rawText: response.result });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please check AI configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSalesAnalytics = async () => {
    setLoading(true);
    try {
      const salesData = {
        transactions: transactions.slice(0, 50), // Last 50 transactions
        products: products,
        timeframe: '30_days',
        shopType: shopData.category || 'General'
      };

      const response = await callAIFunction('sales_analytics', salesData);
      
      if (response.success) {
        setAnalytics(response.result);
        toast({
          title: "Sales Analytics Generated",
          description: "AI-powered insights are ready to help grow your business!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate analytics. Please check AI configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const optimizeInventory = async () => {
    setLoading(true);
    try {
      const inventoryData = {
        products: products.map(p => ({
          name: p.name,
          currentStock: p.stock_quantity,
          minLevel: p.min_stock_level,
          price: p.price,
          lastSold: 'recent' // You could calculate this from transactions
        })),
        salesTrend: 'growing', // You could calculate this from transactions
        seasonality: 'normal'
      };

      const response = await callAIFunction('optimize_inventory', inventoryData);
      
      if (response.success) {
        toast({
          title: "Inventory Optimization Complete",
          description: "AI recommendations for stock optimization are ready!",
        });
        // You could display optimization results in a modal or separate component
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize inventory. Please check AI configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            AI Inventory Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={generateProductSuggestions}
              disabled={loading}
              className="flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2" />}
              Product Suggestions
            </Button>

            <Button 
              onClick={generateSalesAnalytics}
              disabled={loading}
              variant="outline"
              className="flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              Sales Analytics
            </Button>

            <Button 
              onClick={optimizeInventory}
              disabled={loading}
              variant="outline"
              className="flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Package className="h-4 w-4 mr-2" />}
              Optimize Inventory
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestions && (
        <Card>
          <CardHeader>
            <CardTitle>AI Product Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(suggestions) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.slice(0, 6).map((product: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{product.category}</Badge>
                      <span className="font-bold text-green-600">₹{product.estimated_price}</span>
                    </div>
                    {product.reasoning && (
                      <p className="text-xs text-gray-500 mt-2">{product.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm">{suggestions.rawText}</div>
            )}
          </CardContent>
        </Card>
      )}

      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>AI Sales Analytics & Growth Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {analytics}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
