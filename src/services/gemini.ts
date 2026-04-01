import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export async function callGeminiAPI(
  contents: any,
  systemInstruction: string | null = null,
  responseMimeType: string = "text/plain"
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // If API key is missing, it might be because the user needs to select one in the shared app
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: systemInstruction || undefined,
      responseMimeType,
    },
  });

  return response.text || "";
}
