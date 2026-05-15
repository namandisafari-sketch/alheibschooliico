import { createWorker } from 'tesseract.js';
import { BrowserPDF417Reader } from '@zxing/library';

export interface ScanResult {
  identity: {
    name: string;
    nin: string;
    cardNumber?: string;
  };
  address: {
    village: string;
    parish: string;
    sub_county: string;
    county: string;
    district: string;
  };
  verification: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

/**
 * STREAM A: Barcode Extraction (PDF417)
 * Decodes the high-density barcode on the back of the Ugandan ID
 */
const extractBarcodeData = async (imageSrc: string) => {
  try {
    const reader = new BrowserPDF417Reader();
    const result = await reader.decodeFromImageUrl(imageSrc);
    const rawText = result.getText();
    
    // Ugandan ID Barcode format usually contains delimited fields
    // Logic: Split and identify NIN (14 chars) and Names
    const parts = rawText.split(/[|,;]/);
    const ninMatch = rawText.match(/[A-Z0-9]{14}/);
    
    return {
      name: parts[0]?.trim() || "Unknown",
      nin: ninMatch ? ninMatch[0] : "Not Found",
      success: !!ninMatch
    };
  } catch (e) {
    console.error("Barcode Stream Error:", e);
    return null;
  }
};

/**
 * STREAM B: OCR Address Parsing
 * Scans for labels: VILLAGE, PARISH, S.COUNTY, COUNTY, DISTRICT
 */
const extractAddressOCR = async (imageSrc: string, onProgress?: (p: number) => void) => {
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') onProgress?.(m.progress);
    }
  });

  const { data: { text } } = await worker.recognize(imageSrc);
  await worker.terminate();

  // Ugandan Address Label Regex Patterns
  const patterns = {
    village: /(?:VILLAGE|VILLAGE:)\s*([^ \n\r]+(?: [^ \n\r]+)*)/i,
    parish: /(?:PARISH|PARISH:)\s*([^ \n\r]+(?: [^ \n\r]+)*)/i,
    sub_county: /(?:S\.COUNTY|S\.COUNTY:|SUB COUNTY)\s*([^ \n\r]+(?: [^ \n\r]+)*)/i,
    county: /(?:COUNTY|COUNTY:)\s*([^ \n\r]+(?: [^ \n\r]+)*)/i,
    district: /(?:DISTRICT|DISTRICT:)\s*([^ \n\r]+(?: [^ \n\r]+)*)/i,
  };

  const extract = (regex: RegExp) => {
    const match = text.match(regex);
    return match ? match[1].trim().split('\n')[0] : "";
  };

  return {
    village: extract(patterns.village),
    parish: extract(patterns.parish),
    sub_county: extract(patterns.sub_county),
    county: extract(patterns.county),
    district: extract(patterns.district),
  };
};

/**
 * HYBRID MERGER
 * Combines both streams and normalizes the output
 */
export const scanUgandaIDBack = async (
  imageSrc: string, 
  onProgress: (stream: 'barcode' | 'ocr', progress: number) => void
): Promise<ScanResult> => {
  
  // Start both streams in parallel
  const [barcodeData, addressData] = await Promise.all([
    extractBarcodeData(imageSrc).then(res => {
      onProgress('barcode', 100);
      return res;
    }),
    extractAddressOCR(imageSrc, (p) => onProgress('ocr', p * 100))
  ]);

  return {
    identity: {
      name: barcodeData?.name || "RECOVERY NEEDED",
      nin: barcodeData?.nin || "RECOVERY NEEDED",
    },
    address: addressData,
    verification: barcodeData?.success ? 'SUCCESS' : 'PARTIAL'
  };
};
