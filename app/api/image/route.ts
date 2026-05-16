export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json(
        { error: "Prompt kosong" },
        { status: 400 }
      );
    }

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?width=512&height=512&model=flux&seed=${Date.now()}`;

    return Response.json({
      image: imageUrl,
    });
  } catch (err: any) {
    return Response.json(
      {
        error: err.message || "Gagal generate gambar",
      },
      { status: 500 }
    );
  }
}
