import { GoogleGenAI } from "@google/genai";
import { AIEditResponse, EditParams } from "../types";

const SYSTEM_PROMPT = `You are an AI photo editing assistant for product photography.
You analyze photos and return structured edit parameters as JSON.

IMPORTANT: You do NOT generate or modify images. You analyze the photo and suggest
deterministic edit parameters that will be applied programmatically.

Available parameters:
- brightness: -100 to 100 (0 = no change)
- contrast: -100 to 100 (0 = no change)
- saturation: -100 to 100 (0 = no change)
- sharpness: 0 to 100 (0 = no change)
- warmth: -100 to 100 (negative = cooler/bluer, positive = warmer/yellower)
- rotation: degrees (0 = no rotation, use small values like -2 to 2 for straightening)
- flipX: true/false
- flipY: true/false

Respond ONLY with valid JSON in this exact format:
{
  "params": { ... edit parameters ... },
  "explanation": "Brief explanation of what changes you're suggesting and why"
}

When analyzing watch/product photos, prioritize:
- Accurate color representation
- Clean, bright appearance
- Proper exposure and contrast
- Sharp details`;

const TEMPLATE_MATCH_PROMPT = `You are an AI photo editing assistant. You are given TWO images:
1. A REFERENCE/TEMPLATE image that represents the desired style
2. A TARGET image that needs to be edited to match the reference style

Analyze the visual characteristics of the reference image (brightness, contrast, saturation, warmth, sharpness) and determine what edit parameters should be applied to the TARGET image to make it look similar in style.

Available parameters:
- brightness: -100 to 100 (0 = no change)
- contrast: -100 to 100 (0 = no change)
- saturation: -100 to 100 (0 = no change)
- sharpness: 0 to 100 (0 = no change)
- warmth: -100 to 100 (negative = cooler/bluer, positive = warmer/yellower)
- rotation: degrees (0 = no rotation)
- flipX: true/false
- flipY: true/false

Focus on matching the STYLE, not the content. Match the lighting feel, color grading, contrast levels, warmth, and overall mood.

Respond ONLY with valid JSON:
{
  "params": { ... edit parameters to apply to the TARGET ... },
  "explanation": "Brief explanation of style differences you detected and how the edits will bridge them"
}`;

export async function analyzeAndSuggestEdits(
  imageBase64: string,
  mimeType: string,
  instruction: string,
  apiKey: string
): Promise<AIEditResponse> {
  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = instruction
    ? `The user wants: "${instruction}". Analyze this photo and return the edit parameters to achieve their request.`
    : `Analyze this product photo and suggest optimal edit parameters to make it look professional and listing-ready.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT + "\n\n" + userPrompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
  });

  const text = response.text ?? "";
  return parseAIResponse(text);
}

export async function matchTemplateStyle(
  targetBase64: string,
  targetMimeType: string,
  referenceBase64: string,
  referenceMimeType: string,
  apiKey: string
): Promise<AIEditResponse> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              TEMPLATE_MATCH_PROMPT +
              "\n\nThe first image is the REFERENCE (the style to match). The second image is the TARGET (to be edited).",
          },
          {
            inlineData: {
              mimeType: referenceMimeType,
              data: referenceBase64,
            },
          },
          {
            inlineData: {
              mimeType: targetMimeType,
              data: targetBase64,
            },
          },
        ],
      },
    ],
  });

  const text = response.text ?? "";
  return parseAIResponse(text);
}

function parseAIResponse(text: string): AIEditResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as AIEditResponse;
  const params = clampParams(parsed.params);

  return {
    params,
    explanation: parsed.explanation || "Edits suggested by AI",
  };
}

function clampParams(params: EditParams): EditParams {
  const clamp = (val: number | undefined, min: number, max: number) =>
    val !== undefined ? Math.max(min, Math.min(max, val)) : undefined;

  return {
    brightness: clamp(params.brightness, -100, 100),
    contrast: clamp(params.contrast, -100, 100),
    saturation: clamp(params.saturation, -100, 100),
    sharpness: clamp(params.sharpness, 0, 100),
    warmth: clamp(params.warmth, -100, 100),
    rotation: params.rotation,
    flipX: params.flipX,
    flipY: params.flipY,
    crop: params.crop,
  };
}
