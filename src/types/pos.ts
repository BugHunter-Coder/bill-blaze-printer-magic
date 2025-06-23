export interface DatabaseProduct {
  id: string;
  shop_id: string;
  category_id?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  inStock: boolean;
  stock_quantity?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  logo_url?: string;
  currency: string;
  tax_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Keep ShopDetails as alias for backward compatibility
export type ShopDetails = Shop;

export interface UserProfile {
  id: string;
  shop_id?: string;
  full_name?: string;
  role: 'admin' | 'cashier' | 'manager';
  is_active: boolean;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  total_purchases: number;
  last_purchase_date?: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  shop_id: string;
  customer_id?: string;
  cashier_id?: string;
  type: 'sale' | 'purchase' | 'expense' | 'refund';
  invoice_number?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  payment_reference?: string;
  notes?: string;
  is_direct_billing: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Expense {
  id: string;
  shop_id: string;
  category: string;
  description: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  receipt_url?: string;
  created_by?: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  date: string;
  totalSales: number;
  totalTransactions: number;
  totalExpenses: number;
  totalProfit: number;
  transactionCount: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
] as const;
