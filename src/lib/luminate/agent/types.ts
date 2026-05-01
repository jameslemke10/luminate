import { EditParams, Overlay } from "../types";

export interface AgentRequest {
  imageBase64: string;
  mimeType: string;
  instruction: string;
  currentParams: EditParams;
  model?: string;
  logoImageBase64?: string;
  logoMimeType?: string;
  maxIterations?: number;
}

export interface ToolCallResult {
  toolName: string;
  toolArgs: Record<string, unknown>;
  description: string;
  success: boolean;
}

export type AgentEventType =
  | "thinking"
  | "tool_batch"
  | "params_update"
  | "overlays_update"
  | "complete"
  | "error";

export interface AgentEvent {
  type: AgentEventType;
  reasoning?: string;
  tools?: ToolCallResult[];
  currentParams?: EditParams;
  overlays?: Overlay[];
  explanation?: string;
  error?: string;
}
