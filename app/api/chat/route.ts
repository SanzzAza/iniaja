import OpenAI from 'openai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, model, provider } = await req.json();

    const config: Record<string, { apiKey: string; baseURL: string }> = {
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseURL: 'https://openrouter.ai/api/v1',
      },
      cerebras: {
        apiKey: process.env.CEREBRAS_API_KEY!,
        baseURL: 'https://api.cerebras.ai/v1',
      },
    };

    if (!config[provider]) {
      return new Response(
        JSON.stringify({ error: 'Invalid provider' }),
        { status: 400 }
      );
    }

    const client = new OpenAI(config[provider]);

    const stream = await client.chat.completions.create({
      model: model,
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
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
    
    // Better error message
    let errorMsg = 'Internal server error';
    if (error.status === 404) {
      errorMsg = `Model "${error.model || 'unknown'}" tidak ditemukan. Coba model lain.`;
    } else if (error.status === 401) {
      errorMsg = 'API key tidak valid. Cek environment variable.';
    } else if (error.status === 429) {
      errorMsg = 'Rate limit tercapai. Coba lagi nanti.';
    } else if (error.message) {
      errorMsg = error.message;
    }

    return new Response(
      JSON.stringify({ error: errorMsg, status: error.status }),
      { status: error.status || 500 }
    );
  }
}
