export const maxDuration = 60;

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return jsonError("Prompt kosong");
    }

    const token =
      process.env.HF_TOKEN ||
      process.env.HUGGINGFACE_API_KEY;

    if (!token) {
      return jsonError("HF_TOKEN belum diisi");
    }

    const response = await fetch(
      "https://router.huggingface.co/replicate/v1/models/black-forest-labs/flux-schnell/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt,
            width: 512,
            height: 512,
            num_outputs: 1,
            num_inference_steps: 4,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return jsonError(
        JSON.stringify(data),
        response.status
      );
    }

    // hasil image url
    const imageUrl = data?.output?.[0];

    if (!imageUrl) {
      return jsonError("Image gagal dibuat");
    }

    return Response.json({
      image: imageUrl,
    });
  } catch (err: any) {
    return jsonError(
      err.message || "Terjadi error",
      500
    );
  }
}
