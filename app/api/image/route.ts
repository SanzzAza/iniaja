export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt kosong" }, { status: 400 });
    }

    const finalPrompt = `
masterpiece, best quality, ultra detailed, anime style,
${prompt}
`;

    const seed = Math.floor(Math.random() * 999999999);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      finalPrompt
    )}?width=512&height=512&model=flux&seed=${seed}&nologo=true&private=true`;

    const imgRes = await fetch(imageUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!imgRes.ok) {
      return Response.json(
        { error: `Gagal ambil gambar: ${imgRes.status}` },
        { status: 500 }
      );
    }

    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return Response.json({
      image: `data:image/png;base64,${base64}`,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Gagal generate gambar" },
      { status: 500 }
    );
  }
}
