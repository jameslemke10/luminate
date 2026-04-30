import { AgentEvent, AgentRequest } from "./types";
import { runGeminiAgent } from "./gemini-agent";

export async function* runAgentLoop(
  request: AgentRequest,
  apiKey: string
): AsyncGenerator<AgentEvent> {
  try {
    yield* runGeminiAgent(request, apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    yield { type: "error", error: message };
  }
}
