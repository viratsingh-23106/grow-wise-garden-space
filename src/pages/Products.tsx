
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProductsHeader from "@/components/products/ProductsHeader";
import ProductsFilters from "@/components/products/ProductsFilters";
import ProductsGrid from "@/components/products/ProductsGrid";
import IoTKitPromotion from "@/components/products/IoTKitPromotion";

const Products = () => {
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const { addToCart } = useCart();
  const { user } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

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

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductsHeader />
        
        <ProductsFilters 
          selectedType={selectedType}
          sortBy={sortBy}
          onTypeChange={setSelectedType}
          onSortChange={setSortBy}
        />

        <ProductsGrid 
          products={filteredProducts}
          onAddToCart={handleAddToCart}
          user={user}
        />

        <IoTKitPromotion />
      </div>
    </div>
  );
};

export default Products;
