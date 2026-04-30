import { ToolDefinition } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const adjustExposure: ToolDefinition = {
  name: "adjust_exposure",
  description: "Adjust exposure using a gamma curve. Unlike brightness (which shifts all pixels equally), exposure adjusts the midtones more naturally, similar to changing camera exposure. Positive values brighten, negative darken.",
  parameters: {
    value: { type: "number", description: "Exposure value from -100 (underexpose) to 100 (overexpose)", minimum: -100, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const value = clamp(args.value as number, -100, 100);
    return { success: true, paramUpdates: { exposure: value }, description: `Set exposure to ${value}` };
  },
};

export const adjustHighlights: ToolDefinition = {
  name: "adjust_highlights",
  description: "Adjust the bright areas (highlights) of the image. Positive values brighten highlights, negative values recover/darken blown-out highlights.",
  parameters: {
    value: { type: "number", description: "Highlights value from -100 (recover highlights) to 100 (brighten highlights)", minimum: -100, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const value = clamp(args.value as number, -100, 100);
    return { success: true, paramUpdates: { highlights: value }, description: `Set highlights to ${value}` };
  },
};

export const adjustShadows: ToolDefinition = {
  name: "adjust_shadows",
  description: "Adjust the dark areas (shadows) of the image. Positive values lift/brighten shadows to reveal detail, negative values deepen shadows.",
  parameters: {
    value: { type: "number", description: "Shadows value from -100 (deepen shadows) to 100 (lift shadows)", minimum: -100, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const value = clamp(args.value as number, -100, 100);
    return { success: true, paramUpdates: { shadows: value }, description: `Set shadows to ${value}` };
  },
};
