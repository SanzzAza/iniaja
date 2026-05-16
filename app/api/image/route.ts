export const maxDuration = 60;

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return jsonError("Prompt gambar belum diisi.", 400);
    }

    const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;

    if (!token) {
      return jsonError("HF_TOKEN belum diisi di Vercel.", 500);
    }

    const res = await fetch(
      "https://router.huggingface.co/hf-inference/models/ByteDance/Hyper-SD",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 512,
            height: 512,
            num_inference_steps: 4,
          },
          options: {
            wait_for_model: true,
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return jsonError(`HF Error ${res.status}: ${text}`, 500);
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return Response.json({
      image: `data:image/png;base64,${base64}`,
    });
  } catch (err: any) {
    return jsonError(err?.message || "Gagal generate gambar.", 500);
  }
}
