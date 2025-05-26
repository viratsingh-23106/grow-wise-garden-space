
import { useState } from "react";
import { Link } from "react-router-dom";
import { Filter, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NavBar from "@/components/NavBar";

// Mock product data with IoT sensor recommendations
const products = [
  {
    id: 1,
    name: "Heirloom Tomato Seeds",
    type: "seeds",
    price: 12.99,
    description: "Premium organic heirloom tomato seeds for exceptional flavor",
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500",
    stockQuantity: 50,
    sensors: ["soil-moisture", "temperature", "light", "ph"],
    guidanceSteps: 8
  },
  {
    id: 2,
    name: "Basil Plant Starter",
    type: "plants",
    price: 8.99,
    description: "Healthy basil plant ready for transplanting",
    imageUrl: "https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=500",
    stockQuantity: 25,
    sensors: ["humidity", "light", "temperature"],
    guidanceSteps: 5
  },
  {
    id: 3,
    name: "Smart Garden Trowel",
    type: "tools",
    price: 24.99,
    description: "Ergonomic trowel with soil analysis capabilities",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
    stockQuantity: 15,
    sensors: ["soil-moisture", "ph", "nutrients"],
    guidanceSteps: 3
  },
  {
    id: 4,
    name: "Lettuce Seed Mix",
    type: "seeds",
    price: 9.99,
    description: "Variety pack of lettuce seeds for continuous harvest",
    imageUrl: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500",
    stockQuantity: 35,
    sensors: ["soil-moisture", "temperature", "nutrients"],
    guidanceSteps: 6
  },
  {
    id: 5,
    name: "Pepper Plant Bundle",
    type: "plants",
    price: 19.99,
    description: "Set of 3 pepper plants: bell, jalapeño, and habanero",
    imageUrl: "https://images.unsplash.com/photo-1583663508051-17a4540d4915?w=500",
    stockQuantity: 20,
    sensors: ["temperature", "humidity", "light", "soil-moisture"],
    guidanceSteps: 7
  },
  {
    id: 6,
    name: "IoT Sensor Starter Kit",
    type: "tools",
    price: 149.99,
    description: "Complete sensor kit for monitoring soil and environment",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500",
    stockQuantity: 10,
    sensors: ["all"],
    guidanceSteps: 10
  }
];

const sensorTypes = {
  "soil-moisture": { name: "Soil Moisture", color: "bg-blue-100 text-blue-800" },
  "temperature": { name: "Temperature", color: "bg-red-100 text-red-800" },
  "humidity": { name: "Humidity", color: "bg-teal-100 text-teal-800" },
  "light": { name: "Light", color: "bg-yellow-100 text-yellow-800" },
  "ph": { name: "pH Level", color: "bg-purple-100 text-purple-800" },
  "nutrients": { name: "Nutrients", color: "bg-green-100 text-green-800" },
  "all": { name: "All Sensors", color: "bg-gray-100 text-gray-800" }
};

const Products = () => {
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const filteredProducts = products
    .filter(product => selectedType === "all" || product.type === selectedType)
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Products & IoT Solutions
          </h1>
          <p className="text-xl text-gray-600">
            Discover our curated selection of seeds, plants, and smart tools with integrated sensor recommendations
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="seeds">Seeds</SelectItem>
                <SelectItem value="plants">Plants</SelectItem>
                <SelectItem value="tools">Tools & Sensors</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.type}
                  </Badge>
                  <span className="text-2xl font-bold text-green-600">
                    ${product.price}
                  </span>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {product.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {product.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* IoT Sensors */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Recommended Sensors:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {product.sensors.map((sensor) => (
                      <Badge 
                        key={sensor} 
                        variant="secondary" 
                        className={`text-xs ${sensorTypes[sensor]?.color}`}
                      >
                        {sensorTypes[sensor]?.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Guidance Steps */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{product.guidanceSteps} guidance steps</span>
                  <span>{product.stockQuantity} in stock</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button asChild variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    <Link to={`/products/${product.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* IoT Kit Promotion */}
        <div className="mt-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Complete IoT Sensor Kit
            </h2>
            <p className="text-xl mb-6 text-green-100">
              Monitor soil moisture, temperature, humidity, light, pH, and nutrients with our comprehensive sensor package
            </p>
            <div className="flex justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                View Sensor Kit Details <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
