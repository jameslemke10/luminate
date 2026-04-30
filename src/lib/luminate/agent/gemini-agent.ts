import { GoogleGenAI, Content, FunctionCallingConfigMode, Part } from "@google/genai";
import { getDefaultToolRegistry, getDefaultFunctionDeclarations } from "../tools";
import { ToolContext } from "../tools/types";
import { EditParams } from "../types";
import { AgentEvent, AgentRequest } from "./types";

const AGENT_SYSTEM_PROMPT = `You are an expert photo editor with computer vision capabilities. You can see the image the user has uploaded.

Your job is to analyze the image visually and use the available tools to edit it according to the user's instructions.

CRITICAL: Call ALL the tools you need in a SINGLE response. Do NOT spread tool calls across multiple turns. Plan everything upfront and execute it all at once.

GUIDELINES:
- You can SEE the image. Use your vision to detect issues like tilt, off-center subjects, exposure problems, color casts, etc.
- ROTATION: Be very conservative. Only rotate if the image is clearly tilted. Most product photos are already level. If you do rotate, use very small values (typically -2 to 2 degrees). If unsure, do NOT rotate.
- CROPPING: To center a subject, estimate where it is in the frame as a percentage. If the subject takes up ~60% of the frame and is roughly centered, leave it alone. Only crop if the subject is clearly off-center.
- For professional product photography: aim for clean whites, good contrast, sharp details, and neutral color temperature.
- Use exposure for overall brightness (more natural than brightness), shadows to lift dark areas, highlights to recover blown areas.
- Be subtle — adjustments in the +5 to +25 range usually look more professional than dramatic ones.
- If the user asks you to add a logo, ALWAYS include the add_logo tool call along with your other edits.
- Call all tools you need in ONE response, then provide a text summary of what you did.`;

export async function* runGeminiAgent(
  request: AgentRequest,
  apiKey: string
): AsyncGenerator<AgentEvent> {
  const ai = new GoogleGenAI({ apiKey });
  const registry = getDefaultToolRegistry();
  const functionDeclarations = getDefaultFunctionDeclarations();

  let currentParams: EditParams = { ...request.currentParams };
  const maxIterations = request.maxIterations ?? 5;

  yield { type: "thinking", reasoning: "Analyzing the image and planning edits..." };

  // Build initial contents with the image and instruction
  const contents: Content[] = [
    {
      role: "user",
      parts: [
        { text: `${AGENT_SYSTEM_PROMPT}\n\nUser instruction: "${request.instruction}"\n\nCurrent edit state: ${JSON.stringify(currentParams)}\n\nAnalyze the image and use tools to fulfill the request.` },
        {
          inlineData: {
            mimeType: request.mimeType,
            data: request.imageBase64,
          },
        },
      ],
    },
  ];

  // If there's a logo, mention it in the context
  if (request.logoImageBase64) {
    (contents[0].parts as Part[]).push({
      text: "\n\nThe user has uploaded a logo image that can be placed using the add_logo tool.",
    });
  }

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        tools: [{ functionDeclarations }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });

    const functionCalls = response.functionCalls;

    // If no function calls, the model is done — extract final text
    if (!functionCalls || functionCalls.length === 0) {
      const explanation = response.text ?? "Edits complete.";
      yield { type: "complete", explanation };
      return;
    }

    // Process each function call
    const functionResponseParts: Part[] = [];

    for (const call of functionCalls) {
      const toolName = call.name ?? "unknown";
      const toolArgs = (call.args ?? {}) as Record<string, unknown>;

      yield {
        type: "tool_call",
        toolName,
        toolArgs,
        reasoning: `Calling ${toolName}`,
      };

      const tool = registry.get(toolName);
      if (!tool) {
        const errorResult = { success: false, description: `Unknown tool: ${toolName}` };
        yield { type: "tool_result", toolName, description: errorResult.description };
        functionResponseParts.push({
          functionResponse: { name: toolName, response: { output: errorResult } },
        });
        continue;
      }

      // Build tool context
      const ctx: ToolContext = {
        imageBase64: request.imageBase64,
        mimeType: request.mimeType,
        currentParams,
        logoImageBase64: request.logoImageBase64,
        logoMimeType: request.logoMimeType,
      };

      const result = await tool.execute(ctx, toolArgs);

      yield { type: "tool_result", toolName, description: result.description };

      // Apply param updates
      if (result.paramUpdates) {
        currentParams = { ...currentParams, ...result.paramUpdates };
        yield { type: "params_update", currentParams: { ...currentParams } };
      }

      // Apply logo placement
      if (result.logoPlacement) {
        yield { type: "logo_update", logoPlacement: result.logoPlacement };
      }

      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          response: { output: { success: result.success, description: result.description } },
        },
      });
    }

    // Add model's function calls to conversation history
    contents.push({
      role: "model",
      parts: functionCalls.map((call) => ({
        functionCall: { name: call.name ?? "", args: call.args },
      })),
    });

    // Add function responses
    contents.push({
      role: "user",
      parts: functionResponseParts,
    });
  }

  // Max iterations reached
  yield {
    type: "complete",
    explanation: "Reached maximum number of editing rounds. The edits applied so far are your result.",
  };
}
