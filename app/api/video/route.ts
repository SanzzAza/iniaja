export const maxDuration = 60;

const API_KEY = process.env.MAGNIFIC_API_KEY!;

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json();

    if (!prompt || !image) {
      return Response.json(
        { error: "Prompt atau image kosong" },
        { status: 400 }
      );
    }

    // CREATE VIDEO TASK
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

    const createData = await createRes.json();

    console.log("CREATE:", createData);

    const taskId = createData?.data?.task_id;

    if (!taskId) {
      return Response.json(createData, {
        status: 500,
      });
    }

    // POLLING
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const statusRes = await fetch(
        `https://api.magnific.com/v1/ai/tasks/${taskId}`,
        {
          headers: {
            "x-magnific-api-key": API_KEY,
          },
          cache: "no-store",
        }
      );

      const statusData = await statusRes.json();

      console.log("STATUS:", statusData);

      const generated =
        statusData?.data?.generated?.[0];

      if (generated) {
        return Response.json({
          success: true,
          video: generated,
        });
      }

      if (
        statusData?.data?.status === "FAILED"
      ) {
        return Response.json(statusData, {
          status: 500,
        });
      }
    }

    return Response.json({
      error: "Timeout generate video",
    });
  } catch (err: any) {
    console.log(err);

    return Response.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}
