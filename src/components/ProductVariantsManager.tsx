import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, X, Settings } from 'lucide-react';
import { ProductVariant, VariantOption } from '@/types/pos';

interface ProductVariantsManagerProps {
  productId: string;
  shopId: string;
  onVariantsChange: () => void;
}

export const ProductVariantsManager = ({ productId, shopId, onVariantsChange }: ProductVariantsManagerProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    value: '',
    price_modifier: '',
    stock_quantity: '',
    min_stock_level: '',
    sku: '',
    barcode: '',
  });

  const [pricingMode, setPricingMode] = useState<'modifier' | 'complete'>('complete');
  const [completePrice, setCompletePrice] = useState('');

  const [showNewOptionForm, setShowNewOptionForm] = useState(false);
  const [newOptionData, setNewOptionData] = useState({
    name: '',
    values: [] as string[],
    newValue: '',
  });

  useEffect(() => {
    fetchVariants();
    fetchVariantOptions();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setVariants(data || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const fetchVariantOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('variant_options')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setVariantOptions(data || []);
    } catch (error) {
      console.error('Error fetching variant options:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      value: '',
      price_modifier: '',
      stock_quantity: '',
      min_stock_level: '',
      sku: '',
      barcode: '',
    });
    setCompletePrice('');
    setPricingMode('complete');
    setShowAddForm(false);
    setEditingVariant(null);
  };

  const resetNewOptionForm = () => {
    setNewOptionData({
      name: '',
      values: [],
      newValue: '',
    });
    setShowNewOptionForm(false);
  };

  const addNewOptionValue = () => {
    if (newOptionData.newValue.trim() && !newOptionData.values.includes(newOptionData.newValue.trim())) {
      setNewOptionData(prev => ({
        ...prev,
        values: [...prev.values, prev.newValue.trim()],
        newValue: '',
      }));
    }
  };

  const removeNewOptionValue = (value: string) => {
    setNewOptionData(prev => ({
      ...prev,
      values: prev.values.filter(v => v !== value),
    }));
  };

  const handleCreateNewOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || newOptionData.values.length === 0) return;

    try {
      const optionData = {
        shop_id: shopId,
        name: newOptionData.name,
        values: newOptionData.values,
      };

      const { error } = await supabase
        .from('variant_options')
        .insert(optionData);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Variant option created successfully.",
      });

      await fetchVariantOptions();
      resetNewOptionForm();
    } catch (error) {
      console.error('Error creating variant option:', error);
      toast({
        title: "Error",
        description: "Failed to create variant option.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    // Calculate price modifier based on pricing mode
    let finalPriceModifier = 0;
    if (pricingMode === 'complete' && completePrice) {
      // Get the base product price to calculate modifier
      const basePrice = 0; // We'll need to get this from the product
      finalPriceModifier = parseFloat(completePrice) - basePrice;
    } else {
      finalPriceModifier = parseFloat(formData.price_modifier) || 0;
    }

    try {
      const variantData = {
        product_id: productId,
        name: formData.name,
        value: formData.value,
        price_modifier: finalPriceModifier,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
      };

      if (editingVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', editingVariant.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Option updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('product_variants')
          .insert(variantData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Option added successfully.",
        });
      }

      await fetchVariants();
      onVariantsChange();
      resetForm();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: "Error",
        description: "Failed to save option.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      value: variant.value,
      price_modifier: variant.price_modifier.toString(),
      stock_quantity: variant.stock_quantity.toString(),
      min_stock_level: variant.min_stock_level.toString(),
      sku: variant.sku || '',
      barcode: variant.barcode || '',
    });
    setCompletePrice((variant.price_modifier || 0).toString());
    setPricingMode('complete');
    setShowAddForm(true);
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return;

    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: false })
        .eq('id', variantId);

      if (error) throw error;
      
      await fetchVariants();
      onVariantsChange();
      toast({
        title: "Success",
        description: "Option deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: "Error",
        description: "Failed to delete option.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Options</h3>
          <p className="text-sm text-gray-600 mt-1">
            Add serving sizes, portions, or other choices for this product (e.g., Half Plate, Full Plate)
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingVariant ? 'Edit Option' : 'Add New Option'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="variant-name">Option Type *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.name}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select option type" />
                      </SelectTrigger>
                      <SelectContent>
                        {variantOptions.map((option) => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewOptionForm(true)}
                      className="whitespace-nowrap"
                    >
                      + New
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose option type (e.g., Serving Size, Portion) or create new
                  </p>
                </div>

                <div>
                  <Label htmlFor="variant-value">Option Value *</Label>
                  <Input
                    id="variant-value"
                    placeholder="e.g., Half Plate, Full Plate, Small, Large"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The specific choice (Half Plate, Full Plate, etc.)
                  </p>
                </div>

                <div>
                  <Label htmlFor="variant-price-modifier">Pricing</Label>
                  <div className="space-y-2">
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="pricingMode"
                          value="complete"
                          checked={pricingMode === 'complete'}
                          onChange={() => setPricingMode('complete')}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Complete Price</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="pricingMode"
                          value="modifier"
                          checked={pricingMode === 'modifier'}
                          onChange={() => setPricingMode('modifier')}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Price Modifier</span>
                      </label>
                    </div>
                    
                    {pricingMode === 'complete' ? (
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 70.00"
                          value={completePrice}
                          onChange={(e) => setCompletePrice(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Complete price for this option (e.g., ₹70 for Full Plate)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price_modifier}
                          onChange={(e) => setFormData(prev => ({ ...prev, price_modifier: e.target.value }))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Additional cost for this option (e.g., +₹20 for Full Plate)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="variant-stock">Available Quantity</Label>
                  <Input
                    id="variant-stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many of this option are available
                  </p>
                </div>

                <div>
                  <Label htmlFor="variant-min-stock">Min Stock Level</Label>
                  <Input
                    id="variant-min-stock"
                    type="number"
                    placeholder="0"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum stock level for reorder alerts
                  </p>
                </div>

                <div>
                  <Label htmlFor="variant-sku">SKU</Label>
                  <Input
                    id="variant-sku"
                    placeholder="SKU code"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional SKU for this option
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!formData.name || !formData.value}>
                  {editingVariant ? 'Update' : 'Add'} Option
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* New Option Creation Modal */}
      {showNewOptionForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Option Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNewOption} className="space-y-4">
              <div>
                <Label htmlFor="option-name">Option Type Name *</Label>
                <Input
                  id="option-name"
                  placeholder="e.g., Serving Size, Portion, Spice Level"
                  value={newOptionData.name}
                  onChange={(e) => setNewOptionData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The type of choice (Serving Size, Portion, Spice Level, etc.)
                </p>
              </div>

              <div>
                <Label>Available Choices *</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a choice (e.g., Half Plate, Full Plate)"
                    value={newOptionData.newValue}
                    onChange={(e) => setNewOptionData(prev => ({ ...prev, newValue: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewOptionValue())}
                  />
                  <Button type="button" onClick={addNewOptionValue} disabled={!newOptionData.newValue.trim()}>
                    Add
                  </Button>
                </div>
                
                {newOptionData.values.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newOptionData.values.map((value, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {value}
                        <button
                          type="button"
                          onClick={() => removeNewOptionValue(value)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Add all available choices for this option type
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={newOptionData.values.length === 0}>
                  Create Option Type
                </Button>
                <Button type="button" variant="outline" onClick={resetNewOptionForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-2">
        {variants.map((variant) => (
          <Card key={variant.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{variant.name}:</span>
                    <Badge variant="outline">{variant.value}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Price: {variant.price_modifier >= 0 ? '+' : ''}₹{variant.price_modifier.toFixed(2)} | 
                    Stock: {variant.stock_quantity} | 
                    Min: {variant.min_stock_level}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(variant)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(variant.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {variants.length === 0 && !showAddForm && !showNewOptionForm && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No options added yet</h3>
              <p className="text-gray-600 mb-4">
                Add serving sizes, portions, or other choices to give customers options.
              </p>
            </div>
            
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Create option types (Serving Size, Portion, etc.) with available choices</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Set price differences and stock levels for each option</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500">Examples:</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Serving Size: Half Plate, Full Plate</p>
                <p>• Spice Level: Mild, Medium, Hot</p>
                <p>• Portion: Small, Medium, Large</p>
              </div>
            </div>
            
            <Button onClick={() => setShowAddForm(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Option
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 