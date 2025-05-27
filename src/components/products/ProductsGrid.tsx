
import ProductCard from "./ProductCard";

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

interface ProductsGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  user: any;
}

const ProductsGrid = ({ products, onAddToCart, user }: ProductsGridProps) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onAddToCart={onAddToCart}
          user={user}
        />
      ))}
    </div>
  );
};

export default ProductsGrid;
