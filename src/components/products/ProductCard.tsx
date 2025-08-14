
import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sensorTypes = {
  "soil-moisture": { name: "Soil Moisture", color: "bg-blue-100 text-blue-800" },
  "temperature": { name: "Temperature", color: "bg-red-100 text-red-800" },
  "humidity": { name: "Humidity", color: "bg-teal-100 text-teal-800" },
  "light": { name: "Light", color: "bg-yellow-100 text-yellow-800" },
  "ph": { name: "pH Level", color: "bg-purple-100 text-purple-800" },
  "nutrients": { name: "Nutrients", color: "bg-green-100 text-green-800" },
  "all": { name: "All Sensors", color: "bg-gray-100 text-gray-800" }
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  image_url: string;
  sensors: string[];
  guidance_steps: number;
  stock_quantity: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  user: any;
}

const ProductCard = ({ product, onAddToCart, user }: ProductCardProps) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="aspect-square overflow-hidden">
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500'} 
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
            {product.price}
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
            {product.sensors?.map((sensor) => (
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
          <span>{product.guidance_steps} guidance steps</span>
          <span>{product.stock_quantity} in stock</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onAddToCart(product.id)}
            disabled={!user}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {user ? 'Add to Cart' : 'Sign in to Buy'}
          </Button>
          <Button asChild variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            <Link to={`/products/${product.id}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
