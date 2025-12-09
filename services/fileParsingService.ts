import * as pdfjsLibProxy from 'pdfjs-dist';
import mammoth from 'mammoth';
import readXlsxFile from 'read-excel-file';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini for OCR tasks
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const OCR_MODEL = 'gemini-2.5-flash';

// Handle different import structures (ESM vs CJS default export) for PDF.js
const pdfjsLib = (pdfjsLibProxy as any).default || pdfjsLibProxy;

// Setup PDF.js worker
if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
  console.warn("PDF.js GlobalWorkerOptions not found. PDF parsing might fail.");
}

/**
 * Parses a PDF file and extracts text from all pages.
 */
const parsePdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // Join text items with space
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }
  
  return fullText;
};

/**
 * Parses a DOCX file using Mammoth.
 */
const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

/**
 * Parses an Excel file (XLSX) and converts rows to CSV format.
 */
const parseXlsx = async (file: File): Promise<string> => {
  const rows = await readXlsxFile(file);
  return rows.map((row: any[]) => 
    row.map(cell => {
      if (cell === null || cell === undefined) return '';
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  ).join("\n");
};

/**
 * Converts a File object to a Base64 string suitable for Gemini API.
 */
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Performs OCR on an image file using Gemini Vision API.
 * This provides vastly superior results compared to browser-based Tesseract.js.
 */
const parseImage = async (file: File): Promise<string> => {
  try {
    const base64Data = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: OCR_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: "Transcribe the text from this image exactly as it appears. If there is handwritten text, try to read it. Output ONLY the text content. If the image contains tables, format them with markdown."
          }
        ]
      }
    });

    return response.text || "[OCR: Текст не найден или изображение пустое]";
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Ошибка AI-распознавания текста: " + error.message);
  }
};

/**
 * Main parser function that delegates to specific parsers based on file type.
 */
export const parseFileContent = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePdf(file);
    } 
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      return await parseDocx(file);
    } 
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      fileName.endsWith('.xlsx')
    ) {
      return await parseXlsx(file);
    }
    else if (
      fileType.startsWith('image/') || 
      fileName.match(/\.(jpg|jpeg|png|webp|bmp|heic)$/)
    ) {
      return await parseImage(file);
    }
    else {
      // Default to text parsing
      return await file.text();
    }
  } catch (error: any) {
    console.error(`Error parsing file ${fileName}:`, error);
    throw new Error(`Не удалось прочитать файл ${file.name}: ${error.message}`);
  }
};