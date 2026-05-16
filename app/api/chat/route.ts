import OpenAI from 'openai';

export const maxDuration = 60;

const SYSTEM_PROMPT = `
You are a helpful AI assistant.
Always answer clearly, honestly, and concisely.
If the user sends an image, analyze it directly and explain what you see.
`;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: any;
};

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function missingEnv(name: string) {
  return jsonError(`${name} belum diisi di environment variable.`, 500);
}

function withSystemPrompt(messages: ChatMessage[]) {
  const hasSystem = messages.some((msg) => msg.role === 'system');
  if (hasSystem) return messages;

  return [
    {
      role: 'system' as const,
      content: SYSTEM_PROMPT,
    },
    ...messages,
  ];
}

function attachImagesToLastUserMessage(messages: ChatMessage[], images: string[]) {
  if (!images.length) return messages;

  const finalMessages = [...messages];
  const lastUserIndex = finalMessages.map((msg) => msg.role).lastIndexOf('user');

  if (lastUserIndex === -1) return finalMessages;

  const lastUser = finalMessages[lastUserIndex];
  const textContent =
    typeof lastUser.content === 'string'
      ? lastUser.content
      : 'Tolong jelaskan gambar ini.';

  finalMessages[lastUserIndex] = {
    ...lastUser,
    content: [
      {
        type: 'text',
        text: textContent,
      },
      ...images.map((url) => ({
        type: 'image_url',
        image_url: {
          url,
        },
      })),
    ],
  };

  return finalMessages;
}

function streamPlainTextFromSSE(res: Response) {
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

function streamPlainTextFromOpenAIStream(stream: any) {
  const encoder = new TextEncoder();
  let lastText = '';
  let repeatCount = 0;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content || '';

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
}

export async function POST(req: Request) {
  try {
    const { messages, model, provider, images = [] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return jsonError('Messages tidak valid.', 400);
    }

    if (!model) {
      return jsonError('Model belum dipilih.', 400);
    }

    if (!provider) {
      return jsonError('Provider belum dipilih.', 400);
    }

    const imageList = Array.isArray(images)
      ? images.filter((img) => typeof img === 'string' && img.startsWith('data:image/')).slice(0, 4)
      : [];

    const hasImages = imageList.length > 0;

    if (hasImages && provider === 'cerebras') {
      return jsonError(
        'Cerebras belum support membaca gambar. Pakai Google Gemini, OpenRouter vision model, GitHub GPT-4o, atau NVIDIA vision model.',
        400
      );
    }

    const finalMessages = attachImagesToLastUserMessage(
      withSystemPrompt(messages),
      imageList
    );

    // ── Cerebras: raw fetch (text only) ───────────────────────────────────
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

        return jsonError(errMsg, res.status);
      }

      return streamPlainTextFromSSE(res);
    }

    // ── Other providers: OpenAI SDK compatible ────────────────────────────
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
    } else if (provider === 'huggingface') {
      if (!process.env.HF_TOKEN) {
        return missingEnv('HF_TOKEN');
      }

      client = new OpenAI({
        apiKey: process.env.HF_TOKEN,
        baseURL: 'https://router.huggingface.co/v1',
      });
    } else {
      return jsonError('Invalid provider', 400);
    }

    const simpleParams = provider === 'google' || provider === 'huggingface';

    const stream: any = await client.chat.completions.create({
      model,
      messages: finalMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
      ...(simpleParams
        ? {}
        : {
            top_p: 0.9,
            frequency_penalty: 0.5,
            presence_penalty: 0.3,
          }),
    });

    return streamPlainTextFromOpenAIStream(stream);
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

    return jsonError(errorMsg, error.status || 500);
  }
}
