/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PurchaseOrder, POItem, ReturnPurchase, ReturnBill, Item, Sale } from '../types';
import { 
  Plus, Clipboard, RefreshCw, Eye, CheckCircle, PackageOpen, 
  ArrowLeftRight, ArrowDownLeft, Trash2, Save, X, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PurchaseOrdersProps {
  purchaseOrders: PurchaseOrder[];
  returnPurchases: ReturnPurchase[];
  returnBills: ReturnBill[];
  items: Item[];
  sales: Sale[];
  onAddPurchaseOrder: (po: PurchaseOrder) => void;
  onUpdatePurchaseOrderStatus: (id: string, status: 'Draft' | 'Sent' | 'Received') => void;
  onAddReturnPurchase: (ret: ReturnPurchase) => void;
  onAddReturnBill: (ret: ReturnBill) => void;
  onUpdateStock: (itemId: string, qtyToAdd: number) => void;
}

export default function PurchaseOrders({
  purchaseOrders,
  returnPurchases,
  returnBills,
  items,
  sales,
  onAddPurchaseOrder,
  onUpdatePurchaseOrderStatus,
  onAddReturnPurchase,
  onAddReturnBill,
  onUpdateStock,
}: PurchaseOrdersProps) {
  // Tabs: 'po' | 'supplier_return' | 'customer_return'
  const [activeTab, setActiveTab] = useState<'po' | 'supplier_return' | 'customer_return'>('po');

  // Modal displays
  const [showPoModal, setShowPoModal] = useState(false);
  const [showSupRetModal, setShowSupRetModal] = useState(false);
  const [showCustRetModal, setShowCustRetModal] = useState(false);
  const [viewingPo, setViewingPo] = useState<PurchaseOrder | null>(null);

  // Purchase Order Form States
  const [poSupplier, setPoSupplier] = useState('');
  const [poLines, setPoLines] = useState<POItem[]>([]);
  const [poItemSelect, setPoItemSelect] = useState('');
  const [poItemQty, setPoItemQty] = useState<number>(1);
  const [poItemCost, setPoItemCost] = useState<number>(0);

  // Supplier Return Form States
  const [retSupplier, setRetSupplier] = useState('');
  const [retLines, setRetLines] = useState<POItem[]>([]);
  const [retItemSelect, setRetItemSelect] = useState('');
  const [retItemQty, setRetItemQty] = useState<number>(1);
  const [retItemCost, setRetItemCost] = useState<number>(0);

  // Customer Bill Return Form States
  const [retInvoiceNo, setRetInvoiceNo] = useState('');
  const [retReason, setRetReason] = useState('');
  const [retCustLines, setRetCustLines] = useState<any[]>([]);
  const [retCustItemSelect, setRetCustItemSelect] = useState('');
  const [retCustItemQty, setRetCustItemQty] = useState<number>(1);

  // PO Line Add Handler
  const handleAddPoLine = () => {
    if (!poItemSelect) return;
    const item = items.find(i => i.id === poItemSelect);
    if (item) {
      const existing = poLines.find(l => l.itemId === item.id);
      if (existing) {
        setPoLines(poLines.map(l => l.itemId === item.id ? {
          ...l,
          quantity: l.quantity + poItemQty,
          total: parseFloat(((l.quantity + poItemQty) * l.costPrice).toFixed(2))
        } : l));
      } else {
        setPoLines([...poLines, {
          itemId: item.id,
          name: item.name,
          costPrice: poItemCost || item.costPrice,
          quantity: poItemQty,
          total: parseFloat((poItemQty * (poItemCost || item.costPrice)).toFixed(2))
        }]);
      }
      setPoItemSelect('');
      setPoItemQty(1);
      setPoItemCost(0);
    }
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplier.trim() || poLines.length === 0) return;

    const poNo = `WCS-PO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPo: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNo,
      supplier: poSupplier,
      orderDate: new Date().toLocaleDateString('en-CA'),
      status: 'Draft',
      items: poLines,
      totalAmount: poLines.reduce((acc, curr) => acc + curr.total, 0),
    };

    onAddPurchaseOrder(newPo);
    setPoLines([]);
    setPoSupplier('');
    setShowPoModal(false);
  };

  // Supplier Return Line Handlers
  const handleAddRetLine = () => {
    if (!retItemSelect) return;
    const item = items.find(i => i.id === retItemSelect);
    if (item) {
      if (retItemQty > item.stock) {
        alert(`Cannot return more than current stock level: ${item.stock} ${item.unit}`);
        return;
      }
      const existing = retLines.find(l => l.itemId === item.id);
      if (existing) {
        setRetLines(retLines.map(l => l.itemId === item.id ? {
          ...l,
          quantity: l.quantity + retItemQty,
          total: parseFloat(((l.quantity + retItemQty) * l.costPrice).toFixed(2))
        } : l));
      } else {
        setRetLines([...retLines, {
          itemId: item.id,
          name: item.name,
          costPrice: retItemCost || item.costPrice,
          quantity: retItemQty,
          total: parseFloat((retItemQty * (retItemCost || item.costPrice)).toFixed(2))
        }]);
      }
      setRetItemSelect('');
      setRetItemQty(1);
      setRetItemCost(0);
    }
  };

  const handleSaveSupplierReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retSupplier.trim() || retLines.length === 0) return;

    const returnNo = `WCS-SR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRet: ReturnPurchase = {
      id: `sup_ret_${Date.now()}`,
      returnNo,
      supplier: retSupplier,
      date: new Date().toLocaleDateString('en-CA'),
      items: retLines,
      totalAmount: retLines.reduce((acc, curr) => acc + curr.total, 0),
    };

    onAddReturnPurchase(newRet);
    
    // Subtract stock immediately
    retLines.forEach(line => {
      onUpdateStock(line.itemId, -line.quantity); // Subtract stock
    });

    setRetLines([]);
    setRetSupplier('');
    setShowSupRetModal(false);
  };

  // Customer Return line handlers
  const handleAddCustRetLine = () => {
    if (!retCustItemSelect) return;
    const item = items.find(i => i.id === retCustItemSelect);
    if (item) {
      const existing = retCustLines.find(l => l.itemId === item.id);
      if (existing) {
        setRetCustLines(retCustLines.map(l => l.itemId === item.id ? {
          ...l,
          quantity: l.quantity + retCustItemQty,
          total: parseFloat(((l.quantity + retCustItemQty) * l.price).toFixed(2))
        } : l));
      } else {
        setRetCustLines([...retCustLines, {
          itemId: item.id,
          name: item.name,
          code: item.code,
          price: item.retailPrice,
          quantity: retCustItemQty,
          unit: item.unit,
          total: parseFloat((retCustItemQty * item.retailPrice).toFixed(2))
        }]);
      }
      setRetCustItemSelect('');
      setRetCustItemQty(1);
    }
  };

  const handleSaveCustReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retInvoiceNo.trim() || retCustLines.length === 0) return;

    const returnNo = `WCS-CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRet: ReturnBill = {
      id: `cust_ret_${Date.now()}`,
      returnNo,
      saleInvoiceNo: retInvoiceNo,
      date: new Date().toLocaleDateString('en-CA'),
      reason: retReason,
      items: retCustLines,
      refundAmount: retCustLines.reduce((acc, curr) => acc + curr.total, 0),
    };

    onAddReturnBill(newRet);
    
    // Add stock back immediately
    retCustLines.forEach(line => {
      onUpdateStock(line.itemId, line.quantity); // Add stock back
    });

    setRetCustLines([]);
    setRetInvoiceNo('');
    setRetReason('');
    setShowCustRetModal(false);
  };

  const markPOAsReceived = (po: PurchaseOrder) => {
    onUpdateOrderStatus(po.id, 'Received');
  };

  const onUpdateOrderStatus = (id: string, status: 'Draft' | 'Sent' | 'Received') => {
    onUpdateOrderStatusAndStocks(id, status);
  };

  const onUpdateOrderStatusAndStocks = (id: string, status: 'Draft' | 'Sent' | 'Received') => {
    onUpdateOrderStatus(id, status);
    if (status === 'Received') {
      const po = purchaseOrders.find(p => p.id === id);
      if (po) {
        po.items.forEach(line => {
          onUpdateStock(line.itemId, line.quantity); // Add to stock
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden" id="procurement_workbench">
      
      {/* Tab Row Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-3">
        <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('po')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'po' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5 inline mr-1.5" />
            Purchase Orders
          </button>
          
          <button
            onClick={() => setActiveTab('supplier_return')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'supplier_return' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PackageOpen className="w-3.5 h-3.5 inline mr-1.5" />
            Supplier Returns
          </button>
          
          <button
            onClick={() => setActiveTab('customer_return')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'customer_return' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 inline mr-1.5" />
            Customer Return Bills
          </button>
        </div>

        <div>
          {activeTab === 'po' && (
            <button
              onClick={() => setShowPoModal(true)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Purchase Order
            </button>
          )}
          {activeTab === 'supplier_return' && (
            <button
              onClick={() => setShowSupRetModal(true)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Log Supplier Return
            </button>
          )}
          {activeTab === 'customer_return' && (
            <button
              onClick={() => setShowCustRetModal(true)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Process Sale Refund
            </button>
          )}
        </div>
      </div>

      {/* PO LIST WORKBENCH */}
      {activeTab === 'po' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto" id="po_tab_pane">
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Clipboard className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="font-semibold text-slate-400">No purchase orders drafted</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Date Ordered</th>
                  <th className="py-3 px-4 text-right">Items Quantity</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Procurement Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {purchaseOrders.map((po) => {
                  const itemsCount = po.items.reduce((acc, curr) => acc + curr.quantity, 0);
                  return (
                    <tr key={po.id} className="hover:bg-slate-950/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{po.poNo}</td>
                      <td className="py-3 px-4 text-slate-300">{po.supplier}</td>
                      <td className="py-3 px-4 text-slate-400">{po.orderDate}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-300">{itemsCount} units</td>
                      <td className="py-3 px-4 text-right font-bold text-teal-400">Rs. {po.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          po.status === 'Received' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' 
                            : po.status === 'Sent' 
                              ? 'bg-blue-950 text-blue-400 border border-blue-900/30' 
                              : 'bg-slate-950 text-slate-400 border border-slate-850'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setViewingPo(po)}
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
                            title="View Items details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {po.status !== 'Received' && (
                            <button
                              onClick={() => {
                                if (confirm(`Mark PO ${po.poNo} as Received? This adds items to your stock level!`)) {
                                  onUpdateOrderStatusAndStocks(po.id, 'Received');
                                }
                              }}
                              className="p-1.5 bg-slate-850 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded border border-slate-800 hover:border-transparent transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Received
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SUPPLIER RETURNS PANELS */}
      {activeTab === 'supplier_return' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto" id="sup_return_pane">
          {returnPurchases.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <PackageOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="font-semibold text-slate-400">No supplier returns registered</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Return Number</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items Returned</th>
                  <th className="py-3 px-4 text-right">Debit Adjust Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {returnPurchases.map((rp) => {
                  const qty = rp.items.reduce((acc, curr) => acc + curr.quantity, 0);
                  return (
                    <tr key={rp.id} className="hover:bg-slate-950/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{rp.returnNo}</td>
                      <td className="py-3 px-4 text-slate-300">{rp.supplier}</td>
                      <td className="py-3 px-4 text-slate-400">{rp.date}</td>
                      <td className="py-3 px-4 text-slate-400">{qty} items</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400">Rs. {rp.totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CUSTOMER REFUND/RETURN BILL PANELS */}
      {activeTab === 'customer_return' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto" id="cust_return_pane">
          {returnBills.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <RefreshCw className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-spin-slow" />
              <p className="font-semibold text-slate-400">No sales return refunds logged</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Return ID</th>
                  <th className="py-3 px-4">Invoice Referenced</th>
                  <th className="py-3 px-4">Refund Date</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Refund Cleared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {returnBills.map((rb) => (
                  <tr key={rb.id} className="hover:bg-slate-950/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{rb.returnNo}</td>
                    <td className="py-3 px-4 text-teal-400 font-mono">{rb.saleInvoiceNo}</td>
                    <td className="py-3 px-4 text-slate-400">{rb.date}</td>
                    <td className="py-3 px-4 text-slate-300">{rb.reason}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">Rs. {rb.refundAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      <AnimatePresence>
        {showPoModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <Clipboard className="w-5 h-5 text-teal-400" />
                  Draft Purchase Order
                </h3>
                <button onClick={() => setShowPoModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePO} className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={poSupplier}
                    onChange={(e) => setPoSupplier(e.target.value)}
                    placeholder="e.g. Ceylon Grain Suppliers Ltd."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Add Item Row */}
                <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Add Items to PO List</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Select Product</label>
                      <select
                        value={poItemSelect}
                        onChange={(e) => {
                          setPoItemSelect(e.target.value);
                          const itm = items.find(i => i.id === e.target.value);
                          if (itm) setPoItemCost(itm.costPrice);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Choose Product --</option>
                        {items.map(i => (
                          <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Cost Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={poItemCost || ''}
                          onChange={(e) => setPoItemCost(parseFloat(e.target.value) || 0)}
                          placeholder="Cost"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={poItemQty}
                          onChange={(e) => setPoItemQty(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPoLine}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-teal-400 text-xs font-bold rounded cursor-pointer transition-colors"
                  >
                    Add Line Item
                  </button>
                </div>

                {/* Selected items review */}
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {poLines.map((line, i) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-slate-950 p-2 border border-slate-850 rounded">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-semibold text-slate-200 block truncate">{line.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {line.quantity} units x Rs. {line.costPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">Rs. {line.total.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => setPoLines(poLines.filter((_, idx) => idx !== i))}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total PO value */}
                <div className="flex justify-between items-center bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-xs font-bold text-slate-400">Total Procurement Value:</span>
                  <span className="font-black text-teal-400 text-lg">
                    Rs. {poLines.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={poLines.length === 0}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-all disabled:opacity-40 cursor-pointer text-center"
                >
                  Save & Draft PO
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: LOG SUPPLIER RETURN */}
      <AnimatePresence>
        {showSupRetModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <ArrowDownLeft className="w-5 h-5 text-rose-400" />
                  Supplier Outward Return
                </h3>
                <button onClick={() => setShowSupRetModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSupplierReturn} className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={retSupplier}
                    onChange={(e) => setRetSupplier(e.target.value)}
                    placeholder="e.g. Ceylon Grain Suppliers Ltd."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Return Item select rows */}
                <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 text-rose-400">Select Outgoing Items</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Product</label>
                      <select
                        value={retItemSelect}
                        onChange={(e) => {
                          setRetItemSelect(e.target.value);
                          const itm = items.find(i => i.id === e.target.value);
                          if (itm) setRetItemCost(itm.costPrice);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Choose Product --</option>
                        {items.map(i => (
                          <option key={i.id} value={i.id}>{i.name} (Stock: {i.stock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Cost Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={retItemCost || ''}
                          onChange={(e) => setRetItemCost(parseFloat(e.target.value) || 0)}
                          placeholder="Cost"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Qty to Return</label>
                        <input
                          type="number"
                          min="1"
                          value={retItemQty}
                          onChange={(e) => setRetItemQty(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRetLine}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-rose-400 text-xs font-bold rounded cursor-pointer transition-colors"
                  >
                    Add Outgoing Line
                  </button>
                </div>

                {/* Line Review list */}
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {retLines.map((line, i) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-slate-950 p-2 border border-slate-850 rounded">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-semibold text-slate-200 block truncate">{line.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {line.quantity} units x Rs. {line.costPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-rose-400">Rs. {line.total.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => setRetLines(retLines.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-xs font-bold text-slate-400">Debit Adjustment total:</span>
                  <span className="font-black text-rose-400 text-lg">
                    Rs. {retLines.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={retLines.length === 0}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-40 cursor-pointer text-center"
                >
                  Confirm Supplier Return (Deducts Stocks)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SALE REFUND / CUSTOMER RETURN BILLS */}
      <AnimatePresence>
        {showCustRetModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <RefreshCw className="w-5 h-5 text-teal-400" />
                  Process Customer Sale Refund
                </h3>
                <button onClick={() => setShowCustRetModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustReturn} className="space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Referenced Invoice No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={retInvoiceNo}
                      onChange={(e) => setRetInvoiceNo(e.target.value)}
                      placeholder="e.g. WCS-INV-10025"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Reason for Return *
                    </label>
                    <input
                      type="text"
                      required
                      value={retReason}
                      onChange={(e) => setRetReason(e.target.value)}
                      placeholder="Defective, wrong size, etc."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Refund items adder */}
                <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 text-teal-400">Identify Refund Items</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Product</label>
                      <select
                        value={retCustItemSelect}
                        onChange={(e) => setRetCustItemSelect(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">-- Choose Product --</option>
                        {items.map(i => (
                          <option key={i.id} value={i.id}>{i.name} (Rs. {i.retailPrice})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Quantity Returned</label>
                      <input
                        type="number"
                        min="1"
                        value={retCustItemQty}
                        onChange={(e) => setRetCustItemQty(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-center font-bold"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustRetLine}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-teal-400 text-xs font-bold rounded cursor-pointer transition-colors"
                  >
                    Add Refund Line
                  </button>
                </div>

                {/* Line item review */}
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {retCustLines.map((line, i) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-slate-950 p-2 border border-slate-850 rounded">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-semibold text-slate-200 block truncate">{line.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {line.quantity} units x Rs. {line.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-teal-400">Rs. {line.total.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => setRetCustLines(retCustLines.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-xs font-bold text-slate-400">Grand Refund Amount:</span>
                  <span className="font-black text-rose-400 text-lg">
                    Rs. {retCustLines.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={retCustLines.length === 0}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-all disabled:opacity-40 cursor-pointer text-center"
                >
                  Issue Refund (Restores Stocks)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PO VIEW MODAL */}
      <AnimatePresence>
        {viewingPo && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white">Purchase Order Details</h3>
                <button onClick={() => setViewingPo(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 text-xs text-slate-400">
                  <div>PO Number: <span className="font-bold text-white block mt-0.5">{viewingPo.poNo}</span></div>
                  <div>Supplier: <span className="font-bold text-white block mt-0.5">{viewingPo.supplier}</span></div>
                </div>

                <div className="border-t border-slate-800/80 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Order Lines</span>
                  <div className="space-y-1 mt-1.5">
                    {viewingPo.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs bg-slate-950 p-2 border border-slate-855 rounded">
                        <span>{it.name} <span className="text-slate-500">x{it.quantity}</span></span>
                        <span className="font-semibold text-teal-400">Rs. {it.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-800/80 font-bold text-sm">
                  <span>Grand Total:</span>
                  <span className="text-teal-400 text-md font-extrabold">Rs. {viewingPo.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
