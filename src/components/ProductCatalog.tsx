import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Package, Settings } from 'lucide-react';
import { DatabaseProduct, Product, ProductVariant } from '@/types/pos';
import { useNavigate } from 'react-router-dom';

interface ProductCatalogProps {
  onAddToCart: (product: Product) => void;
  onAddProduct?: () => void;
}

export const ProductCatalog = ({ onAddToCart, onAddProduct }: ProductCatalogProps) => {
  const { profile } = useAuth();
  const { selectedShopId } = useShop();
  const navigate = useNavigate();
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DatabaseProduct | null>(null);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

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

  const fetchProductVariants = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setProductVariants(data || []);
    } catch (error) {
      console.error('Error fetching product variants:', error);
    }
  };

  // Additional filter to ensure only products from the selected shop are shown
  const shopFilteredProducts = products.filter(product => product.shop_id === selectedShopId);
  
  const filteredProducts = shopFilteredProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const convertToProduct = (dbProduct: DatabaseProduct, variant?: ProductVariant): Product => {
    const product: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      price: variant ? (dbProduct.price + variant.price_modifier) : dbProduct.price,
      category: 'General', // You can join with categories table later
      image: dbProduct.image_url,
      description: dbProduct.description,
      inStock: variant ? variant.stock_quantity > 0 : dbProduct.stock_quantity > 0,
      stock_quantity: variant ? variant.stock_quantity : dbProduct.stock_quantity,
      has_variants: dbProduct.has_variants,
      variants: productVariants,
      selectedVariant: variant || undefined,
    };
    
    console.log('Converting product:', { dbProduct, variant, result: product }); // Debug log
    return product;
  };

  const getOptionPrice = (variant: ProductVariant) => {
    return selectedProduct ? selectedProduct.price + variant.price_modifier : variant.price_modifier;
  };

  const handleAddToCart = (product: DatabaseProduct) => {
    console.log('ProductCatalog handleAddToCart called with:', product); // Debug log
    if (product.has_variants) {
      setSelectedProduct(product);
      fetchProductVariants(product.id);
      setShowVariantModal(true);
    } else {
      const convertedProduct = convertToProduct(product);
      console.log('Adding non-variant product to cart:', convertedProduct); // Debug log
      onAddToCart(convertedProduct);
    }
  };

  const handleVariantSelection = () => {
    console.log('handleVariantSelection called:', { selectedProduct, selectedVariant }); // Debug log
    if (selectedProduct && selectedVariant) {
      const productWithVariant = convertToProduct(selectedProduct, selectedVariant);
      console.log('Adding variant product to cart:', productWithVariant); // Debug log
      onAddToCart(productWithVariant);
      setShowVariantModal(false);
      setSelectedProduct(null);
      setSelectedVariant(null);
      setProductVariants([]);
    }
  };

  // Auto-select first available variant when variants are loaded
  useEffect(() => {
    if (productVariants.length > 0 && !selectedVariant) {
      const firstAvailableVariant = productVariants.find(v => v.stock_quantity > 0);
      setSelectedVariant(firstAvailableVariant || productVariants[0]);
    }
  }, [productVariants, selectedVariant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Enhanced Search and Filters */}
      <div className="flex-shrink-0 p-2 md:p-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 flex items-center">
            <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="hidden xs:inline">Products</span>
            <span className="xs:hidden">Items</span>
          </h2>
          {onAddProduct && (
            <Button onClick={() => navigate('/products/add')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7 md:h-8 text-xs">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 md:h-4 md:w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 md:pl-10 h-8 md:h-9 lg:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <span>{filteredProducts.length} products found</span>
          <span className="bg-blue-100 text-blue-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium text-xs">
            {products.filter(p => p.stock_quantity <= p.min_stock_level).length} low stock
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-6 md:py-8 lg:py-12 bg-white m-2 md:m-3 rounded-lg border-2 border-dashed border-gray-300">
            <div className="bg-gray-100 rounded-full w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 mx-auto mb-2 md:mb-3 flex items-center justify-center">
              <Package className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-gray-400" />
            </div>
            <h3 className="text-sm md:text-base lg:text-lg font-medium text-gray-900 mb-1 md:mb-2">No products found</h3>
            <p className="text-gray-600 mb-3 md:mb-4 max-w-md mx-auto text-xs md:text-sm">
              {searchTerm ? 'Try adjusting your search terms or browse all products.' : 'Add your first product to get started with sales.'}
            </p>
            {onAddProduct && !searchTerm && (
              <Button onClick={() => navigate('/products/add')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Add Your First Product</span>
                <span className="sm:hidden">Add Product</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-2 md:p-4 lg:p-6">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
                 style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="group overflow-hidden hover:shadow-lg focus-within:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 hover:border-blue-400 focus-within:border-blue-500 bg-white rounded-xl min-w-[220px] max-w-full"
                  tabIndex={0}
                >
                  <CardContent className="p-3 md:p-4 lg:p-5 flex flex-col h-full">
                    {/* Product Image */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 md:mb-4 flex items-center justify-center relative overflow-hidden w-full">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 group-focus:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Package className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mb-2" />
                          <span className="text-base md:text-lg">No Image</span>
                        </div>
                      )}
                      {/* Stock Status Badge */}
                      {product.stock_quantity <= product.min_stock_level && (
                        <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-500 text-white text-xs px-2 py-1 md:px-2.5 md:py-1.5 rounded-full font-medium shadow">
                          Low
                        </div>
                      )}
                      {/* Variant Indicator */}
                      {product.has_variants && (
                        <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-blue-500 text-white text-xs px-2 py-1 md:px-2.5 md:py-1.5 rounded-full font-medium shadow">
                          <Settings className="h-4 w-4 inline mr-1" />
                          <span className="hidden sm:inline">Var</span>
                        </div>
                      )}
                    </div>
                    {/* Product Info */}
                    <div className="flex flex-col flex-1 space-y-3 md:space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 truncate flex-1 text-base md:text-lg leading-tight">
                          {product.name}
                        </h3>
                      </div>
                      {product.description && (
                        <p className="text-sm md:text-base text-gray-600 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                      {/* Price and Stock */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <p className="text-base md:text-lg lg:text-xl font-bold text-gray-900">
                            ₹{product.price.toFixed(2)}
                          </p>
                          <p className="text-sm md:text-base text-gray-500">
                            Stock: {product.has_variants ? '—' : product.stock_quantity}
                          </p>
                        </div>
                        <Badge 
                          variant={product.has_variants ? "default" : (product.stock_quantity > 0 ? "default" : "destructive")}
                          className="text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2 font-medium"
                        >
                          {product.has_variants ? 'In Stock' : (product.stock_quantity > 0 ? 'In Stock' : 'Out')}
                        </Badge>
                      </div>
                      {/* Add to Cart Button */}
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full h-12 md:h-14 lg:h-16 text-base md:text-lg font-semibold bg-blue-600 hover:bg-blue-700 focus:bg-blue-800 text-white transition-all duration-200 group-hover:bg-blue-700 group-focus:bg-blue-800 rounded-lg mt-2"
                        size="lg"
                        disabled={product.has_variants ? false : product.stock_quantity === 0}
                        tabIndex={0}
                      >
                        <svg className="w-5 h-5 md:w-6 md:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                        </svg>
                        <span className="hidden sm:inline">Add to Cart</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Variant Selection Modal */}
      <Dialog open={showVariantModal} onOpenChange={setShowVariantModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Options - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Base Price: ₹{selectedProduct?.price.toFixed(2)}</Label>
            </div>
            
            {productVariants.length > 0 && (
              <div className="space-y-4">
                {/* Group variants by name (option type) */}
                {(() => {
                  const groupedVariants = productVariants.reduce((groups, variant) => {
                    if (!groups[variant.name]) {
                      groups[variant.name] = [];
                    }
                    groups[variant.name].push(variant);
                    return groups;
                  }, {} as Record<string, ProductVariant[]>);

                  return Object.entries(groupedVariants).map(([optionName, variants]) => (
                    <div key={optionName} className="space-y-2">
                      <Label className="text-sm font-medium">{optionName}</Label>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((variant) => (
                          <Button
                            key={variant.id}
                            type="button"
                            variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedVariant(variant)}
                            disabled={variant.stock_quantity === 0}
                            className="flex items-center gap-2"
                          >
                            <span>{variant.value}</span>
                            <span className="text-xs font-medium">₹{getOptionPrice(variant).toFixed(2)}</span>
                            {variant.stock_quantity === 0 && (
                              <span className="text-xs text-red-500">(Out of Stock)</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
            
            {selectedVariant && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>Selected Option:</span>
                    <span>{selectedVariant.name}: {selectedVariant.value}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Price:</span>
                    <span>₹{getOptionPrice(selectedVariant).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Available:</span>
                    <span>{selectedVariant.stock_quantity}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleVariantSelection}
                disabled={!selectedVariant || selectedVariant.stock_quantity === 0}
                className="w-full"
              >
                Add to Cart - ₹{selectedVariant ? getOptionPrice(selectedVariant).toFixed(2) : '0.00'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
