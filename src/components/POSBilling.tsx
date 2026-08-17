/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Item, Category, Customer, Sale, SaleItem, SystemConfig, ProductUnit } from '../types';
import { 
  Search, Trash2, UserPlus, CreditCard, DollarSign, Wallet, Scale, 
  Printer, Grid, RefreshCw, Barcode, CheckCircle, Clock, Copy, ChevronDown, Check, ShoppingCart,
  QrCode, Landmark, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface POSBillingProps {
  categories: Category[];
  items: Item[];
  customers: Customer[];
  systemConfig: SystemConfig;
  sales: Sale[];
  onAddSale: (sale: Sale) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateStock: (itemId: string, quantityToSubtract: number) => void;
  currentUser: { id: string; name: string };
}

export default function POSBilling({
  categories,
  items,
  customers,
  systemConfig,
  sales,
  onAddSale,
  onAddCustomer,
  onUpdateStock,
  currentUser
}: POSBillingProps) {
  // POS States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'store_credit' | 'qr_code' | 'bank_transfer' | 'cheque'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [applyTax, setApplyTax] = useState(false);
  
  // Modals & Popups
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  
  // Find last sale in memory or historical logs to support reprinting
  const lastSale = lastCompletedSale || (sales && sales.length > 0 ? sales[sales.length - 1] : null);
  
  // Extended payment state simulators
  const [bankTxRef, setBankTxRef] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [cardTxRef, setCardTxRef] = useState('');

  // Split / Partial Payment states
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [splitCredit, setSplitCredit] = useState<string>(''); // For outstanding partial ledger
  const [splitQr, setSplitQr] = useState<string>('');
  
  // Hold/Recall Bills
  const [heldBills, setHeldBills] = useState<{ id: string; cart: SaleItem[]; customerId: string; timestamp: string }[]>([]);
  
  // Scale Simulator States
  const [scaleConnected, setScaleConnected] = useState(true);
  const [simulatedWeight, setSimulatedWeight] = useState<number>(0.0);
  const [weighingItem, setWeighingItem] = useState<Item | null>(null);

  // New Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // 1. Filter items based on search and category selection
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!item.active) return false;
      
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.code.toLowerCase().includes(lowerQuery) ||
        item.barcode.includes(lowerQuery);
        
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // 2. Selected Customer Object
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // 3. Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.total, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    if (!applyTax) return 0;
    const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
    return parseFloat((taxableAmount * (systemConfig.taxPercentage / 100)).toFixed(2));
  }, [cartSubtotal, discountAmount, systemConfig.taxPercentage, applyTax]);

  const cartTotal = useMemo(() => {
    const total = cartSubtotal - discountAmount + taxAmount;
    return parseFloat(Math.max(0, total).toFixed(2));
  }, [cartSubtotal, discountAmount, taxAmount]);

  const cashChange = useMemo(() => {
    const cashVal = parseFloat(cashReceived);
    if (isNaN(cashVal) || cashVal < cartTotal) return 0;
    return parseFloat((cashVal - cartTotal).toFixed(2));
  }, [cashReceived, cartTotal]);

  const splitTotalPaid = useMemo(() => {
    if (!isSplitPayment) return 0;
    const cashVal = parseFloat(splitCash) || 0;
    const cardVal = parseFloat(splitCard) || 0;
    const creditVal = parseFloat(splitCredit) || 0;
    const qrVal = parseFloat(splitQr) || 0;
    return parseFloat((cashVal + cardVal + creditVal + qrVal).toFixed(2));
  }, [isSplitPayment, splitCash, splitCard, splitCredit, splitQr]);

  const splitRemaining = useMemo(() => {
    return parseFloat(Math.max(0, cartTotal - splitTotalPaid).toFixed(2));
  }, [cartTotal, splitTotalPaid]);

  // 4. Add item to cart
  const handleAddToItem = (item: Item, customQty?: number) => {
    const existingIndex = cart.findIndex(c => c.itemId === item.id);
    const initialQty = customQty || (item.unit === 'kg' || item.unit === 'gram' ? 1.000 : 1);
    
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + (customQty || 1);
      updatedCart[existingIndex].quantity = parseFloat(newQty.toFixed(item.unit === 'pcs' ? 0 : 3));
      updatedCart[existingIndex].total = parseFloat((updatedCart[existingIndex].price * updatedCart[existingIndex].quantity).toFixed(2));
      setCart(updatedCart);
    } else {
      const newItem: SaleItem = {
        id: `cart_${Date.now()}_${item.id}`,
        itemId: item.id,
        name: item.name,
        code: item.code,
        price: item.retailPrice,
        quantity: initialQty,
        unit: item.unit,
        total: parseFloat((item.retailPrice * initialQty).toFixed(2)),
      };
      setCart([...cart, newItem]);
    }
  };

  // 5. Update cart item quantity
  const handleUpdateQty = (cartId: string, qtyStr: string, unit: ProductUnit) => {
    let qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty < 0) qty = 0;
    
    // Standardize decimals based on unit
    const finalQty = parseFloat(qty.toFixed(unit === 'pcs' ? 0 : 3));

    const updated = cart.map(c => {
      if (c.id === cartId) {
        return {
          ...c,
          quantity: finalQty,
          total: parseFloat((c.price * finalQty).toFixed(2)),
        };
      }
      return c;
    }).filter(c => c.quantity > 0); // Remove if qty drops to 0
    
    setCart(updated);
  };

  // Quick cash triggers
  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toString());
  };

  // 6. Scale Simulator Trigger
  const triggerScaleWeigh = (item: Item) => {
    setWeighingItem(item);
    // Simulate scale settling on a random weight
    const weight = parseFloat((Math.random() * 2 + 0.125).toFixed(3)); // e.g. 0.125 - 2.125 kg
    setSimulatedWeight(weight);
  };

  const applyScaleWeight = () => {
    if (weighingItem) {
      handleAddToItem(weighingItem, simulatedWeight);
      setWeighingItem(null);
      setSimulatedWeight(0.0);
    }
  };

  // 7. Save/Hold current cart
  const handleHoldBill = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `held_${Date.now()}`,
      cart,
      customerId: selectedCustomerId,
      timestamp: new Date().toLocaleTimeString(),
    };
    setHeldBills([...heldBills, newHold]);
    setCart([]);
    setSelectedCustomerId('');
    setDiscountAmount(0);
    setCashReceived('');
  };

  // 8. Recall held bill
  const handleRecallBill = (heldId: string) => {
    const held = heldBills.find(h => h.id === heldId);
    if (held) {
      setCart(held.cart);
      setSelectedCustomerId(held.customerId);
      setHeldBills(heldBills.filter(h => h.id !== heldId));
    }
  };

  // 9. Process Sale
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    // Verify cash received if using simple cash payment
    if (paymentMethod === 'cash' && !isSplitPayment) {
      const received = parseFloat(cashReceived);
      if (isNaN(received)) {
        alert('Please enter the cash amount received from the customer.');
        return;
      }
      if (received < cartTotal) {
        alert(`Insufficient Cash. Received: Rs. ${received.toFixed(2)}, Required: Rs. ${cartTotal.toFixed(2)}`);
        return;
      }
    }
    
    // Verify credit limits if using store credit
    if (paymentMethod === 'store_credit') {
      if (!selectedCustomerId) {
        alert('Please select a customer to process store credit payment.');
        return;
      }
    }

    if (isSplitPayment) {
      if (splitRemaining > 0 && !selectedCustomerId) {
        alert('Please select a customer to record the unpaid balance (Rs. ' + splitRemaining.toFixed(2) + ') to their store credit/outstanding ledger.');
        return;
      }
    }

    const nextInvoiceNum = Math.floor(Math.random() * 90000) + 10000;
    const invoiceNo = `WCS-INV-${nextInvoiceNum}`;

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNo,
      timestamp: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      items: [...cart],
      subtotal: parseFloat(cartSubtotal.toFixed(2)),
      discount: discountAmount,
      tax: taxAmount,
      total: cartTotal,
      paymentMethod: isSplitPayment ? 'cash' : paymentMethod,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer?.name || undefined,
      isSplitPayment: isSplitPayment || undefined,
      splitCashAmount: isSplitPayment ? (parseFloat(splitCash) || 0) : undefined,
      splitCardAmount: isSplitPayment ? (parseFloat(splitCard) || 0) : undefined,
      splitCreditAmount: isSplitPayment ? (parseFloat(splitCredit) || splitRemaining) : undefined,
      splitQrAmount: isSplitPayment ? (parseFloat(splitQr) || 0) : undefined,
      cashReceived: (!isSplitPayment && paymentMethod === 'cash') ? parseFloat(cashReceived) : undefined,
      cashChange: (!isSplitPayment && paymentMethod === 'cash') ? cashChange : undefined,
      paymentReference: paymentMethod === 'card' ? (cardTxRef || 'MID-****9842') :
                        paymentMethod === 'bank_transfer' ? bankTxRef :
                        paymentMethod === 'cheque' ? `CHQ-${chequeNo} (${chequeBank})` : undefined,
    };

    // Commit changes
    onAddSale(newSale);
    
    // Subtract stocks
    cart.forEach(cartItem => {
      onUpdateStock(cartItem.itemId, cartItem.quantity);
    });

    setLastCompletedSale(newSale);
    setShowReceiptModal(true);
    
    // Clear cart & variables
    setCart([]);
    setSelectedCustomerId('');
    setDiscountAmount(0);
    setCashReceived('');
    setBankTxRef('');
    setChequeNo('');
    setChequeBank('');
    setCardTxRef('');
    setIsSplitPayment(false);
    setSplitCash('');
    setSplitCard('');
    setSplitCredit('');
    setSplitQr('');
  };

  // 10. Register New Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || undefined,
      points: 0,
      outstandingBalance: 0,
    };

    onAddCustomer(newCustomer);
    setSelectedCustomerId(newCustomer.id);
    setShowNewCustModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-6rem)] overflow-hidden" id="pos_billing_container">
      
      {/* SECTION 1: ITEMS GRID (Left 7 Cols) */}
      <div className="lg:col-span-7 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4">
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="pos_item_search"
              type="text"
              placeholder="Scan Barcode, Item Code, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              id="pos_category_select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category quick buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2.5 mb-2 scrollbar-thin scrollbar-thumb-slate-800" id="pos_category_scroll">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all' 
                ? 'bg-teal-500 text-slate-950' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id 
                  ? 'bg-teal-500 text-slate-950' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1" id="pos_items_grid">
          {filteredItems.length === 0 ? (
            <div className="col-span-full flex flex-col justify-center items-center py-12 text-slate-500">
              <Barcode className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
              <p className="font-semibold text-slate-400">No active products found</p>
              <p className="text-xs text-slate-600 mt-1">Try another search keyword or scan barcode</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isLowStock = item.stock <= item.minStock;
              return (
                <div
                  key={item.id}
                  id={`pos_item_card_${item.id}`}
                  onClick={() => handleAddToItem(item)}
                  className="bg-slate-950 border border-slate-800 hover:border-teal-500/50 rounded-xl p-3 flex flex-col justify-between cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  {/* Product Header / Image Placeholder */}
                  <div className="relative aspect-video w-full bg-slate-900 border border-slate-800/60 rounded-lg flex items-center justify-center mb-2.5 overflow-hidden group-hover:bg-slate-850">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="object-cover w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-teal-400/80 group-hover:scale-110 transition-transform">
                        <Grid className="w-8 h-8 opacity-60" />
                      </div>
                    )}
                    
                    {/* Scale weight simulation tag */}
                    {(item.unit === 'kg' || item.unit === 'gram') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerScaleWeigh(item);
                        }}
                        className="absolute bottom-1 right-1 p-1 bg-slate-900 hover:bg-teal-500 hover:text-slate-950 border border-slate-800 hover:border-transparent text-teal-400 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold shadow-lg"
                        title="Simulate Electronic Weighing Scale"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Weigh
                      </button>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">
                      {item.code}
                    </span>
                    <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-teal-400 transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  {/* Stock and Price footer */}
                  <div className="mt-2 pt-2 border-t border-slate-900/80 flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isLowStock 
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' 
                        : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                    }`}>
                      {item.stock} {item.unit}
                    </span>
                    <span className="font-bold text-teal-300 text-sm">
                      Rs. {item.retailPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2 & 3: CART AND PAYMENTS (Right 5 Cols) */}
      <div className="lg:col-span-5 flex flex-col h-full gap-4">
        
        {/* Active Register Terminal Cart Card */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4">
          
          {/* Customer Selection Header */}
          <div className="pb-3 border-b border-slate-800/80 flex justify-between items-center gap-2">
            <div className="relative flex-1">
              <select
                id="pos_customer_select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="">Walk-In Customer</option>
                {customers.map(cust => {
                  const balanceLabel = cust.outstandingBalance > 0 
                    ? ` (Credit: Rs.${cust.outstandingBalance})` 
                    : cust.outstandingBalance < 0 
                      ? ` (Owes: Rs.${Math.abs(cust.outstandingBalance)})` 
                      : '';
                  return (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} {balanceLabel}
                    </option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            <button
              onClick={() => setShowNewCustModal(true)}
              className="p-2.5 bg-slate-850 hover:bg-slate-800 text-teal-400 rounded-lg border border-slate-800 hover:border-teal-500/20 transition-all cursor-pointer"
              title="Add Customer Profile"
            >
              <UserPlus className="w-4 h-4" />
            </button>

            {lastSale && (
              <button
                type="button"
                onClick={() => {
                  setLastCompletedSale(lastSale);
                  setShowReceiptModal(true);
                }}
                className="p-2.5 bg-slate-850 hover:bg-slate-800 hover:border-amber-500/30 text-amber-400 rounded-lg border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
                title="Reprint Last Invoice Receipt"
              >
                <Printer className="w-4 h-4" />
                <span>Reprint Last</span>
              </button>
            )}
          </div>

          {/* Held Bills Bar if they exist */}
          {heldBills.length > 0 && (
            <div className="bg-slate-950 border-b border-slate-800/40 p-2 flex gap-2 overflow-x-auto items-center">
              <span className="text-[10px] text-amber-500 font-bold shrink-0 flex items-center gap-1 uppercase">
                <Clock className="w-3 h-3" /> Parked ({heldBills.length}):
              </span>
              {heldBills.map((hb) => {
                const customerName = customers.find(c => c.id === hb.customerId)?.name || 'Walk-In';
                return (
                  <button
                    key={hb.id}
                    onClick={() => handleRecallBill(hb.id)}
                    className="px-2 py-0.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 font-medium whitespace-nowrap cursor-pointer transition-colors"
                  >
                    {customerName} ({hb.timestamp})
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Cart Items */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1" id="pos_cart_items">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-600">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-semibold text-slate-500">Sales Register Empty</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Click items on left to add to bill</p>
              </div>
            ) : (
              cart.map((cartItem) => (
                <div 
                  key={cartItem.id} 
                  id={`cart_item_${cartItem.id}`}
                  className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-semibold text-slate-200 text-sm truncate">
                        {cartItem.name}
                      </h4>
                      <span className="text-[10px] px-1 bg-slate-900 border border-slate-800 rounded text-slate-400 select-none">
                        {cartItem.unit}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rs. {cartItem.price.toFixed(2)} / {cartItem.unit}
                    </p>
                  </div>

                  {/* Quantity Editor supporting Decimals */}
                  <div className="flex items-center gap-2">
                    <input
                      id={`cart_qty_input_${cartItem.id}`}
                      type="number"
                      step={cartItem.unit === 'pcs' ? '1' : '0.001'}
                      min="0"
                      value={cartItem.quantity}
                      onChange={(e) => handleUpdateQty(cartItem.id, e.target.value, cartItem.unit)}
                      className="w-16 bg-slate-900 border border-slate-800 rounded text-center text-white py-1 font-bold text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    
                    <span className="font-bold text-slate-200 text-sm shrink-0 w-20 text-right">
                      Rs. {cartItem.total.toFixed(2)}
                    </span>
                    
                    <button
                      onClick={() => handleUpdateQty(cartItem.id, '0', cartItem.unit)}
                      className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Subtotals and Checkout Actions Card */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-sm">
            
            <div className="flex justify-between text-slate-400">
              <span>Gross Subtotal</span>
              <span className="font-semibold text-slate-300">Rs. {cartSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Manual Bill Discount</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Rs.</span>
                <input
                  id="pos_discount_input"
                  type="number"
                  min="0"
                  max={cartSubtotal}
                  value={discountAmount || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDiscountAmount(isNaN(val) ? 0 : val);
                  }}
                  className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-right font-semibold text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <div className="flex items-center gap-1.5">
                <input
                  id="apply_tax_checkbox"
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="apply_tax_checkbox" className="text-xs font-medium cursor-pointer select-none">
                  Add Sales Tax ({systemConfig.taxPercentage}%)
                </label>
              </div>
              <span className={`font-semibold ${applyTax ? 'text-slate-300' : 'text-slate-600 line-through'}`}>
                Rs. {taxAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-t border-b border-slate-800/40 my-1">
              <span className="font-bold text-slate-100 text-base">Invoice Total</span>
              <span className="font-extrabold text-teal-400 text-xl">
                Rs. {cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Clear Customer Payment Amount (Tendered Amount) Field */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-2 mt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tendered Amount</span>
                <div className="relative">
                  <span className="absolute left-2 top-1 text-slate-600 font-bold text-[9px]">Rs.</span>
                  <input
                    id="billing_customer_paid_input"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-28 bg-slate-900 border border-slate-800 rounded pl-7 pr-1.5 py-0.5 text-right text-xs font-bold text-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              
              {parseFloat(cashReceived) > 0 && (
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-900">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Change Return</span>
                  <span className={`font-black font-mono text-xs ${parseFloat(cashReceived) >= cartTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parseFloat(cashReceived) >= cartTotal 
                      ? `Rs. ${(parseFloat(cashReceived) - cartTotal).toFixed(2)}` 
                      : `Deficit: Rs. ${(cartTotal - parseFloat(cashReceived)).toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Dynamic Payment & Quick Cash Deck */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          
          {/* Payment Method Selector */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                Payment Settlement
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSplitPayment(!isSplitPayment);
                  setCashReceived('');
                  setSplitCash('');
                  setSplitCard('');
                  setSplitCredit('');
                  setSplitQr('');
                }}
                className={`px-2 py-1 rounded text-[9px] font-extrabold tracking-wider uppercase transition-all border cursor-pointer ${
                  isSplitPayment
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {isSplitPayment ? '⚡ Part / Split Active' : 'Enable Part / Split'}
              </button>
            </div>

            {!isSplitPayment ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 border rounded-lg font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Cash Hand
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 border rounded-lg font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Credit Card
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentMethod('store_credit')}
                  disabled={!selectedCustomerId}
                  className={`py-2 px-3 border rounded-lg font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    !selectedCustomerId ? 'opacity-40 cursor-not-allowed' : ''
                  } ${
                    paymentMethod === 'store_credit'
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-400'
                  }`}
                  title={!selectedCustomerId ? 'Select customer to enable store credit' : 'Use Customer Credit Account'}
                >
                  <Wallet className="w-4 h-4" />
                  Store Credit
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('qr_code')}
                  className={`py-2 px-3 border rounded-lg font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'qr_code'
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Mobile QR
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`py-2 px-3 border rounded-lg font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  Bank Transfer
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cheque')}
                  className={`py-2 px-3 border rounded-lg font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'cheque'
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Bank Cheque
                </button>
              </div>
            ) : (
              /* Split / Partial Payment allocation deck */
              <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl space-y-3 text-xs animate-fadeIn">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold block">
                  Split Allocation Deck
                </span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
                      Cash Portion Paid
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-600 font-bold text-[10px]">Rs.</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-1.5 py-1 text-xs text-white placeholder-slate-700 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
                      Card Portion Paid
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-600 font-bold text-[10px]">Rs.</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={splitCard}
                        onChange={(e) => setSplitCard(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-1.5 py-1 text-xs text-white placeholder-slate-700 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
                      LankaQR Portion Paid
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-600 font-bold text-[10px]">Rs.</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={splitQr}
                        onChange={(e) => setSplitQr(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-1.5 py-1 text-xs text-white placeholder-slate-700 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">
                        Credit Account Portion
                      </label>
                      {!selectedCustomerId && (
                        <span className="text-[7px] text-rose-400 font-black">Requires Customer</span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-600 font-bold text-[10px]">Rs.</span>
                      <input
                        type="number"
                        placeholder="0"
                        disabled={!selectedCustomerId}
                        value={splitCredit}
                        onChange={(e) => setSplitCredit(e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-1.5 py-1 text-xs text-white placeholder-slate-700 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          !selectedCustomerId ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Balance Filler buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-900/60 text-[9px]">
                  <span className="text-slate-500 uppercase font-bold">Auto-Fill Balance:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSplitCash(splitRemaining.toFixed(2))}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-teal-400 border border-slate-800 rounded cursor-pointer transition-colors"
                    >
                      To Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitCard(splitRemaining.toFixed(2))}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-teal-400 border border-slate-800 rounded cursor-pointer transition-colors"
                    >
                      To Card
                    </button>
                    {selectedCustomerId && (
                      <button
                        type="button"
                        onClick={() => setSplitCredit(splitRemaining.toFixed(2))}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-amber-400 border border-slate-800 rounded cursor-pointer transition-colors"
                      >
                        To Credit Account
                      </button>
                    )}
                  </div>
                </div>

                {/* Split accounting totals ledger */}
                <div className="pt-2 border-t border-slate-800/60 space-y-1 text-[10px] leading-tight">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Allocated Amount:</span>
                    <span className="font-bold text-teal-400">Rs. {splitTotalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Invoice Grand Total:</span>
                    <span className="font-bold text-white">Rs. {cartTotal.toFixed(2)}</span>
                  </div>
                  {splitRemaining > 0 ? (
                    <div className="flex justify-between font-mono bg-amber-500/5 p-1 rounded border border-amber-500/10">
                      <span className="text-amber-400 font-bold">Remaining Unpaid:</span>
                      <span className="font-black text-amber-400">Rs. {splitRemaining.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between font-mono bg-emerald-500/5 p-1 rounded border border-emerald-500/10">
                      <span className="text-emerald-400 font-bold">Allocated Fully:</span>
                      <span className="font-black text-emerald-400">Verified Success</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cash Change Drawer Simulator */}
          {paymentMethod === 'cash' && (
            <div className="bg-slate-950 p-2.5 border border-slate-800 rounded-lg space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 font-medium">Cash Received</span>
                <input
                  id="pos_cash_received_input"
                  type="number"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-28 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-right text-sm font-bold text-teal-400 focus:outline-none"
                />
              </div>

              {/* Quick cash buttons */}
              <div className="flex gap-1.5 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setCashReceived(cartTotal.toFixed(2))}
                  className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 text-[10px] font-bold rounded cursor-pointer transition-colors"
                >
                  Exact (Rs.{cartTotal.toFixed(2)})
                </button>
                {[100, 500, 1000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickCash(val)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-teal-400 text-[10px] font-bold rounded cursor-pointer transition-colors"
                  >
                    Rs.{val}
                  </button>
                ))}
              </div>

              {/* Calculated Change */}
              {parseFloat(cashReceived) >= cartTotal && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-900/60 text-xs">
                  <span className="text-slate-500 font-semibold">Change to Customer</span>
                  <span className="font-extrabold text-emerald-400">Rs. {cashChange.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Credit Card Authorization Code */}
          {paymentMethod === 'card' && (
            <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg space-y-2 text-xs animate-fadeIn">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                Credit Card Authorization
              </span>
              <div className="pt-1">
                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
                  Card Terminal Approval Code / Slip Ref #
                </label>
                <input
                  id="pos_card_ref_input"
                  type="text"
                  placeholder="e.g. APP-908422 or MID-8891"
                  value={cardTxRef}
                  onChange={(e) => setCardTxRef(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* QR Code Scan Simulator */}
          {paymentMethod === 'qr_code' && (
            <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg space-y-3 flex flex-col items-center text-center animate-fadeIn">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Scan Dynamic UPI / LankaQR
              </span>
              <div className="p-2 bg-white rounded-lg">
                <svg className="w-24 h-24 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 h25 v25 h-25 z M15,15 h15 v15 h-15 z M10,65 h25 v25 h-25 z M15,70 h15 v15 h-15 z M65,10 h25 v25 h-25 z M70,15 h15 v15 h-15 z" />
                  <path d="M45,10 h10 v10 h-10 z M45,30 h10 v20 h-10 z M45,60 h20 v10 h-20 z M55,75 h10 v15 h-10 z M75,45 h15 v10 h-15 z M65,80 h25 v10 h-25 z" />
                  <path d="M22,22 h3 v3 h-3 z M72,22 h3 v3 h-3 z M22,72 h3 v3 h-3 z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-teal-400">Rs. {cartTotal.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Scan with Seylan Pay, Genie, FriMi or any QR Wallet</p>
              </div>
            </div>
          )}

          {/* Bank Transfer Details & Reference Input */}
          {paymentMethod === 'bank_transfer' && (
            <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg space-y-2 text-xs animate-fadeIn">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                Direct Bank Deposit
              </span>
              <div className="bg-slate-900/60 p-2 border border-slate-800/80 rounded space-y-1 text-slate-300 font-mono text-[10px]">
                <p>BANK: Bank of Ceylon (BOC)</p>
                <p>A/C: 7044-8991-3200-11</p>
                <p>NAME: WCS SUPERMARKET PVT LTD</p>
              </div>
              <div className="pt-1">
                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
                  Transaction Receipt Ref #
                </label>
                <input
                  id="pos_bank_ref_input"
                  type="text"
                  placeholder="e.g. TXN9824401"
                  value={bankTxRef}
                  onChange={(e) => setBankTxRef(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* Bank Cheque Details Input */}
          {paymentMethod === 'cheque' && (
            <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg space-y-2 text-xs animate-fadeIn">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                Cheque Ledger Info
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
                    Cheque Number
                  </label>
                  <input
                    id="pos_cheque_no_input"
                    type="text"
                    placeholder="e.g. 881204"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
                    Issuing Bank
                  </label>
                  <input
                    id="pos_cheque_bank_input"
                    type="text"
                    placeholder="e.g. HNB, Sampath"
                    value={chequeBank}
                    onChange={(e) => setChequeBank(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Deck */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleHoldBill}
              disabled={cart.length === 0}
              className={`py-2 px-3 bg-slate-850 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold text-xs rounded-lg border border-slate-800 hover:border-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                cart.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <Clock className="w-4 h-4" />
              Park / Hold Bill
            </button>

            <button
              id="pos_checkout_btn"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-teal-950/20 ${
                cart.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <Printer className="w-4 h-4" />
              Bill & Print (80mm)
            </button>
          </div>

        </div>

      </div>

      {/* WEIGHING SCALE DIALOGUE SIMULATOR */}
      <AnimatePresence>
        {weighingItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl"
              id="scale_modal"
            >
              <div className="text-center">
                <div className="inline-flex p-3 bg-teal-950/40 border border-teal-500/20 rounded-full text-teal-400 mb-4">
                  <Scale className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Electronic Weighing Scale</h3>
                <p className="text-xs text-slate-400 mb-4">Reading weight for item: {weighingItem.name}</p>
              </div>

              {/* Simulated Weight Readout Screen */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 text-center mb-6">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                  Stabilized Net Weight
                </span>
                <span className="text-4xl font-mono font-black text-teal-400 block tracking-tight">
                  {simulatedWeight.toFixed(3)} <span className="text-lg text-teal-600">{weighingItem.unit}</span>
                </span>
                <p className="text-[10px] text-slate-500 mt-2.5">
                  Unit Rate: Rs. {weighingItem.retailPrice.toFixed(2)} / {weighingItem.unit}
                </p>
                <p className="text-xs text-slate-300 font-bold mt-1.5">
                  Calculated price: Rs. {(weighingItem.retailPrice * simulatedWeight).toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const weight = parseFloat((Math.random() * 2 + 0.1).toFixed(3));
                    setSimulatedWeight(weight);
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-Weigh Item
                </button>
                <button
                  onClick={applyScaleWeight}
                  className="py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-teal-950/10"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Weight
                </button>
              </div>

              <button
                onClick={() => setWeighingItem(null)}
                className="mt-4 w-full py-1.5 text-xs text-slate-500 hover:text-slate-400 cursor-pointer text-center"
              >
                Cancel / Exit Scale
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW CUSTOMER REGISTER OVERLAY MODAL */}
      <AnimatePresence>
        {showNewCustModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl"
              id="new_cust_modal"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-teal-400" />
                  New Customer Account
                </h3>
                <button 
                  onClick={() => setShowNewCustModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Customer Full Name *
                  </label>
                  <input
                    id="new_cust_name_input"
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Manjula Trisantha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mobile Phone Number *
                  </label>
                  <input
                    id="new_cust_phone_input"
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="e.g. 0771234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    id="new_cust_email_input"
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="e.g. name@domain.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  id="new_cust_submit_btn"
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-all cursor-pointer"
                >
                  Register Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 80mm RECEIPT BILL PREVIEW MODAL */}
      <AnimatePresence>
        {showReceiptModal && lastCompletedSale && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col my-8"
              id="receipt_modal"
            >
              <div className="p-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <span className="font-bold text-white text-sm">Sale Logged Successfully</span>
                </div>
                <button 
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Scrollable Receipt Body Container (80mm width standard simulation) */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex justify-center" id="receipt_print_area">
                
                {/* Simulated Thermal 80mm roll sheet */}
                <div className="w-[80mm] min-h-[140mm] bg-white text-zinc-900 font-mono text-[11px] p-4 shadow-inner border border-zinc-200">
                  
                  {/* Store Info Header */}
                  <div className="text-center pb-3 border-b border-dashed border-zinc-400">
                    <svg className="w-10 h-10 mx-auto text-zinc-800 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                    <h2 className="font-black text-sm uppercase leading-tight">{systemConfig.storeName}</h2>
                    <p className="text-[9px] text-zinc-600 leading-snug mt-0.5">{systemConfig.storeAddress}</p>
                    <p className="text-[9px] text-zinc-600">Tel: {systemConfig.storePhone}</p>
                  </div>

                  {/* Transaction Metadata */}
                  <div className="py-2.5 border-b border-dashed border-zinc-400 text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>INVOICE:</span>
                      <span className="font-bold">{lastCompletedSale.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE:</span>
                      <span>{new Date(lastCompletedSale.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TIME:</span>
                      <span>{new Date(lastCompletedSale.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CASHIER:</span>
                      <span>{lastCompletedSale.cashierName.toUpperCase()}</span>
                    </div>
                    {lastCompletedSale.customerName && (
                      <div className="flex justify-between">
                        <span>CUSTOMER:</span>
                        <span className="font-bold">{lastCompletedSale.customerName}</span>
                      </div>
                    )}
                  </div>

                  {/* Line Items Table */}
                  <table className="w-full text-left border-collapse my-3">
                    <thead>
                      <tr className="border-b border-dashed border-zinc-400 font-bold text-[10px]">
                        <th className="pb-1 w-1/2">Item Description</th>
                        <th className="pb-1 text-center w-1/6">Qty</th>
                        <th className="pb-1 text-right w-1/3">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px]">
                      {lastCompletedSale.items.map((it) => (
                        <tr key={it.id} className="align-top">
                          <td className="py-1 leading-tight">
                            {it.name}
                            <span className="block text-[8px] text-zinc-500">
                              Rs.{it.price.toFixed(2)} / {it.unit}
                            </span>
                          </td>
                          <td className="py-1 text-center font-bold">
                            {it.quantity}
                          </td>
                          <td className="py-1 text-right font-bold">
                            {it.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Summary block */}
                  <div className="border-t border-dashed border-zinc-400 pt-2 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span>Rs.{lastCompletedSale.subtotal.toFixed(2)}</span>
                    </div>
                    {lastCompletedSale.discount > 0 && (
                      <div className="flex justify-between text-zinc-600">
                        <span>DISCOUNT:</span>
                        <span>-Rs.{lastCompletedSale.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>TAX ({systemConfig.taxPercentage}%):</span>
                      <span>Rs.{lastCompletedSale.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-xs border-t border-dashed border-zinc-400 pt-1">
                      <span>GRAND TOTAL:</span>
                      <span>Rs.{lastCompletedSale.total.toFixed(2)}</span>
                    </div>
                  </div>                    {/* Payment Details */}
                   <div className="border-t border-dashed border-zinc-400 mt-2 pt-2 text-[9px] space-y-0.5">
                     <div className="flex justify-between uppercase font-bold">
                       <span>PAYMENT MODE:</span>
                       <span>{lastCompletedSale.isSplitPayment ? 'SPLIT / PART PAY' : lastCompletedSale.paymentMethod.replace('_', ' ')}</span>
                     </div>
                     {lastCompletedSale.isSplitPayment ? (
                       <>
                         {lastCompletedSale.splitCashAmount ? (
                           <div className="flex justify-between text-zinc-600">
                             <span>CASH PORTION:</span>
                             <span>Rs.{lastCompletedSale.splitCashAmount.toFixed(2)}</span>
                           </div>
                         ) : null}
                         {lastCompletedSale.splitCardAmount ? (
                           <div className="flex justify-between text-zinc-600">
                             <span>CARD PORTION:</span>
                             <span>Rs.{lastCompletedSale.splitCardAmount.toFixed(2)}</span>
                           </div>
                         ) : null}
                         {lastCompletedSale.splitQrAmount ? (
                           <div className="flex justify-between text-zinc-600">
                             <span>MOBILE QR PORTION:</span>
                             <span>Rs.{lastCompletedSale.splitQrAmount.toFixed(2)}</span>
                           </div>
                         ) : null}
                         {lastCompletedSale.splitCreditAmount ? (
                           <div className="flex justify-between text-zinc-600">
                             <span>CREDIT LEDGER DEBT:</span>
                             <span>Rs.{lastCompletedSale.splitCreditAmount.toFixed(2)}</span>
                           </div>
                         ) : null}
                       </>
                     ) : (
                       <>
                         {lastCompletedSale.paymentMethod === 'cash' && (
                           <>
                             <div className="flex justify-between text-zinc-600">
                               <span>CASH RECEIVED:</span>
                               <span>Rs.{(lastCompletedSale.cashReceived ?? lastCompletedSale.total).toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between text-zinc-600">
                               <span>CHANGE RETURN:</span>
                               <span>Rs.{(lastCompletedSale.cashChange ?? 0).toFixed(2)}</span>
                             </div>
                           </>
                         )}
                         {lastCompletedSale.paymentMethod === 'card' && (
                           <div className="flex justify-between text-zinc-600">
                             <span>CARD TRANS ID:</span>
                             <span>{lastCompletedSale.paymentReference || 'MID-****9842'}</span>
                           </div>
                         )}
                         {lastCompletedSale.paymentMethod === 'store_credit' && (
                           <div className="flex justify-between text-zinc-600">
                             <span>CREDIT ACCOUNT:</span>
                             <span>ACTIVE LEDGER</span>
                           </div>
                         )}
                         {lastCompletedSale.paymentMethod === 'qr_code' && (
                           <div className="flex justify-between text-zinc-600">
                             <span>LANKAQR SCAN:</span>
                             <span>VERIFIED SUCCESS</span>
                           </div>
                         )}
                         {lastCompletedSale.paymentMethod === 'bank_transfer' && (
                           <div className="flex justify-between text-zinc-600">
                             <span>DEP REF:</span>
                             <span>{lastCompletedSale.paymentReference || 'DEP-BOC-7044'}</span>
                           </div>
                         )}
                         {lastCompletedSale.paymentMethod === 'cheque' && (
                           <div className="flex justify-between text-zinc-600">
                             <span>CHEQUE LEDGER:</span>
                             <span>{lastCompletedSale.paymentReference || 'CHQ-000000'}</span>
                           </div>
                         )}
                       </>
                     )}
                   </div>

                  {/* Barcode representation */}
                  <div className="text-center mt-5 pt-3 border-t border-dashed border-zinc-400">
                    {/* Simulated Barcode */}
                    <div className="inline-flex flex-col items-center">
                      <div className="flex items-stretch h-8 bg-zinc-900 px-3 w-40 mb-1" style={{ letterSpacing: '2px' }}>
                        {/* CSS Barcode pattern */}
                        <div className="flex-1 flex gap-0.5 opacity-90">
                          <div className="bg-white w-1"></div><div className="bg-zinc-900 w-2"></div>
                          <div className="bg-white w-1"></div><div className="bg-zinc-900 w-1"></div>
                          <div className="bg-white w-1"></div><div className="bg-zinc-900 w-3"></div>
                          <div className="bg-white w-1"></div><div className="bg-zinc-900 w-1"></div>
                          <div className="bg-white w-2"></div><div className="bg-zinc-900 w-1"></div>
                          <div className="bg-white w-1"></div><div className="bg-zinc-900 w-2"></div>
                          <div className="bg-white w-1"></div><div className="bg-zinc-900 w-1"></div>
                        </div>
                      </div>
                      <span className="text-[8px] text-zinc-500 font-mono tracking-widest">{lastCompletedSale.invoiceNo}</span>
                    </div>
                  </div>

                  {/* Receipt Footer Message */}
                  <div className="text-center mt-4 pt-2 border-t border-dashed border-zinc-400 text-[8px] text-zinc-500 leading-snug">
                    <p className="font-bold uppercase">{systemConfig.receiptHeader}</p>
                    <p className="mt-0.5">{systemConfig.receiptFooter}</p>
                  </div>

                </div>
              </div>

              {/* Receipt actions footer */}
              <div className="p-4 bg-slate-850 border-t border-slate-800 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const printContents = document.getElementById('receipt_print_area')?.innerHTML;
                    if (printContents) {
                      const iframe = document.createElement('iframe');
                      iframe.style.position = 'absolute';
                      iframe.style.width = '0px';
                      iframe.style.height = '0px';
                      iframe.style.border = 'none';
                      document.body.appendChild(iframe);
                      
                      const doc = iframe.contentWindow?.document || iframe.contentDocument;
                      if (doc) {
                        doc.write(`
                          <html>
                            <head>
                              <title>Receipt Print</title>
                              <style>
                                body { font-family: monospace; padding: 20px; margin: 0; background: #fff; color: #000; display: flex; justify-content: center; }
                                @page { size: auto; margin: 0mm; }
                                * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                              </style>
                            </head>
                            <body>
                              ${printContents}
                              <script>
                                setTimeout(() => {
                                  window.print();
                                }, 250);
                              </script>
                            </body>
                          </html>
                        `);
                        doc.close();
                      }
                      
                      // Cleanup iframe
                      setTimeout(() => {
                        document.body.removeChild(iframe);
                      }, 4000);
                    }
                  }}
                  className="py-2 px-3 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/20 text-teal-400 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer flex justify-center items-center shadow-lg shadow-teal-950/10"
                >
                  Start Next Sale
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
