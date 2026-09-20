import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CameraIcon,
  UploadCloudIcon,
  SparklesIcon,
  CheckCircle2Icon,
  XIcon,
  Trash2Icon,
  PlusIcon,
  FileTextIcon,
  FuelIcon,
  MilestoneIcon,
  WrenchIcon,
  ShieldAlertIcon,
  UtensilsIcon,
  UsersIcon,
  PackageIcon,
  AlertCircleIcon,
  SlidersHorizontalIcon,
  RefreshCwIcon,
  EyeIcon,
  CheckIcon
} from 'lucide-react';
import {
  analyzeExpensePaper,
  generateSampleHandwrittenChit,
  type ScannedExpenseItem,
  type PaperAnalysisResult
} from '../utils/expensePaperScanner';
import { formatINR } from '../utils/helpers';
import type { ExpenseCategory, Trip } from '../data/types';

interface ExpensePaperScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrips: Trip[];
  onSaveExpenses: (
    tripId: string,
    expenses: Array<{
      label: string;
      amount: number;
      category: ExpenseCategory;
      receiptUrl: string;
      notes: string;
    }>
  ) => void;
}

const CATEGORY_OPTIONS: Array<{ value: ExpenseCategory; label: string; icon: any; color: string }> = [
  { value: 'fuel', label: 'Fuel / Diesel', icon: FuelIcon, color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  { value: 'toll', label: 'Toll Plaza / Fastag', icon: MilestoneIcon, color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  { value: 'worker_hamali', label: 'Hamali / Loading', icon: UsersIcon, color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  { value: 'police_rto', label: 'Police / RTO Checkpost', icon: ShieldAlertIcon, color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  { value: 'bata_food', label: 'Driver Bata & Meals', icon: UtensilsIcon, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  { value: 'maintenance', label: 'Vehicle Repairs / Tyre', icon: WrenchIcon, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  { value: 'other', label: 'Weighbridge / Other', icon: PackageIcon, color: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/30' }
];

export function ExpensePaperScannerModal({
  isOpen,
  onClose,
  activeTrips,
  onSaveExpenses
}: ExpensePaperScannerModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const [showEnhanced, setShowEnhanced] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusText, setScanStatusText] = useState<string>('');
  const [extractedItems, setExtractedItems] = useState<ScannedExpenseItem[]>([]);
  const [detectedPaperTotal, setDetectedPaperTotal] = useState<number | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [engineUsed, setEngineUsed] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('geminiApiKey') || '');
  const [useGeminiVision, setUseGeminiVision] = useState<boolean>(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize selected trip
  useEffect(() => {
    if (activeTrips.length > 0 && !selectedTripId) {
      setSelectedTripId(activeTrips[0].id);
    }
  }, [activeTrips, selectedTripId]);

  // Clean state when closed
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setEnhancedPreview(null);
      setExtractedItems([]);
      setIsScanning(false);
      setIsSaved(false);
      setScanProgress(0);
    }
  }, [isOpen]);

  const handleProcessImage = async (dataUrl: string) => {
    setImagePreview(dataUrl);
    setIsScanning(true);
    setScanProgress(5);
    setScanStatusText('Preparing document...');
    setExtractedItems([]);
    setDetectedPaperTotal(null);

    try {
      const result: PaperAnalysisResult = await analyzeExpensePaper(dataUrl, {
        geminiApiKey: geminiApiKey.trim() || undefined,
        useGeminiVision,
        onProgress: (pct, status) => {
          setScanProgress(pct);
          setScanStatusText(status);
        }
      });

      setEnhancedPreview(result.enhancedImageUrl || null);
      setExtractedItems(result.items);
      setDetectedPaperTotal(result.detectedTotal);
      setEngineUsed(result.engineUsed);
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanStatusText('Handwriting recognition completed with partial read.');
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleProcessImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = (sampleType: 'andhra_kerala_trip' | 'ramapuram_quarry_bunk') => {
    const sampleDataUrl = generateSampleHandwrittenChit(sampleType);
    handleProcessImage(sampleDataUrl);
  };

  const handleUpdateItem = (id: string, field: 'label' | 'amount' | 'category', value: any) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: ScannedExpenseItem = {
      id: `manual-${Date.now()}`,
      label: 'New Trip Cost',
      amount: 500,
      category: 'other',
      rawText: 'Manual item',
      confidence: 1.0
    };
    setExtractedItems((prev) => [...prev, newItem]);
  };

  const calculatedTotal = extractedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleConfirmAndSave = () => {
    if (!selectedTripId) {
      alert('Please select an active trip to record these expenses.');
      return;
    }
    if (extractedItems.length === 0) {
      alert('Please add at least one expense line.');
      return;
    }

    const payload = extractedItems.map((item) => ({
      label: item.label,
      amount: Number(item.amount),
      category: item.category,
      receiptUrl: imagePreview || '',
      notes: `Extracted from driver handwritten paper chit (${item.rawText || item.label})`
    }));

    onSaveExpenses(selectedTripId, payload);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl rounded-2xl border border-ink-700 bg-ink-950 text-neutral-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-ink-800 px-6 py-4 bg-ink-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40">
              <CameraIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Handwritten Cost Paper Scanner
                </h2>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/30 uppercase tracking-wider flex items-center gap-1">
                  <SparklesIcon className="h-3 w-3" /> AI &amp; OCR Engine
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Snap or upload paper chits, diary notes, or fuel slips — costs are analyzed and recorded in the system.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-ink-800 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!imagePreview ? (
            /* Upload / Capture Stage */
            <div className="space-y-6">
              {/* Drop / Capture Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-700 hover:border-gold bg-ink-900/40 hover:bg-ink-900/80 p-10 text-center transition-all cursor-pointer shadow-inner"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold group-hover:scale-110 transition-transform">
                  <UploadCloudIcon className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Upload Photo of Handwritten Expense Paper
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mb-5">
                  Take a clear photo of your handwritten paper slip, transport chit, or fuel receipt. Make sure handwriting and amounts are visible.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-400 shadow-[0_4px_15px_rgba(212,175,55,0.2)] transition-transform active:scale-95"
                  >
                    <CameraIcon className="h-4 w-4" /> Snap Photo with Camera
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-5 py-2.5 text-xs font-semibold text-neutral-200 hover:text-white hover:border-ink-600 transition-colors"
                  >
                    <FileTextIcon className="h-4 w-4 text-gold" /> Select File / Photo
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Sample Chits for 1-Click Verification */}
              <div className="rounded-xl border border-ink-800 bg-ink-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                    <FileTextIcon className="h-4 w-4" /> Quick Test: Sample Handwritten Transport Chits
                  </span>
                  <span className="text-[10px] text-neutral-500">Test the scanner instantly without physical paper</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('andhra_kerala_trip')}
                    className="flex flex-col text-left rounded-xl border border-ink-700 hover:border-gold/60 bg-ink-950/80 hover:bg-ink-950 p-3.5 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-gold transition-colors">
                        Andhra ➔ Kerala Highway Trip Chit
                      </span>
                      <span className="text-[11px] font-mono font-bold text-gold">₹8,010</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      7 line items: Diesel (₹5,400), Tolls (₹860), Hamali (₹700), Police (₹300), Bata (₹450), Tyre (₹200), Kanta (₹100).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSample('ramapuram_quarry_bunk')}
                    className="flex flex-col text-left rounded-xl border border-ink-700 hover:border-gold/60 bg-ink-950/80 hover:bg-ink-950 p-3.5 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-gold transition-colors">
                        Wayanad Route Quarry Slip
                      </span>
                      <span className="text-[11px] font-mono font-bold text-gold">₹6,850</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      5 line items: Diesel 50L (₹4,800), Fastag (₹550), Hamali (₹500), AdBlue DEF (₹600), Food Allowance (₹400).
                    </p>
                  </button>
                </div>

                {/* Optional Gemini Vision Engine Configuration */}
                <div className="border-t border-ink-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="text-[11px] text-neutral-400 hover:text-gold flex items-center gap-1.5 transition-colors"
                  >
                    <SlidersHorizontalIcon className="h-3 w-3" />
                    {showApiKeyInput ? 'Hide AI Engine Settings' : 'Advanced: Optional Gemini Vision AI Integration'}
                  </button>

                  {showApiKeyInput && (
                    <div className="mt-2.5 rounded-xl border border-ink-800 bg-ink-950 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                          <SparklesIcon className="h-3.5 w-3.5 text-gold" />
                          Enable Gemini Multimodal Vision Mode
                        </span>
                        <input
                          type="checkbox"
                          checked={useGeminiVision}
                          onChange={(e) => setUseGeminiVision(e.target.checked)}
                          className="h-4 w-4 rounded border-ink-700 bg-ink-900 text-gold focus:ring-gold"
                        />
                      </div>

                      {useGeminiVision && (
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                            Google Gemini API Key
                          </label>
                          <input
                            type="password"
                            value={geminiApiKey}
                            onChange={(e) => {
                              setGeminiApiKey(e.target.value);
                              localStorage.setItem('geminiApiKey', e.target.value);
                            }}
                            placeholder="AIzaSy..."
                            className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs text-white focus:border-gold focus:outline-none font-mono"
                          />
                          <p className="text-[10px] text-neutral-500 mt-1">
                            When enabled, uses Gemini 1.5 Flash to decipher complex handwritten cursive chits. Otherwise, the high-speed built-in OCR is used.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Analysis & Review Stage */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Viewer & Scan Radar */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                    <EyeIcon className="h-3.5 w-3.5 text-gold" /> Uploaded Paper Document
                  </span>
                  {enhancedPreview && (
                    <button
                      type="button"
                      onClick={() => setShowEnhanced(!showEnhanced)}
                      className="text-[10px] text-gold hover:underline flex items-center gap-1"
                    >
                      <SlidersHorizontalIcon className="h-3 w-3" />
                      {showEnhanced ? 'Show Original Photo' : 'Show Enhanced B&W Scan'}
                    </button>
                  )}
                </div>

                <div className="relative rounded-xl border border-ink-800 bg-ink-900 overflow-hidden min-h-[280px] max-h-[460px] flex items-center justify-center p-2">
                  <img
                    src={showEnhanced && enhancedPreview ? enhancedPreview : imagePreview}
                    alt="Driver handwritten paper chit"
                    className="max-h-[440px] w-auto max-w-full object-contain rounded shadow"
                  />

                  {/* Scanning Radar Overlay Animation */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                      {/* Animated Laser Scan Line */}
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_15px_#d4af37]"
                        animate={{ top: ['5%', '95%', '5%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                      />

                      <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                        <div className="h-12 w-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                        <span className="text-xs font-bold text-white">Analyzing Handwritten Paper...</span>
                        <div className="w-48 bg-ink-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gold h-full transition-all duration-300"
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-400 max-w-xs">{scanStatusText}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setEnhancedPreview(null);
                      setExtractedItems([]);
                    }}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCwIcon className="h-3.5 w-3.5" /> Retake / Choose Another Paper
                  </button>

                  {engineUsed && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Engine: {engineUsed === 'gemini_vision' ? 'Gemini AI Vision' : 'Tesseract OCR + Regex'}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Extracted Values & Confirmation */}
              <div className="lg:col-span-7 space-y-4">
                {/* Target Trip Selection */}
                <div className="rounded-xl border border-ink-800 bg-ink-900/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-0.5">
                      Target Active Dispatch / Trip
                    </span>
                    {activeTrips.length === 0 ? (
                      <span className="text-red-400 font-bold">No active trip currently dispatched</span>
                    ) : (
                      <select
                        value={selectedTripId}
                        onChange={(e) => setSelectedTripId(e.target.value)}
                        className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs text-white focus:border-gold focus:outline-none font-bold"
                      >
                        {activeTrips.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.code} — {t.origin} ➔ Destination ({t.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-0.5">
                      Extracted Items
                    </span>
                    <span className="font-bold text-gold text-sm">
                      {extractedItems.length} lines detected
                    </span>
                  </div>
                </div>

                {/* Extracted Items Table */}
                <div className="rounded-xl border border-ink-800 bg-ink-900/40 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2.5 bg-ink-900/70 text-xs">
                    <span className="font-bold text-neutral-300">Extracted Cost Line Items</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:text-gold-400 transition-colors"
                    >
                      <PlusIcon className="h-3.5 w-3.5" /> Add Missing Line
                    </button>
                  </div>

                  {extractedItems.length === 0 && !isScanning ? (
                    <div className="p-8 text-center text-xs text-neutral-500 space-y-3">
                      <AlertCircleIcon className="h-8 w-8 text-amber-400 mx-auto" />
                      <p>No expense values detected yet or image is unclear.</p>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs text-gold font-semibold hover:bg-ink-750"
                      >
                        + Add Expense Manually
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-[260px] overflow-y-auto divide-y divide-ink-800/80 p-2 space-y-1.5">
                      {extractedItems.map((item) => {
                        const catConfig =
                          CATEGORY_OPTIONS.find((c) => c.value === item.category) || CATEGORY_OPTIONS[6];
                        const IconComponent = catConfig.icon;

                        return (
                          <div
                            key={item.id}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-lg bg-ink-950/70 p-2 border border-ink-800/60 hover:border-ink-700 transition-colors"
                          >
                            {/* Category Selector */}
                            <div className="w-full sm:w-44 flex-shrink-0 flex items-center gap-1.5">
                              <IconComponent className="h-3.5 w-3.5 text-gold flex-shrink-0" />
                              <select
                                value={item.category}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, 'category', e.target.value as ExpenseCategory)
                                }
                                className="w-full rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-neutral-200 focus:border-gold focus:outline-none"
                              >
                                {CATEGORY_OPTIONS.map((cat) => (
                                  <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Label Input */}
                            <div className="flex-1 min-w-[140px]">
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
                                placeholder="Expense description"
                                className="w-full rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                              />
                            </div>

                            {/* Amount Input */}
                            <div className="w-28 flex-shrink-0 flex items-center gap-1">
                              <span className="text-xs text-neutral-500 font-mono">₹</span>
                              <input
                                type="number"
                                min={0}
                                value={item.amount}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, 'amount', Number(e.target.value || 0))
                                }
                                className="w-full rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs font-bold text-gold font-mono focus:border-gold focus:outline-none"
                              />
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                              title="Delete line"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mathematical Verification Banner */}
                <div className="rounded-xl border border-ink-800 bg-ink-900/60 p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Total Calculated from Items:</span>
                    <span className="text-base font-extrabold text-gold font-mono">
                      {formatINR(calculatedTotal)}
                    </span>
                  </div>

                  {detectedPaperTotal !== null && (
                    <div className="flex justify-between items-center text-xs border-t border-ink-800/80 pt-2">
                      <span className="text-neutral-400">Stated Total on Handwritten Chit:</span>
                      <span className="font-bold text-neutral-200 font-mono">
                        {formatINR(detectedPaperTotal)}
                      </span>
                    </div>
                  )}

                  {detectedPaperTotal !== null && (
                    <div className="pt-1">
                      {Math.abs(calculatedTotal - detectedPaperTotal) <= 1 ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-green-400 font-semibold bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20">
                          <CheckCircle2Icon className="h-3.5 w-3.5" />
                          Handwritten total matches sum of all extracted lines perfectly!
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                          <AlertCircleIcon className="h-3.5 w-3.5" />
                          Difference of {formatINR(Math.abs(calculatedTotal - detectedPaperTotal))} detected between paper total and individual items. You can adjust line items above.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-ink-700 bg-ink-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={extractedItems.length === 0 || isScanning || isSaved}
                    onClick={handleConfirmAndSave}
                    className="rounded-xl bg-gold px-6 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-400 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.2)]"
                  >
                    {isSaved ? (
                      <>
                        <CheckIcon className="h-4 w-4" /> Noted in System!
                      </>
                    ) : (
                      <>
                        <CheckCircle2Icon className="h-4 w-4" /> Confirm &amp; Note Values in System
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
