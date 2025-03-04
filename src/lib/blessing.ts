// src/lib/blessing.ts
export type ScenarioType = "weather" | "birthday" | "mbti";

export interface BlessingParams {
  scenario: ScenarioType;
  temp?: string;
  weather?: string;
  name?: string;
  age?: string;
  mbtiType?: string;
  relationship?: string;
}

import axios from "axios";

const buildPrompt = (params: BlessingParams): string => {
  const { scenario } = params;

  // 专业提示词工程模板
  const prompts: Record<ScenarioType, string> = {
    weather: `作为祝福语创作专家，请根据以下天气数据生成祝福语：
- 温度：${params.temp}℃
- 天气状况：${params.weather}
要求：
1. 结合气象特征（如${params.weather?.includes("雨") ? "雨水滋润" : "阳光温暖"}）
2. 使用口语化表达，不超过50字
3. 包含积极向上的情感元素
4. 不要有多余的解释`,

    birthday: `为以下对象创作生日祝福：
- 姓名：${params.name}
- 年龄：${params.age || "未知"}
要求：
1. 使用${params.age ? "符合年龄阶段" : "普适"}的表达方式
2. 包含至少1个相关emoji
3. 突出祝福重点
4. 不要有多余的解释`,

    mbti: `根据MBTI性格类型生成专属祝福：
- 类型：${params.mbtiType}
- 关系：${params.relationship}
要求：
1. 结合该类型认知功能特点
2. 使用对应的比喻手法（如NT型用科技类比）
3. 保持亲切自然的口吻
4. 不要有多余的解释`,
  };

  return prompts[scenario];
};

export const generateBlessing = async (
  params: BlessingParams
): Promise<string> => {
  const prompt = buildPrompt(params);

  console.log(
    process.env.DEEPSEEK_API_KEY,
    prompt,
    "process.env.DEEPSEEK_API_KEY"
  );

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-reasoner",
        messages: [
          {
            role: "system",
            content:
              "你是有10年经验的祝福语创作专家，擅长生成温暖且有创意的祝福内容",
          },
          { role: "user", content: prompt },
        ],
        stream: false,
        temperature: 1.5,
        // max_tokens: 200,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        timeout: 3000000, // 3000秒超时
      }
    );
    console.log(response, "response");

    return response?.data?.choices[0]?.message?.content;
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
};
