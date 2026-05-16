import OpenAI from 'openai';

export const maxDuration = 60;

const SYSTEM_PROMPT = `
You are a helpful AI assistant.
Always answer clearly, honestly, and concisely.
`;

const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 1000;

const ipRequests = new Map<
  string,
  {
    count: number;
    timestamp: number;
  }
>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const user = ipRequests.get(ip);

  if (!user) {
    ipRequests.set(ip, {
      count: 1,
      timestamp: now,
    });
    return true;
  }

  if (now - user.timestamp > WINDOW_MS) {
    ipRequests.set(ip, {
      count: 1,
      timestamp: now,
    });
    return true;
  }

  if (user.count >= RATE_LIMIT) {
    return false;
  }

  user.count++;
  return true;
}

function getIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'
  );
}

function withSystemPrompt(messages: any[]) {
  const hasSystemPrompt = messages.some((msg) => msg.role === 'system');

  if (hasSystemPrompt) {
    return messages;
  }

  return [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    ...messages,
  ];
}

function missingEnv(name: string) {
  return new Response(
    JSON.stringify({
      error: `${name} belum diisi di environment variable.`,
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const { messages, model, provider } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: 'Messages tidak valid.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!model) {
      return new Response(
        JSON.stringify({
          error: 'Model belum dipilih.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!provider) {
      return new Response(
        JSON.stringify({
          error: 'Provider belum dipilih.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const ip = getIp(req);

    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({
          error: 'Terlalu banyak request. Coba lagi sebentar lagi.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const finalMessages = withSystemPrompt(messages);

    // ── Cerebras: raw fetch ───────────────────────────────────────────────
    if (provider === 'cerebras') {
      if (!process.env.CEREBRAS_API_KEY) {
        return missingEnv('CEREBRAS_API_KEY');
      }

      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: finalMessages,
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

        return new Response(
          JSON.stringify({
            error: errMsg,
          }),
          {
            status: res.status,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, {
              stream: true,
            });

            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6).trim();

              if (data === '[DONE]') continue;

              try {
                const json = JSON.parse(data);
                const text = json.choices?.[0]?.delta?.content ?? '';

                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
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
      if (!process.env.GOOGLE_API_KEY) {
        return missingEnv('GOOGLE_API_KEY');
      }

      client = new OpenAI({
        apiKey: process.env.GOOGLE_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
    } else if (provider === 'openrouter') {
      if (!process.env.OPENROUTER_API_KEY) {
        return missingEnv('OPENROUTER_API_KEY');
      }

      client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://iniaja.vercel.app',
          'X-Title': 'Iniaja AI',
        },
      });
    } else if (provider === 'github') {
      if (!process.env.GITHUB_TOKEN) {
        return missingEnv('GITHUB_TOKEN');
      }

      client = new OpenAI({
        apiKey: process.env.GITHUB_TOKEN,
        baseURL: 'https://models.github.ai/inference',
      });
    } else if (provider === 'nvidia') {
      if (!process.env.NVIDIA_API_KEY) {
        return missingEnv('NVIDIA_API_KEY');
      }

      client = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });
    } else {
      return new Response(
        JSON.stringify({
          error: 'Invalid provider',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const isGoogle = provider === 'google';

    const stream: any = await client.chat.completions.create({
      model,
      messages: finalMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
      ...(isGoogle
        ? {}
        : {
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

            if (text) {
              controller.enqueue(encoder.encode(text));
            }
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

    if (error.status === 404) {
      errorMsg = 'Model tidak ditemukan. Coba model lain.';
    } else if (error.status === 401) {
      errorMsg = 'API key tidak valid.';
    } else if (error.status === 429) {
      errorMsg = 'Rate limit. Coba lagi nanti.';
    } else if (error.status === 400) {
      errorMsg = `Bad request: ${error.message ?? 'Coba model lain.'}`;
    } else if (error.message) {
      errorMsg = error.message;
    }

    return new Response(
      JSON.stringify({
        error: errorMsg,
      }),
      {
        status: error.status || 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
