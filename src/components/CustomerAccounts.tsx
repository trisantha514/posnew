/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer } from '../types';
import { Plus, Search, UserPlus, Phone, Award, DollarSign, RefreshCw, X, ChevronRight, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerAccountsProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomerBalance: (id: string, amountToSettle: number) => void;
}

export default function CustomerAccounts({
  customers,
  onAddCustomer,
  onUpdateCustomerBalance,
}: CustomerAccountsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form States - Customer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Form States - Settle Balance
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleType, setSettleType] = useState<'pay_debt' | 'add_credit'>('pay_debt');

  const filteredCustomers = customers.filter(cust => {
    const query = searchQuery.toLowerCase();
    return cust.name.toLowerCase().includes(query) || cust.phone.includes(query);
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      name,
      phone,
      email: email || undefined,
      points: 0,
      outstandingBalance: 0,
    };

    onAddCustomer(newCustomer);
    setName('');
    setPhone('');
    setEmail('');
    setShowAddModal(false);
  };

  const handleSettleBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || settleAmount <= 0) return;

    // pay_debt means adding money to positive (e.g. if outstanding is negative -500, they pay Rs.500, making it 0)
    // add_credit means adding store credit balance
    const changeAmount = settleType === 'pay_debt' ? settleAmount : -settleAmount;
    
    onUpdateCustomerBalance(selectedCustomer.id, changeAmount);
    setSettleAmount(0);
    setSelectedCustomer(null);
    setShowSettleModal(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden" id="customers_registry_panel">
      
      {/* Search and Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="cust_search_input"
            type="text"
            placeholder="Search Customers by Name or Mobile No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          id="cust_add_btn"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 justify-center"
        >
          <UserPlus className="w-4 h-4" />
          Register New Customer
        </button>
      </div>

      {/* Customer Accounts Grid Ledger */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto" id="customers_ledgers">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <UserPlus className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="font-semibold text-slate-400">No matching customer profiles</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-center">Loyalty Points</th>
                <th className="py-3 px-4 text-right">Outstanding Ledger Balance</th>
                <th className="py-3 px-4 text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {filteredCustomers.map((cust) => {
                const isDebtor = cust.outstandingBalance < 0;
                const isCreditor = cust.outstandingBalance > 0;
                
                return (
                  <tr key={cust.id} className="hover:bg-slate-950/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{cust.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ID: {cust.id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{cust.phone}</span>
                      </div>
                      {cust.email && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">{cust.email}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-amber-950/30 text-amber-400 border border-amber-900/30 rounded-full font-bold text-xs inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {cust.points} Pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isDebtor ? (
                        <span className="font-bold text-rose-400">
                          Owes store Rs. {Math.abs(cust.outstandingBalance).toFixed(2)}
                        </span>
                      ) : isCreditor ? (
                        <span className="font-bold text-emerald-400">
                          Store Credit Rs. {cust.outstandingBalance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-semibold">Settled (Rs. 0.00)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setSettleType(isDebtor ? 'pay_debt' : 'add_credit');
                          setShowSettleModal(true);
                        }}
                        className="py-1 px-3 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 hover:border-transparent transition-all cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Adjust Ledger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: REGISTER NEW CUSTOMER */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl"
              id="cust_form_modal"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-teal-400" />
                  New Customer Account
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Customer Full Name *
                  </label>
                  <input
                    id="form_cust_name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Manjula Trisantha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mobile Phone Number *
                  </label>
                  <input
                    id="form_cust_phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0771234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    id="form_cust_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. customer@domain.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    id="form_cust_submit"
                    type="submit"
                    className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADJUST/SETTLE LEDGER BALANCE */}
      <AnimatePresence>
        {showSettleModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl"
              id="settle_ledger_modal"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-teal-400 animate-pulse" />
                  Adjust Ledger Account
                </h3>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer text-xl">
                  &times;
                </button>
              </div>

              <div className="mb-4 bg-slate-950 p-3 border border-slate-850 rounded-lg text-xs space-y-1.5">
                <div>Client Name: <span className="font-bold text-white text-sm block mt-0.5">{selectedCustomer.name}</span></div>
                <div>Current outstanding: <span className="font-mono text-teal-400 font-bold text-sm block mt-0.5">
                  Rs. {selectedCustomer.outstandingBalance.toFixed(2)}
                </span></div>
              </div>

              <form onSubmit={handleSettleBalance} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Ledger Action Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettleType('pay_debt')}
                      className={`py-2 px-2 border rounded-lg font-bold text-xs cursor-pointer text-center transition-all ${
                        settleType === 'pay_debt'
                          ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                          : 'bg-slate-950 border-slate-850 text-slate-400'
                      }`}
                    >
                      Receive Cash Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettleType('add_credit')}
                      className={`py-2 px-2 border rounded-lg font-bold text-xs cursor-pointer text-center transition-all ${
                        settleType === 'add_credit'
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                          : 'bg-slate-950 border-slate-850 text-slate-400'
                      }`}
                    >
                      Issue Store Credit
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Adjustment Amount (Rs.) *
                  </label>
                  <input
                    id="form_settle_amount"
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={settleAmount || ''}
                    onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setShowSettleModal(false);
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    id="form_settle_submit"
                    type="submit"
                    className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Book Adjustment
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
