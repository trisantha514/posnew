/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Item, SystemConfig } from '../types';
import { 
  Printer, Scale, Copy, Database, Cloud, Share2, 
  MessageSquare, LayoutGrid, Check, FileText
} from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface BarcodeItemProps {
  code: string;
  format: 'CODE128' | 'EAN13';
}

function BarcodeItem({ code, format }: BarcodeItemProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        const cleanCode = (code || '000000000000').trim();
        // EAN13 needs exactly 12 or 13 digits, fallback to CODE128 if not matching
        const chosenFormat = format === 'EAN13' && /^\d{12,13}$/.test(cleanCode) ? 'EAN13' : 'CODE128';

        JsBarcode(svgRef.current, cleanCode, {
          format: chosenFormat,
          width: 1.1,
          height: 26,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('JsBarcode failed', err);
      }
    }
  }, [code, format]);

  return (
    <div className="w-full flex justify-center items-center overflow-hidden py-0.5" style={{ minHeight: '30px' }}>
      <svg ref={svgRef} className="max-w-full block" />
    </div>
  );
}

interface SystemIntegrationsProps {
  items: Item[];
  systemConfig: SystemConfig;
}

export default function SystemIntegrations({ items, systemConfig }: SystemIntegrationsProps) {
  // Sub-tabs: 'hardware' | 'barcodes' | 'marketing' | 'mysql' | 'infinity'
  const [activeTab, setActiveTab] = useState<'hardware' | 'barcodes' | 'marketing' | 'mysql' | 'infinity'>('hardware');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Barcode Label States
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [labelSize, setLabelSize] = useState('38x25mm');
  const [labelsCount, setLabelsCount] = useState(12);
  const [barcodeFormat, setBarcodeFormat] = useState<'ean13' | 'code128'>('code128');
  const [layoutColumns, setLayoutColumns] = useState<'1' | 'multi'>('1');
  const [labelGap, setLabelGap] = useState<'3' | '5'>('3');

  // Marketing states
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoCustomMsg, setPromoCustomMsg] = useState('Fresh stock arrived! Grab yours now before it runs out!');

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const selectedItem = items.find(i => i.id === selectedItemId) || items[0];

  // Millimeter sizes translation to CSS classes
  const sizeMap: Record<string, { width: string; height: string; text: string }> = {
    '20x10mm': { width: '75px', height: '38px', text: 'text-[7px]' },
    '30x20mm': { width: '113px', height: '75px', text: 'text-[9px]' },
    '38x25mm': { width: '143px', height: '94px', text: 'text-[10px]' },
    '50x25mm': { width: '189px', height: '94px', text: 'text-[10px]' },
    '40x30mm': { width: '151px', height: '113px', text: 'text-[11px]' },
    '50x30mm': { width: '189px', height: '113px', text: 'text-[11px]' },
    'code128_1col_3mm': { width: '143px', height: '113px', text: 'text-[10px]' },
  };

  const currentSizeConfig = sizeMap[labelSize] || sizeMap['38x25mm'];

  // ESC/POS Copyable Code snippet
  const escposSnippet = `// ESC/POS Node.js command to trigger RJ11 Cash Drawer via Receipt Printer
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const device  = new escpos.USB();
const printer = new escpos.Printer(device);

device.open(function(error){
  if(error) return console.error(error);
  
  // ESC/POS Cash Drawer pulse code: ESC p m t1 t2
  // Hex: 1B 70 00 19 FA
  printer.write(Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]));
  printer.text('Cash drawer triggered successfully!');
  printer.cut();
  device.close();
});`;

  // Scale Integration code snippet
  const scaleSnippet = `// Web Serial API snippet to read weight from Electronic Scale in React
async function connectToScale() {
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
    
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    
    // Listen to scale continuous stream outputs
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        // Sample output: "ST,GS,+01.251kg" -> Extract "1.251"
        const match = value.match(/\\+?(-?\\d+\\.\\d+)/);
        if (match) {
          const weight = parseFloat(match[1]);
          console.log("Measured Net Weight:", weight);
        }
      }
    }
  } catch (error) {
    console.error("Scale connection failed:", error);
  }
}`;

  // MySQL SQL Code snippet
  const mysqlSchema = `-- WCS Inventory POS MySQL Schema Structure
CREATE DATABASE IF NOT EXISTS wcs_pos_db;
USE wcs_pos_db;

-- 1. Categories Table
CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Products / Items Table
CREATE TABLE items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(100) NOT NULL,
  category_id VARCHAR(50),
  cost_price DECIMAL(10,2) NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL,
  unit ENUM('pcs', 'kg', 'gram') DEFAULT 'pcs',
  stock DECIMAL(10,3) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 5,
  image_url LONGTEXT,
  active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Customers Table
CREATE TABLE customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  points INT DEFAULT 0,
  outstanding_balance DECIMAL(10,2) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Expenses Table
CREATE TABLE expenses (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date_logged DATE NOT NULL,
  logged_by VARCHAR(100) NOT NULL,
  remarks TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

  // InfinityFree index.php snippet
  const infinityPhp = `<?php
// index.php - InfinityFree Entrypoint
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

require_once "api/config.php";

$request_uri = $_SERVER['REQUEST_URI'];

if (strpos($request_uri, '/api/products') !== false) {
    // Fetch products
    $stmt = $pdo->query("SELECT * FROM items WHERE active = 1");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "products" => $products]);
} else {
    echo json_encode(["status" => "running", "message" => "WCS Inventory POS API operational"]);
}
?>`;

  // InfinityFree config.php snippet
  const infinityConfig = `<?php
// api/config.php - MySQL connection settings
$host = "sql301.infinityfree.com"; // Your InfinityFree SQL Host
$dbname = "epiz_31234_wcs_db";     // Your InfinityFree database name
$username = "epiz_31234";          // Your InfinityFree database user
$password = "yourMySqlPassword";   // Your InfinityFree database password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $e->getMessage()]));
}
?>`;

  // Dynamic promo messaging generator
  const generatedPromoMsg = selectedItem 
    ? `🚨 PROMO FLASH! 🚨\n\nGet *${selectedItem.name}* for an incredible price of just *Rs. ${(selectedItem.retailPrice * (1 - promoDiscount / 100)).toFixed(2)}* (Save ${promoDiscount}%!) 🥳\n\n${promoCustomMsg}\n\n📍 Visit WCS Retail Store today!\n📞 Call: ${systemConfig?.storePhone || '+94 11 234 5678'}`
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-6rem)] overflow-hidden" id="integrations_hub_container">
      
      {/* Tab Menu Left Navigation Column (3 cols) */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 h-full">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 block mb-2">
          Integrations & Blueprints
        </span>
        
        <button
          onClick={() => setActiveTab('hardware')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
            activeTab === 'hardware' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          Hardware & Scales Guides
        </button>

        <button
          onClick={() => setActiveTab('barcodes')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
            activeTab === 'barcodes' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Barcode Label Sheet Printing
        </button>

        <button
          onClick={() => setActiveTab('marketing')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
            activeTab === 'marketing' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Social Promo Broadcaster
        </button>

        <button
          onClick={() => setActiveTab('mysql')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
            activeTab === 'mysql' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          MySQL Schema script
        </button>

        <button
          onClick={() => setActiveTab('infinity')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
            activeTab === 'infinity' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
          }`}
        >
          <Cloud className="w-4 h-4" />
          InfinityFree PHP Blueprints
        </button>
      </div>

      {/* Tab Contents Container Column (9 cols) */}
      <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-xl p-5 h-full overflow-y-auto">
        
        {/* HARDWARE INTERFACE PANEL */}
        {activeTab === 'hardware' && (
          <div className="space-y-6" id="hardware_pane">
            <div>
              <h3 className="text-md font-bold text-white mb-1.5 flex items-center gap-2">
                <Scale className="text-teal-400 w-5 h-5" />
                Electronic Weighing Scales Integration Guide
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                WCS Inventory POS utilizes direct serial port access via the modern browser **Web Serial API** or native raw system triggers. Standard scale configurations expect continuous streaming data of measured values.
              </p>
              
              <div className="relative bg-slate-950 border border-slate-850 rounded-lg p-3.5">
                <button
                  type="button"
                  onClick={() => handleCopy(scaleSnippet, 'scale')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-slate-400 hover:text-white"
                >
                  {copiedText === 'scale' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-[10px] text-teal-300 font-mono overflow-x-auto whitespace-pre">
                  {scaleSnippet}
                </pre>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-5">
              <h3 className="text-md font-bold text-white mb-1.5 flex items-center gap-2">
                <Printer className="text-teal-400 w-5 h-5" />
                ESC/POS Thermal Printing & RJ11 Cash Drawers
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Cash drawers are connected directly to the receipt printer via RJ11 cable. Operating drawers requires sending ESC/POS raw characters to trigger a 24V solenoid pulse.
              </p>

              <div className="relative bg-slate-950 border border-slate-850 rounded-lg p-3.5">
                <button
                  type="button"
                  onClick={() => handleCopy(escposSnippet, 'drawer')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-slate-400 hover:text-white"
                >
                  {copiedText === 'drawer' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-[10px] text-teal-300 font-mono overflow-x-auto whitespace-pre">
                  {escposSnippet}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* BARCODES SHEET GENERATION */}
        {activeTab === 'barcodes' && (
          <div className="space-y-6" id="barcodes_pane">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-md font-bold text-white">Interactive Barcode Label Printer</h3>
                <p className="text-xs text-slate-400">Generate and print standard thermal sticker sheets on-the-fly</p>
              </div>
              <button
                onClick={() => {
                  const printContents = document.getElementById('barcode_print_roll')?.innerHTML;
                  if (printContents) {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(`<html><head><title>Print Labels</title><style>body{padding:20px;display:flex;flex-wrap:wrap;gap:10px;font-family:sans-serif;}</style></head><body>${printContents}</body></html>`);
                      win.document.close();
                      win.print();
                    }
                  }
                }}
                className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Sheet
              </button>
            </div>

            {/* Custom Label Layout configuration block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950 p-4 border border-slate-850 rounded-xl text-xs">
              <div>
                <label className="block text-slate-400 font-semibold uppercase mb-1.5">Select Target Product</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold uppercase mb-1.5">Label Standard Size</label>
                <select
                  value={labelSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLabelSize(val);
                    if (val === 'code128_1col_3mm') {
                      setLayoutColumns('1');
                      setBarcodeFormat('code128');
                      setLabelGap('3');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white"
                >
                  <option value="code128_1col_3mm">Code 128 - 1 Column (30×30 mm, 3mm Gap)</option>
                  <option value="20x10mm">20×10 mm (Tiny jewelry)</option>
                  <option value="30x20mm">30×20 mm (Standard grocery)</option>
                  <option value="38x25mm">38×25 mm (Best Seller standard)</option>
                  <option value="50x25mm">50×25 mm (Wide product)</option>
                  <option value="40x30mm">40×30 mm (Medium pricing box)</option>
                  <option value="50x30mm">50×30 mm (Logistics code)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold uppercase mb-1.5">Barcode Format Type</label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value as 'ean13' | 'code128')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white font-semibold"
                >
                  <option value="code128">Code 128 Standard (High Density)</option>
                  <option value="ean13">EAN-13 Standard (Classic)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold uppercase mb-1.5">Layout Spacing Gap</label>
                <select
                  value={labelGap}
                  onChange={(e) => setLabelGap(e.target.value as '3' | '5')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white"
                >
                  <option value="3">3mm Gap (Standard Sticker Roll)</option>
                  <option value="5">5mm Gap (Wide Margins)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold uppercase mb-1.5">Layout Columns</label>
                <select
                  value={layoutColumns}
                  onChange={(e) => setLayoutColumns(e.target.value as '1' | 'multi')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white"
                >
                  <option value="1">1 Column Roll (Barcode tape)</option>
                  <option value="multi">Multi-Column (A4 grid sheet)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold uppercase mb-1.5">Sheet Layout Count</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={labelsCount}
                  onChange={(e) => setLabelsCount(parseInt(e.target.value) || 12)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-bold"
                />
              </div>
            </div>

            {/* Simulated Sheet Roll */}
            <div className="bg-slate-950 p-6 border border-slate-850 rounded-xl flex justify-center overflow-x-auto">
              <div 
                className={`flex ${layoutColumns === '1' ? 'flex-col items-center' : 'flex-wrap'} justify-center p-3 bg-white border border-zinc-200 max-w-lg shadow-inner`}
                style={{ gap: labelGap === '3' ? '11px' : '19px' }}
                id="barcode_print_roll"
              >
                {Array.from({ length: labelsCount }).map((_, index) => (
                  <div
                    key={index}
                    style={{ 
                      width: currentSizeConfig.width, 
                      height: currentSizeConfig.height,
                      marginBottom: layoutColumns === '1' && labelGap === '3' ? '11px' : '0px'
                    }}
                    className="border border-dashed border-zinc-400 bg-white p-1.5 flex flex-col justify-between items-center text-zinc-900 select-none overflow-hidden"
                  >
                    <span className="font-bold text-[8px] uppercase block leading-none text-center truncate w-full">
                      {selectedItem?.name}
                    </span>
                    
                    {/* Real Scan-Ready Code 128 / EAN13 Barcode */}
                    <BarcodeItem 
                      code={selectedItem?.code || '000000000000'} 
                      format={barcodeFormat === 'code128' || labelSize === 'code128_1col_3mm' ? 'CODE128' : 'EAN13'} 
                    />
                    
                    <div className="flex justify-between items-center w-full text-[8px] leading-none mt-0.5 font-semibold">
                      <span className="font-mono text-[7px]">{selectedItem?.code}</span>
                      <span className="font-bold text-zinc-800">Rs.{selectedItem?.retailPrice.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROMOTIONS MAILING ENGINE */}
        {activeTab === 'marketing' && (
          <div className="space-y-6" id="marketing_pane">
            <div>
              <h3 className="text-md font-bold text-white mb-1">WhatsApp & Facebook Campaign Creator</h3>
              <p className="text-xs text-slate-400">Generate beautiful, emojis-rich high-impact copy templates with direct WhatsApp redirection</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Campaign Inputs */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5 uppercase">Choose Target Deal item</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-2 text-white text-sm"
                  >
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.name} (Rs.{i.retailPrice})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1.5 uppercase">Campaign Discount (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(parseInt(e.target.value) || 5)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1.5 uppercase">Deal Highlight Tagline</label>
                  <textarea
                    rows={3}
                    value={promoCustomMsg}
                    onChange={(e) => setPromoCustomMsg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Campaign Preview and Action */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">WhatsApp Feed Mockup</span>
                  <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-lg p-3.5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                    {generatedPromoMsg}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleCopy(generatedPromoMsg, 'promo')}
                    className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-lg border border-slate-800 flex justify-center items-center gap-1.5 cursor-pointer"
                  >
                    {copiedText === 'promo' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    Copy Message Copy
                  </button>
                  <button
                    onClick={() => {
                      const textEncoded = encodeURIComponent(generatedPromoMsg);
                      window.open(`https://wa.me/?text=${textEncoded}`, '_blank');
                    }}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex justify-center items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/10"
                  >
                    <MessageSquare className="w-4 h-4" /> Broadcast WhatsApp
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MYSQL DB SCHEMA VIEW */}
        {activeTab === 'mysql' && (
          <div className="space-y-4" id="mysql_pane">
            <div>
              <h3 className="text-md font-bold text-white mb-1 flex items-center gap-2">
                <Database className="text-teal-400 w-5 h-5" />
                Raw MySQL SQL Schema (schema.sql)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Below is the raw relational schema optimized for modern MySQL deployments. It models full referential integrity and is completely ready for import in local PHP servers or cPanel phpMyAdmin panels.
              </p>
            </div>

            <div className="relative bg-slate-950 border border-slate-850 rounded-lg p-4">
              <button
                type="button"
                onClick={() => handleCopy(mysqlSchema, 'mysql_sql')}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-slate-400 hover:text-white"
              >
                {copiedText === 'mysql_sql' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="text-[10px] text-teal-300 font-mono overflow-y-auto max-h-96 whitespace-pre">
                {mysqlSchema}
              </pre>
            </div>
          </div>
        )}

        {/* INFINITYFREE DEPLOYMENT BLUEPRINTS */}
        {activeTab === 'infinity' && (
          <div className="space-y-5" id="infinity_pane">
            <div>
              <h3 className="text-md font-bold text-white mb-1 flex items-center gap-2">
                <Cloud className="text-teal-400 w-5 h-5" />
                InfinityFree Hosting & cPanel PHP Setup
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                To migrate your prototype POS to InfinityFree for live production database writes, execute the following step-by-step structure inside your free web account.
              </p>
            </div>

            {/* Instruction Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-300 mb-5">
              <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                <span className="font-bold text-teal-400 block mb-1">Step 1: Database Setup</span>
                Create a database in your InfinityFree cPanel. Open phpMyAdmin, and run the SQL code from the **MySQL Schema tab**.
              </div>
              <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                <span className="font-bold text-teal-400 block mb-1">Step 2: FTP Code Transfer</span>
                Upload files to the <code className="text-teal-300 font-mono font-bold">htdocs/</code> folder of your InfinityFree account using FTP client (e.g., FileZilla).
              </div>
              <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                <span className="font-bold text-teal-400 block mb-1">Step 3: Edit config.php</span>
                Customize the credentials in <code className="text-teal-300 font-mono font-bold">api/config.php</code> using your InfinityFree cPanel credential block.
              </div>
            </div>

            {/* config.php */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">1. api/config.php (Connection layer)</span>
              <div className="relative bg-slate-950 border border-slate-850 rounded-lg p-3.5">
                <button
                  type="button"
                  onClick={() => handleCopy(infinityConfig, 'config_php')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-slate-400 hover:text-white"
                >
                  {copiedText === 'config_php' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-[10px] text-teal-300 font-mono overflow-x-auto whitespace-pre">
                  {infinityConfig}
                </pre>
              </div>
            </div>

            {/* index.php */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">2. index.php (API Routing Entrypoint)</span>
              <div className="relative bg-slate-950 border border-slate-850 rounded-lg p-3.5">
                <button
                  type="button"
                  onClick={() => handleCopy(infinityPhp, 'index_php')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-slate-400 hover:text-white"
                >
                  {copiedText === 'index_php' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-[10px] text-teal-300 font-mono overflow-x-auto whitespace-pre font-sans">
                  {infinityPhp}
                </pre>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
