import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package } from 'lucide-react';
import { DatabaseProduct, Product } from '@/types/pos';

interface ProductCatalogProps {
  onAddToCart: (product: Product) => void;
  onAddProduct?: () => void;
}

export const ProductCatalog = ({ onAddToCart, onAddProduct }: ProductCatalogProps) => {
  const { profile } = useAuth();
  const { selectedShopId } = useShop();
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedShopId) {
      fetchProducts();
    }
  }, [selectedShopId]);

  const fetchProducts = async () => {
    if (!selectedShopId) return;
    
    try {
      setLoading(true);
      console.log('Fetching products for shop:', selectedShopId);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', selectedShopId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      console.log('Fetched products:', data?.length, 'products for shop:', selectedShopId);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Additional filter to ensure only products from the selected shop are shown
  const shopFilteredProducts = products.filter(product => product.shop_id === selectedShopId);
  
  const filteredProducts = shopFilteredProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const convertToProduct = (dbProduct: DatabaseProduct): Product => ({
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price,
    category: 'General', // You can join with categories table later
    image: dbProduct.image_url,
    description: dbProduct.description,
    inStock: dbProduct.stock_quantity > 0,
    stock_quantity: dbProduct.stock_quantity,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          {onAddProduct && (
            <Button onClick={onAddProduct} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search terms.' : 'Add products to get started.'}
          </p>
          {onAddProduct && !searchTerm && (
            <Button onClick={onAddProduct} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                
                {product.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{product.price.toFixed(2)}
                  </p>
                  <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                    Stock: {product.stock_quantity}
                  </Badge>
                </div>
                
                <Button
                  onClick={() => onAddToCart(convertToProduct(product))}
                  className="w-full"
                  size="sm"
                  disabled={product.stock_quantity === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
