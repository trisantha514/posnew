/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Category, User, Customer, Sale, PurchaseOrder, ReturnPurchase, ReturnBill, Expense, SystemConfig } from './types';
import { 
  INITIAL_CONFIG, INITIAL_USERS, INITIAL_CATEGORIES, INITIAL_ITEMS, INITIAL_CUSTOMERS, INITIAL_EXPENSES, INITIAL_SALES, INITIAL_PURCHASE_ORDERS 
} from './data/initialData';

import LoginScreen from './components/LoginScreen';
import POSBilling from './components/POSBilling';
import InventoryManager from './components/InventoryManager';
import PurchaseOrders from './components/PurchaseOrders';
import CustomerAccounts from './components/CustomerAccounts';
import ExpensesManager from './components/ExpensesManager';
import ReportPanel from './components/ReportPanel';
import SystemIntegrations from './components/SystemIntegrations';
import BackupRestore from './components/BackupRestore';
import UserManager from './components/UserManager';

import { 
  ShoppingCart, Package, ClipboardList, Users, DollarSign, BarChart3, Cpu, Database, ShieldAlert, LogOut, Moon, Sun, Clock, Scale, Printer, Lock, ChevronRight, CheckCircle2, AlertTriangle, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- Change Password states ---
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  // --- Persistent States from LocalStorage ---
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('wcs_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('wcs_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('wcs_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('wcs_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('wcs_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('wcs_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('wcs_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [returnPurchases, setReturnPurchases] = useState<ReturnPurchase[]>(() => {
    const saved = localStorage.getItem('wcs_return_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [returnBills, setReturnBills] = useState<ReturnBill[]>(() => {
    const saved = localStorage.getItem('wcs_return_bills');
    return saved ? JSON.parse(saved) : [];
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('wcs_system_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  // --- Active Session ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('wcs_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // --- Active Tab Navigation ---
  // Default is 'billing' (Point of Sale)
  const [activeTab, setActiveTab] = useState<string>('billing');

  // --- Restricted Access Toast ---
  const [accessWarning, setAccessWarning] = useState<string | null>(null);

  // --- Time Tick ---
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Write updates back to LocalStorage on state modifications ---
  useEffect(() => {
    localStorage.setItem('wcs_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('wcs_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('wcs_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('wcs_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('wcs_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('wcs_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('wcs_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('wcs_return_purchases', JSON.stringify(returnPurchases));
  }, [returnPurchases]);

  useEffect(() => {
    localStorage.setItem('wcs_return_bills', JSON.stringify(returnBills));
  }, [returnBills]);

  useEffect(() => {
    localStorage.setItem('wcs_system_config', JSON.stringify(systemConfig));
  }, [systemConfig]);

  // --- Callback Handlers ---

  const handleLogin = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    setCurrentUser(user);
    localStorage.setItem('wcs_current_user', JSON.stringify(user));
    setActiveTab('billing'); // Reset to default point of sale billing upon authentication
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('wcs_current_user');
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (!currentUser) return;

    if (currentUser.passwordHash !== oldPassword) {
      setPwdError('The current password you entered is incorrect.');
      return;
    }

    if (newPassword.length < 4) {
      setPwdError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('The new passwords you entered do not match.');
      return;
    }

    // Success! Update password hash
    const updatedUser = {
      ...currentUser,
      passwordHash: newPassword,
      isFirstTime: false
    };

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    localStorage.setItem('wcs_current_user', JSON.stringify(updatedUser));
    
    setPwdSuccess('Your secure login password has been changed successfully!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAddSale = (sale: Sale) => {
    const updated = [sale, ...sales];
    setSales(updated);

    // If customer selected, add loyalty reward points
    if (sale.customerId) {
      const pointsEarned = Math.floor(sale.total / 100); // 1 point per Rs. 100 spent
      setCustomers(prev => prev.map(c => {
        if (c.id === sale.customerId) {
          let balanceChange = 0;
          if (sale.isSplitPayment && sale.splitCreditAmount) {
            balanceChange = -sale.splitCreditAmount; // split part not paid yet
          } else if (sale.paymentMethod === 'store_credit') {
            balanceChange = -sale.total; // owes store money (negative balance)
          }
          return {
            ...c,
            points: c.points + pointsEarned,
            outstandingBalance: parseFloat((c.outstandingBalance + balanceChange).toFixed(2))
          };
        }
        return c;
      }));
    }
  };

  const handleSubtractStock = (itemId: string, qtyToSubtract: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          stock: parseFloat(Math.max(0, item.stock - qtyToSubtract).toFixed(3))
        };
      }
      return item;
    }));
  };

  const handleAddStock = (itemId: string, qtyToAdd: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          stock: parseFloat((item.stock + qtyToAdd).toFixed(3))
        };
      }
      return item;
    }));
  };

  const handleAddCategory = (cat: Category) => {
    setCategories(prev => [...prev, cat]);
  };

  const handleUpdateCategory = (cat: Category) => {
    setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleAddItem = (item: Item) => {
    setItems(prev => [item, ...prev]);
  };

  const handleUpdateItem = (item: Item) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleAddPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [po, ...prev]);
  };

  const handleUpdatePurchaseOrderStatus = (id: string, status: 'Draft' | 'Sent' | 'Received') => {
    const po = purchaseOrders.find(p => p.id === id);
    const oldStatus = po?.status;

    setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, status } : p));

    // Automated inventory addition upon transition to Received status
    if (status === 'Received' && oldStatus !== 'Received' && po) {
      setItems(prevItems => prevItems.map(item => {
        const poLine = po.items.find(l => l.itemId === item.id);
        if (poLine) {
          return {
            ...item,
            stock: parseFloat((item.stock + poLine.quantity).toFixed(3))
          };
        }
        return item;
      }));
    }
  };

  const handleAddReturnPurchase = (ret: ReturnPurchase) => {
    setReturnPurchases(prev => [ret, ...prev]);
    // Deduct stock for supplier return
    setItems(prevItems => prevItems.map(item => {
      const line = ret.items.find(l => l.itemId === item.id);
      if (line) {
        return {
          ...item,
          stock: parseFloat(Math.max(0, item.stock - line.quantity).toFixed(3))
        };
      }
      return item;
    }));
  };

  const handleAddReturnBill = (ret: ReturnBill) => {
    setReturnBills(prev => [ret, ...prev]);
    // Add back stock returned by customer
    setItems(prevItems => prevItems.map(item => {
      const line = ret.items.find(l => l.itemId === item.id);
      if (line) {
        return {
          ...item,
          stock: parseFloat((item.stock + line.quantity).toFixed(3))
        };
      }
      return item;
    }));
  };

  const handleAddCustomer = (cust: Customer) => {
    setCustomers(prev => [...prev, cust]);
  };

  const handleUpdateCustomerBalance = (id: string, amountToSettle: number) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          outstandingBalance: parseFloat((c.outstandingBalance + amountToSettle).toFixed(2))
        };
      }
      return c;
    }));
  };

  const handleAddExpense = (exp: Expense) => {
    setExpenses(prev => [exp, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('wcs_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleRestoreState = (data: {
    items: Item[];
    categories: Category[];
    users: User[];
    customers: Customer[];
    sales: Sale[];
    expenses: Expense[];
  }) => {
    setItems(data.items);
    setCategories(data.categories);
    setUsers(data.users);
    setCustomers(data.customers);
    setSales(data.sales);
    setExpenses(data.expenses);
  };

  const handleBulkImportProducts = (importedItems: Item[]) => {
    const updated = [...importedItems];
    items.forEach(existing => {
      if (!updated.some(u => u.code === existing.code)) {
        updated.push(existing);
      }
    });
    setItems(updated);
  };

  // --- Analytical Live Metrics for Bento Navigation ---
  const metrics = useMemo(() => {
    const lowStockCount = items.filter(i => i.active && i.stock <= i.minStock).length;
    const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0);
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      lowStock: lowStockCount,
      uniqueProducts: items.length,
      customersCount: customers.length,
      expensesTotal: totalExpensesAmount,
      salesTotal: totalSalesAmount,
      usersCount: users.length,
      poCount: purchaseOrders.length
    };
  }, [items, sales, expenses, customers, users, purchaseOrders]);

  // --- Access Security Validation ---
  const selectTab = (tabName: string) => {
    if (!currentUser) return;
    
    // Restricted screens for Cashiers
    const adminScreens = ['inventory', 'orders', 'expenses', 'reports', 'backup', 'users'];
    if (currentUser.role === 'cashier' && adminScreens.includes(tabName)) {
      setAccessWarning(`Access Denied! Your role (${currentUser.role.toUpperCase()}) does not have permission to view backoffice analytics or administration panels.`);
      setTimeout(() => setAccessWarning(null), 5000);
      return;
    }
    
    setActiveTab(tabName);
  };

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return <LoginScreen users={users} onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col antialiased select-none selection:bg-teal-500 selection:text-white" id="main_root_container">
      
      {/* 1. TOP GLOBAL APP HEADER (BENTO CARD STYLE) */}
      <header className="p-4 bg-slate-900/60 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md" id="global_header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Brand block */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 shadow-inner">
              <ShoppingCart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-teal-500 uppercase">WCS Retail</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-semibold text-slate-400">v2.4 PRO</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">Inventory & POS Terminal</h1>
            </div>
          </div>

          {/* Center clock & notifications */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800/60 rounded-xl px-4 py-1.5 shadow-inner">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono text-slate-300 font-medium">{currentTime || 'Loading Terminal...'}</span>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <p className="text-sm font-semibold text-white">{currentUser.name}</p>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-400">
                {currentUser.role} Account
              </p>
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <button
              onClick={() => {
                setPwdError(null);
                setPwdSuccess(null);
                setShowChangePasswordModal(true);
              }}
              className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/30 text-slate-400 hover:text-teal-400 rounded-xl transition-all cursor-pointer"
              title="Change Password"
            >
              <Key className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-850 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/30 text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
              title="End session / Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN BENTO GRID DASHBOARD AREA */}
      <main className="flex-1 p-4 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5" id="main_dashboard_layout">
        
        {/* LEFT COLUMN: LIVE BENTO NAVIGATION PANELS (4 Cols) */}
        <nav className="lg:col-span-3 flex flex-col gap-4 h-full" id="bento_nav_sidebar">
          
          {/* Section title */}
          <div className="px-1 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Terminal Control Hub</span>
            <span className="text-[10px] text-slate-500 font-medium">Bento Grid Style</span>
          </div>

          {/* Navigation Items - Rendered as individual grid cards with metrics */}
          <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto pr-1" id="bento_nav_list">
            
            {/* Tab: POS Billing */}
            <div
              id="nav_item_billing"
              onClick={() => selectTab('billing')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                activeTab === 'billing'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'billing' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">POS Billing</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">80mm checkout register</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
            </div>

            {/* Tab: Inventory Manager */}
            <div
              id="nav_item_inventory"
              onClick={() => selectTab('inventory')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group relative ${
                currentUser.role === 'cashier' ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                activeTab === 'inventory'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">Products & Cats</h4>
                    {currentUser.role === 'cashier' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Stock controls & rates</p>
                </div>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded ${metrics.lowStock > 0 ? 'bg-rose-950/60 text-rose-400 border border-rose-900/30' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}>
                {metrics.lowStock > 0 ? `${metrics.lowStock} Low` : `${metrics.uniqueProducts} total`}
              </span>
            </div>

            {/* Tab: Purchase Orders */}
            <div
              id="nav_item_orders"
              onClick={() => selectTab('orders')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group relative ${
                currentUser.role === 'cashier' ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                activeTab === 'orders'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">Purchase Orders</h4>
                    {currentUser.role === 'cashier' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supplier returns & POs</p>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 font-bold bg-slate-950 border border-slate-800 text-slate-400 rounded">
                {metrics.poCount} POs
              </span>
            </div>

            {/* Tab: Customers */}
            <div
              id="nav_item_customers"
              onClick={() => selectTab('customers')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                activeTab === 'customers'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'customers' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">Customer Ledgers</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Points & store credits</p>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 font-bold bg-slate-950 border border-slate-800 text-teal-400 rounded">
                {metrics.customersCount} Custs
              </span>
            </div>

            {/* Tab: Expenses */}
            <div
              id="nav_item_expenses"
              onClick={() => selectTab('expenses')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group relative ${
                currentUser.role === 'cashier' ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                activeTab === 'expenses'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'expenses' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">Expenses Manager</h4>
                    {currentUser.role === 'cashier' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Log operational costs</p>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 font-bold bg-slate-950 border border-slate-800 text-rose-400 rounded">
                Rs.{metrics.expensesTotal}
              </span>
            </div>

            {/* Tab: Reports & Profit Analytics */}
            <div
              id="nav_item_reports"
              onClick={() => selectTab('reports')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group relative ${
                currentUser.role === 'cashier' ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                activeTab === 'reports'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">Reports & Analytics</h4>
                    {currentUser.role === 'cashier' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Revenue, P&L, valuation</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
            </div>

            {/* Tab: System Integrations */}
            <div
              id="nav_item_integrations"
              onClick={() => selectTab('integrations')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                activeTab === 'integrations'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'integrations' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">System Guides</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Scale, printer & SQL guides</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
            </div>

            {/* Tab: Backup / Recovery */}
            <div
              id="nav_item_backup"
              onClick={() => selectTab('backup')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group relative ${
                currentUser.role === 'cashier' ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                activeTab === 'backup'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'backup' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">Backup & Restore</h4>
                    {currentUser.role === 'cashier' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">JSON State, CSV imports</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
            </div>

            {/* Tab: User Security Profile Accounts */}
            <div
              id="nav_item_users"
              onClick={() => selectTab('users')}
              className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group relative ${
                currentUser.role === 'cashier' ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                activeTab === 'users'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'users' ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 border border-slate-800/60 text-teal-400'}`}>
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-tight text-white group-hover:text-teal-400 transition-colors">Operator Security</h4>
                    {currentUser.role === 'cashier' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Credential & role governance</p>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 font-bold bg-slate-950 border border-slate-800 text-slate-400 rounded">
                {metrics.usersCount} Operators
              </span>
            </div>

          </div>
        </nav>

        {/* RIGHT COLUMN: MAIN BENTO DISPLAY CANVAS (9 Cols) */}
        <section className="lg:col-span-9 bg-[#0b1329]/80 border border-slate-800 rounded-3xl p-5 flex flex-col relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-h-[calc(100vh-8rem)]" id="bento_display_canvas">
          
          {/* Floating warning toaster for denied privileges */}
          <AnimatePresence>
            {accessWarning && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-4 left-4 right-4 z-50 p-4 bg-rose-950 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-200 text-xs shadow-xl shadow-slate-950/40"
                id="access_denied_banner"
              >
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                <div className="flex-1">
                  <span className="font-bold block uppercase tracking-wider mb-0.5">Authorization Exception</span>
                  <span>{accessWarning}</span>
                </div>
                <button 
                  onClick={() => setAccessWarning(null)}
                  className="px-2 py-1 bg-rose-900/40 hover:bg-rose-900 border border-rose-800/40 hover:border-transparent rounded font-bold cursor-pointer"
                >
                  Dimiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active View Dispatcher */}
          <div className="flex-1 overflow-y-auto" id="active_bento_view_container">
            {activeTab === 'billing' && (
              <POSBilling
                categories={categories}
                items={items}
                customers={customers}
                systemConfig={systemConfig}
                sales={sales}
                onAddSale={handleAddSale}
                onAddCustomer={handleAddCustomer}
                onUpdateStock={handleSubtractStock}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryManager
                categories={categories}
                items={items}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
              />
            )}

            {activeTab === 'orders' && (
              <PurchaseOrders
                purchaseOrders={purchaseOrders}
                returnPurchases={returnPurchases}
                returnBills={returnBills}
                items={items}
                sales={sales}
                onAddPurchaseOrder={handleAddPurchaseOrder}
                onUpdatePurchaseOrderStatus={handleUpdatePurchaseOrderStatus}
                onAddReturnPurchase={handleAddReturnPurchase}
                onAddReturnBill={handleAddReturnBill}
                onUpdateStock={handleAddStock}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerAccounts
                customers={customers}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomerBalance={handleUpdateCustomerBalance}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesManager
                expenses={expenses}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'reports' && (
              <ReportPanel
                sales={sales}
                expenses={expenses}
                items={items}
                systemConfig={systemConfig}
                users={users}
                customers={customers}
                purchaseOrders={purchaseOrders}
                returnPurchases={returnPurchases}
              />
            )}

            {activeTab === 'integrations' && (
              <SystemIntegrations
                items={items}
                systemConfig={systemConfig}
              />
            )}

            {activeTab === 'backup' && (
              <BackupRestore
                items={items}
                categories={categories}
                users={users}
                customers={customers}
                sales={sales}
                expenses={expenses}
                onRestoreState={handleRestoreState}
                onBulkImportProducts={handleBulkImportProducts}
              />
            )}

            {activeTab === 'users' && (
              <UserManager
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                currentUser={currentUser}
              />
            )}
          </div>

        </section>

      </main>

      {/* --- PASSWORD CHANGE DIALOG MODAL --- */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="pwd_change_modal_backdrop">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden text-xs"
              id="pwd_change_modal_content"
            >
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4 mb-4">
                <div className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Change Security Password</h3>
                  <p className="text-[10px] text-slate-400">Update credentials for cashier or administrator session</p>
                </div>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                    Current Password
                  </label>
                  <input
                    id="pwd_old_input"
                    type="password"
                    required
                    placeholder="Enter current session password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                    New Secure Password
                  </label>
                  <input
                    id="pwd_new_input"
                    type="password"
                    required
                    placeholder="At least 4 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    id="pwd_confirm_input"
                    type="password"
                    required
                    placeholder="Re-type new secure password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono"
                  />
                </div>

                {/* Toast alerts inside modal */}
                {pwdError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/30 rounded-xl text-rose-400 font-bold flex items-start gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{pwdError}</span>
                  </div>
                )}

                {pwdSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 rounded-xl text-emerald-400 font-bold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{pwdSuccess}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPwdError(null);
                      setPwdSuccess(null);
                      setShowChangePasswordModal(false);
                    }}
                    className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-xl transition-all border border-slate-800 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-teal-500/10"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
