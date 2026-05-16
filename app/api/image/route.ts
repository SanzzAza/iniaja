export const maxDuration = 60;

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return jsonError("Prompt kosong");
    }

    const token =
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HF_TOKEN;

    if (!token) {
      return jsonError("HF_TOKEN belum diisi", 500);
    }

    // SDXL TURBO
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/sdxl-turbo",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          options: {
            wait_for_model: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();

      return jsonError(
        `HF Error ${response.status}: ${text}`,
        500
      );
    }

    const buffer = await response.arrayBuffer();

    const base64 = Buffer.from(buffer).toString("base64");

    return new Response(
      JSON.stringify({
        image: `data:image/jpeg;base64,${base64}`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    return jsonError(
      err.message || "Gagal generate gambar",
      500
    );
  }
}
