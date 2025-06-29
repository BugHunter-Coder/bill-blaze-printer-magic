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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, FolderOpen, X } from 'lucide-react';

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

export const CategoryManagement = () => {
  const { profile } = useAuth();
  const { selectedShopId } = useShop();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });

  useEffect(() => {
    if (selectedShopId) {
      fetchCategories();
    }
  }, [selectedShopId]);

  const fetchCategories = async () => {
    if (!selectedShopId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', selectedShopId)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
      
      // Fetch product counts for each category
      const counts: Record<string, number> = {};
      for (const category of data || []) {
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', selectedShopId)
          .eq('category_id', category.id)
          .eq('is_active', true);
        
        if (!countError) {
          counts[category.id] = count || 0;
        }
      }
      setProductCounts(counts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return;

    try {
      const categoryData = {
        shop_id: selectedShopId,
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || null,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Category updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Category created successfully.",
        });
      }

      await fetchCategories();
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will be moved to "Uncategorized".')) return;

    try {
      // First, move all products in this category to uncategorized (null category_id)
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      if (updateError) throw updateError;

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      
      await fetchCategories();
      toast({
        title: "Success",
        description: "Category deleted successfully. Products moved to uncategorized.",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      
      await fetchCategories();
      toast({
        title: "Success",
        description: `Category ${category.is_active ? 'deactivated' : 'activated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast({
        title: "Error",
        description: "Failed to update category status.",
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
    <div className="overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Management</h1>
                <p className="text-gray-600">Organize your products into categories for better management</p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)} 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Category
              </Button>
            </div>
          </div>

          {/* Add/Edit Category Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Category Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Electronics, Clothing, Food"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="icon" className="text-sm font-medium text-gray-700">
                      Icon (Optional)
                    </Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., 📱, 🎮, 👕"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Brief description of this category..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Categories Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Categories ({categories.length})
              </h2>
            </div>

            {categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((category) => (
                  <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{category.icon || '📁'}</span>
                            <h3 className="font-semibold text-lg text-gray-900 truncate">{category.name}</h3>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{category.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleToggleActive(category)}
                            className="h-8 w-8 p-0"
                            title={category.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {category.is_active ? (
                              <FolderOpen className="h-3 w-3 text-green-600" />
                            ) : (
                              <Package className="h-3 w-3 text-gray-400" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(category)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(category.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Products:</span>
                          <Badge variant="secondary" className="text-xs">
                            {productCounts[category.id] || 0} products
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          <Badge 
                            variant={category.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create categories to organize your products. This will help you manage your inventory more efficiently.
                </p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Category
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 