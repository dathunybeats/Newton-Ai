import { extractText } from 'unpdf';

/**
 * Extract text content from a PDF buffer
 * @param pdfBuffer - Buffer containing PDF file data
 * @returns Extracted text from all pages
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(pdfBuffer);
    const { text, totalPages } = await extractText(uint8Array);
    
    const extractedText = Array.isArray(text) 
      ? text.map(page => String(page).trim()).join('\n\n') 
      : String(text).trim();

    if (!extractedText || extractedText.length === 0) {
      throw new Error("No text could be extracted from the PDF");
    }

    console.log(`PDF text extraction successful: ${totalPages} pages, ${extractedText.length} characters`);

    return extractedText;
  } catch (error: any) {
    console.error("PDF text extraction error:", error);
    throw new Error(
      `Failed to extract text from PDF: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Extract text from a PDF file (in-memory)
 * @param fileBuffer - Buffer containing PDF file data
 * @returns Extracted text content
 */
export async function extractTextFromPDFFile(
  fileBuffer: Buffer
): Promise<string> {
  return await extractTextFromPDF(fileBuffer);
}