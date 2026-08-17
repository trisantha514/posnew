/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'owner' | 'cashier';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string; // Stored in state, simulated
  isFirstTime?: boolean; // Track if password change is required on first login
}

export type ProductUnit = 'pcs' | 'kg' | 'gram';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Item {
  id: string;
  name: string;
  code: string;
  barcode: string;
  categoryId: string;
  costPrice: number;   // Hidden from cashier
  retailPrice: number; // Selling price
  unit: ProductUnit;
  stock: number;
  minStock: number;
  image: string;       // base64 or placeholder url
  active: boolean;
  expiryDate?: string; // ISO date string (YYYY-MM-DD) or empty
}

export interface SaleItem {
  id: string; // matches item.id or unique line item
  itemId: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
  unit: ProductUnit;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  timestamp: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'store_credit' | 'qr_code' | 'bank_transfer' | 'cheque';
  customerId?: string;
  customerName?: string;
  isReturned?: boolean;
  isSplitPayment?: boolean;
  splitCashAmount?: number;
  splitCardAmount?: number;
  splitCreditAmount?: number;
  splitQrAmount?: number;
  cashReceived?: number;
  cashChange?: number;
  paymentReference?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  outstandingBalance: number; // Positive is store credit (they can spend it), negative is debt
}

export interface POItem {
  itemId: string;
  name: string;
  costPrice: number;
  quantity: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplier: string;
  orderDate: string;
  status: 'Draft' | 'Sent' | 'Received';
  items: POItem[];
  totalAmount: number;
}

export interface ReturnPurchase {
  id: string;
  returnNo: string;
  supplier: string;
  date: string;
  items: POItem[];
  totalAmount: number;
}

export interface ReturnBill {
  id: string;
  returnNo: string;
  saleInvoiceNo: string;
  date: string;
  reason: string;
  items: SaleItem[];
  refundAmount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  loggedBy: string;
  remarks?: string;
}

export interface SystemConfig {
  logoUrl: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptHeader: string;
  receiptFooter: string;
  taxPercentage: number;
}
