/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Sale, Expense, Item, SystemConfig, User, Customer, PurchaseOrder, ReturnPurchase } from '../types';
import { 
  TrendingUp, DollarSign, ShoppingBag, FileText, Printer, Shield, 
  Package, Users, Briefcase, ChevronRight, ClipboardList, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface ReportPanelProps {
  sales: Sale[];
  expenses: Expense[];
  items: Item[];
  systemConfig: SystemConfig;
  users?: User[];
  customers?: Customer[];
  purchaseOrders?: PurchaseOrder[];
  returnPurchases?: ReturnPurchase[];
}

type MainReportTab = 'financials' | 'inventory' | 'cashiers' | 'suppliers' | 'expenses';

export default function ReportPanel({
  sales = [],
  expenses = [],
  items = [],
  systemConfig,
  users = [],
  customers = [],
  purchaseOrders = [],
  returnPurchases = []
}: ReportPanelProps) {
  // Main Tab Navigation
  const [activeMainTab, setActiveMainTab] = useState<MainReportTab>('financials');
  
  // Financial Tab Range: 'daily' | 'monthly' | 'yearly'
  const [financialRange, setFinancialRange] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  // Search/Filters within reports
  const [inventorySearch, setInventorySearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

  // Today's Date String
  const todayStr = new Date().toISOString().split('T')[0];

  // ==========================================
  // 1. FINANCIAL ANALYTICS & P&L
  // ==========================================
  const stats = useMemo(() => {
    const now = new Date();
    
    const filteredSales = sales.filter(s => {
      const sDate = new Date(s.timestamp);
      if (financialRange === 'daily') {
        return s.timestamp.startsWith(todayStr);
      } else if (financialRange === 'monthly') {
        return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      } else if (financialRange === 'yearly') {
        return sDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const filteredExpenses = expenses.filter(e => {
      const eDate = new Date(e.date);
      if (financialRange === 'daily') {
        return e.date === todayStr;
      } else if (financialRange === 'monthly') {
        return eDate.getMonth() === now.getMonth() && eDate.getFullYear() === now.getFullYear();
      } else if (financialRange === 'yearly') {
        return eDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const grossSales = filteredSales.reduce((sum, curr) => sum + curr.total, 0);
    const totalExpenses = filteredExpenses.reduce((sum, curr) => sum + curr.amount, 0);

    let cogs = 0;
    filteredSales.forEach(s => {
      s.items.forEach(line => {
        const item = items.find(i => i.id === line.itemId);
        const itemCost = item ? item.costPrice : (line.price * 0.7);
        cogs += line.quantity * itemCost;
      });
    });

    const grossProfit = grossSales - cogs;
    const netProfit = grossProfit - totalExpenses;
    const hiddenFiftySplit = Math.max(0, netProfit * 0.5);

    return {
      grossSales,
      totalExpenses,
      cogs,
      grossProfit,
      netProfit,
      calculateReportVal: hiddenFiftySplit,
      salesCount: filteredSales.length,
      expensesCount: filteredExpenses.length
    };
  }, [sales, expenses, items, financialRange, todayStr]);

  // ==========================================
  // 2. INVENTORY VALUE REPORT DATA
  // ==========================================
  const inventoryData = useMemo(() => {
    const list = items.map(item => {
      const stockValCost = item.stock * item.costPrice;
      const stockValRetail = item.stock * item.retailPrice;
      const potentialProfit = stockValRetail - stockValCost;
      const isLow = item.stock <= item.minStock;
      const isExpired = item.expiryDate ? new Date(item.expiryDate) < new Date() : false;

      return {
        ...item,
        stockValCost,
        stockValRetail,
        potentialProfit,
        isLow,
        isExpired
      };
    });

    const totalCostValue = list.reduce((sum, i) => sum + i.stockValCost, 0);
    const totalRetailValue = list.reduce((sum, i) => sum + i.stockValRetail, 0);
    const totalPotentialProfit = totalRetailValue - totalCostValue;
    const lowStockItems = list.filter(i => i.isLow);
    const expiredItems = list.filter(i => i.isExpired);

    return {
      list,
      totalCostValue,
      totalRetailValue,
      totalPotentialProfit,
      lowStockItems,
      expiredItems
    };
  }, [items]);

  // Filtered Inventory list for render
  const filteredInventoryList = useMemo(() => {
    if (!inventorySearch) return inventoryData.list;
    const clean = inventorySearch.toLowerCase();
    return inventoryData.list.filter(i => 
      i.name.toLowerCase().includes(clean) || 
      i.code.toLowerCase().includes(clean) || 
      i.barcode.includes(clean)
    );
  }, [inventoryData.list, inventorySearch]);

  // ==========================================
  // 3. CASHIER PERFORMANCE & BALANCE SHEET DATA
  // ==========================================
  const cashierReports = useMemo(() => {
    // Generate statistics for every user/cashier
    return users.map(user => {
      // Find sales handled by this user
      const userSales = sales.filter(s => s.cashierId === user.id);
      const totalSalesRevenue = userSales.reduce((sum, s) => sum + s.total, 0);
      const salesCount = userSales.length;
      const avgOrder = salesCount > 0 ? totalSalesRevenue / salesCount : 0;

      // Cash balance calculations (for cash balance sheet)
      // Including split payments if present, else standard paymentMethod
      let cashSales = 0;
      let cardSales = 0;
      let qrSales = 0;
      let creditSales = 0;

      userSales.forEach(s => {
        if (s.isSplitPayment) {
          cashSales += s.splitCashAmount || 0;
          cardSales += s.splitCardAmount || 0;
          qrSales += s.splitQrAmount || 0;
          creditSales += s.splitCreditAmount || 0;
        } else {
          if (s.paymentMethod === 'cash') cashSales += s.total;
          else if (s.paymentMethod === 'card') cardSales += s.total;
          else if (s.paymentMethod === 'qr_code') qrSales += s.total;
          else if (s.paymentMethod === 'store_credit') creditSales += s.total;
          else cashSales += s.total; // Default/Fallback to cash
        }
      });

      return {
        user,
        salesCount,
        totalSalesRevenue,
        avgOrder,
        balances: {
          cash: cashSales,
          card: cardSales,
          qr: qrSales,
          credit: creditSales,
          totalCollected: cashSales + cardSales + qrSales + creditSales
        }
      };
    });
  }, [users, sales]);

  // ==========================================
  // 4. SUPPLIER ACCOUNTS & OUTSTANDING LEDGER
  // ==========================================
  const supplierLedger = useMemo(() => {
    // Collect all suppliers mentioned in POs
    const uniqueSuppliers = Array.from(new Set(purchaseOrders.map(po => po.supplier.trim())));
    if (uniqueSuppliers.length === 0 && purchaseOrders.length > 0) {
      // Safeguard if supplier is empty
      uniqueSuppliers.push("General Supplier");
    }

    const report = uniqueSuppliers.map(supName => {
      const supPOs = purchaseOrders.filter(po => po.supplier.trim() === supName || (supName === "General Supplier" && !po.supplier.trim()));
      const totalPOAmount = supPOs.reduce((sum, po) => sum + po.totalAmount, 0);
      const receivedPOs = supPOs.filter(po => po.status === 'Received');
      const receivedVal = receivedPOs.reduce((sum, po) => sum + po.totalAmount, 0);
      const pendingPOs = supPOs.filter(po => po.status !== 'Received');
      const pendingVal = pendingPOs.reduce((sum, po) => sum + po.totalAmount, 0);

      // Find returns sent to this supplier
      const supReturns = returnPurchases.filter(ret => ret.supplier.trim() === supName || (supName === "General Supplier" && !ret.supplier.trim()));
      const returnsVal = supReturns.reduce((sum, ret) => sum + ret.totalAmount, 0);

      // Current Simulated Outstanding Balance 
      // (Received Inventory value - Returns sent) represents accounts payable balance
      const outstandingBalance = receivedVal - returnsVal;

      return {
        supplierName: supName || "General Supplier",
        poCount: supPOs.length,
        totalPOAmount,
        receivedVal,
        pendingVal,
        returnsVal,
        outstandingBalance
      };
    });

    const cumulativeBalance = report.reduce((sum, s) => sum + s.outstandingBalance, 0);
    const cumulativeReceived = report.reduce((sum, s) => sum + s.receivedVal, 0);
    const cumulativeReturns = report.reduce((sum, s) => sum + s.returnsVal, 0);

    return {
      report,
      cumulativeBalance,
      cumulativeReceived,
      cumulativeReturns
    };
  }, [purchaseOrders, returnPurchases]);

  const filteredSupplierLedger = useMemo(() => {
    if (!supplierSearch) return supplierLedger.report;
    const clean = supplierSearch.toLowerCase();
    return supplierLedger.report.filter(s => s.supplierName.toLowerCase().includes(clean));
  }, [supplierLedger.report, supplierSearch]);

  // ==========================================
  // 5. EXPENSES SUMMARY
  // ==========================================
  const totalExpensesSum = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // ==========================================
  // UNIVERSAL PRINT FLOW (iFrame-friendly popup)
  // ==========================================
  const triggerPrintSection = (elementId: string, title: string) => {
    const content = document.getElementById(elementId)?.innerHTML;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                font-family: 'Courier New', Courier, monospace;
                padding: 30px;
                color: #000;
                background-color: #fff;
              }
              .header {
                text-align: center;
                border-bottom: 3px double #000;
                padding-bottom: 12px;
                margin-bottom: 25px;
              }
              .header h1 {
                margin: 0;
                font-size: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .header p {
                margin: 4px 0;
                font-size: 12px;
              }
              .title-block {
                text-align: center;
                margin-bottom: 20px;
              }
              .title-block h2 {
                margin: 0;
                font-size: 15px;
                text-transform: uppercase;
                border-bottom: 1px solid #000;
                display: inline-block;
                padding-bottom: 2px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                font-size: 11px;
              }
              th, td {
                border: 1px solid #000;
                padding: 8px 6px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
                text-transform: uppercase;
              }
              .text-right {
                text-align: right;
              }
              .text-center {
                text-align: center;
              }
              .total-row {
                font-weight: bold;
                background-color: #f9f9f9;
                border-top: 2px solid #000;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                font-size: 10px;
                border-top: 1px dashed #000;
                padding-top: 12px;
              }
              .badge {
                border: 1px solid #000;
                padding: 1px 4px;
                font-size: 9px;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${systemConfig.storeName}</h1>
              <p>${systemConfig.storeAddress}</p>
              <p>Hotline: ${systemConfig.storePhone}</p>
              <p>Date Printed: ${new Date().toLocaleString()}</p>
            </div>
            <div class="title-block">
              <h2>${title}</h2>
            </div>
            ${content}
            <div class="footer">
              <p>CONFIDENTIAL TERMINAL MANAGEMENT REPORT</p>
              <p>WCS Retail Intelligence - System Verified Ledger</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden bg-slate-950" id="analytics_intelligence_center">
      
      {/* Tab Selectors Row */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveMainTab('financials')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'financials'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Profit & Loss
          </button>
          
          <button
            onClick={() => setActiveMainTab('inventory')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'inventory'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Inventory Value & Alerts
          </button>

          <button
            onClick={() => setActiveMainTab('cashiers')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'cashiers'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Operator Balance Sheets
          </button>

          <button
            onClick={() => setActiveMainTab('suppliers')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'suppliers'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Supplier Accounts
          </button>

          <button
            onClick={() => setActiveMainTab('expenses')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'expenses'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Expenses List
          </button>
        </div>

        {/* Global Print Header Actions */}
        <div>
          {activeMainTab === 'financials' && (
            <button
              onClick={() => triggerPrintSection('a4_financial_print_wrapper', 'Profit and Loss Summary')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Print P&L Report
            </button>
          )}
          {activeMainTab === 'inventory' && (
            <div className="flex gap-2">
              <button
                onClick={() => triggerPrintSection('a4_inventory_print_wrapper', 'Master Inventory Valuation List')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Valuation List
              </button>
              <button
                onClick={() => triggerPrintSection('a4_lowstock_print_wrapper', 'Low Stock Warning Ledger')}
                className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-rose-900/30"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Print Low Stock Alert
              </button>
            </div>
          )}
          {activeMainTab === 'cashiers' && (
            <div className="flex gap-2">
              <button
                onClick={() => triggerPrintSection('a4_cashier_sales_print_wrapper', 'Cashiers Sales Performance Summary')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Sales Report
              </button>
              <button
                onClick={() => triggerPrintSection('a4_cashier_balances_print_wrapper', 'Operators Drawer Cash Balance Sheets')}
                className="px-3 py-1.5 bg-teal-950 hover:bg-teal-900 text-teal-300 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-teal-900/30"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                Print Drawer Balances
              </button>
            </div>
          )}
          {activeMainTab === 'suppliers' && (
            <button
              onClick={() => triggerPrintSection('a4_suppliers_print_wrapper', 'Suppliers Outstanding Account Ledger')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Supplier Account Ledger
            </button>
          )}
          {activeMainTab === 'expenses' && (
            <button
              onClick={() => triggerPrintSection('a4_expenses_print_wrapper', 'Operating Overhead Expenses Ledger')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Expenses Ledger
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          TAB CONTENT: FINANCIAL P&L
          ========================================== */}
      {activeMainTab === 'financials' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
          {/* Main Financial Analytics */}
          <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Range selection subheader */}
            <div className="flex gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800 self-start">
              {['daily', 'monthly', 'yearly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setFinancialRange(range as any)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    financialRange === range 
                      ? 'bg-teal-500 text-slate-950' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Gross Sales Revenue
                </span>
                <span className="text-2xl font-black text-teal-400">Rs. {stats.grossSales.toFixed(2)}</span>
                <p className="text-xs text-slate-500 mt-1">Processed over {stats.salesCount} billing invoices</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Cost of Goods Sold (COGS)
                </span>
                <span className="text-2xl font-black text-slate-300">Rs. {stats.cogs.toFixed(2)}</span>
                <p className="text-xs text-slate-500 mt-1">Supplier purchasing value of stock sold</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Overhead Operating Expenses
                </span>
                <span className="text-2xl font-black text-rose-400">Rs. {stats.totalExpenses.toFixed(2)}</span>
                <p className="text-xs text-slate-500 mt-1">Overhead operational costs logged</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl bg-teal-500/5 border-teal-500/20">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block mb-1">
                  Net Commercial Profit
                </span>
                <span className={`text-2xl font-black ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Rs. {stats.netProfit.toFixed(2)}
                </span>
                <p className="text-xs text-slate-500 mt-1">Revenue minus COGS and operating costs</p>
              </div>
            </div>

            {/* Chart Simulation */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Revenue vs Operating Cost Breakdown</span>
              <div className="w-full h-36 bg-slate-950 border border-slate-850/60 rounded-lg p-3 flex items-end justify-between relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-5">
                  <div className="border-b border-slate-700 w-full"></div>
                  <div className="border-b border-slate-700 w-full"></div>
                  <div className="border-b border-slate-700 w-full"></div>
                </div>

                <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
                  <div className="bg-teal-500/80 w-12 rounded-t-md transition-all duration-500" style={{ height: stats.grossSales > 0 ? '70px' : '4px' }}></div>
                  <span className="text-[9px] font-bold text-slate-400">Gross Sales</span>
                </div>
                
                <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
                  <div className="bg-slate-700 w-12 rounded-t-md transition-all duration-500" style={{ height: stats.cogs > 0 ? '50px' : '4px' }}></div>
                  <span className="text-[9px] font-bold text-slate-400">Inventory Cost</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
                  <div className="bg-rose-500/80 w-12 rounded-t-md transition-all duration-500" style={{ height: stats.totalExpenses > 0 ? '40px' : '4px' }}></div>
                  <span className="text-[9px] font-bold text-slate-400">Expenses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Division Security Code Check */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="inline-flex p-2.5 bg-amber-950/40 border border-amber-900/30 text-amber-400 rounded-xl mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">Owner Security Division</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  The cashier-facing terminal hides markup margins. Net balance ledger values are calculated dynamically for owner-level review.
                </p>
                
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                    Calculate Report Ledger Split
                  </span>
                  <span className="text-2xl font-mono font-black text-amber-400">
                    Rs. {stats.calculateReportVal.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-2">
                    * Locked to 50% dividend allocation ledger formula
                  </span>
                </div>
              </div>

              <button
                onClick={() => triggerPrintSection('a4_financial_print_wrapper', 'Master Executive P&L Ledger')}
                className="w-full mt-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
              >
                Launch Professional P&L Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT: INVENTORY VALUE & ALERTS
          ========================================== */}
      {activeMainTab === 'inventory' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
          
          {/* Key Totals Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Catalog count</span>
              <span className="text-lg font-black text-white">{inventoryData.list.length} Items</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Value at Cost Price</span>
              <span className="text-lg font-black text-slate-300 font-mono">Rs. {inventoryData.totalCostValue.toFixed(2)}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Value at Retail Price</span>
              <span className="text-lg font-black text-teal-400 font-mono">Rs. {inventoryData.totalRetailValue.toFixed(2)}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg border-teal-500/10 bg-teal-500/5">
              <span className="text-[9px] uppercase font-bold text-teal-400 block">Potential Retail Profit</span>
              <span className="text-lg font-black text-emerald-400 font-mono">Rs. {inventoryData.totalPotentialProfit.toFixed(2)}</span>
            </div>
          </div>

          {/* Search bar & Alert summaries */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-between">
            <input
              type="text"
              placeholder="Filter products list by code or name..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white text-xs w-full sm:max-w-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-rose-950/40 text-rose-400 text-xs font-bold border border-rose-900/40 rounded flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {inventoryData.lowStockItems.length} Low Stock Alerts
              </span>
              <span className="px-2 py-1 bg-amber-950/30 text-amber-400 text-xs font-bold border border-amber-900/30 rounded flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {inventoryData.expiredItems.length} Expired Products
              </span>
            </div>
          </div>

          {/* Master Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/40">
                  <th className="py-2.5 px-3">Product Name & SKU</th>
                  <th className="py-2.5 px-3 text-center">Expiry</th>
                  <th className="py-2.5 px-3 text-right">In-Stock</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Retail Price</th>
                  <th className="py-2.5 px-3 text-right">Total Cost Value</th>
                  <th className="py-2.5 px-3 text-right">Total Retail Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {filteredInventoryList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-2 px-3">
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.code} • {item.barcode}</div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.expiryDate ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                          item.isExpired 
                            ? 'bg-rose-950/40 text-rose-400 border-rose-900/40' 
                            : 'bg-amber-950/30 text-amber-400 border-amber-900/30'
                        }`}>
                          {item.expiryDate} {item.isExpired ? '(EXPIRED)' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">
                      <span className={item.isLow ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {item.stock} {item.unit}
                      </span>
                      {item.isLow && <span className="block text-[8px] text-rose-500 font-bold">Alert Limit {item.minStock}</span>}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400">Rs.{item.costPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-teal-400 font-semibold">Rs.{item.retailPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-300">Rs.{item.stockValCost.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-teal-300">Rs.{item.stockValRetail.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB CONTENT: OPERATOR BALANCE SHEETS
          ========================================== */}
      {activeMainTab === 'cashiers' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto space-y-6">
          
          {/* Section A: Users by Sales performance */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-400" />
                Cashiers Sales Performance Summary
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/40">
                    <th className="py-2.5 px-3">Operator Name</th>
                    <th className="py-2.5 px-3">System Role</th>
                    <th className="py-2.5 px-3 text-center">Invoice Transactions</th>
                    <th className="py-2.5 px-3 text-right">Average Ticket Value</th>
                    <th className="py-2.5 px-3 text-right">Total Gross Sales Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {cashierReports.map(rep => (
                    <tr key={rep.user.id} className="hover:bg-slate-950/20">
                      <td className="py-2.5 px-3 font-bold text-white">{rep.user.name}</td>
                      <td className="py-2.5 px-3 font-semibold uppercase tracking-wide text-[10px] text-slate-500">
                        {rep.user.role}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-400">{rep.salesCount} Sales</td>
                      <td className="py-2.5 px-3 text-right font-mono">Rs.{rep.avgOrder.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-300">Rs.{rep.totalSalesRevenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Cash Balance Sheet & Reconciliation */}
          <div className="space-y-3 pt-4 border-t border-slate-800/60">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                Operators Drawer Cash Balance Sheet
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cashierReports.map(rep => (
                <div key={rep.user.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="font-bold text-white text-xs">{rep.user.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-teal-950/40 text-teal-400 text-[9px] uppercase font-bold">
                      {rep.user.role}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Cash Collected</span>
                      <span className="font-mono text-slate-200">Rs.{rep.balances.cash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Card Settled</span>
                      <span className="font-mono text-slate-200">Rs.{rep.balances.card.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>LankaQR Payments</span>
                      <span className="font-mono text-slate-200">Rs.{rep.balances.qr.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Store Credit / Debt</span>
                      <span className="font-mono text-slate-200">Rs.{rep.balances.credit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-slate-900 text-teal-400">
                      <span>Total Drawer Revenue</span>
                      <span className="font-mono">Rs.{rep.balances.totalCollected.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB CONTENT: SUPPLIERS OUTSTANDING
          ========================================== */}
      {activeMainTab === 'suppliers' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
          
          {/* Supplier Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Active Suppliers</span>
              <span className="text-lg font-black text-white">{supplierLedger.report.length} Accounts</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Purchase Value</span>
              <span className="text-lg font-black text-slate-300 font-mono">Rs. {supplierLedger.cumulativeReceived.toFixed(2)}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg border-teal-500/10 bg-teal-500/5">
              <span className="text-[9px] uppercase font-bold text-teal-400 block">Total Accounts Payable</span>
              <span className="text-lg font-black text-teal-400 font-mono">Rs. {supplierLedger.cumulativeBalance.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Filter by Supplier name..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white text-xs w-full sm:max-w-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Supplier Grid list */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/40">
                  <th className="py-2.5 px-3">Supplier Name / Entity</th>
                  <th className="py-2.5 px-3 text-center">Purchase Orders Count</th>
                  <th className="py-2.5 px-3 text-right">Received Stock Value</th>
                  <th className="py-2.5 px-3 text-right">Stock Returns Value</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Ledger Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {filteredSupplierLedger.map((sup, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/20">
                    <td className="py-2.5 px-3 font-bold text-white">{sup.supplierName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">{sup.poCount} Orders</td>
                    <td className="py-2.5 px-3 text-right font-mono">Rs.{sup.receivedVal.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-400">Rs.{sup.returnsVal.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-400">Rs.{sup.outstandingBalance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB CONTENT: EXPENSES LIST
          ========================================== */}
      {activeMainTab === 'expenses' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
          
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overhead operational expenses</span>
            <span className="px-3 py-1 bg-rose-950/30 text-rose-400 border border-rose-900/40 text-xs font-black rounded-lg font-mono">
              Total Expenses: Rs. {totalExpensesSum.toFixed(2)}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-medium">
                No overhead operational expenses recorded in the ledger.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/40">
                    <th className="py-2.5 px-3">Log Date</th>
                    <th className="py-2.5 px-3">Expense Item Title</th>
                    <th className="py-2.5 px-3">Expense Category</th>
                    <th className="py-2.5 px-3">Logged By</th>
                    <th className="py-2.5 px-3">Remarks / Vendor</th>
                    <th className="py-2.5 px-3 text-right">Expense Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-950/20">
                      <td className="py-2 px-3 font-mono text-slate-400">{exp.date}</td>
                      <td className="py-2 px-3 font-bold text-white">{exp.title}</td>
                      <td className="py-2 px-3 uppercase tracking-wider text-[10px] text-slate-500 font-semibold">{exp.category}</td>
                      <td className="py-2 px-3 text-slate-400">{exp.loggedBy}</td>
                      <td className="py-2 px-3 text-slate-500 italic">{exp.remarks || 'No remarks provided'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">Rs.{exp.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
          HIDDEN PRINT TEMPLATE STRUCTURES (FOR B&W HARDWARE COPIES)
          ======================================================== */}
      
      {/* Printable Financial Summary */}
      <div className="hidden" id="a4_financial_print_wrapper">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Performance Metrics</th>
              <th className="text-right">Financial Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gross Sales Revenue ({stats.salesCount} Invoices)</td>
              <td className="text-right font-bold">Rs. {stats.grossSales.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Cost of Goods Sold (COGS)</td>
              <td className="text-right">Rs. {stats.cogs.toFixed(2)}</td>
            </tr>
            <tr className="total-row">
              <td><strong>Gross Profit Margin</strong></td>
              <td className="text-right font-bold">Rs. {stats.grossProfit.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Overhead Operational Expenses ({stats.expensesCount} logs)</td>
              <td className="text-right">Rs. {stats.totalExpenses.toFixed(2)}</td>
            </tr>
            <tr className="total-row" style={{ borderTop: '2px double #000' }}>
              <td><strong>Net Operating Profit</strong></td>
              <td className="text-right font-bold">Rs. {stats.netProfit.toFixed(2)}</td>
            </tr>
            <tr className="total-row" style={{ borderTop: '2px solid #000', fontSize: '13px' }}>
              <td><strong>CALCULATE REPORT (Owner Split)</strong></td>
              <td className="text-right font-bold" style={{ textDecoration: 'underline' }}>Rs. {stats.calculateReportVal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Printable Inventory Valuation */}
      <div className="hidden" id="a4_inventory_print_wrapper">
        <table style={{ marginBottom: '15px' }}>
          <tbody>
            <tr>
              <td><strong>Catalog Total count:</strong> {inventoryData.list.length} Items</td>
              <td><strong>Cost Valuation:</strong> Rs. {inventoryData.totalCostValue.toFixed(2)}</td>
              <td><strong>Retail Valuation:</strong> Rs. {inventoryData.totalRetailValue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Product Name</th>
              <th className="text-center">Expiry</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Cost Price</th>
              <th className="text-right">Retail Price</th>
              <th className="text-right">Val at Cost</th>
              <th className="text-right">Val at Retail</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.list.map(item => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td>{item.name}</td>
                <td className="text-center">{item.expiryDate || '—'}</td>
                <td className="text-right">{item.stock} {item.unit}</td>
                <td className="text-right">Rs.{item.costPrice.toFixed(2)}</td>
                <td className="text-right">Rs.{item.retailPrice.toFixed(2)}</td>
                <td className="text-right">Rs.{item.stockValCost.toFixed(2)}</td>
                <td className="text-right">Rs.{item.stockValRetail.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={6}><strong>GRAND CUMULATIVE INVENTORY VALUATION:</strong></td>
              <td className="text-right">Rs. {inventoryData.totalCostValue.toFixed(2)}</td>
              <td className="text-right">Rs. {inventoryData.totalRetailValue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Printable Low Stock Alerts */}
      <div className="hidden" id="a4_lowstock_print_wrapper">
        <div style={{ padding: '8px', border: '1px solid #000', marginBottom: '15px', backgroundColor: '#f2f2f2', fontWeight: 'bold', fontSize: '12px' }}>
          ⚠️ TOTAL ACTION REQUIRED: {inventoryData.lowStockItems.length} PRODUCTS ARE AT OR BELOW THE MINIMUM STOCK LEVEL.
        </div>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Product Name</th>
              <th className="text-center">Expiry Date</th>
              <th className="text-right">Current Stock</th>
              <th className="text-right">Min Stock Limit</th>
              <th className="text-right">Deficit Qty</th>
              <th className="text-right">Cost Price</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.lowStockItems.map(item => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td><strong>{item.name}</strong></td>
                <td className="text-center">{item.expiryDate || '—'}</td>
                <td className="text-right" style={{ color: 'red', fontWeight: 'bold' }}>{item.stock} {item.unit}</td>
                <td className="text-right">{item.minStock} {item.unit}</td>
                <td className="text-right">{(item.minStock - item.stock).toFixed(2)}</td>
                <td className="text-right">Rs.{item.costPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Printable Cashier Sales Performance */}
      <div className="hidden" id="a4_cashier_sales_print_wrapper">
        <table>
          <thead>
            <tr>
              <th>Operator Name</th>
              <th>System Role</th>
              <th className="text-center">Invoice Sales Count</th>
              <th className="text-right">Average Order size</th>
              <th className="text-right">Total Gross Sales Revenue</th>
            </tr>
          </thead>
          <tbody>
            {cashierReports.map(rep => (
              <tr key={rep.user.id}>
                <td><strong>{rep.user.name}</strong></td>
                <td>{rep.user.role.toUpperCase()}</td>
                <td className="text-center">{rep.salesCount} Sales</td>
                <td className="text-right">Rs. {rep.avgOrder.toFixed(2)}</td>
                <td className="text-right" style={{ fontWeight: 'bold' }}>Rs. {rep.totalSalesRevenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Printable Cashier Drawer Reconciliation */}
      <div className="hidden" id="a4_cashier_balances_print_wrapper">
        <table>
          <thead>
            <tr>
              <th>Operator/Cashier</th>
              <th className="text-right">Cash Collected</th>
              <th className="text-right">Card Transactions</th>
              <th className="text-right">LankaQR Sales</th>
              <th className="text-right">Store Credit / Debt</th>
              <th className="text-right">Total Drawer Revenue</th>
            </tr>
          </thead>
          <tbody>
            {cashierReports.map(rep => (
              <tr key={rep.user.id}>
                <td><strong>{rep.user.name} ({rep.user.role})</strong></td>
                <td className="text-right">Rs. {rep.balances.cash.toFixed(2)}</td>
                <td className="text-right">Rs. {rep.balances.card.toFixed(2)}</td>
                <td className="text-right">Rs. {rep.balances.qr.toFixed(2)}</td>
                <td className="text-right">Rs. {rep.balances.credit.toFixed(2)}</td>
                <td className="text-right" style={{ fontWeight: 'bold' }}>Rs. {rep.balances.totalCollected.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Printable Supplier Accounts payable ledger */}
      <div className="hidden" id="a4_suppliers_print_wrapper">
        <table style={{ marginBottom: '15px' }}>
          <tbody>
            <tr>
              <td><strong>Active accounts:</strong> {supplierLedger.report.length} suppliers</td>
              <td><strong>Total Purchases Value:</strong> Rs. {supplierLedger.cumulativeReceived.toFixed(2)}</td>
              <td><strong>Total returns:</strong> Rs. {supplierLedger.cumulativeReturns.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th className="text-center">POs Count</th>
              <th className="text-right">Received Val</th>
              <th className="text-right">Returns Val</th>
              <th className="text-right">Outstanding balance (Payable)</th>
            </tr>
          </thead>
          <tbody>
            {supplierLedger.report.map((sup, idx) => (
              <tr key={idx}>
                <td><strong>{sup.supplierName}</strong></td>
                <td className="text-center">{sup.poCount} POs</td>
                <td className="text-right">Rs. {sup.receivedVal.toFixed(2)}</td>
                <td className="text-right" style={{ color: 'red' }}>Rs. {sup.returnsVal.toFixed(2)}</td>
                <td className="text-right" style={{ fontWeight: 'bold' }}>Rs. {sup.outstandingBalance.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={2}><strong>CUMULATIVE PAYABLE BALANCES:</strong></td>
              <td className="text-right">Rs. {supplierLedger.cumulativeReceived.toFixed(2)}</td>
              <td className="text-right">Rs. {supplierLedger.cumulativeReturns.toFixed(2)}</td>
              <td className="text-right">Rs. {supplierLedger.cumulativeBalance.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Printable Overhead Expenses Ledger */}
      <div className="hidden" id="a4_expenses_print_wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Item Title</th>
              <th>Category</th>
              <th>Logged By</th>
              <th>Remarks / Details</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id}>
                <td>{exp.date}</td>
                <td><strong>{exp.title}</strong></td>
                <td>{exp.category.toUpperCase()}</td>
                <td>{exp.loggedBy}</td>
                <td>{exp.remarks || '—'}</td>
                <td className="text-right" style={{ fontWeight: 'bold' }}>Rs. {exp.amount.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={5}><strong>GRAND TOTAL OPERATING OVERHEAD EXPENSES:</strong></td>
              <td className="text-right" style={{ fontSize: '13px' }}><strong>Rs. {totalExpensesSum.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
