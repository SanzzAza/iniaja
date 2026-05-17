export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const MAGNIFIC_API_KEY = process.env.MAGNIFIC_API_KEY;
const MAGNIFIC_VIDEO_URL = 'https://api.magnific.com/v1/ai/image-to-video/kling-v2-6-pro';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTaskId(data: any): string | undefined {
  return data?.data?.task_id || data?.task_id || data?.data?.id || data?.id;
}

function getStatus(data: any): string {
  return String(data?.data?.status || data?.status || '').toUpperCase();
}

function getVideoUrl(data: any): string | undefined {
  const generated = data?.data?.generated || data?.generated;

  if (Array.isArray(generated)) {
    const first = generated[0];
    if (typeof first === 'string') return first;
    return first?.url || first?.video || first?.output;
  }

  return (
    data?.data?.video ||
    data?.data?.url ||
    data?.data?.output ||
    data?.video ||
    data?.url ||
    data?.output ||
    data?.result?.video ||
    data?.result?.url
  );
}

function normalizeImage(input: string) {
  // Magnific docs: field harus "image" dan value boleh URL publik / base64.
  // Jangan kirim image_url, dan jangan kirim object/file mentah.
  return input.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || '').trim();
    const image = typeof body?.image === 'string' ? normalizeImage(body.image) : '';
    const duration = String(body?.duration || '5'); // docs enum<string>: "5" atau "10"

    if (!MAGNIFIC_API_KEY) {
      return Response.json(
        { error: 'MAGNIFIC_API_KEY belum diisi di .env.local / Vercel Environment Variables' },
        { status: 500 }
      );
    }

    if (!prompt) {
      return Response.json({ error: 'Prompt video kosong' }, { status: 400 });
    }

    if (!image) {
      return Response.json(
        { error: 'Image kosong. Upload gambar dulu, lalu generate video.' },
        { status: 400 }
      );
    }

    if (!['5', '10'].includes(duration)) {
      return Response.json(
        { error: 'Duration harus "5" atau "10"' },
        { status: 400 }
      );
    }

    const createRes = await fetch(MAGNIFIC_VIDEO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-magnific-api-key': MAGNIFIC_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        duration,
        image,
      }),
      cache: 'no-store',
    });

    const createData: any = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      return Response.json(
        {
          error:
            createData?.message ||
            createData?.error ||
            createData?.detail?.message ||
            'Validation error dari Magnific. Biasanya image/base64 tidak valid, resolusi kurang dari 300x300, atau duration bukan string "5"/"10".',
          detail: createData,
        },
        { status: createRes.status }
      );
    }

    const taskId = getTaskId(createData);
    const instantVideo = getVideoUrl(createData);

    if (instantVideo) {
      return Response.json({ video: instantVideo, task_id: taskId, raw: createData });
    }

    if (!taskId) {
      return Response.json(
        { error: 'Task ID video tidak ditemukan dari Magnific', detail: createData },
        { status: 500 }
      );
    }

    for (let i = 0; i < 100; i++) {
      await sleep(3000);

      const statusRes = await fetch(`${MAGNIFIC_VIDEO_URL}/${taskId}`, {
        method: 'GET',
        headers: {
          'x-magnific-api-key': MAGNIFIC_API_KEY,
        },
        cache: 'no-store',
      });

      const statusData: any = await statusRes.json().catch(() => ({}));

      if (!statusRes.ok) {
        return Response.json(
          {
            error: statusData?.message || statusData?.error || 'Gagal cek status video Magnific',
            detail: statusData,
          },
          { status: statusRes.status }
        );
      }

      const video = getVideoUrl(statusData);
      if (video) {
        return Response.json({
          video,
          task_id: taskId,
          status: getStatus(statusData) || 'COMPLETED',
          raw: statusData,
        });
      }

      const status = getStatus(statusData);
      if (['FAILED', 'ERROR', 'CANCELLED', 'CANCELED'].includes(status)) {
        return Response.json(
          { error: `Generate video gagal: ${status}`, task_id: taskId, detail: statusData },
          { status: 500 }
        );
      }
    }

    return Response.json(
      { error: 'Timeout menunggu hasil video dari Magnific. Task sudah dibuat, coba generate ulang atau cek dashboard.', task_id: taskId },
      { status: 504 }
    );
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'Gagal generate video' },
      { status: 500 }
    );
  }
}
