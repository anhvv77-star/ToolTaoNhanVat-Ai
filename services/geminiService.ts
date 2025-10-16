import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = 'gemini-2.5-flash-image';

const processImageResponse = (response: GenerateContentResponse): string => {
  // Case 1: Prompt was blocked upfront.
  if (response.promptFeedback?.blockReason) {
    throw new Error(`Yêu cầu đã bị chặn vì lý do an toàn: ${response.promptFeedback.blockReason}. Vui lòng thử một prompt khác.`);
  }

  // Case 2: No candidates were returned. This is often a safety issue post-prompt check.
  if (!response.candidates || response.candidates.length === 0) {
    console.error("Invalid response: No candidates returned. Full response:", response);
    throw new Error("AI không tạo ra kết quả. Điều này có thể do bộ lọc an toàn. Vui lòng thử một prompt khác.");
  }

  const candidate = response.candidates[0];

  // Case 3: A candidate was returned, but the generation was stopped for a reason other than success.
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
     throw new Error(`Quá trình tạo ảnh đã bị dừng vì lý do: ${candidate.finishReason}. Vui lòng thử một prompt khác.`);
  }

  // Case 4: Candidate finished successfully, but the expected image data is missing.
  const imagePart = candidate.content?.parts?.find(p => p.inlineData);
  if (!imagePart?.inlineData) {
    console.error("Invalid response structure: 'STOP' finish reason but no image data. Full response:", response);
    throw new Error("Phản hồi từ AI có cấu trúc không hợp lệ hoặc không chứa hình ảnh. Vui lòng thử lại.");
  }
  
  // Success case
  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    return processImageResponse(response);
  } catch (error: any) {
    console.error("Lỗi khi tạo hình ảnh từ prompt:", error);
    // Re-throw our custom, user-friendly errors from processImageResponse,
    // or a message from an underlying API error.
    if (error?.message) {
      throw new Error(error.message);
    }
    throw new Error("Không thể tạo hình ảnh do lỗi không xác định. Vui lòng thử lại.");
  }
};


export const generateSceneWithCharacter = async (
  characterImages: { data: string; mimeType: string }[],
  scenePrompt: string
): Promise<string> => {
  try {
    const imageParts = characterImages.map(image => ({
        inlineData: {
            data: image.data,
            mimeType: image.mimeType,
        },
    }));

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          ...imageParts,
          { text: scenePrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    return processImageResponse(response);
  } catch (error: any) {
    console.error("Lỗi khi tạo bối cảnh với nhân vật:", error);
    // Re-throw our custom, user-friendly errors from processImageResponse,
    // or a message from an underlying API error.
    if (error?.message) {
      throw new Error(error.message);
    }
    throw new Error("Không thể tạo bối cảnh do lỗi không xác định. Vui lòng thử lại.");
  }
};