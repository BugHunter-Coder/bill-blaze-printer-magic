import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Edit, Trash2, Settings, Upload, Download, FileText, X } from 'lucide-react';
import { DatabaseProduct } from '@/types/pos';
import { ProductVariantsManager } from './ProductVariantsManager';

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

export const ProductManagement = () => {
  const { profile } = useAuth();
  const { selectedShopId } = useShop();
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DatabaseProduct | null>(null);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    min_stock_level: '',
    sku: '',
    barcode: '',
    has_variants: false,
    category_id: '',
  });

  const [tempProductId, setTempProductId] = useState<string | null>(null);

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
          )
        `)
        .eq('shop_id', selectedShopId)
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products.",
        variant: "destructive",
      });
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost_price: '',
      stock_quantity: '',
      min_stock_level: '',
      sku: '',
      barcode: '',
      has_variants: false,
      category_id: '',
    });
    setShowAddForm(false);
    setShowCSVUpload(false);
    setEditingProduct(null);
    setTempProductId(null);
    setCsvFile(null);
    setCsvPreview([]);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      
      setCsvPreview(data.slice(0, 5)); // Show first 5 rows
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile || !selectedShopId) return;

    try {
      setUploading(true);
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          // Accept both 'Yes' and 'true' (case-insensitive) for Has Variants
          const hasVariants = (row.has_variants || row['Has Variants'] || '').toString().trim().toLowerCase() === 'true' || (row.has_variants || row['Has Variants'] || '').toString().trim().toLowerCase() === 'yes';
          // Accept both '|' and '/' as delimiters for options/prices/stocks
          const variantOptions = (row.variant_options || row['Variant Options'] || '').replace(/\//g, '|');
          const variantPrices = (row.variant_prices || row['Variant Prices'] || '').replace(/\//g, '|');
          const variantStocks = (row.variant_stocks || row['Variant Stocks'] || '').replace(/\//g, '|');

          // Handle category lookup
          let categoryId = null;
          const categoryName = row.category || row.Category || row.category_name || row['Category Name'];
          if (categoryName) {
            // Find category by name
            const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
            if (category) {
              categoryId = category.id;
            } else {
              // Create category if it doesn't exist
              const { data: newCategory, error: categoryError } = await supabase
                .from('categories')
                .insert({
                  shop_id: selectedShopId,
                  name: categoryName,
                  is_active: true,
                })
                .select()
                .single();

              if (!categoryError && newCategory) {
                categoryId = newCategory.id;
                // Refresh categories list
                await fetchCategories();
              }
            }
          }

          // Create the product
          const productData = {
            shop_id: selectedShopId,
            name: row.name || row.Name || row.product_name || row['Product Name'],
            description: row.description || row.Description || row['Product Description'] || null,
            price: parseFloat(row.price || row.Price || row.selling_price || row['Selling Price']) || 0,
            cost_price: row.cost_price || row['Cost Price'] ? parseFloat(row.cost_price || row['Cost Price']) : null,
            stock_quantity: parseInt(row.stock_quantity || row['Stock Quantity'] || row.quantity || row.Quantity) || 0,
            min_stock_level: parseInt(row.min_stock_level || row['Min Stock Level'] || row['Minimum Stock']) || 0,
            sku: row.sku || row.SKU || null,
            barcode: row.barcode || row.Barcode || null,
            has_variants: hasVariants,
            category_id: categoryId,
          };

          const { data: product, error: productError } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

          if (productError) throw productError;

          // If product has variants, create variant options and variants
          if (hasVariants && variantOptions && variantPrices && product) {
            const options = variantOptions.split('|').map((opt: string) => opt.trim()).filter(Boolean);
            const prices = variantPrices.split('|').map((price: string) => parseFloat(price.trim()) || 0);
            const stocks = variantStocks.split('|').map((stock: string) => parseInt(stock.trim()) || 0);

            if (options.length === prices.length) {
              // Create variant option (e.g., "Size" with values ["Half Plate", "Full Plate"])
              const optionName = "Size"; // Default option name for restaurant-style variants
              
              // Check if option already exists
              let { data: existingOption } = await supabase
                .from('variant_options')
                .select('id')
                .eq('shop_id', selectedShopId)
                .eq('name', optionName)
                .single();

              let optionId;
              if (!existingOption) {
                // Create new option
                const { data: newOption, error: optionError } = await supabase
                  .from('variant_options')
                  .insert({
                    shop_id: selectedShopId,
                    name: optionName,
                    values: options, // Array of option values
                  })
                  .select()
                  .single();

                if (optionError) throw optionError;
                optionId = newOption.id;
              } else {
                optionId = existingOption.id;
              }

              // Create product variants for each option
              for (let i = 0; i < options.length; i++) {
                const optionValue = options[i];
                const optionPrice = prices[i];
                const optionStock = stocks[i] !== undefined ? stocks[i] : 0;

                // Create product variant
                const { error: variantError } = await supabase
                  .from('product_variants')
                  .insert({
                    product_id: product.id,
                    name: optionName,
                    value: optionValue,
                    price_modifier: optionPrice, // Use price_modifier for complete pricing
                    stock_quantity: optionStock,
                  });

                if (variantError) throw variantError;
              }
            }
          }

          successCount++;
        } catch (error) {
          console.error('Error processing row:', row, error);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        toast({
          title: "Partial Success",
          description: `Successfully uploaded ${successCount} products. ${errorCount} products failed.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully uploaded ${successCount} products with variants.`,
        });
      }

      await fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error uploading products:', error);
      toast({
        title: "Error",
        description: "Failed to upload products.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const template = `Name,Description,Price,Cost Price,Stock Quantity,Min Stock Level,SKU,Barcode,Category,Has Variants,Variant Options,Variant Prices,Variant Stocks
"Sample Product","Product description",100.00,80.00,50,10,"SKU001","1234567890","Electronics",false,,,
"Restaurant Item","Delicious food item",0.00,0.00,100,20,"SKU002","0987654321","Food",true,"Half Plate|Full Plate","75.00|150.00","10|20"
"Another Product","Another description",150.00,120.00,30,5,"SKU003","1122334455","Clothing",false,,,
`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return;

    try {
      const productData = {
        shop_id: selectedShopId,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        has_variants: formData.has_variants,
        category_id: formData.category_id || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Product updated successfully.",
        });
        
        // If editing and has variants, open variant management
        if (formData.has_variants) {
          setSelectedProductForVariants(editingProduct.id);
          resetForm();
          return;
        }
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product added successfully.",
        });
        
        // If new product and has variants, open variant management
        if (formData.has_variants && data) {
          setTempProductId(data.id);
          setSelectedProductForVariants(data.id);
          resetForm();
          return;
        }
      }

      await fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: DatabaseProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      cost_price: product.cost_price?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      sku: product.sku || '',
      barcode: product.barcode || '',
      has_variants: product.has_variants || false,
      category_id: product.category_id || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    }
  };

  const handleVariantsChange = () => {
    fetchProducts();
  };

  const handleHasVariantsChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, has_variants: checked }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedProductForVariants) {
    const product = products.find(p => p.id === selectedProductForVariants);
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedProductForVariants(null)}
                className="mb-2"
              >
                ← Back to Products
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">
                Variants for {product?.name}
              </h2>
            </div>
          </div>
          <ProductVariantsManager
            productId={selectedProductForVariants}
            shopId={selectedShopId!}
            onVariantsChange={handleVariantsChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
                <p className="text-gray-600">Manage your inventory and product catalog</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={() => setShowCSVUpload(true)} 
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button 
                  onClick={() => setShowAddForm(true)} 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Product
                </Button>
              </div>
            </div>
          </div>

          {/* CSV Upload Section */}
          {showCSVUpload && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  Bulk Upload Products
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  Upload multiple products at once using a CSV file
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {/* CSV Template Download */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-blue-900 mb-1">Download CSV Template</h3>
                        <p className="text-sm text-blue-800 mb-3">
                          Use our template to ensure your CSV file has the correct format and column headers.
                          For products with variants (like restaurant items), set "Has Variants" to true and use "Variant Options" and "Variant Prices" columns.
                        </p>
                        <div className="text-xs text-blue-700 mb-3 space-y-1">
                          <p><strong>Variant Options:</strong> Use pipe (|) to separate options (e.g., "Half Plate|Full Plate")</p>
                          <p><strong>Variant Prices:</strong> Use pipe (|) to separate prices (e.g., "75.00|150.00")</p>
                          <p><strong>Variant Stocks:</strong> Use pipe (|) to separate stocks (e.g., "10|20")</p>
                          <p><strong>Note:</strong> For variant products, set the main Price to 0</p>
                        </div>
                        <Button 
                          onClick={downloadCSVTemplate}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Upload CSV File</h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          {csvFile ? csvFile.name : 'Choose CSV file or drag and drop'}
                        </p>
                        <p className="text-sm text-gray-500">
                          CSV files only, max 10MB
                        </p>
                      </label>
                    </div>

                    {csvFile && (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">{csvFile.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCsvFile(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* CSV Preview */}
                  {csvPreview.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Preview (First 5 rows)</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(csvPreview[0] || {}).map((header) => (
                                <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((row, index) => (
                              <tr key={index} className="border-b">
                                {Object.values(row).map((value, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Upload Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm}
                      className="px-6 py-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleBulkUpload}
                      disabled={!csvFile || uploading}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                    >
                      {uploading ? 'Uploading...' : 'Upload Products'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Product Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {editingProduct ? 'Update product information' : 'Create a new product for your inventory'}
                </p>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Product Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter product name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                          Category
                        </Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value === "none" ? "" : value }))}
                        >
                          <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Category</SelectItem>
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Product Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Describe your product..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sku" className="text-sm font-medium text-gray-700">
                          SKU (Stock Keeping Unit)
                        </Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="e.g., PROD-001"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="barcode" className="text-sm font-medium text-gray-700">
                          Barcode
                        </Label>
                        <Input
                          id="barcode"
                          value={formData.barcode}
                          onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Scan or enter barcode"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Pricing & Inventory
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                          Selling Price *
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            required
                            className="h-11 pl-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cost_price" className="text-sm font-medium text-gray-700">
                          Cost Price
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <Input
                            id="cost_price"
                            type="number"
                            step="0.01"
                            value={formData.cost_price}
                            onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                            className="h-11 pl-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="stock_quantity" className="text-sm font-medium text-gray-700">
                          Current Stock *
                        </Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                          required
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="min_stock_level" className="text-sm font-medium text-gray-700">
                          Minimum Stock Level
                        </Label>
                        <Input
                          id="min_stock_level"
                          type="number"
                          value={formData.min_stock_level}
                          onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500">You'll be notified when stock falls below this level</p>
                      </div>
                    </div>
                  </div>

                  {/* Product Options Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Product Options
                    </h3>
                    
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Checkbox
                        id="has_variants"
                        checked={formData.has_variants}
                        onCheckedChange={handleHasVariantsChange}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="has_variants" className="text-sm font-medium text-gray-700 cursor-pointer">
                          This product has multiple options (sizes, portions, etc.)
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Enable if your product comes in different sizes, portions, or variations
                        </p>
                      </div>
                    </div>
                    
                    {formData.has_variants && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                            <span className="text-white text-xs font-medium">i</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-blue-900 mb-2">Product Options Setup</p>
                            <p className="text-sm text-blue-800 mb-3">
                              After saving this product, you'll be taken to the options management screen where you can add serving sizes, portions, or other choices with their own prices and availability.
                            </p>
                            <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                              <p className="font-medium mb-1">Examples:</p>
                              <ul className="space-y-1">
                                <li>• Half Plate / Full Plate</li>
                                <li>• Small / Medium / Large</li>
                                <li>• Mild / Medium / Hot</li>
                                <li>• Regular / Extra Cheese</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm}
                      className="px-6 py-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    >
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Products ({products.length})
              </h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  {products.filter(p => p.stock_quantity <= p.min_stock_level).length} Low Stock
                </Badge>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">{product.name}</h3>
                          {product.sku && (
                            <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                          )}
                          {product.categories && (
                            <div className="flex items-center space-x-1 mt-1">
                              <span className="text-sm text-gray-500">Category:</span>
                              <Badge variant="outline" className="text-xs">
                                <span className="mr-1">{product.categories.icon || '📁'}</span>
                                {product.categories.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-2">
                          {product.has_variants && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedProductForVariants(product.id)}
                              title="Manage Variants"
                              className="h-8 w-8 p-0"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(product)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(product.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Price:</span>
                          <span className="font-bold text-lg text-gray-900">₹{product.price.toFixed(2)}</span>
                        </div>
                        
                        {product.cost_price && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Cost:</span>
                            <span className="text-sm text-gray-700">₹{product.cost_price.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Stock:</span>
                          <Badge 
                            variant={product.stock_quantity > product.min_stock_level ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {product.stock_quantity} units
                          </Badge>
                        </div>
                        
                        {product.has_variants && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Type:</span>
                            <Badge variant="secondary" className="text-xs">Has Options</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start building your product catalog by adding your first product. You can add basic products or products with multiple options.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button 
                    onClick={() => setShowCSVUpload(true)}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
