export const maxDuration = 60;

const API_KEY = process.env.MAGNIFIC_API_KEY!;

async function readResponse(res: Response) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text || "Response bukan JSON",
      status: res.status,
    };
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json();

    if (!prompt || !image) {
      return Response.json(
        { error: "Prompt atau image kosong" },
        { status: 400 }
      );
    }

    const createRes = await fetch(
      "https://api.magnific.com/v1/ai/image-to-video/kling-v2-6-pro",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-magnific-api-key": API_KEY,
        },
        body: JSON.stringify({
          prompt,
          image,
          duration: "5",
        }),
      }
    );

    const createData = await readResponse(createRes);

    if (!createRes.ok) {
      return Response.json(createData, { status: createRes.status });
    }

    return Response.json(createData);
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
