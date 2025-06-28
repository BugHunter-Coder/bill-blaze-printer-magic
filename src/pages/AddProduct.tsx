import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Upload, Download, FileText, X } from 'lucide-react';
import { ProductVariantsManager } from '@/components/ProductVariantsManager';

export const AddProduct = () => {
  const { profile } = useAuth();
  const { selectedShopId } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [showVariantsManager, setShowVariantsManager] = useState(false);
  const [tempProductId, setTempProductId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
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
  });
  const [activeTab, setActiveTab] = useState('single');

  // Check URL parameters to auto-switch tabs
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'bulk') {
      setActiveTab('bulk');
    }
  }, [searchParams]);

  const handleHasVariantsChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, has_variants: checked }));
  };

  const downloadCSVTemplate = () => {
    const template = `Name,Description,Price,Cost Price,Stock Quantity,Min Stock Level,SKU,Barcode,Has Variants,Variant Options,Variant Prices,Variant Stocks
"Sample Product","Product description",100.00,80.00,50,10,"SKU001","1234567890",false,,,
"Restaurant Item","Delicious food item",0.00,0.00,100,20,"SKU002","0987654321",true,"Half Plate|Full Plate","75.00|150.00","10|20"
"Another Product","Another description",150.00,120.00,30,5,"SKU003","1122334455",false,,,
`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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

      // Navigate back to POS
      navigate('/pos');
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
      };

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
      
      // If product has variants, show variant management
      if (formData.has_variants && data) {
        setTempProductId(data.id);
        setShowVariantsManager(true);
        return;
      }

      // Navigate back to POS
      navigate('/pos');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product.",
        variant: "destructive",
      });
    }
  };

  const handleVariantsChange = () => {
    // Navigate back to POS after variants are set up
    navigate('/pos');
  };

  if (showVariantsManager && tempProductId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="outline" 
                onClick={() => setShowVariantsManager(false)}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Product Form
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">
                Add Product Options
              </h2>
            </div>
          </div>
          <ProductVariantsManager
            productId={tempProductId}
            shopId={selectedShopId!}
            onVariantsChange={handleVariantsChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/pos')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to POS
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Add Products</h1>
            <p className="text-gray-600 mt-1">Add single products or upload multiple products at once</p>
          </div>
        </div>

        {/* Tabs for Single vs Bulk Upload */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Product</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-6">
            {/* Single Product Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Add New Product</CardTitle>
              </CardHeader>
              <CardContent>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      onClick={() => navigate('/pos')}
                      className="px-6 py-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Product
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bulk" className="space-y-6">
            {/* Bulk Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Bulk Upload Products</CardTitle>
              </CardHeader>
              <CardContent>
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
                      onClick={() => navigate('/pos')}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AddProduct; 