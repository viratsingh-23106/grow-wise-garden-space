
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductsFiltersProps {
  selectedType: string;
  sortBy: string;
  onTypeChange: (type: string) => void;
  onSortChange: (sort: string) => void;
}

const ProductsFilters = ({ selectedType, sortBy, onTypeChange, onSortChange }: ProductsFiltersProps) => {
  return (
    <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <Select value={selectedType} onValueChange={onTypeChange}>
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
      
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="price">Price</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductsFilters;
