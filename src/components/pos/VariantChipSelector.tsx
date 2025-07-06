import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ProductVariant } from '@/types/pos';
import { Skeleton } from '@/components/ui/skeleton';

interface VariantChipSelectorProps {
  productId: string;
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantSelect: (variant: ProductVariant) => void;
  basePrice: number;
  showPrice?: boolean;
  compact?: boolean;
}

export function VariantChipSelector({
  productId,
  variants,
  selectedVariant,
  onVariantSelect,
  basePrice,
  showPrice = true,
  compact = false
}: VariantChipSelectorProps) {
  const [defaultVariant, setDefaultVariant] = useState<ProductVariant | null>(null);

  // Set default variant on mount
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      const firstAvailable = variants.find(v => v.stock_quantity > 0);
      if (firstAvailable) {
        setDefaultVariant(firstAvailable);
        onVariantSelect(firstAvailable);
      }
    }
  }, [variants, selectedVariant, onVariantSelect]);

  // Group variants by name (e.g., Size, Color, etc.)
  const groupedVariants = variants.reduce((groups, variant) => {
    if (!groups[variant.name]) {
      groups[variant.name] = [];
    }
    groups[variant.name].push(variant);
    return groups;
  }, {} as Record<string, ProductVariant[]>);

  const getVariantPrice = (variant: ProductVariant) => {
    return basePrice + variant.price_modifier;
  };

  const currentVariant = selectedVariant || defaultVariant;

  if (variants.length === 0) return null;

  return (
    <div className="space-y-2">
      {Object.entries(groupedVariants).map(([optionName, optionVariants]) => (
        <div key={optionName} className="space-y-1">
          {!compact && (
            <div className="text-xs font-medium text-gray-700">
              {optionName}:
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {optionVariants.map((variant) => {
              const isSelected = currentVariant?.id === variant.id;
              const isAvailable = variant.stock_quantity > 0;
              
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onVariantSelect(variant)}
                  disabled={!isAvailable}
                  className={`
                    px-2 py-1 text-xs rounded-full border transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${!isAvailable 
                      ? 'opacity-50 cursor-not-allowed line-through' 
                      : 'cursor-pointer hover:scale-105'
                    }
                    ${compact ? 'text-xs px-1.5 py-0.5' : ''}
                  `}
                >
                  <span className="font-medium">{variant.value}</span>
                  {showPrice && (
                    !currentVariant ? (
                      <Skeleton className="h-4 w-10 inline-block align-middle ml-1" />
                    ) : (
                      <span className={`ml-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        ₹{getVariantPrice(variant).toFixed(0)}
                      </span>
                    )
                  )}
                  {!isAvailable && (
                    <span className="ml-1 text-red-500">(Out)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Selected Variant Summary */}
      {currentVariant && !compact && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-900">
              Selected: {currentVariant.name}: {currentVariant.value}
            </span>
            <Badge className="bg-blue-600 text-white">
              ₹{getVariantPrice(currentVariant).toFixed(2)}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
} 