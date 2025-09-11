
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Package, IndianRupee, BookOpen, Video, FileText } from "lucide-react";
import { useAdminData, AdminProduct } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";

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
    sensors: [] as string[],
    growthGuideTitle: '',
    growthGuideDescription: '',
    guideSteps: [{
      title: '',
      description: '',
      video_url: '',
      document_url: '',
      estimated_duration: ''
    }]
  });

  const handleCreate = () => {
    setFormData({
      name: '',
      type: '',
      price: 0,
      stock_quantity: 0,
      description: '',
      image_url: '',
      sensors: [],
      growthGuideTitle: '',
      growthGuideDescription: '',
      guideSteps: [{
        title: '',
        description: '',
        video_url: '',
        document_url: '',
        estimated_duration: ''
      }]
    });
    setSelectedProduct(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = async (product: AdminProduct) => {
    setFormData({
      name: product.name,
      type: product.type,
      price: product.price,
      stock_quantity: product.stock_quantity,
      description: product.description || '',
      image_url: product.image_url || '',
      sensors: product.sensors || [],
      growthGuideTitle: '',
      growthGuideDescription: '',
      guideSteps: [{
        title: '',
        description: '',
        video_url: '',
        document_url: '',
        estimated_duration: ''
      }]
    });
    setSelectedProduct(product);
    setIsEditing(true);
    setIsDialogOpen(true);

    // Load existing growth guide and steps if any
    const { data: guide } = await supabase
      .from('growth_guides')
      .select('*')
      .eq('product_id', product.id)
      .maybeSingle();

    if (guide) {
      const { data: steps } = await supabase
        .from('guide_steps')
        .select('*')
        .eq('guide_id', guide.id)
        .order('step_number');

      setFormData(prev => ({
        ...prev,
        growthGuideTitle: guide.title || '',
        growthGuideDescription: guide.description || '',
        guideSteps: (steps && steps.length > 0) ? steps.map((s: any) => ({
          title: s.title || '',
          description: s.description || '',
          video_url: s.video_url || '',
          document_url: s.document_url || '',
          estimated_duration: s.estimated_duration || ''
        })) : prev.guideSteps
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || formData.price <= 0) {
      return;
    }

    try {
      // Create or update product
      const productId = await upsertProduct(
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

      // Create or update growth guide and steps
      if (productId) {
        // Prepare steps from form
        const stepsPayload = formData.guideSteps
          .filter(step => step.title.trim())
          .map((step, index) => ({
            step_number: index + 1,
            title: step.title,
            description: step.description,
            video_url: step.video_url || null,
            document_url: step.document_url || null,
            estimated_duration: step.estimated_duration || null
          }));

        const { data: existingGuide } = await supabase
          .from('growth_guides')
          .select('*')
          .eq('product_id', productId)
          .maybeSingle();

        if (existingGuide) {
          // Update guide
          await supabase
            .from('growth_guides')
            .update({
              title: formData.growthGuideTitle || existingGuide.title,
              description: formData.growthGuideDescription || existingGuide.description,
              total_steps: stepsPayload.length
            })
            .eq('id', existingGuide.id);

          // Replace steps
          await supabase.from('guide_steps').delete().eq('guide_id', existingGuide.id);
          if (stepsPayload.length > 0) {
            await supabase.from('guide_steps').insert(
              stepsPayload.map(s => ({ ...s, guide_id: existingGuide.id }))
            );
          }
        } else if (formData.growthGuideTitle || stepsPayload.length > 0) {
          // Create new guide
          const { data: guide, error: guideError } = await supabase
            .from('growth_guides')
            .insert({
              product_id: productId,
              title: formData.growthGuideTitle || 'Growing Guide',
              description: formData.growthGuideDescription || '',
              total_steps: stepsPayload.length
            })
            .select()
            .single();

          if (guideError) throw guideError;

          if (stepsPayload.length > 0) {
            const { error: stepsError } = await supabase
              .from('guide_steps')
              .insert(stepsPayload.map(s => ({ ...s, guide_id: guide.id })));

            if (stepsError) throw stepsError;
          }
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving product and guide:', error);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6" />
          <h2 className="text-xl sm:text-2xl font-bold">Product Management</h2>
          <Badge variant="secondary">{products.length} Products</Badge>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-0 sm:min-w-64">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

            {/* Growth Guide Section */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Growing Guide (Optional)</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Guide Title</Label>
                  <Input
                    placeholder="How to grow this product"
                    value={formData.growthGuideTitle}
                    onChange={(e) => setFormData({ ...formData, growthGuideTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Guide Description</Label>
                  <Textarea
                    placeholder="Brief description of the growing guide"
                    value={formData.growthGuideDescription}
                    onChange={(e) => setFormData({ ...formData, growthGuideDescription: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Guide Steps */}
              <div className="space-y-4">
                <Label>Guide Steps</Label>
                {formData.guideSteps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Step {index + 1}</h4>
                      {formData.guideSteps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSteps = formData.guideSteps.filter((_, i) => i !== index);
                            setFormData({ ...formData, guideSteps: newSteps });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label>Step Title</Label>
                        <Input
                          placeholder="Step title"
                          value={step.title}
                          onChange={(e) => {
                            const newSteps = [...formData.guideSteps];
                            newSteps[index].title = e.target.value;
                            setFormData({ ...formData, guideSteps: newSteps });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Step Description</Label>
                        <Textarea
                          placeholder="Detailed step description"
                          value={step.description}
                          onChange={(e) => {
                            const newSteps = [...formData.guideSteps];
                            newSteps[index].description = e.target.value;
                            setFormData({ ...formData, guideSteps: newSteps });
                          }}
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            Video URL
                          </Label>
                          <Input
                            placeholder="https://youtube.com/watch?v=..."
                            value={step.video_url}
                            onChange={(e) => {
                              const newSteps = [...formData.guideSteps];
                              newSteps[index].video_url = e.target.value;
                              setFormData({ ...formData, guideSteps: newSteps });
                            }}
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Document URL
                          </Label>
                          <Input
                            placeholder="https://example.com/guide.pdf"
                            value={step.document_url}
                            onChange={(e) => {
                              const newSteps = [...formData.guideSteps];
                              newSteps[index].document_url = e.target.value;
                              setFormData({ ...formData, guideSteps: newSteps });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Estimated Duration</Label>
                        <Input
                          placeholder="e.g., 2 weeks, 30 days"
                          value={step.estimated_duration}
                          onChange={(e) => {
                            const newSteps = [...formData.guideSteps];
                            newSteps[index].estimated_duration = e.target.value;
                            setFormData({ ...formData, guideSteps: newSteps });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      guideSteps: [...formData.guideSteps, {
                        title: '',
                        description: '',
                        video_url: '',
                        document_url: '',
                        estimated_duration: ''
                      }]
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Step
                </Button>
              </div>
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
