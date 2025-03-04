// src/app/api/blessing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateBlessing, BlessingParams, ScenarioType } from "@/lib/blessing";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

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

  try {
    const content = await generateBlessing(params);
    return NextResponse.json({
      success: true,
      data: {
        type: scenario,
        content,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "生成失败",
        code: "DEEPSEEK_API_ERROR",
      },
      { status: 500 }
    );
  }
}
