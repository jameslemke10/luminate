import { EditParams, LogoPlacement } from "../types";

export interface ToolParam {
  type: "number" | "string" | "boolean";
  description: string;
  minimum?: number;
  maximum?: number;
  enum?: string[];
  required?: boolean;
}

export interface ToolContext {
  imageBase64: string;
  mimeType: string;
  currentParams: EditParams;
  logoImageBase64?: string;
  logoMimeType?: string;
}

export interface ToolResult {
  success: boolean;
  paramUpdates?: Partial<EditParams>;
  logoPlacement?: LogoPlacement;
  description: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParam>;
  execute: (ctx: ToolContext, args: Record<string, unknown>) => Promise<ToolResult>;
}
