// src/app/api/blessing/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  BlessingParams,
  ScenarioType,
  generateBlessingStream,
} from "@/lib/blessing";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  // 参数解析
  const scenario = searchParams.get("type") as ScenarioType;
  const params = {
    scenario,
    temp: searchParams.get("temp"),
    weather: searchParams.get("weather"),
    name: searchParams.get("name"),
    age: searchParams.get("age"),
    mbtiType: searchParams.get("mbtiType"),
    relationship: searchParams.get("relationship"),
  } as BlessingParams;

  // 参数校验
  if (!["weather", "birthday", "mbti"].includes(scenario)) {
    return NextResponse.json(
      { success: false, error: "无效的场景类型" },
      { status: 400 }
    );
  }

  // 场景参数校验
  const validation: Record<ScenarioType, string[]> = {
    weather: ["temp", "weather"],
    birthday: ["name"],
    mbti: ["mbtiType", "relationship"],
  };

  const missingParams = validation[scenario].filter(
    (p) => !params[p as keyof typeof params]
  );
  if (missingParams.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `缺少必要参数: ${missingParams.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // const stream = generateBlessingStream(params);

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        // 心跳机制
        const heartbeatTimer = setInterval(() => {
          controller.enqueue(new TextEncoder().encode(":\n\n"));
        }, 5000);

        try {
          for await (const chunk of generateBlessingStream(params)) {
            const eventData = `data: ${JSON.stringify({ text: chunk })}\n\n`;
            controller.enqueue(encoder.encode(eventData));
          }
          controller.enqueue(encoder.encode("data: { text: [DONE] } \n\n"));
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : typeof error === "string"
              ? error
              : "Unknown error";

          // 标准化错误数据格式
          const errorMsg = `event: error\ndata: ${JSON.stringify({
            message,
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMsg));
          controller.enqueue(encoder.encode(errorMsg));
        } finally {
          clearInterval(heartbeatTimer);
          controller.close();
        }
      },
    }),
    { headers }
  );
}
