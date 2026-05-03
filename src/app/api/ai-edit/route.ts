import {
  analyzeAndSuggestEdits,
  matchTemplateStyle,
} from "@/lib/luminate/ai/gemini";
import { checkRateLimit } from "@/lib/luminate/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { imageBase64, mimeType, instruction, referenceBase64, referenceMimeType, model } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "imageBase64 and mimeType are required" },
        { status: 400 }
      );
    }

    // Template matching mode
    if (referenceBase64 && referenceMimeType) {
      const result = await matchTemplateStyle(
        imageBase64,
        mimeType,
        referenceBase64,
        referenceMimeType,
        apiKey,
        model
      );
      return NextResponse.json(result);
    }

    // Standard AI edit mode
    const result = await analyzeAndSuggestEdits(
      imageBase64,
      mimeType,
      instruction || "",
      apiKey,
      model
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI edit error:", error);
    return NextResponse.json(
      { error: "Failed to process AI edit request" },
      { status: 500 }
    );
  }
}
