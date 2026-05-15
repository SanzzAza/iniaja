import OpenAI from 'openai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, model, provider } = await req.json();

    // ── Cerebras: raw fetch (bypass OpenAI SDK entirely) ──────────────────
    if (provider === 'cerebras') {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.7,
          max_completion_tokens: 8192,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `Cerebras error ${res.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson?.message ?? errJson?.error?.message ?? errText;
        } catch {}
        return new Response(JSON.stringify({ error: errMsg }), { status: res.status });
      }

      // Parse SSE stream and forward as plain text
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const json = JSON.parse(data);
                const text = json.choices?.[0]?.delta?.content ?? '';
                if (text) controller.enqueue(encoder.encode(text));
              } catch {}
            }
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // ── Other providers: OpenAI SDK ───────────────────────────────────────
    let client: OpenAI;

    if (provider === 'google') {
      client = new OpenAI({
        apiKey: process.env.GOOGLE_API_KEY!,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
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
      return new Response(JSON.stringify({ error: 'Invalid provider' }), { status: 400 });
    }

    const isGoogle = provider === 'google';
    const stream: any = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
      ...(isGoogle ? {} : {
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
      }),
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
              if (++repeatCount > 5) break;
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
      JSON.stringify({ error: errorMsg }),
      { status: error.status || 500 }
    );
  }
}
