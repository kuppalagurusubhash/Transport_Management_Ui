import { createWorker } from 'tesseract.js';
import type { ExpenseCategory } from '../data/types';

export interface ScannedExpenseItem {
  id: string;
  label: string;
  amount: number;
  category: ExpenseCategory;
  rawText: string;
  confidence: number;
}

export interface PaperAnalysisResult {
  items: ScannedExpenseItem[];
  detectedTotal: number | null;
  calculatedSum: number;
  rawOcrText: string;
  engineUsed: 'tesseract' | 'gemini_vision' | 'heuristic_ocr';
  warning?: string;
  enhancedImageUrl?: string;
}

// ─── Image Preprocessing Filter ─────────────────────────────────────────────
// Enhances contrast and binarizes dark handwriting on notebook/paper slips
export async function preprocessReceiptImage(
  dataUrl: string,
  options: { contrast?: number; threshold?: number; grayscale?: boolean } = {}
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Max dimension normalization to keep OCR fast and high-resolution
      const maxDim = 1600;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      const contrast = options.contrast ?? 1.35; // contrast boost
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      const applyThreshold = options.threshold !== undefined;
      const threshVal = options.threshold ?? 140;

      for (let i = 0; i < d.length; i += 4) {
        // Luminance grayscale
        let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

        // Apply contrast factor
        gray = factor * (gray - 128) + 128;
        gray = Math.max(0, Math.min(255, gray));

        if (applyThreshold) {
          gray = gray < threshVal ? 0 : 255;
        }

        d[i] = gray;
        d[i + 1] = gray;
        d[i + 2] = gray;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ─── Keyword Dictionary & Category Classifier ──────────────────────────────
interface CategoryRule {
  category: ExpenseCategory;
  keywords: RegExp[];
  defaultLabel: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'fuel',
    keywords: [/diesel/i, /fuel/i, /petrol/i, /iocl/i, /hpcl/i, /bpcl/i, /bunk/i, /pump/i, /oil\s*fill/i, /డిజిల్/i, /డీజిల్/i, /ഡീസൽ/i],
    defaultLabel: 'Diesel Fuel'
  },
  {
    category: 'toll',
    keywords: [/toll/i, /fastag/i, /plaza/i, /tax/i, /tollgate/i, /ടോൾ/i, /టోల్/i],
    defaultLabel: 'Toll Plaza / Fastag'
  },
  {
    category: 'worker_hamali',
    keywords: [/hamali/i, /coolie/i, /loading/i, /unloading/i, /labour/i, /worker/i, /helpers/i, /హమాలీ/i, /കൂലി/i],
    defaultLabel: 'Hamali & Loading'
  },
  {
    category: 'police_rto',
    keywords: [/rto/i, /police/i, /traffic/i, /border/i, /checkpost/i, /entry/i, /fine/i, /పోలీస్/i, /പോലീസ്/i],
    defaultLabel: 'RTO / Border Checkpost'
  },
  {
    category: 'bata_food',
    keywords: [/bata/i, /food/i, /meals/i, /tea/i, /hotel/i, /allowance/i, /breakfast/i, /dinner/i, /బాటా/i, /ഭക്ഷണം/i],
    defaultLabel: 'Driver Bata & Meals'
  },
  {
    category: 'maintenance',
    keywords: [/puncture/i, /tyre/i, /tire/i, /tube/i, /air/i, /grease/i, /oil\s*change/i, /engine\s*oil/i, /adblue/i, /def/i, /welding/i, /repair/i, /service/i, /wash/i, /స్పేర్/i, /പഞ്ചർ/i],
    defaultLabel: 'Vehicle Maintenance & Tyre'
  },
  {
    category: 'other',
    keywords: [/kanta/i, /weighbridge/i, /weight/i, /parking/i, /kaanta/i, /రశీదు/i],
    defaultLabel: 'Weighbridge / Parking'
  }
];

export function detectExpenseCategory(text: string): { category: ExpenseCategory; suggestedLabel: string } {
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (kw.test(text)) {
        return { category: rule.category, suggestedLabel: rule.defaultLabel };
      }
    }
  }
  return { category: 'other', suggestedLabel: 'Trip Expense' };
}

// ─── Heuristic Regex Parser for Handwritten Lines ──────────────────────────
export function parseTransportExpenseText(rawText: string): {
  items: ScannedExpenseItem[];
  detectedTotal: number | null;
  calculatedSum: number;
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: ScannedExpenseItem[] = [];
  let detectedTotal: number | null = null;

  // Patterns to match amounts:
  // e.g. "5000", "5000/-", "Rs 5000", "Rs.5000", "₹5,000", "5000=00", "500.00"
  const amountPattern = /(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]{2,6})(?:\s*(?:\/[-=]|=[0-9]{2}|rs|\/-))?/i;
  const totalLinePattern = /^(?:grand\s*)?total|tot|net|balance|మొత్తం|ആകെ/i;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Check if line represents a total
    if (totalLinePattern.test(line)) {
      const match = line.match(amountPattern);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const val = parseFloat(numStr);
        if (!isNaN(val) && val > 0) {
          detectedTotal = val;
        }
      }
      continue;
    }

    // Extract amount from line
    // Find all numbers in the line, typically the last substantial number is the price/cost
    const matches = [...line.matchAll(new RegExp(amountPattern, 'gi'))];
    if (matches.length > 0) {
      // Pick the last matching number
      const lastMatch = matches[matches.length - 1];
      const rawNum = lastMatch[1].replace(/,/g, '');
      const amount = parseFloat(rawNum);

      // Sanity check: transport trip expenses are usually between ₹10 and ₹1,00,000
      if (!isNaN(amount) && amount >= 10 && amount <= 200000) {
        // Strip the number and symbols from the line to find the label
        let label = line.replace(lastMatch[0], '').replace(/[=:\-\/—_]/g, ' ').trim();
        
        // If label is too short or empty, try previous line or categorize
        const { category, suggestedLabel } = detectExpenseCategory(line);
        if (!label || label.length < 2) {
          label = suggestedLabel;
        } else {
          // Capitalize nicely
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        // Avoid adding duplicate or total lines
        if (!totalLinePattern.test(label)) {
          items.push({
            id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substr(2, 4)}`,
            label,
            amount,
            category,
            rawText: line,
            confidence: 0.88
          });
        }
      }
    }
  }

  const calculatedSum = items.reduce((sum, it) => sum + it.amount, 0);

  return {
    items,
    detectedTotal,
    calculatedSum
  };
}

// ─── Tesseract.js OCR Execution Engine ──────────────────────────────────────
export async function runTesseractOCR(
  imageDataUrl: string,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  try {
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          onProgress?.(Math.round((m.progress || 0) * 100), 'Recognizing handwriting & values...');
        } else if (m.status) {
          onProgress?.(30, `Loading OCR engine (${m.status})...`);
        }
      }
    });

    const ret = await worker.recognize(imageDataUrl);
    await worker.terminate();

    return ret.data.text || '';
  } catch (err: any) {
    console.warn('[Tesseract Engine Error]', err);
    throw new Error(`OCR processing failed: ${err.message || 'Unknown error'}`);
  }
}

// ─── Optional Gemini Vision AI Integration ──────────────────────────────────
export async function runGeminiVisionAnalysis(
  imageDataUrl: string,
  apiKey: string
): Promise<{ items: ScannedExpenseItem[]; detectedTotal: number | null; calculatedSum: number }> {
  const base64Data = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.substring(imageDataUrl.indexOf(':') + 1, imageDataUrl.indexOf(';'));

  const prompt = `
You are an expert transport document auditor analyzing a driver's handwritten expense paper chit for a lorry trip in South India (Andhra Pradesh, Kerala, Karnataka).
Extract all expense lines from this handwritten note/chit into JSON.
Return ONLY raw JSON in this exact structure without markdown backticks:
{
  "items": [
    {
      "label": "Diesel (IOCL)",
      "amount": 5400,
      "category": "fuel"
    },
    {
      "label": "Toll Plaza",
      "amount": 860,
      "category": "toll"
    }
  ],
  "total": 6260
}

Valid categories: "fuel" | "toll" | "maintenance" | "police_rto" | "worker_hamali" | "bata_food" | "other".
Amount must be integer numbers in Indian Rupees without symbols.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Vision API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean JSON output
  const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const items: ScannedExpenseItem[] = (parsed.items || []).map((item: any, idx: number) => ({
    id: `gemini-${Date.now()}-${idx}`,
    label: item.label || 'Expense',
    amount: Number(item.amount || 0),
    category: item.category || 'other',
    rawText: `${item.label}: ₹${item.amount}`,
    confidence: 0.96
  }));

  const calculatedSum = items.reduce((sum, it) => sum + it.amount, 0);
  const detectedTotal = parsed.total ? Number(parsed.total) : null;

  return {
    items,
    detectedTotal,
    calculatedSum
  };
}

// ─── Main Paper Analysis Orchestrator ───────────────────────────────────────
export async function analyzeExpensePaper(
  originalDataUrl: string,
  options: {
    geminiApiKey?: string;
    useGeminiVision?: boolean;
    onProgress?: (progress: number, status: string) => void;
  } = {}
): Promise<PaperAnalysisResult> {
  const { geminiApiKey, useGeminiVision, onProgress } = options;

  onProgress?.(10, 'Enhancing image for handwriting clarity...');
  const enhancedImageUrl = await preprocessReceiptImage(originalDataUrl, { contrast: 1.35 });

  // 1. Try Gemini Vision if requested and key provided
  if (useGeminiVision && geminiApiKey) {
    try {
      onProgress?.(40, 'Analyzing paper with Gemini Vision AI...');
      const geminiResult = await runGeminiVisionAnalysis(enhancedImageUrl, geminiApiKey);
      onProgress?.(100, 'Analysis complete!');
      return {
        ...geminiResult,
        rawOcrText: JSON.stringify(geminiResult.items, null, 2),
        engineUsed: 'gemini_vision',
        enhancedImageUrl
      };
    } catch (err: any) {
      console.warn('Gemini Vision fallback to Tesseract OCR due to error:', err);
    }
  }

  // 2. High-Speed Local OCR (Tesseract.js) + Heuristic Parser
  onProgress?.(25, 'Initializing handwriting recognition...');
  let rawText = '';
  try {
    rawText = await runTesseractOCR(enhancedImageUrl, (pct, status) => {
      onProgress?.(25 + Math.round(pct * 0.65), status);
    });
  } catch (ocrErr: any) {
    console.warn('Tesseract OCR error, using image heuristics:', ocrErr);
  }

  onProgress?.(95, 'Extracting transport expense line items & sums...');
  const parsed = parseTransportExpenseText(rawText);

  onProgress?.(100, 'Analysis complete!');

  return {
    items: parsed.items,
    detectedTotal: parsed.detectedTotal,
    calculatedSum: parsed.calculatedSum,
    rawOcrText: rawText,
    engineUsed: 'tesseract',
    enhancedImageUrl,
    warning:
      parsed.items.length === 0
        ? 'Could not clearly recognize written values. You can manually add lines or adjust the image.'
        : undefined
  };
}

// ─── Built-in Realistic Sample Handwritten Chits for Instant Testing ─────────
// Generates realistic SVG/Canvas notebook paper with handwritten style text
export function generateSampleHandwrittenChit(
  type: 'andhra_kerala_trip' | 'ramapuram_quarry_bunk'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 680;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Paper background: vintage lined notebook paper
  ctx.fillStyle = '#f8f5eb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Red margin line on left
  ctx.strokeStyle = '#e07a7a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 0);
  ctx.lineTo(90, canvas.height);
  ctx.stroke();

  // Ruled horizontal blue lines
  ctx.strokeStyle = '#cad9e8';
  ctx.lineWidth = 1;
  for (let y = 80; y < canvas.height - 40; y += 38) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }

  // 2. Handwritten text rendering with dark blue/black ink
  ctx.fillStyle = '#1a2b4c';
  ctx.font = 'bold 22px "Courier New", monospace';

  if (type === 'andhra_kerala_trip') {
    ctx.fillText('TRIP EXPENSES — TRP-1042', 120, 72);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#555';
    ctx.fillText('Lorry: KL-07 AB 4521 | Ramapuram -> Palakkad', 120, 110);
    ctx.fillStyle = '#14233c';

    const lines = [
      { text: '1. Diesel Fuel (IOCL Pump)  : Rs. 5400/-', y: 186 },
      { text: '2. Toll Plaza (Krishnagiri) : Rs. 860/-', y: 262 },
      { text: '3. Hamali Loading Workers   : Rs. 700/-', y: 338 },
      { text: '4. Police / Checkpost       : Rs. 300/-', y: 414 },
      { text: '5. Driver Bata & Meals      : Rs. 450/-', y: 490 },
      { text: '6. Tyre Puncture & Air      : Rs. 200/-', y: 566 },
      { text: '7. Weighbridge (Kanta)      : Rs. 100/-', y: 642 }
    ];

    ctx.font = 'bold 19px "Courier New", monospace';
    lines.forEach((l) => {
      ctx.fillText(l.text, 105, l.y);
    });

    // Total line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(105, 730);
    ctx.lineTo(580, 730);
    ctx.stroke();

    ctx.font = 'bold 23px "Courier New", monospace';
    ctx.fillStyle = '#8b0000';
    ctx.fillText('TOTAL EXPENSES: Rs. 8010/-', 120, 775);

    ctx.font = 'italic 15px "Courier New", monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Driver Signature: K. Suresh (Sign)', 120, 840);
  } else {
    ctx.fillText('LORRY TRIP MAINTENANCE CHIT', 120, 72);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#555';
    ctx.fillText('Route: Ramapuram -> Wayanad (Trip #1048)', 120, 110);
    ctx.fillStyle = '#14233c';

    const lines = [
      { text: '• Diesel 50 Liters (HP Bunk) : 4800/-', y: 186 },
      { text: '• Fastag Toll Recharge       : 550/-', y: 262 },
      { text: '• Hamali Coolie (Loading)    : 500/-', y: 338 },
      { text: '• AdBlue DEF Can             : 600/-', y: 414 },
      { text: '• Driver Food Allowance      : 400/-', y: 490 }
    ];

    ctx.font = 'bold 19px "Courier New", monospace';
    lines.forEach((l) => {
      ctx.fillText(l.text, 105, l.y);
    });

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(105, 590);
    ctx.lineTo(580, 590);
    ctx.stroke();

    ctx.font = 'bold 23px "Courier New", monospace';
    ctx.fillStyle = '#8b0000';
    ctx.fillText('TOTAL AMOUNT: 6850/-', 120, 635);

    ctx.font = 'italic 15px "Courier New", monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Paper chit logged by driver Raju', 120, 710);
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}
