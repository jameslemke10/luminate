import { runAgentLoop } from "@/lib/luminate/agent/loop";
import { AgentRequest } from "@/lib/luminate/agent/types";
import {
  acquireAgentSession,
  checkRateLimit,
  releaseAgentSession,
} from "@/lib/luminate/server/rate-limit";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const concurrencyLimited = acquireAgentSession(request);
  if (concurrencyLimited) return concurrencyLimited;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    releaseAgentSession(request);
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: AgentRequest;
  try {
    body = await request.json();
  } catch {
    releaseAgentSession(request);
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!body.imageBase64 || !body.mimeType) {
    releaseAgentSession(request);
    return new Response(
      JSON.stringify({ error: "imageBase64 and mimeType are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runAgentLoop(body, apiKey)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: message })}\n\n`)
        );
      } finally {
        releaseAgentSession(request);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
