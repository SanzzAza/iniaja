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

    // HuggingFace new inference router URL
    const res = await fetch(
      'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell/v1/images/generations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          num_inference_steps: 4,
          response_format: 'b64_json',
        }),
      }
    );

    if (!res.ok) {
      let errMsg = `HuggingFace error ${res.status}`;
      try {
        const errText = await res.text();
        const stripped = errText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson?.error?.message || errJson?.error || errJson?.message || errMsg;
        } catch {
          if (stripped.length > 0 && stripped.length < 300) errMsg = stripped;
        }
      } catch {}
      return jsonError(errMsg, 500);
    }

    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json;

    if (!b64) {
      return jsonError('Gagal mendapatkan gambar dari HuggingFace.', 500);
    }

    return new Response(JSON.stringify({
      image: `data:image/png;base64,${b64}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return jsonError(err.message || 'Gagal generate gambar.', 500);
  }
}
