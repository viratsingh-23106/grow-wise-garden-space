
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShoppingCart, Plus, Minus, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";

const sensorTypes = {
  "soil-moisture": { name: "Soil Moisture", color: "bg-blue-100 text-blue-800" },
  "temperature": { name: "Temperature", color: "bg-red-100 text-red-800" },
  "humidity": { name: "Humidity", color: "bg-teal-100 text-teal-800" },
  "light": { name: "Light", color: "bg-yellow-100 text-yellow-800" },
  "ph": { name: "pH Level", color: "bg-purple-100 text-purple-800" },
  "nutrients": { name: "Nutrients", color: "bg-green-100 text-green-800" },
  "all": { name: "All Sensors", color: "bg-gray-100 text-gray-800" }
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: growthGuide, isLoading: guideLoading } = useQuery({
    queryKey: ['growthGuide', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: guide, error: guideError } = await supabase
        .from('growth_guides')
        .select('*')
        .eq('product_id', id)
        .maybeSingle();
      
      if (guideError) throw guideError;
      
      if (!guide) return null;
      
      const { data: steps, error: stepsError } = await supabase
        .from('guide_steps')
        .select('*')
        .eq('guide_id', guide.id)
        .order('step_number', { ascending: true });
      
      if (stepsError) throw stepsError;
      
      return { ...guide, steps: steps || [] };
    },
    enabled: !!product,
  });

  const increaseQuantity = () => {
    if (product && quantity < product.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.id, quantity);
    }
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center">
          <div className="text-center">Loading product details...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
            <Button onClick={() => navigate('/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/products')} className="text-green-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="rounded-2xl overflow-hidden bg-white shadow-lg">
            <img 
              src={product.image_url || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500'} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">{product.type}</Badge>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-5 w-5 ${star <= 4 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">4.0 (12 reviews)</span>
              </div>
            </div>
            
            <p className="text-xl font-bold text-green-600">${product.price}</p>
            
            <p className="text-gray-700">{product.description}</p>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recommended IoT Sensors:</h3>
              <div className="flex flex-wrap gap-2">
                {product.sensors?.map((sensor) => (
                  <Badge 
                    key={sensor}
                    variant="secondary"
                    className={`${sensorTypes[sensor]?.color}`}
                  >
                    {sensorTypes[sensor]?.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">
                In Stock: <span className={`font-medium ${product.stock_quantity > 10 ? 'text-green-600' : 'text-amber-600'}`}>
                  {product.stock_quantity} available
                </span>
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="mr-4">Quantity:</span>
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="mx-4 w-8 text-center">{quantity}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  onClick={handleAddToCart}
                  disabled={!user}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {user ? 'Add to Cart' : 'Sign in to Buy'}
                </Button>
                
                {!user && (
                  <Button 
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600"
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="details" className="mt-12">
          <TabsList className="grid w-full md:w-1/2 grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="guidance">Growing Guide</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Product Specifications</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Type</h3>
                    <p>{product.type}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Price</h3>
                    <p>${product.price}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Stock</h3>
                    <p>{product.stock_quantity} units</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Guidance Steps</h3>
                    <p>{product.guidance_steps} steps</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Sensors</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.sensors?.map((sensor) => (
                        <Badge key={sensor} variant="outline">{sensorTypes[sensor]?.name}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="guidance" className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              {guideLoading ? (
                <div className="text-center py-8">Loading growth guide...</div>
              ) : growthGuide ? (
                <>
                  <h2 className="text-2xl font-semibold mb-2">{growthGuide.title}</h2>
                  <p className="text-gray-600 mb-6">{growthGuide.description}</p>
                  
                  <div className="space-y-8">
                    {growthGuide.steps?.map((step) => (
                      <div key={step.id} className="border-l-4 border-green-500 pl-4">
                        <div className="flex items-center">
                          <span className="bg-green-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                            {step.step_number}
                          </span>
                          <h3 className="text-xl font-medium">{step.title}</h3>
                        </div>
                        
                        <p className="mt-2 text-gray-600">{step.description}</p>
                        
                        {(step.video_url || step.document_url) && (
                          <div className="mt-4 flex flex-wrap gap-4">
                            {step.video_url && (
                              <div className="w-full md:w-1/2">
                                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                                  <iframe 
                                    className="w-full h-full rounded"
                                    src={step.video_url}
                                    title={`Step ${step.step_number} video`}
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              </div>
                            )}
                            
                            {step.document_url && (
                              <Button variant="outline" className="mt-2">
                                <Link to={step.document_url} target="_blank" rel="noopener noreferrer">
                                  View Documentation
                                </Link>
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {step.estimated_duration && (
                          <Badge variant="outline" className="mt-3">
                            Duration: {step.estimated_duration}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="mb-4">No growth guide available for this product yet.</p>
                  <p className="text-gray-600">Check back soon for detailed instructions!</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Customer Reviews</h2>
              <div className="text-center py-8">
                <p className="mb-4">No reviews available for this product yet.</p>
                {user ? (
                  <Button className="bg-green-600 hover:bg-green-700">
                    Write a Review
                  </Button>
                ) : (
                  <p className="text-gray-600">Sign in to leave a review</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetail;
