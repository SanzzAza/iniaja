export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const MAGNIFIC_API_KEY = process.env.MAGNIFIC_API_KEY;
const MAGNIFIC_VIDEO_URL = 'https://api.magnific.com/v1/ai/image-to-video/kling-v2-6-pro';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getVideoUrl(data: any): string | undefined {
  return (
    data?.video ||
    data?.url ||
    data?.output ||
    data?.data?.video ||
    data?.data?.url ||
    data?.data?.output ||
    data?.data?.generated?.[0] ||
    data?.generated?.[0] ||
    data?.result?.video ||
    data?.result?.url
  );
}

function getTaskId(data: any): string | undefined {
  return data?.task_id || data?.id || data?.data?.task_id || data?.data?.id;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const image = body?.image || body?.image_url;
    const duration = body?.duration || 5;

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt video kosong' }, { status: 400 });
    }

    if (!image || typeof image !== 'string') {
      return Response.json({ error: 'Image kosong. Upload/generate gambar dulu untuk Kling image-to-video.' }, { status: 400 });
    }

    if (!MAGNIFIC_API_KEY) {
      return Response.json(
        { error: 'MAGNIFIC_API_KEY belum diisi di Environment Variables / .env.local' },
        { status: 500 }
      );
    }

    const createPayload = {
      prompt,
      image,
      image_url: image,
      duration,
    };

    const createRes = await fetch(MAGNIFIC_VIDEO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-magnific-api-key': MAGNIFIC_API_KEY,
      },
      body: JSON.stringify(createPayload),
      cache: 'no-store',
    });

    const createData: any = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      return Response.json(
        { error: createData?.message || createData?.error || 'Gagal membuat task video Magnific', detail: createData },
        { status: createRes.status }
      );
    }

    const instantVideo = getVideoUrl(createData);
    if (instantVideo) {
      return Response.json({ video: instantVideo, raw: createData });
    }

    const taskId = getTaskId(createData);
    if (!taskId) {
      return Response.json(
        { error: 'Task ID video tidak ditemukan dari Magnific', detail: createData },
        { status: 500 }
      );
    }

    for (let i = 0; i < 90; i++) {
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
          { error: statusData?.message || statusData?.error || 'Gagal cek status video Magnific', detail: statusData },
          { status: statusRes.status }
        );
      }

      const video = getVideoUrl(statusData);
      if (video) {
        return Response.json({
          video,
          task_id: taskId,
          status: statusData?.data?.status || statusData?.status || 'COMPLETED',
          raw: statusData,
        });
      }

      const status = String(statusData?.data?.status || statusData?.status || '').toUpperCase();
      if (['FAILED', 'ERROR', 'CANCELLED', 'CANCELED'].includes(status)) {
        return Response.json(
          { error: `Generate video gagal: ${status}`, task_id: taskId, detail: statusData },
          { status: 500 }
        );
      }
    }

    return Response.json(
      { error: 'Timeout menunggu hasil video dari Magnific. Coba cek lagi / ulang generate.', task_id: taskId },
      { status: 504 }
    );
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'Gagal generate video' },
      { status: 500 }
    );
  }
}
