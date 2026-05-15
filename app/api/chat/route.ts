import OpenAI from 'openai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, model, provider } = await req.json();

    let client: OpenAI;

    if (provider === 'google') {
      client = new OpenAI({
        apiKey: process.env.GOOGLE_API_KEY!,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
    } else if (provider === 'cerebras') {
      client = new OpenAI({
        apiKey: process.env.CEREBRAS_API_KEY!,
        baseURL: 'https://api.cerebras.ai/v1',
      });
    } else if (provider === 'openrouter') {
      client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://iniaja.vercel.app',
          'X-Title': 'Iniaja AI',
        },
      });
    } else if (provider === 'github') {
      client = new OpenAI({
        apiKey: process.env.GITHUB_TOKEN!,
        baseURL: 'https://models.github.ai/inference',
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid provider' }),
        { status: 400 }
      );
    }

    // Cerebras only supports: model, messages, stream, temperature, max_tokens
    // Google Gemini also has issues with penalty params
    // Keep params minimal and safe across all providers
    const baseParams = {
      model,
      messages,
      stream: true as const,
      temperature: 0.7,
      max_tokens: 2048,
    };

    const extraParams = (provider === 'cerebras' || provider === 'google')
      ? {}
      : {
          top_p: 0.9,
          frequency_penalty: 0.5,
          presence_penalty: 0.3,
        };

    const stream: any = await client.chat.completions.create({
      ...baseParams,
      ...extraParams,
    });

    const encoder = new TextEncoder();
    let lastText = '';
    let repeatCount = 0;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';

            if (text === lastText && text.length > 10) {
              repeatCount++;
              if (repeatCount > 5) {
                console.log('Loop detected, stopping stream');
                break;
              }
            } else {
              repeatCount = 0;
            }
            lastText = text;

            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);

    let errorMsg = 'Internal server error';
    if (error.status === 404) errorMsg = 'Model tidak ditemukan. Coba model lain.';
    else if (error.status === 401) errorMsg = 'API key tidak valid.';
    else if (error.status === 429) errorMsg = 'Rate limit. Coba lagi nanti.';
    else if (error.status === 400) errorMsg = `Bad request: ${error.message ?? 'Coba model lain.'}`;
    else if (error.message) errorMsg = error.message;

    return new Response(
      JSON.stringify({ error: errorMsg, status: error.status }),
      { status: error.status || 500 }
    );
  }
}
