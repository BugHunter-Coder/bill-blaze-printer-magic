
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Coffee, Utensils, Cookie, Soup } from 'lucide-react';
import { Product, Category } from '@/types/pos';

const categories: Category[] = [
  { id: 'all', name: 'All', icon: 'Grid' },
  { id: 'beverages', name: 'Beverages', icon: 'Coffee' },
  { id: 'food', name: 'Food', icon: 'Utensils' },
  { id: 'snacks', name: 'Snacks', icon: 'Cookie' },
  { id: 'soups', name: 'Soups', icon: 'Soup' },
];

const products: Product[] = [
  { id: '1', name: 'Espresso', price: 3.50, category: 'beverages', inStock: true },
  { id: '2', name: 'Cappuccino', price: 4.25, category: 'beverages', inStock: true },
  { id: '3', name: 'Latte', price: 4.75, category: 'beverages', inStock: true },
  { id: '4', name: 'Americano', price: 3.25, category: 'beverages', inStock: true },
  { id: '5', name: 'Croissant', price: 2.95, category: 'food', inStock: true },
  { id: '6', name: 'Bagel with Cream Cheese', price: 3.75, category: 'food', inStock: true },
  { id: '7', name: 'Avocado Toast', price: 7.95, category: 'food', inStock: true },
  { id: '8', name: 'Blueberry Muffin', price: 2.50, category: 'snacks', inStock: true },
  { id: '9', name: 'Chocolate Chip Cookie', price: 1.95, category: 'snacks', inStock: true },
  { id: '10', name: 'Tomato Soup', price: 5.95, category: 'soups', inStock: true },
  { id: '11', name: 'Chicken Noodle Soup', price: 6.95, category: 'soups', inStock: true },
  { id: '12', name: 'Green Tea', price: 2.75, category: 'beverages', inStock: true },
];

interface ProductCatalogProps {
  onAddToCart: (product: Product) => void;
}

export const ProductCatalog = ({ onAddToCart }: ProductCatalogProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const getCategoryIcon = (iconName: string) => {
    const icons = {
      Coffee: Coffee,
      Utensils: Utensils,
      Cookie: Cookie,
      Soup: Soup,
    };
    const IconComponent = icons[iconName as keyof typeof icons] || Coffee;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Products</h2>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center space-x-2"
              size="sm"
            >
              {category.id !== 'all' && getCategoryIcon(category.icon)}
              <span>{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card 
            key={product.id} 
            className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
          >
            <CardContent className="p-4">
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                <div className="text-4xl">
                  {product.category === 'beverages' && '☕'}
                  {product.category === 'food' && '🥪'}
                  {product.category === 'snacks' && '🍪'}
                  {product.category === 'soups' && '🍲'}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">
                    ${product.price.toFixed(2)}
                  </span>
                  
                  {product.inStock ? (
                    <Badge variant="secondary" className="text-green-600 bg-green-50">
                      In Stock
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-red-600 bg-red-50">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                
                <Button 
                  onClick={() => onAddToCart(product)}
                  disabled={!product.inStock}
                  className="w-full group-hover:bg-blue-600 transition-colors"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found in this category.</p>
        </div>
      )}
    </div>
  );
};
