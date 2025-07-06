import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  TrendingUp, 
  Package, 
  Star, 
  Clock,
  Zap,
  ShoppingCart,
  Eye
} from 'lucide-react';
import { Product, CartItem } from '@/types/pos';

interface AIProductRecommendationsProps {
  currentCart: CartItem[];
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
  shopId?: string;
}

interface Recommendation {
  product: Product;
  reason: string;
  confidence: number;
  type: 'frequently_bought' | 'trending' | 'category' | 'price_range' | 'seasonal';
}

export function AIProductRecommendations({
  currentCart,
  allProducts,
  onAddToCart,
  shopId
}: AIProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // AI-powered recommendation algorithm
  const generateRecommendations = () => {
    setIsLoading(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const newRecommendations: Recommendation[] = [];
      
      // Get current cart categories
      const cartCategories = currentCart.map(item => item.category).filter(Boolean);
      const cartPriceRange = currentCart.reduce((sum, item) => sum + item.price, 0);
      
      // Filter out products already in cart
      const availableProducts = allProducts.filter(product => 
        !currentCart.some(cartItem => cartItem.id === product.id)
      );

      // 1. Category-based recommendations
      if (cartCategories.length > 0) {
        const categoryProducts = availableProducts.filter(product => 
          cartCategories.includes(product.category)
        );
        categoryProducts.slice(0, 3).forEach(product => {
          newRecommendations.push({
            product,
            reason: `Similar to items in your cart`,
            confidence: 0.85,
            type: 'category',
          });
        });
      }

      // 2. Price range recommendations
      const priceRangeProducts = availableProducts.filter(product => 
        product.price >= cartPriceRange * 0.5 && product.price <= cartPriceRange * 1.5
      );
      priceRangeProducts.slice(0, 2).forEach(product => {
        newRecommendations.push({
          product,
          reason: `Matches your budget range`,
          confidence: 0.75,
          type: 'price_range',
        });
      });

      // 3. Trending products (simulated)
      const trendingProducts = availableProducts
        .sort(() => Math.random() - 0.5) // Simulate trending
        .slice(0, 2);
      trendingProducts.forEach(product => {
        newRecommendations.push({
          product,
          reason: `Trending now`,
          confidence: 0.8,
          type: 'trending',
        });
      });

      // 4. Frequently bought together (simulated)
      if (currentCart.length > 0) {
        const frequentlyBought = availableProducts
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        frequentlyBought.forEach(product => {
          newRecommendations.push({
            product,
            reason: `Frequently bought together`,
            confidence: 0.9,
            type: 'frequently_bought',
          });
        });
      }

      // Sort by confidence and remove duplicates
      const uniqueRecommendations = newRecommendations
        .filter((rec, index, self) => 
          index === self.findIndex(r => r.product.id === rec.product.id)
        )
        .sort((a, b) => b.confidence - a.confidence);

      setRecommendations(uniqueRecommendations);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (currentCart.length > 0 && allProducts.length > 0) {
      generateRecommendations();
    }
  }, [currentCart, allProducts]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'frequently_bought':
        return <ShoppingCart className="h-3 w-3" />;
      case 'trending':
        return <TrendingUp className="h-3 w-3" />;
      case 'category':
        return <Package className="h-3 w-3" />;
      case 'price_range':
        return <Star className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'frequently_bought':
        return 'bg-green-100 text-green-600';
      case 'trending':
        return 'bg-orange-100 text-orange-600';
      case 'category':
        return 'bg-blue-100 text-blue-600';
      case 'price_range':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (currentCart.length === 0) {
    return null;
  }

  const displayRecommendations = showAll ? recommendations : recommendations.slice(0, 4);

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI Recommendations
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
            <Zap className="h-2 w-2 mr-1" />
            Smart
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600">Analyzing your cart...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {displayRecommendations.map((rec) => (
                <Button
                  key={rec.product.id}
                  onClick={() => onAddToCart(rec.product)}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-start space-y-2 bg-white hover:bg-purple-50 border-purple-200"
                >
                  <div className="flex items-center justify-between w-full">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getRecommendationColor(rec.type)}`}
                    >
                      {getRecommendationIcon(rec.type)}
                      <span className="ml-1">{rec.type.replace('_', ' ')}</span>
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {Math.round(rec.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="text-left w-full">
                    <div className="font-medium text-xs truncate">
                      {rec.product.name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      ₹{rec.product.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {rec.reason}
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            {recommendations.length > 4 && (
              <Button
                onClick={() => setShowAll(!showAll)}
                variant="ghost"
                size="sm"
                className="w-full text-purple-600 hover:text-purple-700"
              >
                {showAll ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Show More ({recommendations.length - 4} more)
                  </>
                )}
              </Button>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Recommendations update in real-time based on your cart</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 