import { NextRequest, NextResponse } from "next/server";
import { getGaodeWeather, WeatherType } from "@/lib/weather";

/**
 * GET 天气数据接口
 * 请求参数：
 * ?type=live|forecast （必填）
 * &city=城市代码 （可选，默认440100）
 */
export async function GET(request: NextRequest) {
  // 解析查询参数
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as WeatherType;
  const city = searchParams.get("city") || undefined;

  // 参数校验
  if (!type || !["live", "forecast"].includes(type)) {
    return NextResponse.json(
      { success: false, error: "缺少或无效的type参数（必须为live或forecast）" },
      { status: 400 }
    );
  }

  try {
    // 获取天气数据
    const weatherData = await getGaodeWeather({ type, city });
    return NextResponse.json({ success: true, data: weatherData });
  } catch (error) {
    // 错误处理
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        code: "WEATHER_API_ERROR",
      },
      { status: 500 }
    );
  }
}
