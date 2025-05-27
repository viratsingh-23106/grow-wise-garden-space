
import { useState, useEffect } from "react";
import { ArrowLeft, Thermometer, Droplets, Sun, FlaskConical, Zap, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";

const sensorFeatures = [
  {
    name: "Soil Moisture Sensor",
    icon: Droplets,
    description: "Monitor soil hydration levels in real-time",
    specs: "±3% accuracy, 0-100% range",
    color: "bg-blue-100 text-blue-800"
  },
  {
    name: "Temperature Sensor",
    icon: Thermometer,
    description: "Track ambient and soil temperature",
    specs: "±0.5°C accuracy, -40°C to 85°C range",
    color: "bg-red-100 text-red-800"
  },
  {
    name: "Light Sensor",
    icon: Sun,
    description: "Measure light intensity and photoperiod",
    specs: "0-65,000 lux range, UV detection",
    color: "bg-yellow-100 text-yellow-800"
  },
  {
    name: "pH Sensor",
    icon: FlaskConical,
    description: "Monitor soil acidity and alkalinity",
    specs: "±0.1 pH accuracy, 0-14 pH range",
    color: "bg-purple-100 text-purple-800"
  },
  {
    name: "Humidity Sensor",
    icon: Eye,
    description: "Track air humidity levels",
    specs: "±2% RH accuracy, 0-100% range",
    color: "bg-teal-100 text-teal-800"
  },
  {
    name: "Nutrient Sensor",
    icon: Zap,
    description: "Detect NPK levels in soil",
    specs: "EC measurement, 0-20 mS/cm range",
    color: "bg-green-100 text-green-800"
  }
];

const SensorKit = () => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [sensorKitProduct, setSensorKitProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSensorKitProduct = async () => {
      try {
        // Look for a product that has all sensor types or is specifically a sensor kit
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or('name.ilike.%sensor kit%,name.ilike.%iot%')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSensorKitProduct(data[0]);
        } else {
          // If no sensor kit found, create a fallback product data
          setSensorKitProduct({
            id: null,
            name: 'Complete IoT Sensor Kit',
            price: 149.99,
            description: 'Monitor soil moisture, temperature, humidity, light, pH, and nutrients with our comprehensive sensor package',
            stock_quantity: 25
          });
        }
      } catch (error) {
        console.error('Error fetching sensor kit product:', error);
        // Fallback product data
        setSensorKitProduct({
          id: null,
          name: 'Complete IoT Sensor Kit',
          price: 149.99,
          description: 'Monitor soil moisture, temperature, humidity, light, pH, and nutrients with our comprehensive sensor package',
          stock_quantity: 25
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSensorKitProduct();
  }, []);

  const handleAddToCart = async () => {
    if (!sensorKitProduct || !sensorKitProduct.id) {
      console.log('No sensor kit product available to add to cart');
      return;
    }
    await addToCart(sensorKitProduct.id, selectedQuantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="text-green-600 hover:bg-green-50">
            <Link to="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <div className="mb-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {sensorKitProduct?.name || 'Complete IoT Sensor Kit'}
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                {sensorKitProduct?.description || 'Monitor every aspect of your garden with our comprehensive sensor package. Get real-time data on soil moisture, temperature, humidity, light, pH, and nutrients.'}
              </p>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-green-600">
                  ${sensorKitProduct?.price || '149.99'}
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Complete Kit
                </Badge>
              </div>
              
              {/* Quantity and Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="quantity" className="text-sm font-medium">Quantity:</label>
                  <select 
                    id="quantity"
                    value={selectedQuantity} 
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-1"
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleAddToCart}
                  disabled={!user || !sensorKitProduct?.id}
                >
                  {!user ? 'Sign in to Buy' : !sensorKitProduct?.id ? 'Product Unavailable' : 'Add to Cart'}
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600" 
                alt="IoT Sensor Kit"
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Sensor Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What's Included</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensorFeatures.map((sensor) => (
              <Card key={sensor.name} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${sensor.color}`}>
                      <sensor.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{sensor.name}</CardTitle>
                  </div>
                  <CardDescription>{sensor.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    {sensor.specs}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Technical Specifications</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Hardware Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Connectivity:</span>
                  <span>WiFi 802.11 b/g/n, Bluetooth 5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Power:</span>
                  <span>Solar + Battery backup</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Range:</span>
                  <span>100m outdoor, 30m indoor</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Weather Resistance:</span>
                  <span>IP65 rated</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Software Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Data Logging:</span>
                  <span>Real-time + Historical</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Alerts:</span>
                  <span>Email, SMS, Push notifications</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Mobile App:</span>
                  <span>iOS & Android compatible</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">API Access:</span>
                  <span>REST API & Webhooks</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Setup Process */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Easy Setup Process</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: "Unbox & Charge", desc: "Solar panels charge automatically" },
              { step: 2, title: "Download App", desc: "Available on iOS and Android" },
              { step: 3, title: "Connect Sensors", desc: "Follow guided setup wizard" },
              { step: 4, title: "Start Monitoring", desc: "Real-time data in minutes" }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Smart Gardening Today
          </h2>
          <p className="text-xl mb-6 text-green-100">
            Join thousands of gardeners using data-driven insights to grow better crops
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="bg-white text-green-600 hover:bg-gray-100"
            onClick={handleAddToCart}
            disabled={!user || !sensorKitProduct?.id}
          >
            {!user ? 'Sign In to Purchase' : !sensorKitProduct?.id ? 'Product Unavailable' : `Add to Cart - $${sensorKitProduct?.price || '149.99'}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SensorKit;
