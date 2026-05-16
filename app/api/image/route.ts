export const maxDuration = 60;

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    const { prompt, model = 'stabilityai/sdxl-turbo' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return jsonError('Prompt gambar belum diisi.', 400);
    }

    const token = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    if (!token) {
      return jsonError('HUGGINGFACE_API_KEY atau HF_TOKEN belum diisi di environment variable.', 500);
    }

    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'image/png',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 4,
          guidance_scale: 0,
        },
        options: {
          wait_for_model: true,
        },
      }),
    });

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Hugging Face image error ${res.status}`;

      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error || errJson?.message || errMsg;
      } catch {
        if (errText) errMsg = errText;
      }

      return jsonError(errMsg, res.status);
    }

    if (!contentType.startsWith('image/')) {
      const text = await res.text();
      return jsonError(text || 'Response bukan gambar dari Hugging Face.', 500);
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
