import { ToolDefinition } from "./types";
import { createToolRegistry, toGeminiFunctionDeclarations } from "./registry";
import { adjustBrightness, adjustContrast, adjustSaturation, adjustSharpness, adjustWarmth } from "./adjust";
import { adjustExposure, adjustHighlights, adjustShadows } from "./tone";
import { rotate, crop, flip } from "./transform";
import { addLogo } from "./add-logo";

export type { ToolDefinition, ToolParam, ToolContext, ToolResult } from "./types";
export { createToolRegistry, toGeminiFunctionDeclarations } from "./registry";

const ALL_TOOLS: ToolDefinition[] = [
  adjustBrightness,
  adjustContrast,
  adjustSaturation,
  adjustSharpness,
  adjustWarmth,
  adjustExposure,
  adjustHighlights,
  adjustShadows,
  rotate,
  crop,
  flip,
  addLogo,
];

export function getDefaultToolRegistry() {
  return createToolRegistry(ALL_TOOLS);
}

export function getDefaultFunctionDeclarations() {
  return toGeminiFunctionDeclarations(getDefaultToolRegistry());
}
