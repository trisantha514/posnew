/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Item, Category, ProductUnit } from '../types';
import { 
  Plus, Edit2, Trash2, Search, Filter, AlertTriangle, CheckCircle, 
  X, Image as ImageIcon, Sparkles, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryManagerProps {
  categories: Category[];
  items: Item[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onAddItem: (item: Item) => void;
  onUpdateItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
}

export default function InventoryManager({
  categories,
  items,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: InventoryManagerProps) {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories'>('products');
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form States - Item
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemCostPrice, setItemCostPrice] = useState<number>(0);
  const [itemRetailPrice, setItemRetailPrice] = useState<number>(0);
  const [itemUnit, setItemUnit] = useState<ProductUnit>('pcs');
  const [itemStock, setItemStock] = useState<number>(0);
  const [itemMinStock, setItemMinStock] = useState<number>(5);
  const [itemImage, setItemImage] = useState('');
  const [itemActive, setItemActive] = useState(true);
  const [itemExpiryDate, setItemExpiryDate] = useState('');

  // Form States - Category
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Cost Price visibility toggle
  const [showCostPrice, setShowCostPrice] = useState(false);

  // Process image upload to Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate a random Item Code and Barcode
  const generateCodes = () => {
    const randCode = 'WCS-' + Math.floor(1000 + Math.random() * 9000);
    const randBarcode = '890' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setItemCode(randCode);
    setItemBarcode(randBarcode);
  };

  // Open Add Product modal
  const openAddItemModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCode('');
    setItemBarcode('');
    setItemCategoryId(categories[0]?.id || '');
    setItemCostPrice(0);
    setItemRetailPrice(0);
    setItemUnit('pcs');
    setItemStock(0);
    setItemMinStock(5);
    setItemImage('');
    setItemActive(true);
    setItemExpiryDate('');
    setShowItemModal(true);
  };

  // Open Edit Product modal
  const openEditItemModal = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCode(item.code);
    setItemBarcode(item.barcode);
    setItemCategoryId(item.categoryId);
    setItemCostPrice(item.costPrice);
    setItemRetailPrice(item.retailPrice);
    setItemUnit(item.unit);
    setItemStock(item.stock);
    setItemMinStock(item.minStock);
    setItemImage(item.image);
    setItemActive(item.active);
    setItemExpiryDate(item.expiryDate || '');
    setShowItemModal(true);
  };

  // Save Item (Add/Update)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemCode.trim() || !itemBarcode.trim() || !itemCategoryId) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    const payload: Item = {
      id: editingItem ? editingItem.id : `itm_${Date.now()}`,
      name: itemName,
      code: itemCode,
      barcode: itemBarcode,
      categoryId: itemCategoryId,
      costPrice: Number(itemCostPrice),
      retailPrice: Number(itemRetailPrice),
      unit: itemUnit,
      stock: Number(itemStock),
      minStock: Number(itemMinStock),
      image: itemImage,
      active: itemActive,
      expiryDate: itemExpiryDate || undefined,
    };

    if (editingItem) {
      onUpdateItem(payload);
    } else {
      onAddItem(payload);
    }
    setShowItemModal(false);
  };

  // Open Add Category modal
  const openAddCatModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setShowCatModal(true);
  };

  // Open Edit Category modal
  const openEditCatModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setShowCatModal(true);
  };

  // Save Category (Add/Update)
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const payload: Category = {
      id: editingCategory ? editingCategory.id : `cat_${Date.now()}`,
      name: catName,
      description: catDesc || undefined,
    };

    if (editingCategory) {
      onUpdateCategory(payload);
    } else {
      onAddCategory(payload);
    }
    setShowCatModal(false);
  };

  // Filter products list
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.includes(searchQuery);

      const matchesCat = filterCategory === 'all' || item.categoryId === filterCategory;

      let matchesStock = true;
      if (filterStockStatus === 'low') {
        matchesStock = item.stock <= item.minStock && item.stock > 0;
      } else if (filterStockStatus === 'out') {
        matchesStock = item.stock <= 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [items, searchQuery, filterCategory, filterStockStatus]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden" id="inventory_manager_container">
      
      {/* Sub-Header Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            Product Records
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            Categories Setup
          </button>
        </div>

        <div>
          {activeSubTab === 'products' ? (
            <button
              id="inv_add_item_btn"
              onClick={openAddItemModal}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Product Record
            </button>
          ) : (
            <button
              id="inv_add_cat_btn"
              onClick={openAddCatModal}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Category
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS RECORD WORKBENCH */}
      {activeSubTab === 'products' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
          
          {/* Filtering Tools Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="relative md:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="inv_search_input"
                type="text"
                placeholder="Search by Code, Barcode, or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <select
                id="inv_filter_cat"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                id="inv_filter_stock"
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Stocks Levels</option>
                <option value="low">⚠️ Low Stock Warning</option>
                <option value="out">❌ Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Products Grid / Table */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <AlertTriangle className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
                <p className="font-semibold text-slate-400">No matching products found</p>
                <p className="text-xs text-slate-600 mt-1">Try resetting search criteria or add new records</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse" id="inv_products_table">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Image</th>
                    <th className="py-3 px-4">Product Info</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Retail Price</th>
                    <th className="py-3 px-4 text-center">In-Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {filteredItems.map((item) => {
                    const isLowStock = item.stock <= item.minStock;
                    const catName = categories.find(c => c.id === item.categoryId)?.name || 'Unassigned';
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-10 h-10 rounded-md bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-700" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white leading-tight">{item.name}</div>
                          <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>Code: {item.code}</span>
                            <span>•</span>
                            <span>Barcode: {item.barcode}</span>
                            {item.expiryDate && (
                              <>
                                <span>•</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] border font-semibold ${
                                  new Date(item.expiryDate) < new Date()
                                    ? 'bg-rose-950/40 text-rose-400 border-rose-900/40'
                                    : 'bg-amber-950/30 text-amber-400 border-amber-900/30'
                                }`}>
                                  Exp: {item.expiryDate} {new Date(item.expiryDate) < new Date() ? '(Expired)' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {catName}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono">
                          {showCostPrice ? `Rs.${item.costPrice.toFixed(2)}` : '••••'}
                        </td>
                        <td className="py-3 px-4 text-right text-teal-400 font-semibold font-mono">
                          Rs. {item.retailPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${
                            isLowStock 
                              ? 'bg-rose-950/30 text-rose-400 border border-rose-900/20' 
                              : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/20'
                          }`}>
                            {item.stock.toFixed(item.unit === 'pcs' ? 0 : 3)} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.active ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="text-slate-500 inline-flex items-center gap-1 text-xs">
                              <X className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditItemModal(item)}
                              className="p-1.5 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 rounded text-slate-300 transition-all cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                  onDeleteItem(item.id);
                                }
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white rounded text-slate-400 transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer with Cost visibility toggle */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
            <span>Showing {filteredItems.length} of {items.length} total products</span>
            <button
              onClick={() => setShowCostPrice(!showCostPrice)}
              className="text-slate-400 hover:text-teal-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {showCostPrice ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showCostPrice ? 'Hide Cost Prices' : 'Reveal Supplier Cost'}
            </button>
          </div>
        </div>
      )}

      {/* CATEGORIES RECORD WORKBENCH */}
      {activeSubTab === 'categories' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse" id="inv_categories_table">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Associated Products</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {categories.map((cat) => {
                  const associatedCount = items.filter(i => i.categoryId === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        {cat.name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {cat.description || 'No description provided'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-teal-400">
                        {associatedCount} products
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditCatModal(cat)}
                            className="p-1.5 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 rounded text-slate-300 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={associatedCount > 0}
                            onClick={() => {
                              if (confirm(`Delete category "${cat.name}"?`)) {
                                onDeleteCategory(cat.id);
                              }
                            }}
                            className={`p-1.5 rounded text-slate-400 transition-all cursor-pointer ${
                              associatedCount > 0 
                                ? 'bg-slate-850 text-slate-600 cursor-not-allowed' 
                                : 'bg-slate-800 hover:bg-rose-600 hover:text-white'
                            }`}
                            title={associatedCount > 0 ? 'Cannot delete category containing products' : 'Delete Category'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT PRODUCT */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl my-8 overflow-hidden flex flex-col"
              id="product_form_modal"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
                  {editingItem ? 'Modify Product Record' : 'Create New Product Record'}
                </h3>
                <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Product Title *
                  </label>
                  <input
                    id="form_item_name"
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Sliced Sandwich Bread"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Grid of Codes & Barcode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Product Code *
                    </label>
                    <input
                      id="form_item_code"
                      type="text"
                      required
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      placeholder="e.g. BAK-BRD-07"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        EAN Barcode *
                      </label>
                      <button
                        type="button"
                        onClick={generateCodes}
                        className="text-[10px] text-teal-400 hover:text-teal-300 font-bold uppercase"
                      >
                        Autogen
                      </button>
                    </div>
                    <input
                      id="form_item_barcode"
                      type="text"
                      required
                      value={itemBarcode}
                      onChange={(e) => setItemBarcode(e.target.value)}
                      placeholder="e.g. 8901234567896"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      id="form_item_category"
                      required
                      value={itemCategoryId}
                      onChange={(e) => setItemCategoryId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Inventory Unit *
                    </label>
                    <select
                      id="form_item_unit"
                      required
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value as ProductUnit)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="gram">Grams (g)</option>
                    </select>
                  </div>
                </div>

                {/* Prices & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Supplier Cost *
                    </label>
                    <input
                      id="form_item_cost"
                      type="number"
                      step="0.01"
                      required
                      value={itemCostPrice}
                      onChange={(e) => setItemCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Selling Price *
                    </label>
                    <input
                      id="form_item_retail"
                      type="number"
                      step="0.01"
                      required
                      value={itemRetailPrice}
                      onChange={(e) => setItemRetailPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Current Stock *
                    </label>
                    <input
                      id="form_item_stock"
                      type="number"
                      step="0.001"
                      required
                      value={itemStock}
                      onChange={(e) => setItemStock(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Low stock limit and active toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Alert Level (Min Stock)
                    </label>
                    <input
                      id="form_item_minstock"
                      type="number"
                      step="0.01"
                      required
                      value={itemMinStock}
                      onChange={(e) => setItemMinStock(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      id="form_item_expiry"
                      type="date"
                      value={itemExpiryDate}
                      onChange={(e) => setItemExpiryDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      id="form_item_active"
                      type="checkbox"
                      checked={itemActive}
                      onChange={(e) => setItemActive(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-850 text-teal-500 focus:ring-teal-500 w-4 h-4"
                    />
                    <label htmlFor="form_item_active" className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Active Status
                    </label>
                  </div>
                </div>

                {/* JPG Product Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Product Image (JPG/PNG)
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      id="form_item_image_file"
                      type="file"
                      accept="image/jpeg, image/jpg, image/png"
                      onChange={handleImageChange}
                      className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-750 file:cursor-pointer"
                    />
                    {itemImage && (
                      <div className="relative w-12 h-12 border border-slate-800 rounded overflow-hidden">
                        <img src={itemImage} alt="Preview" className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setItemImage('')}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-500 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-sm transition-all cursor-pointer text-center"
                  >
                    Discard Changes
                  </button>
                  <button
                    id="form_item_submit"
                    type="submit"
                    className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-all cursor-pointer text-center"
                  >
                    Commit Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD/EDIT CATEGORY */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl"
              id="category_form_modal"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white">
                  {editingCategory ? 'Modify Category' : 'Create New Category'}
                </h3>
                <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Category Name *
                  </label>
                  <input
                    id="form_cat_name"
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Fresh Dairy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Brief Description
                  </label>
                  <textarea
                    id="form_cat_desc"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Brief description of category items"
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCatModal(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Discard
                  </button>
                  <button
                    id="form_cat_submit"
                    type="submit"
                    className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Save Category
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
