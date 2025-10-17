import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";

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
     if (candidate.finishReason === 'NO_IMAGE') {
        throw new Error("AI không thể tạo hình ảnh từ mô tả của bạn. Điều này có thể do bộ lọc an toàn hoặc mô tả không đủ chi tiết. Vui lòng thử một prompt khác, cụ thể hơn.");
    }
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
  const errorMessage = error?.message?.toLowerCase() || '';
  if (errorMessage.includes('resource_exhausted') || errorMessage.includes('quota') || errorMessage.includes('429')) {
    throw new Error("Đã vượt quá hạn ngạch API. Vui lòng kiểm tra gói dịch vụ và thông tin thanh toán của bạn, hoặc thử lại sau.");
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

const MARKETING_EXPERT_PROMPT_BASE = `
Bạn là một chuyên gia marketing và sáng tạo nội dung quảng cáo có 10 năm kinh nghiệm, am hiểu sâu sắc về mô hình AIDA (Attention, Interest, Desire, Action).
Nhiệm vụ của bạn là tạo ra các ý tưởng (prompt) để sinh ra hình ảnh quảng cáo. Các gợi ý phải bằng tiếng Việt, ngắn gọn, giàu hình ảnh, và thể hiện được ít nhất một trong các giai đoạn của AIDA. Tập trung vào việc thể hiện lợi ích, kết quả, và cảm xúc tích cực mà sản phẩm mang lại.
`;

const ALL_PRODUCTS_DETAILS = `
Tập trung vào các sản phẩm và dịch vụ sau đây của một công ty công nghệ Việt Nam:

1.  **Nền tảng giáo dục VnnEdu.com:** Dành cho học sinh, giáo viên.
2.  **Nền tảng quản lý doanh nghiệp (VDUP và iCavat):** Gồm ERP, CRM, HRM, Quản lý dự án. Hướng đến các CEO, quản lý, trưởng nhóm.
3.  **Nền tảng quản lý nhà hàng (Cup69.com):** Dành cho chủ nhà hàng, quán ăn, quán cafe.
4.  **Các dịch vụ tại nhà:** Giúp việc, Chăm sóc người già/người bệnh, Vệ sinh máy lạnh. Hướng đến các gia đình, người bận rộn.

Hãy tạo ra 3-4 gợi ý cho mỗi danh mục sản phẩm/dịch vụ trên.
`;

const getSingleProductDetails = (product: string) => `
Tập trung vào sản phẩm/dịch vụ cụ thể sau: **"${product}"**. Hãy tạo ra 4-5 gợi ý chỉ cho sản phẩm/dịch vụ này.`;


export const getSuggestions = async (apiKey: string, contextPrompt: string, selectedProduct?: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    let marketingPrompt;
    if (selectedProduct && selectedProduct !== 'Tất cả sản phẩm/dịch vụ') {
        marketingPrompt = MARKETING_EXPERT_PROMPT_BASE + getSingleProductDetails(selectedProduct);
    } else {
        marketingPrompt = MARKETING_EXPERT_PROMPT_BASE + ALL_PRODUCTS_DETAILS;
    }

    const fullPrompt = marketingPrompt + '\n' + contextPrompt;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                }
              }
            }
          }
        },
      },
    });

    if (!response.text) {
        throw new Error("AI không trả về gợi ý. Vui lòng thử lại.");
    }
    
    const jsonResponse = JSON.parse(response.text);

    if (!jsonResponse.categories || !Array.isArray(jsonResponse.categories)) {
      throw new Error("Phản hồi gợi ý có cấu trúc không hợp lệ.");
    }

    return jsonResponse.categories;

  } catch (error: any) {
    console.error("Lỗi khi lấy gợi ý:", error);
    if (error?.message?.includes('API key not valid')) {
      throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại.");
    }
    throw new Error("Không thể lấy gợi ý từ AI. Vui lòng thử lại sau.");
  }
};