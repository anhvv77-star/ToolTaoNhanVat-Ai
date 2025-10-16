import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

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

const handleApiError = (error: any): never => {
  console.error("Lỗi gọi API Gemini:", error);
  if (error?.message?.includes('API key not valid')) {
    throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại.");
  }
  if (error?.message?.includes('RESOURCE_EXHAUSTED')) {
    throw new Error("Đã hết hạn ngạch hoặc bạn chưa bật thanh toán cho dự án Google Cloud của mình. Vui lòng kiểm tra lại.");
  }
  if (error?.message) {
    throw new Error(error.message);
  }
  throw new Error("Không thể thực hiện yêu cầu do lỗi không xác định. Vui lòng thử lại.");
}

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Make a simple, low-cost call to validate the key and configuration
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hello',
    });
    return true;
  } catch (error: any) {
    handleApiError(error);
  }
};

export const generateImageFromPrompt = async (apiKey: string, prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-image';
    
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
    handleApiError(error);
  }
};


export const generateSceneWithCharacter = async (
  apiKey: string,
  characterImages: { data: string; mimeType: string }[],
  scenePrompt: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-image';

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
  } catch (error: any)
{
    handleApiError(error);
  }
};