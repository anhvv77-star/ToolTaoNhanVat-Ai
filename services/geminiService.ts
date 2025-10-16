import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

// Initialize the client on module load using the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
     let userMessage;
     switch(candidate.finishReason) {
        case 'NO_IMAGE':
        case 'SAFETY':
            userMessage = "AI không thể tạo hình ảnh cho yêu cầu này do chính sách an toàn. Vui lòng điều chỉnh mô tả của bạn và thử lại.";
            break;
        case 'RECITATION':
            userMessage = "Yêu cầu của bạn có thể chứa nội dung có bản quyền. Vui lòng điều chỉnh mô tả và thử lại.";
            break;
        case 'OTHER':
            userMessage = "Đã xảy ra lỗi không xác định trong quá trình tạo ảnh. Vui lòng thử lại sau.";
            break;
        default:
            userMessage = `Quá trình tạo ảnh đã bị dừng vì lý do: ${candidate.finishReason}. Vui lòng thử một prompt khác.`;
            break;
     }
     throw new Error(userMessage);
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

const handleApiError = (error: any, context: string): never => {
    console.error(`Lỗi khi ${context}:`, error);
    if (error.message && (error.message.includes('[429]') || error.message.includes('RESOURCE_EXHAUSTED'))) {
        throw new Error("Hệ thống đang bị quá tải hoặc bạn đã hết hạn ngạch sử dụng. Vui lòng thử lại sau ít phút.");
    }
    if (error?.message) {
      throw new Error(error.message);
    }
    throw new Error(`Không thể ${context} do lỗi không xác định. Vui lòng thử lại.`);
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
    handleApiError(error, 'tạo hình ảnh từ prompt');
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
    handleApiError(error, 'tạo bối cảnh với nhân vật');
  }
};
