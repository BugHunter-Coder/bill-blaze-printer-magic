
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
  orderNumber: number;
}

export interface ShopDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  logo?: string;
  currency: string;
  taxRate: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  receipt?: string;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'purchase' | 'expense';
  amount: number;
  date: Date;
  description: string;
  items?: CartItem[];
  category?: string;
}

export interface DailyReport {
  date: string;
  totalSales: number;
  totalExpenses: number;
  totalProfit: number;
  transactionCount: number;
  topSellingItems: { name: string; quantity: number; revenue: number }[];
}
