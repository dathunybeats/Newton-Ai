import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful study assistant. Generate educational content that helps students learn.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxOutputTokens: 1000,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('AI Stream error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate response',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
