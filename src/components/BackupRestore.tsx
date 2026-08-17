/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Item, Sale, Category, Customer, Expense, User } from '../types';
import { 
  Download, Upload, FileText, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';

interface BackupRestoreProps {
  items: Item[];
  categories: Category[];
  users: User[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  onRestoreState: (restoredData: {
    items: Item[];
    categories: Category[];
    users: User[];
    customers: Customer[];
    sales: Sale[];
    expenses: Expense[];
  }) => void;
  onBulkImportProducts: (importedItems: Item[]) => void;
}

export default function BackupRestore({
  items,
  categories,
  users,
  customers,
  sales,
  expenses,
  onRestoreState,
  onBulkImportProducts,
}: BackupRestoreProps) {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // 1. Export entire database to local JSON Backup file
  const handleExportJSON = () => {
    const backupData = {
      version: "WCS-v2.4",
      timestamp: new Date().toISOString(),
      payload: {
        items,
        categories,
        users,
        customers,
        sales,
        expenses
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `WCS_POS_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Restore entire database from local JSON Backup file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.payload && Array.isArray(parsed.payload.items)) {
            onRestoreState({
              items: parsed.payload.items,
              categories: parsed.payload.categories || categories,
              users: parsed.payload.users || users,
              customers: parsed.payload.customers || customers,
              sales: parsed.payload.sales || sales,
              expenses: parsed.payload.expenses || expenses,
            });
            alert('WCS POS Database restored successfully! Reloading...');
            window.location.reload();
          } else {
            alert('Invalid WCS backup format. Restore aborted.');
          }
        } catch (err) {
          alert('Error parsing JSON backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // 3. Export active products ledger to CSV
  const handleExportProductsCSV = () => {
    const headers = ["ID", "Name", "Code", "Barcode", "CategoryID", "CostPrice", "RetailPrice", "Unit", "Stock", "MinStock", "Active"];
    const csvRows = [headers.join(",")];

    items.forEach(item => {
      const row = [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`,
        item.code,
        item.barcode,
        item.categoryId,
        item.costPrice,
        item.retailPrice,
        item.unit,
        item.stock,
        item.minStock,
        item.active ? 1 : 0
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WCS_Products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // 4. Download simple CSV products template
  const handleDownloadCSVTemplate = () => {
    const headers = ["Name", "Code", "Barcode", "CategoryID", "CostPrice", "RetailPrice", "Unit", "Stock", "MinStock"];
    const sampleRow = ["Basmati Rice Premium", "RICE-BAS-99", "8909999999999", categories[0]?.id || "cat_1", "120.00", "180.00", "kg", "150", "20"];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), sampleRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "WCS_Products_Template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // 5. Parse and bulk import items from uploaded CSV/TXT
  const handleImportProductsCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        if (rows.length < 2) {
          alert('CSV file is empty or missing headers.');
          return;
        }

        const newItems: Item[] = [];
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map(col => col.replace(/^"(.*)"$/, '$1').trim());
          if (cols.length >= 6) {
            const name = cols[0];
            const code = cols[1];
            const barcode = cols[2];
            const categoryId = cols[3];
            const costPrice = parseFloat(cols[4]) || 0;
            const retailPrice = parseFloat(cols[5]) || 0;
            const unit = (cols[6] || 'pcs') as any;
            const stock = parseFloat(cols[7]) || 0;
            const minStock = parseFloat(cols[8]) || 5;

            newItems.push({
              id: `itm_csv_${Date.now()}_${i}`,
              name,
              code,
              barcode,
              categoryId,
              costPrice,
              retailPrice,
              unit,
              stock,
              minStock,
              image: '',
              active: true
            });
          }
        }

        if (newItems.length > 0) {
          onBulkImportProducts(newItems);
          alert(`Successfully imported ${newItems.length} products to inventory state!`);
          window.location.reload();
        } else {
          alert('No valid product rows parsed. Double check CSV template headers.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-6rem)] overflow-y-auto" id="backups_pane">
      
      {/* LEFT BLOCK: SYSTEM-WIDE DATABASE BACKUPS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">
            State Persistence Engine
          </span>
          <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-teal-400" />
            Full Database Backup & Restore (JSON)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Protect your transaction summaries, supplier purchase orders, outstanding customer ledgers, and catalog records. Cleared browser caches will erase standard local state. Downloading a JSON snapshot acts as your durable local backup.
          </p>
          
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg text-center mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-bounce" />
            <span className="text-xs font-semibold text-slate-300 block">Durable Local Storage Warning</span>
            <p className="text-[10px] text-slate-500 mt-1">
              Store snapshots securely on your hard disk drive. Uploading a previous backup file will override current workspace data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Backup
          </button>

          {/* Import JSON Trigger */}
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload Snapshot
          </button>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </div>
      </div>

      {/* RIGHT BLOCK: CSV / EXCEL BULK CATALOG UTILITY */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">
            Data Utility Hub
          </span>
          <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Bulk CSV Catalog Import & Export (Excel compatible)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Import existing supermarket items list or export inventories to Excel for accounting. Download the standard CSV template layout first to ensure columns are aligned.
          </p>

          <div className="space-y-2 mt-2">
            <button
              onClick={handleDownloadCSVTemplate}
              className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-teal-400 hover:text-teal-300 border border-slate-850 rounded text-left px-3 text-xs flex items-center justify-between font-bold cursor-pointer transition-colors"
            >
              <span>1. Download WCS CSV Products Template</span>
              <Download className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-slate-500 px-1 leading-snug">
              * Template headers: Name, Code, Barcode, CategoryID, CostPrice, RetailPrice, Unit, Stock, MinStock
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-6">
          {/* Export Products CSV */}
          <button
            onClick={handleExportProductsCSV}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs border border-slate-700 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Products
          </button>

          {/* Import CSV Trigger */}
          <button
            onClick={() => csvInputRef.current?.click()}
            className="py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-teal-950/10"
          >
            <Upload className="w-4 h-4" /> Upload & Parse CSV
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv, .txt"
            onChange={handleImportProductsCSV}
            className="hidden"
          />
        </div>
      </div>

    </div>
  );
}
