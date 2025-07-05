import { ProductCatalog } from '@/components/ProductCatalog';
import { Product } from '@/types/pos';

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  return (
    <div className="h-full bg-background">
      <div className="p-4 h-full">
        <ProductCatalog 
          onAddToCart={onAddToCart} 
          onAddProduct={() => {}} 
        />
      </div>
    </div>
  );
}