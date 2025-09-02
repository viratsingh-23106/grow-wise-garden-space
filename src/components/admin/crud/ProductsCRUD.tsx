
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Package, IndianRupee } from "lucide-react";
import { useAdminData, AdminProduct } from "@/hooks/useAdminData";

const ProductsCRUD = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { products, loading, upsertProduct, deleteProduct } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    price: 0,
    stock_quantity: 0,
    description: '',
    image_url: '',
    sensors: [] as string[]
  });

  const handleCreate = () => {
    setFormData({
      name: '',
      type: '',
      price: 0,
      stock_quantity: 0,
      description: '',
      image_url: '',
      sensors: []
    });
    setSelectedProduct(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: AdminProduct) => {
    setFormData({
      name: product.name,
      type: product.type,
      price: product.price,
      stock_quantity: product.stock_quantity,
      description: product.description || '',
      image_url: product.image_url || '',
      sensors: product.sensors || []
    });
    setSelectedProduct(product);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || formData.price <= 0) {
      return;
    }

    await upsertProduct(
      {
        name: formData.name,
        type: formData.type,
        price: formData.price,
        stock_quantity: formData.stock_quantity,
        description: formData.description,
        image_url: formData.image_url,
        sensors: formData.sensors
      },
      isEditing ? selectedProduct?.id : undefined
    );
    
    setIsDialogOpen(false);
  };

  const handleDelete = async (product: AdminProduct) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    await deleteProduct(product.id);
  };

  const handleSensorsChange = (value: string) => {
    const sensors = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setFormData({ ...formData, sensors });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center p-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Product Management</h2>
          <Badge variant="secondary">{products.length} Products</Badge>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

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
      </div>

      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant="outline">{product.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <IndianRupee className="w-4 h-4" />
                    {product.price}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Stock: {product.stock_quantity}</span>
                    <span>Created: {new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                  {product.sensors && product.sensors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.sensors.map((sensor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {sensor}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seeds">Seeds</SelectItem>
                    <SelectItem value="plants">Plants</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Product description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div>
              <Label>Sensors (comma-separated)</Label>
              <Input
                placeholder="temperature, humidity, soil_moisture"
                value={formData.sensors.join(', ')}
                onChange={(e) => handleSensorsChange(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
