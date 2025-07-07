import { ProductVariant } from '@/types/pos';

interface VariantChipSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantSelect: (variant: ProductVariant) => void;
}

export function VariantChipSelector({
  variants,
  selectedVariant,
  onVariantSelect,
}: VariantChipSelectorProps) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id;
          const isAvailable = variant.stock_quantity > 0;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onVariantSelect(variant)}
              disabled={!isAvailable}
              className={`
                px-3 py-1 rounded-full border text-sm font-medium transition-all
                ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
                ${!isAvailable ? 'opacity-50 cursor-not-allowed line-through' : 'cursor-pointer hover:scale-105'}
              `}
            >
              {variant.value} <span className="ml-1">₹{typeof variant.price === 'number' ? variant.price.toFixed(0) : '—'}</span>
              {!isAvailable && <span className="ml-1 text-red-500">(Out)</span>}
            </button>
          );
        })}
      </div>
      {selectedVariant && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-sm">
          <span className="text-blue-900 font-medium">
            Selected: {selectedVariant.value}
          </span>
          <span className="font-bold text-blue-700">
            ₹{typeof selectedVariant.price === 'number' ? selectedVariant.price.toFixed(2) : '—'}
          </span>
        </div>
      )}
    </div>
  );
} 