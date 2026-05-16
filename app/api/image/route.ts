export const maxDuration = 60;

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return jsonError('Prompt gambar belum diisi.', 400);
    }

    const token = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    if (!token) {
      return jsonError('HF_TOKEN belum diisi di environment variable.', 500);
    }

    // New HuggingFace Inference API format (v2)
    const res = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
    });

    if (!res.ok) {
      let errMsg = `Error ${res.status}`;
      try {
        const errText = await res.text();
        const stripped = errText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson?.error || errJson?.message || errMsg;
        } catch {
          if (stripped.length > 0 && stripped.length < 300) errMsg = stripped;
        }
      } catch {}
      return jsonError(errMsg, 500);
    }

    const contentType = res.headers.get('content-type') || '';

    if (!contentType.startsWith('image/')) {
      return jsonError('Response bukan gambar. Model mungkin sedang loading, coba lagi.', 500);
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return new Response(JSON.stringify({
      image: `data:${contentType};base64,${base64}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return jsonError(err.message || 'Gagal generate gambar.', 500);
  }
}
