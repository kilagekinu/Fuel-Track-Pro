
import { GoogleGenAI, Type } from "@google/genai";

// Initialize with required named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getReconciliationInsights = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this fuel reconciliation data and provide a brief executive summary regarding stock losses, variance trends, and potential meter inaccuracies: ${JSON.stringify(data)}`,
    });
    // Use .text property directly
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insights at this time.";
  }
};
