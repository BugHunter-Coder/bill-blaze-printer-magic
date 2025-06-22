
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  inStock: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Receipt {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  subtotal: number;
  timestamp: Date;
  paymentMethod: string;
}
