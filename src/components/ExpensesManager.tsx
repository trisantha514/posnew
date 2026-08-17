/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Calendar, DollarSign, Wallet, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  currentUser: { name: string };
}

export default function ExpensesManager({
  expenses,
  onAddExpense,
  onDeleteExpense,
  currentUser,
}: ExpensesManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('Utilities');
  const [remarks, setRemarks] = useState('');

  const expenseCategories = ['Utilities', 'Salaries', 'Rent', 'Logistics & Fuel', 'Supplies', 'Repairs', 'Miscellaneous'];

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, curr) => sum + curr.amount, 0);
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      title,
      amount,
      category,
      date: new Date().toLocaleDateString('en-CA'),
      loggedBy: currentUser.name,
      remarks: remarks || undefined,
    };

    onAddExpense(newExpense);
    setTitle('');
    setAmount(0);
    setCategory('Utilities');
    setRemarks('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden" id="expenses_manager_panel">
      
      {/* Summary KPI Block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
              Consolidated Expenses
            </span>
            <span className="text-xl font-black text-rose-400">Rs. {totalExpenses.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-rose-950/20 border border-rose-900/20 text-rose-400 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
              Total Logs Recorded
            </span>
            <span className="text-xl font-black text-slate-200">{expenses.length} logs</span>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="flex justify-end items-center">
          <button
            id="exp_log_btn"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-teal-950/10 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Log Business Expense
          </button>
        </div>
      </div>

      {/* Expenses List Panel */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto pr-1">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Wallet className="w-12 h-12 mb-2 text-slate-700" />
              <p className="font-semibold text-slate-400">No overhead expenses logged</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="expenses_table">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date logged</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4 text-right">Amount Outward</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{exp.title}</div>
                      {exp.remarks && (
                        <div className="text-[10px] text-slate-500 mt-1">{exp.remarks}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-850">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {exp.loggedBy}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      Rs. {exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Remove expense log for "${exp.title}"?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="p-1.5 bg-slate-850 hover:bg-rose-600 hover:text-white rounded text-slate-500 transition-colors cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: LOG NEW EXPENSE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl"
              id="expense_form_modal"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-teal-400" />
                  Log Expense Outflow
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Expense Description *
                  </label>
                  <input
                    id="form_exp_title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CEB Electricity Bill (July)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Amount (Rs.) *
                    </label>
                    <input
                      id="form_exp_amount"
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      id="form_exp_category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Internal Remarks (Optional)
                  </label>
                  <textarea
                    id="form_exp_remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Reference receipts or transaction keys"
                    rows={2}
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
                    id="form_exp_submit"
                    type="submit"
                    className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Log Outflow
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
