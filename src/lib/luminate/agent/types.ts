import { EditParams, LogoPlacement } from "../types";

export interface AgentRequest {
  imageBase64: string;
  mimeType: string;
  instruction: string;
  currentParams: EditParams;
  logoImageBase64?: string;
  logoMimeType?: string;
  maxIterations?: number; // default 3
}

export type AgentEventType =
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "params_update"
  | "logo_update"
  | "complete"
  | "error";

export interface AgentEvent {
  type: AgentEventType;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  description?: string;
  reasoning?: string;
  currentParams?: EditParams;
  logoPlacement?: LogoPlacement;
  explanation?: string;
  error?: string;
}
