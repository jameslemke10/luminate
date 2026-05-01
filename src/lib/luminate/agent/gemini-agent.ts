import { GoogleGenAI, Content, FunctionCallingConfigMode, Part } from "@google/genai";
import { getDefaultToolRegistry, getDefaultFunctionDeclarations } from "../tools";
import { ToolContext } from "../tools/types";
import { EditParams, Overlay } from "../types";
import { AgentEvent, AgentRequest, ToolCallResult } from "./types";
import { compositeCurrentState } from "../server/composite";

const DEFAULT_MODEL = "gemini-2.5-pro";

const AGENT_SYSTEM_PROMPT = `You are an expert photo editor with computer vision capabilities. You can see the image the user has uploaded.

GUIDELINES:
- Be subtle — adjustments in the +5 to +25 range usually look more professional.
- Use exposure for overall brightness (more natural than brightness).
- Rotation: be conservative, small values only (-2 to 2 degrees).

SPATIAL PLACEMENT:
- All positions/sizes are PERCENTAGES of image dimensions (0=left/top, 100=right/bottom).
- Before placing, study the image carefully and reason about coordinates step by step.

WORKFLOW — ALWAYS follow this pattern:
1. Make ALL your edits in a SINGLE tool call batch. Call add_rectangle, adjustments, etc. together.
   Also include view_image in the SAME batch to see the result immediately.
2. When view_image returns, look at the composited image carefully.
   - If an overlay is misplaced: call remove_overlay AND add_rectangle with corrected coordinates AND view_image again, ALL in one batch.
   - If everything looks correct: respond with a short summary. You are done.
3. NEVER add a duplicate overlay. If correcting placement, ALWAYS remove the old one first.
4. NEVER call just one tool per turn. Batch all related operations together.`;

export async function* runGeminiAgent(
  request: AgentRequest,
  apiKey: string
): AsyncGenerator<AgentEvent> {
  const ai = new GoogleGenAI({ apiKey });
  const registry = getDefaultToolRegistry();
  const functionDeclarations = getDefaultFunctionDeclarations();

  let currentParams: EditParams = { ...request.currentParams };
  let currentOverlays: Overlay[] = [];
  const maxIterations = request.maxIterations ?? 10;

  yield { type: "thinking", reasoning: "Analyzing the image and planning edits..." };

  const contents: Content[] = [
    {
      role: "user",
      parts: [
        { text: `${AGENT_SYSTEM_PROMPT}\n\nUser instruction: "${request.instruction}"\n\nCurrent edit state: ${JSON.stringify(currentParams)}\nCurrent overlays: ${JSON.stringify(currentOverlays)}\n\nAnalyze the image and use tools to fulfill the request.` },
        {
          inlineData: {
            mimeType: request.mimeType,
            data: request.imageBase64,
          },
        },
      ],
    },
  ];

  if (request.logoImageBase64) {
    (contents[0].parts as Part[]).push({
      text: "\n\nThe user has attached an image file. You can place it anywhere on the photo using the add_image tool — specify x, y, width, and height as percentages. You can call add_image multiple times to place the image at different positions.",
    });
  }

  const model = request.model || DEFAULT_MODEL;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const response = await ai.models.generateContent({
      model,
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

    if (!functionCalls || functionCalls.length === 0) {
      const explanation = response.text ?? "Edits complete.";
      yield { type: "complete", explanation };
      return;
    }

    // Show thinking while we execute all tools in this iteration
    if (iterations > 1) {
      yield { type: "thinking", reasoning: "Reviewing results and refining..." };
    }

    const batchResults: ToolCallResult[] = [];
    const functionResponseParts: Part[] = [];
    let shouldIncludeImage = false;

    for (const call of functionCalls) {
      const toolName = call.name ?? "unknown";
      const toolArgs = (call.args ?? {}) as Record<string, unknown>;

      const tool = registry.get(toolName);
      if (!tool) {
        batchResults.push({ toolName, toolArgs, description: `Unknown tool: ${toolName}`, success: false });
        functionResponseParts.push({
          functionResponse: { name: toolName, response: { output: { success: false, description: `Unknown tool: ${toolName}` } } },
        });
        continue;
      }

      const ctx: ToolContext = {
        imageBase64: request.imageBase64,
        mimeType: request.mimeType,
        currentParams,
        logoImageBase64: request.logoImageBase64,
        logoMimeType: request.logoMimeType,
        overlays: currentOverlays,
      };

      const result = await tool.execute(ctx, toolArgs);

      batchResults.push({ toolName, toolArgs, description: result.description, success: result.success });

      if (result.paramUpdates) {
        currentParams = { ...currentParams, ...result.paramUpdates };
      }

      if (result.overlayAdd) {
        currentOverlays = [...currentOverlays, result.overlayAdd];
      }

      if (result.overlayRemoveId) {
        currentOverlays = currentOverlays.filter((o) => o.id !== result.overlayRemoveId);
      }

      if (result.includeImage) {
        shouldIncludeImage = true;
      }

      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          response: { output: { success: result.success, description: result.description } },
        },
      });
    }

    yield { type: "tool_batch", tools: batchResults };
    yield { type: "params_update", currentParams: { ...currentParams } };
    yield { type: "overlays_update", overlays: [...currentOverlays] };

    if (shouldIncludeImage) {
      const composited = await compositeCurrentState(
        request.imageBase64,
        request.mimeType,
        currentOverlays
      );
      functionResponseParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: composited,
        },
      });
    }

    contents.push({
      role: "model",
      parts: functionCalls.map((call) => ({
        functionCall: { name: call.name ?? "", args: call.args },
      })),
    });

    contents.push({
      role: "user",
      parts: functionResponseParts,
    });
  }

  yield {
    type: "complete",
    explanation: "Reached maximum number of editing rounds. The edits applied so far are your result.",
  };
}
