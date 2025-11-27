import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

/**
 * Generate comprehensive study notes from text content
 * @param content - The source text (transcript or PDF text)
 * @param contentType - "youtube" or "pdf" for context
 * @returns Markdown-formatted study notes
 */
export async function generateNotesFromContent(
  content: string,
  contentType: "youtube" | "pdf" = "pdf"
): Promise<string> {
  const sourceContext =
    contentType === "youtube" ? "video transcript" : "PDF document";

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: "system",
        content: `You are an expert note-taking assistant specializing in creating comprehensive, well-structured study notes from ${sourceContext}s.

**MARKDOWN FORMATTING REQUIREMENTS:**

1. **Heading Structure:**
   - Use # for main title (only ONE per document)
   - Use ## for major sections
   - Use ### for subsections
   - Use #### for detailed points when needed

2. **Content Organization:**
   - Start with a brief overview/introduction section
   - Group related information under clear section headings
   - Use bullet points (-) for lists and key points
   - Use numbered lists (1. 2. 3.) for sequential steps or rankings

3. **Emphasis:**
   - Use **bold** for important terms, names, and key concepts
   - Use *italics* for emphasis or definitions
   - Use \`code blocks\` for technical terms, commands, or code

4. **Tables:**
   - Create tables for comparisons, features, or structured data
   - Use proper markdown table syntax with headers
   - Keep tables clean and readable

5. **Sections to Include (when applicable):**
   - Introduction/Overview
   - Key Highlights or Main Points
   - Detailed breakdown by topic
   - Important quotes or statements (use > blockquotes)
   - Summary or Conclusion
   - Additional resources or references (if mentioned)

**STYLE GUIDELINES:**
- Write in clear, concise language
- Focus on key information and main ideas
- Avoid redundancy
- Make it scannable with good structure
- Use proper grammar and spelling
- Keep paragraphs short and focused

Generate notes that are professional, comprehensive, and perfect for studying or review.`,
      },
      {
        role: "user",
        content: `Generate comprehensive, well-structured study notes from this ${sourceContext}. Follow all markdown formatting requirements strictly:\n\n${content}`,
      },
    ],
    temperature: 0.7,
    maxOutputTokens: 4000,
  });

  return text;
}

/**
 * Generate a title and description from content
 * @param content - First portion of the source text
 * @returns Object with title and description
 */
export async function generateTitleAndDescription(
  content: string
): Promise<{ title: string; description: string }> {
  const preview = content.substring(0, 2000);

  const { text } = await generateText({
    model: openai('gpt-4o-mini', { structuredOutputs: true }),
    messages: [
      {
        role: "system",
        content:
          "Generate a concise title (max 60 characters) and a brief description (max 160 characters) for this content. Return the response as a JSON object with 'title' and 'description' fields.",
      },
      {
        role: "user",
        content: `Content: ${preview}`,
      },
    ],
    temperature: 0.7,
    maxOutputTokens: 200,
  });

  const result = JSON.parse(text) as { title?: string; description?: string };
  return {
    title: result.title || "Untitled Note",
    description: result.description || "",
  };
}
