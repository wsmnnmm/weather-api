import axios from "axios";

/***********************​ 类型定义 ​***********************/
// 高德API基础响应类型
interface GaodeBaseResponse {
  status: string; // 返回状态 0-失败 1-成功
  count: string; // 返回结果总条数
  info: string; // 返回状态说明
  infocode: string; // 状态码
}

// 实时天气响应类型
interface GaodeLiveWeatherResponse extends GaodeBaseResponse {
  lives: Array<{
    province: string; // 省份
    city: string; // 城市
    adcode: string; // 区域编码
    weather: string; // 天气现象
    temperature: string; // 实时温度
    winddirection: string; // 风向
    windpower: string; // 风力
    humidity: string; // 空气湿度
    reporttime: string; // 数据发布时间
  }>;
}

// 预报天气响应类型
interface GaodeForecastWeatherResponse extends GaodeBaseResponse {
  forecasts: Array<{
    city: string; // 城市
    adcode: string; // 区域编码
    reporttime: string; // 预报发布时间
    casts: Array<{
      // 预报数据
      date: string; // 日期
      week: string; // 星期
      dayweather: string; // 白天天气
      nightweather: string; // 夜间天气
      daytemp: string; // 白天温度
      nighttemp: string; // 夜间温度
      daywind: string; // 白天风向
      nightwind: string; // 夜间风向
      daypower: string; // 白天风力
      nightpower: string; // 夜间风力
      dayhumidity: string; // 白天湿度
      nighthumidity: string; // 夜间湿度
    }>;
  }>;
}

/***********************​ 应用数据类型 ​***********************/
export type WeatherType = "live" | "forecast";

// 统一天气数据格式
export type WeatherData = {
  type: WeatherType; // 数据类型
  city: string; // 城市
  reportTime: string; // 数据发布时间

  // 实时数据
  live?: {
    temperature: number; // 温度
    weather: string; // 天气现象
    windDirection: string; // 风向
    windPower: string; // 风力
    humidity: number; // 湿度
  };

  // 预报数据
  forecast?: Array<{
    date: string; // 日期
    week: string; // 星期
    dayWeather: string; // 白天天气
    nightWeather: string; // 夜间天气
    dayTemp: number; // 白天温度
    nightTemp: number; // 夜间温度
    dayHumidity: number; // 白天湿度
    nightHumidity: number; // 夜间湿度
  }>;
};

/***********************​ 核心函数 ​***********************/
/**
 * 获取高德天气数据
 * @param params 请求参数
 * @returns 标准化后的天气数据
 */
export async function getGaodeWeather(params: {
  type: WeatherType;
  city?: string; // 默认值：440100（广州）
}): Promise<WeatherData> {
  // 参数校验与默认值
  const cityCode = params.city || "440100";

  if (!process.env.AMAP_KEY) {
    throw new Error("请先配置高德地图API密钥(AMAP_KEY)");
  }

  try {
    // 构建请求URL
    const url = new URL("https://restapi.amap.com/v3/weather/weatherInfo");
    url.searchParams.set("key", process.env.AMAP_KEY);
    url.searchParams.set("city", cityCode);
    url.searchParams.set("extensions", params.type === "live" ? "base" : "all");

    // 发送请求
    const { data } = await axios.get<
      GaodeLiveWeatherResponse | GaodeForecastWeatherResponse
    >(url.toString());

    // 处理错误响应
    if (data.status !== "1") {
      throw new Error(`高德API错误: ${data.info} (状态码: ${data.infocode})`);
    }

    // 处理实时天气
    if (params.type === "live") {
      const liveData = (data as GaodeLiveWeatherResponse).lives[0];
      return {
        type: "live",
        city: liveData.city,
        reportTime: liveData.reporttime,
        live: {
          ...liveData,
          temperature: parseInt(liveData.temperature),
          weather: liveData.weather,
          windDirection: liveData.winddirection,
          windPower: liveData.windpower,
          humidity: parseInt(liveData.humidity),
        },
      };
    }

    // 处理预报天气
    const forecastData = (data as GaodeForecastWeatherResponse).forecasts[0];
    return {
      type: "forecast",
      ...forecastData,
      reportTime: forecastData.reporttime,
      forecast: forecastData.casts.map((cast) => ({
        date: cast.date,
        week: cast.week,
        dayWeather: cast.dayweather,
        nightWeather: cast.nightweather,
        dayTemp: parseInt(cast.daytemp),
        nightTemp: parseInt(cast.nighttemp),
        dayHumidity: parseInt(cast.dayhumidity),
        nightHumidity: parseInt(cast.nighthumidity),
      })),
    };
  } catch (error) {
    // 统一错误处理
    console.error("天气数据获取失败:", error);
    throw new Error(
      `天气服务暂时不可用: ${
        error instanceof Error ? error.message : "未知错误"
      }`
    );
  }
}
