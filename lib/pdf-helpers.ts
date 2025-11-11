// Using dynamic import for CommonJS module compatibility
const getPdfParse = async () => {
  const pdfParse = await import("pdf-parse");
  return pdfParse.default || pdfParse;
};

/**
 * Extract text content from a PDF buffer
 * @param pdfBuffer - Buffer containing PDF file data
 * @returns Extracted text from all pages
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(pdfBuffer);

    // data.text contains all text from all pages
    const extractedText = data.text.trim();

    if (!extractedText || extractedText.length === 0) {
      throw new Error("No text could be extracted from the PDF");
    }

    console.log(`PDF text extraction successful: ${data.numpages} pages, ${extractedText.length} characters`);

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
