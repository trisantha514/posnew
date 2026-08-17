/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Item, User, Customer, Expense, Sale, PurchaseOrder, SystemConfig } from '../types';

export const INITIAL_CONFIG: SystemConfig = {
  logoUrl: '', // Default placeholder, will render custom inline SVG if empty
  storeName: 'WCS Supermarket & POS',
  storeAddress: '123 Business Lane, Colombo, Sri Lanka',
  storePhone: '+94 11 234 5678',
  receiptHeader: 'Thank you for shopping at WCS!',
  receiptFooter: 'Powering retail with speed & accuracy.',
  taxPercentage: 5,
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_1',
    username: 'admin',
    name: 'WCS Administrator',
    role: 'admin',
    passwordHash: 'admin123',
    isFirstTime: true,
  },
  {
    id: 'usr_2',
    username: 'owner',
    name: 'WCS Owner Account',
    role: 'owner',
    passwordHash: 'owner123',
    isFirstTime: true,
  },
  {
    id: 'usr_3',
    username: 'cashier',
    name: 'Regular Cashier',
    role: 'cashier',
    passwordHash: 'cashier123',
    isFirstTime: true,
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Grocery & Staples', description: 'Grains, oils, sugar, flour, and spices' },
  { id: 'cat_2', name: 'Vegetables & Fruits', description: 'Fresh farm-fresh farm produce' },
  { id: 'cat_3', name: 'Beverages', description: 'Juices, sodas, water, tea, and coffee' },
  { id: 'cat_4', name: 'Dairy & Eggs', description: 'Milk, cheese, butter, yogurt, and eggs' },
  { id: 'cat_5', name: 'Bakery & Snacks', description: 'Breads, cookies, cakes, and chips' },
];

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'itm_1',
    name: 'Premium Basmati Rice',
    code: 'RICE-BAS-01',
    barcode: '8901234567890',
    categoryId: 'cat_1',
    costPrice: 120.00,
    retailPrice: 180.00,
    unit: 'kg',
    stock: 250.50,
    minStock: 50.0,
    image: '',
    active: true,
  },
  {
    id: 'itm_2',
    name: 'White Sugar',
    code: 'SUG-WHT-02',
    barcode: '8901234567891',
    categoryId: 'cat_1',
    costPrice: 90.00,
    retailPrice: 130.00,
    unit: 'kg',
    stock: 120.25,
    minStock: 30.0,
    image: '',
    active: true,
  },
  {
    id: 'itm_3',
    name: 'Fresh Red Tomatoes',
    code: 'VEG-TOM-03',
    barcode: '8901234567892',
    categoryId: 'cat_2',
    costPrice: 75.00,
    retailPrice: 120.00,
    unit: 'kg',
    stock: 45.10,
    minStock: 15.0,
    image: '',
    active: true,
  },
  {
    id: 'itm_4',
    name: 'Fresh Red Apples',
    code: 'FRT-APL-04',
    barcode: '8901234567893',
    categoryId: 'cat_2',
    costPrice: 210.00,
    retailPrice: 320.00,
    unit: 'kg',
    stock: 35.80,
    minStock: 10.0,
    image: '',
    active: true,
  },
  {
    id: 'itm_5',
    name: 'Full Cream Milk 1L',
    code: 'DRY-MLK-05',
    barcode: '8901234567894',
    categoryId: 'cat_4',
    costPrice: 180.00,
    retailPrice: 240.00,
    unit: 'pcs',
    stock: 80,
    minStock: 20,
    image: '',
    active: true,
  },
  {
    id: 'itm_6',
    name: 'Premium Ceylon Tea 250g',
    code: 'BEV-TEA-06',
    barcode: '8901234567895',
    categoryId: 'cat_3',
    costPrice: 320.00,
    retailPrice: 450.00,
    unit: 'pcs',
    stock: 42,
    minStock: 10,
    image: '',
    active: true,
  },
  {
    id: 'itm_7',
    name: 'Sliced Sandwich Bread',
    code: 'BAK-BRD-07',
    barcode: '8901234567896',
    categoryId: 'cat_5',
    costPrice: 85.00,
    retailPrice: 120.00,
    unit: 'pcs',
    stock: 15,
    minStock: 5,
    image: '',
    active: true,
  },
  {
    id: 'itm_8',
    name: 'Salted Butter 200g',
    code: 'DRY-BTR-08',
    barcode: '8901234567897',
    categoryId: 'cat_4',
    costPrice: 290.00,
    retailPrice: 390.00,
    unit: 'pcs',
    stock: 22,
    minStock: 8,
    image: '',
    active: true,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Manjula Trisantha',
    phone: '0771234567',
    email: 'manjulatrisantha92@gmail.com',
    points: 150,
    outstandingBalance: 1250.00,
  },
  {
    id: 'cust_2',
    name: 'Samantha Perera',
    phone: '0719876543',
    email: 'samantha.p@example.com',
    points: 85,
    outstandingBalance: -500.00, // Debted (owes store money)
  },
  {
    id: 'cust_3',
    name: 'Nilanthi De Silva',
    phone: '0723456789',
    email: 'nilanthi.ds@example.com',
    points: 12,
    outstandingBalance: 0,
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    title: 'Store Electricity Bill (July)',
    amount: 14500.00,
    category: 'Utilities',
    date: '2026-08-05',
    loggedBy: 'WCS Administrator',
    remarks: 'CEB Electricity payment',
  },
  {
    id: 'exp_2',
    title: 'Water Bill',
    amount: 2800.00,
    category: 'Utilities',
    date: '2026-08-08',
    loggedBy: 'WCS Administrator',
    remarks: 'NWSDB payment',
  },
  {
    id: 'exp_3',
    title: 'Shop Assistant Daily Wage',
    amount: 3500.00,
    category: 'Salaries',
    date: '2026-08-15',
    loggedBy: 'WCS Owner Account',
    remarks: 'Paid in cash',
  },
];

// Seed sales for analytics
const generateSeedSales = (): Sale[] => {
  const sales: Sale[] = [];
  const baseDate = new Date();
  
  // Create sales over the past 30 days
  for (let i = 29; i >= 0; i--) {
    const saleDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
    // 2-4 transactions per day
    const numSales = Math.floor(Math.random() * 3) + 2;
    for (let s = 0; s < numSales; s++) {
      const invoiceNum = 10000 + i * 10 + s;
      const isCard = Math.random() > 0.6;
      const isCredit = !isCard && Math.random() > 0.8;
      
      const itemsSelected = [
        { ...INITIAL_ITEMS[0], quantity: Math.random() * 5 + 1 }, // Rice
        { ...INITIAL_ITEMS[4], quantity: Math.floor(Math.random() * 3) + 1 }, // Milk
        { ...INITIAL_ITEMS[2], quantity: Math.random() * 2 + 0.5 }, // Tomatoes
      ];
      
      const saleItems = itemsSelected.map(itm => {
        const qty = parseFloat(itm.quantity.toFixed(itm.unit === 'kg' ? 3 : 0));
        return {
          id: itm.id + '_' + invoiceNum,
          itemId: itm.id,
          name: itm.name,
          code: itm.code,
          price: itm.retailPrice,
          quantity: qty,
          unit: itm.unit,
          total: parseFloat((itm.retailPrice * qty).toFixed(2)),
        };
      });
      
      const subtotal = saleItems.reduce((acc, curr) => acc + curr.total, 0);
      const discount = Math.random() > 0.7 ? parseFloat((subtotal * 0.05).toFixed(2)) : 0;
      const tax = parseFloat(((subtotal - discount) * 0.05).toFixed(2));
      const total = parseFloat((subtotal - discount + tax).toFixed(2));
      
      const customer = INITIAL_CUSTOMERS[Math.floor(Math.random() * INITIAL_CUSTOMERS.length)];
      
      sales.push({
        id: `sale_${invoiceNum}`,
        invoiceNo: `WCS-INV-${invoiceNum}`,
        timestamp: new Date(saleDate.setHours(10 + s * 2, Math.floor(Math.random() * 60))).toISOString(),
        cashierId: 'usr_3',
        cashierName: 'Regular Cashier',
        items: saleItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount,
        tax,
        total,
        paymentMethod: isCard ? 'card' : (isCredit ? 'store_credit' : 'cash'),
        customerId: Math.random() > 0.4 ? customer.id : undefined,
        customerName: Math.random() > 0.4 ? customer.name : undefined,
      });
    }
  }
  return sales;
};

export const INITIAL_SALES: Sale[] = generateSeedSales();

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po_1',
    poNo: 'WCS-PO-1001',
    supplier: 'Ceylon Grain Suppliers Ltd.',
    orderDate: '2026-08-10',
    status: 'Received',
    items: [
      {
        itemId: 'itm_1',
        name: 'Premium Basmati Rice',
        costPrice: 120.00,
        quantity: 100,
        total: 12000.00,
      },
      {
        itemId: 'itm_2',
        name: 'White Sugar',
        costPrice: 90.00,
        quantity: 50,
        total: 4500.00,
      },
    ],
    totalAmount: 16500.00,
  },
  {
    id: 'po_2',
    poNo: 'WCS-PO-1002',
    supplier: 'Dairies Sri Lanka Co.',
    orderDate: '2026-08-14',
    status: 'Sent',
    items: [
      {
        itemId: 'itm_5',
        name: 'Full Cream Milk 1L',
        costPrice: 180.00,
        quantity: 120,
        total: 21600.00,
      },
    ],
    totalAmount: 21600.00,
  },
];
