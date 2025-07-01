
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';

interface Product {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  sensors: string[];
  guidance_steps: number;
  created_at: string;
}

const ProductsCRUD: React.FC = () => {
  const { logAdminActivity } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    image_url: '',
    sensors: [] as string[],
    guidance_steps: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(product => product.type === filterType);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterType]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      image_url: '',
      sensors: [],
      guidance_steps: 0,
    });
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      type: product.type,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity || 0,
      image_url: product.image_url || '',
      sensors: product.sensors || [],
      guidance_steps: product.guidance_steps || 0,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', selectedProduct.id);

        if (error) throw error;

        await logAdminActivity('UPDATE', 'products', selectedProduct.id, formData);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([formData]);

        if (error) throw error;

        await logAdminActivity('CREATE', 'products', undefined, formData);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      await logAdminActivity('DELETE', 'products', product.id, { name: product.name });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const productTypes = [...new Set(products.map(p => p.type))];

  if (loading) {
    return <div className="text-center p-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Products Management</h2>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {productTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <Badge variant="secondary">{product.type}</Badge>
                  </div>
                  <p className="text-gray-600 text-sm">{product.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <p className="font-medium">₹{product.price}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock:</span>
                      <p className="font-medium">{product.stock_quantity}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Sensors:</span>
                      <p className="font-medium">{product.sensors?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Guide Steps:</span>
                      <p className="font-medium">{product.guidance_steps || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No products found.
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps">Guidance Steps</Label>
                <Input
                  id="steps"
                  type="number"
                  min="0"
                  value={formData.guidance_steps}
                  onChange={(e) => setFormData({ ...formData, guidance_steps: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsCRUD;
