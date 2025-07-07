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
import { Plus, Search, Package, Settings, Filter } from 'lucide-react';
import { DatabaseProduct, Product, ProductVariant } from '@/types/pos';
import { useNavigate } from 'react-router-dom';
import { VariantChipSelector } from './pos/VariantChipSelector';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductCatalogProps {
  onAddToCart: (product: Product) => void;
  onAddProduct?: () => void;
  singleClickMode?: boolean;
}

export const ProductCatalog = ({ onAddToCart, onAddProduct, singleClickMode }: ProductCatalogProps) => {
  const { profile } = useAuth();
  const { selectedShopId } = useShop();
  const navigate = useNavigate();
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DatabaseProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [expandedVariantProduct, setExpandedVariantProduct] = useState<string | null>(null);
  const [selectedVariantForProduct, setSelectedVariantForProduct] = useState<Record<string, ProductVariant>>({});

  useEffect(() => {
    if (selectedShopId) {
      fetchProducts();
      fetchCategories();
    }
  }, [selectedShopId]);

  const fetchProducts = async () => {
    if (!selectedShopId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            icon
          ),
          product_variants:product_variants(*)
        `)
        .eq('shop_id', selectedShopId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setProducts(data || []);
      // Set default variants for products with variants
      const defaultVariants: Record<string, ProductVariant> = {};
      for (const product of data || []) {
        if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
          const defaultVar = product.product_variants.find((v: ProductVariant) => v.value.toLowerCase() === 'full') || product.product_variants[0];
          defaultVariants[product.id] = defaultVar;
        }
      }
      setSelectedVariantForProduct(defaultVariants);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!selectedShopId) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', selectedShopId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Additional filter to ensure only products from the selected shop are shown
  const shopFilteredProducts = products.filter(product => product.shop_id === selectedShopId);
  
  const filteredProducts = shopFilteredProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group products by category
  const productsByCategory = filteredProducts.reduce((groups, product) => {
    const categoryName = product.categories?.name || 'Uncategorized';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(product);
    return groups;
  }, {} as Record<string, DatabaseProduct[]>);

  const convertToProduct = (dbProduct: DatabaseProduct, variant?: ProductVariant): Product => {
    const product: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      price: variant ? variant.price : dbProduct.price,
      category: dbProduct.categories?.name || 'General',
      image: dbProduct.image_url,
      description: dbProduct.description,
      inStock: variant ? variant.stock_quantity > 0 : dbProduct.stock_quantity > 0,
      stock_quantity: variant ? variant.stock_quantity : dbProduct.stock_quantity,
      has_variants: dbProduct.has_variants,
      variants: dbProduct.product_variants ?? [],
      selectedVariant: variant || undefined,
    };
    
    console.log('Converting product:', { dbProduct, variant, result: product }); // Debug log
    return product;
  };

  const getOptionPrice = (variant: ProductVariant, basePrice?: number) => {
    const price = basePrice || (selectedProduct ? selectedProduct.price : 0);
    return price + variant.price;
  };

  const handleAddToCart = async (product: DatabaseProduct) => {
    console.log('ProductCatalog handleAddToCart called with:', product); // Debug log
    if (product.has_variants) {
      const selectedVariant = selectedVariantForProduct[product.id];
      if (selectedVariant) {
        const convertedProduct = convertToProduct(product, selectedVariant);
        console.log('Adding selected variant to cart:', convertedProduct); // Debug log
        onAddToCart(convertedProduct);
      } else {
        // No variant selected, automatically add the first available variant
        const variants = product.product_variants?.filter(v => v.stock_quantity > 0) || [];
        const firstAvailableVariant = variants[0];
        if (firstAvailableVariant) {
          const convertedProduct = convertToProduct(product, firstAvailableVariant);
          console.log('Adding first available variant to cart:', convertedProduct); // Debug log
          onAddToCart(convertedProduct);
        } else {
          // If no variants available, add base product
          const convertedProduct = convertToProduct(product);
          console.log('Adding base product to cart (no variants available):', convertedProduct); // Debug log
          onAddToCart(convertedProduct);
        }
      }
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Enhanced Search and Filters - sticky in full screen */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur p-2 md:p-3 border-b border-gray-200 shadow-sm">
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
        
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 md:h-4 md:w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 md:pl-10 h-8 md:h-9 lg:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value === "none" ? "" : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center space-x-2">
                    <span>{category.icon || '📁'}</span>
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {searchTerm || selectedCategory ? 'Try adjusting your search terms or browse all products.' : 'Add your first product to get started with sales.'}
            </p>
            {onAddProduct && !searchTerm && !selectedCategory && (
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
            {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
              <div key={categoryName} className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">{categoryName}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {categoryProducts.length} products
                  </Badge>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5">
                  {categoryProducts.map((product) => {
                    const hasVariants = (product.product_variants && product.product_variants.length > 0);
                    const selectedVar = hasVariants ? (selectedVariantForProduct[product.id] || product.product_variants[0]) : null;
                    const displayPrice = hasVariants && selectedVar ? selectedVar.price : product.price;
                    const inStock = product.stock_quantity > 0;

                    return (
                      <div key={product.id}>
                        <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition p-4">
                          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="object-cover w-full h-full rounded-lg" />
                            ) : (
                              <span className="text-gray-400 text-3xl">🛒</span>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                            <h3 className="font-semibold text-base text-gray-900 truncate">{product.name}</h3>
                            {product.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                            )}
                            {product.product_variants?.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {product.product_variants.map(variant => (
                                  <button
                                    key={variant.id}
                                    onClick={() => setSelectedVariantForProduct(prev => ({ ...prev, [product.id]: variant }))}
                                    disabled={variant.stock_quantity === 0}
                                    className={`px-2 py-0.5 rounded-full border text-xs font-medium transition-all
                                      ${selectedVariantForProduct[product.id]?.id === variant.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
                                      ${variant.stock_quantity === 0 ? 'opacity-50 cursor-not-allowed line-through' : 'cursor-pointer hover:scale-105'}
                                    `}
                                  >
                                    {variant.value} <span className="ml-1">₹{variant.price}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-bold text-green-700">
                              ₹{displayPrice !== undefined && displayPrice !== null ? Number(displayPrice).toFixed(2) : '—'}
                            </span>
                            <Badge className={`text-xs px-2 py-1 font-medium ml-2 ${inStock ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                              {inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="w-full mt-2 text-xs py-2"
                            disabled={!inStock}
                          >
                            Add to Cart
                          </Button>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
            
            {selectedProduct && selectedProduct.product_variants && selectedProduct.product_variants.length > 0 && (
              <div className="space-y-4">
                {/* Group variants by name (option type) */}
                {(() => {
                  const groupedVariants = selectedProduct.product_variants.reduce((groups, variant) => {
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
                            <span className="text-xs font-medium">₹{getOptionPrice(variant, selectedProduct.price || 0).toFixed(2)}</span>
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
                    <span>₹{getOptionPrice(selectedVariant, selectedProduct?.price || 0).toFixed(2)}</span>
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
                Add to Cart - ₹{selectedVariant ? getOptionPrice(selectedVariant, selectedProduct?.price || 0).toFixed(2) : '0.00'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
