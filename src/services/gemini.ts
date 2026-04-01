import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export async function callGeminiAPI(
  contents: any,
  systemInstruction: string | null = null,
  responseMimeType: string = "text/plain"
): Promise<string> {
  // Using the API key provided by the user
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyC8c-_IZO9msGpsA0J-j10D8JdFZ9y1zv0";
  
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
      maxOutputTokens: 8192, // Increased limit for long lesson plans
    },
  });

  return response.text || "";
}
