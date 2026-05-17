export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type MagnificCreateResponse = {
  data?: {
    task_id?: string;
    status?: string;
    generated?: string[];
  };
  error?: string;
  message?: string;
};

const MAGNIFIC_API_KEY = process.env.MAGNIFIC_API_KEY;
const MAGNIFIC_BASE_URL = 'https://api.magnific.com/v1/ai/text-to-image/flux-dev';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getGeneratedUrl(data: any): string | undefined {
  return (
    data?.image ||
    data?.url ||
    data?.data?.image ||
    data?.data?.url ||
    data?.data?.generated?.[0] ||
    data?.generated?.[0]
  );
}

export async function POST(req: Request) {
  try {
    const { prompt, aspect_ratio = 'square_1_1' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt kosong' }, { status: 400 });
    }

    if (!MAGNIFIC_API_KEY) {
      return Response.json(
        { error: 'MAGNIFIC_API_KEY belum diisi di Environment Variables / .env.local' },
        { status: 500 }
      );
    }

    const createRes = await fetch(MAGNIFIC_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-magnific-api-key': MAGNIFIC_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio,
      }),
      cache: 'no-store',
    });

    const createData: MagnificCreateResponse = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      return Response.json(
        { error: createData?.message || createData?.error || 'Gagal membuat task Magnific', detail: createData },
        { status: createRes.status }
      );
    }

    const instantImage = getGeneratedUrl(createData);
    if (instantImage) {
      return Response.json({ image: instantImage, raw: createData });
    }

    const taskId = createData?.data?.task_id;
    if (!taskId) {
      return Response.json(
        { error: 'Task ID tidak ditemukan dari Magnific', detail: createData },
        { status: 500 }
      );
    }

    // Magnific async: create task dulu, lalu polling sampai generated keluar.
    for (let i = 0; i < 30; i++) {
      await sleep(2000);

      const statusRes = await fetch(`${MAGNIFIC_BASE_URL}/${taskId}`, {
        method: 'GET',
        headers: {
          'x-magnific-api-key': MAGNIFIC_API_KEY,
        },
        cache: 'no-store',
      });

      const statusData: any = await statusRes.json().catch(() => ({}));

      if (!statusRes.ok) {
        return Response.json(
          { error: statusData?.message || statusData?.error || 'Gagal cek status Magnific', detail: statusData },
          { status: statusRes.status }
        );
      }

      const generatedImage = getGeneratedUrl(statusData);
      if (generatedImage) {
        return Response.json({
          image: generatedImage,
          task_id: taskId,
          status: statusData?.data?.status || statusData?.status || 'COMPLETED',
          raw: statusData,
        });
      }

      const status = String(statusData?.data?.status || statusData?.status || '').toUpperCase();
      if (['FAILED', 'ERROR', 'CANCELLED', 'CANCELED'].includes(status)) {
        return Response.json(
          { error: `Generate gagal: ${status}`, task_id: taskId, detail: statusData },
          { status: 500 }
        );
      }
    }

    return Response.json(
      { error: 'Timeout menunggu hasil dari Magnific. Coba generate ulang atau cek limit.', task_id: taskId },
      { status: 504 }
    );
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'Gagal generate gambar' },
      { status: 500 }
    );
  }
}
