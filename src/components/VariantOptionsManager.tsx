import { useState, useEffect } from 'react';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { VariantOption } from '@/types/pos';

export const VariantOptionsManager = () => {
  const { selectedShopId } = useShop();
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOption, setEditingOption] = useState<VariantOption | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    values: [] as string[],
    newValue: '',
  });

  useEffect(() => {
    if (selectedShopId) {
      fetchVariantOptions();
    }
  }, [selectedShopId]);

  const fetchVariantOptions = async () => {
    if (!selectedShopId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('variant_options')
        .select('*')
        .eq('shop_id', selectedShopId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setVariantOptions(data || []);
    } catch (error) {
      console.error('Error fetching variant options:', error);
      toast({
        title: "Error",
        description: "Failed to fetch variant options.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      values: [],
      newValue: '',
    });
    setShowAddForm(false);
    setEditingOption(null);
  };

  const addValue = () => {
    if (formData.newValue.trim() && !formData.values.includes(formData.newValue.trim())) {
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, prev.newValue.trim()],
        newValue: '',
      }));
    }
  };

  const removeValue = (value: string) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter(v => v !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId || formData.values.length === 0) return;

    try {
      const optionData = {
        shop_id: selectedShopId,
        name: formData.name,
        values: formData.values,
      };

      if (editingOption) {
        const { error } = await supabase
          .from('variant_options')
          .update(optionData)
          .eq('id', editingOption.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Variant option updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('variant_options')
          .insert(optionData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Variant option added successfully.",
        });
      }

      await fetchVariantOptions();
      resetForm();
    } catch (error) {
      console.error('Error saving variant option:', error);
      toast({
        title: "Error",
        description: "Failed to save variant option.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (option: VariantOption) => {
    setEditingOption(option);
    setFormData({
      name: option.name,
      values: option.values,
      newValue: '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (optionId: string) => {
    if (!confirm('Are you sure you want to delete this variant option?')) return;

    try {
      const { error } = await supabase
        .from('variant_options')
        .update({ is_active: false })
        .eq('id', optionId);

      if (error) throw error;
      
      await fetchVariantOptions();
      toast({
        title: "Success",
        description: "Variant option deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting variant option:', error);
      toast({
        title: "Error",
        description: "Failed to delete variant option.",
        variant: "destructive",
      });
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
    <div className="overflow-y-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Variant Options</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant Option
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingOption ? 'Edit Variant Option' : 'Add New Variant Option'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="option-name">Option Name *</Label>
                <Input
                  id="option-name"
                  placeholder="e.g., Size, Color, Material"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Values *</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a value (e.g., Large, Red)"
                    value={formData.newValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, newValue: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                  />
                  <Button type="button" onClick={addValue} disabled={!formData.newValue.trim()}>
                    Add
                  </Button>
                </div>
                
                {formData.values.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.values.map((value, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {value}
                        <button
                          type="button"
                          onClick={() => removeValue(value)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={formData.values.length === 0}>
                  {editingOption ? 'Update' : 'Create'} Option
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {variantOptions.map((option) => (
          <Card key={option.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{option.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {option.values.map((value, index) => (
                      <Badge key={index} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(option)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(option.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {variantOptions.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No variant options created yet.</p>
            <p className="text-sm text-gray-400">
              Create variant options like "Size", "Color", or "Material" to add variants to your products.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 