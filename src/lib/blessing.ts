// src/lib/blessing.ts
import OpenAI from "openai";

export type ScenarioType = "weather" | "birthday" | "mbti";

export interface BlessingParams {
  scenario: ScenarioType;
  temp?: string;
  weather?: string;
  name?: string;
  age?: string;
  zodiac?: string;
  mbtiType?: string;
  relationship?: string;
}

import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1", // DeepSeek 专用端点
  timeout: 3000000, // 30秒超时
});

const buildPrompt = (params: BlessingParams): string => {
  const { scenario } = params;

  // 专业提示词工程模板
  const prompts: Record<ScenarioType, string> = {
    weather: `作为祝福语创作专家，请根据以下天气数据生成祝福语：
- 温度：${params.temp}℃
- 天气状况：${params.weather}
要求：
1. 结合气象特征
2. 使用口语化表达，不超过50字
3. 包含关心、祝福和情切的情感元素
4. 不要有多余的解释和解析`,

    birthday: `为以下对象创作生日祝福：
- 姓名：${params.name}
- 年龄：${params.age || "未知"}
- 生肖：${params.zodiac || "未知"}
要求：
1. 使用${params.age ? "符合年龄阶段" : "普适"}的表达方式
2. 包含至少1个相关emoji
3. 突出祝福重点
4. 不要有多余的解释和解析`,

    mbti: `根据MBTI性格类型生成专属祝福：
- 类型：${params.mbtiType}
- 关系：${params.relationship}
要求：
1. 结合该类型认知功能特点
2. 使用对应的比喻手法（如NT型用科技类比）
3. 保持亲切自然的口吻
4. 不要有多余的解释和解析`,
  };

  return prompts[scenario];
};

export async function* generateBlessingStream(
  params: BlessingParams
): AsyncGenerator<string> {
  const prompt = buildPrompt(params);

  try {
    const stream = (await openai.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [
        {
          role: "system",
          content:
            "你是有10年经验的祝福语创作专家，擅长生成温暖且有创意的祝福内容",
        },
        { role: "user", content: prompt },
      ],
      temperature: 1.5,
      stream: true, // 启用流式传输
    })) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content; // 逐步生成内容
      }
    }
  } catch (error) {
    let errorMessage = "生成失败：";
    console.log(error, "error");

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      errorMessage += status
        ? `API错误（状态码 ${status}）`
        : `网络错误（${error.message}）`;
    } else {
      errorMessage += "未知系统错误";
    }

    throw new Error(errorMessage);
  }
}

// 兼容旧版非流式调用（可选）
export const generateBlessing = async (
  params: BlessingParams
): Promise<string> => {
  let fullContent = "";

  try {
    const stream = generateBlessingStream(params);
    for await (const chunk of stream) {
      fullContent += chunk;
    }
    return fullContent;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};
