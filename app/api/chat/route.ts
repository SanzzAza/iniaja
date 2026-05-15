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
          'X-Title': 'My AI Chat',
        },
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid provider' }),
        { status: 400 }
      );
    }

    // Google tidak support stream di semua model
    // coba stream dulu, kalau gagal fallback ke non-stream
    if (provider === 'google') {
      try {
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
      } catch (streamErr: any) {
        // Fallback non-stream kalau stream gagal
        console.log('Stream failed, fallback to non-stream:', streamErr.message);
        const response = await client.chat.completions.create({
          model: model,
          messages,
          stream: false,
        });

        const text = response.choices[0]?.message?.content || '';
        return new Response(text, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }
    }

    // Cerebras & OpenRouter pakai stream normal
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

    let errorMsg = 'Internal server error';
    if (error.status === 404) errorMsg = 'Model tidak ditemukan. Coba model lain.';
    else if (error.status === 401) errorMsg = 'API key tidak valid. Cek GOOGLE_API_KEY.';
    else if (error.status === 429) errorMsg = 'Rate limit. Coba lagi nanti.';
    else if (error.status === 400) errorMsg = 'Bad request. Coba model lain.';
    else if (error.message) errorMsg = error.message;

    return new Response(
      JSON.stringify({ error: errorMsg, status: error.status }),
      { status: error.status || 500 }
    );
  }
}
