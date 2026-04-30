import { ToolDefinition } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const adjustBrightness: ToolDefinition = {
  name: "adjust_brightness",
  description: "Adjust the overall brightness of the image. Positive values brighten, negative values darken.",
  parameters: {
    value: { type: "number", description: "Brightness value from -100 (darker) to 100 (brighter)", minimum: -100, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const value = clamp(args.value as number, -100, 100);
    return { success: true, paramUpdates: { brightness: value }, description: `Set brightness to ${value}` };
  },
};

export const adjustContrast: ToolDefinition = {
  name: "adjust_contrast",
  description: "Adjust the contrast of the image. Positive values increase contrast, negative values decrease it.",
  parameters: {
    value: { type: "number", description: "Contrast value from -100 (less contrast) to 100 (more contrast)", minimum: -100, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const value = clamp(args.value as number, -100, 100);
    return { success: true, paramUpdates: { contrast: value }, description: `Set contrast to ${value}` };
  },
};

export const adjustSaturation: ToolDefinition = {
  name: "adjust_saturation",
  description: "Adjust color saturation. Positive values make colors more vivid, negative values desaturate toward grayscale.",
  parameters: {
    value: { type: "number", description: "Saturation value from -100 (grayscale) to 100 (vivid)", minimum: -100, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const value = clamp(args.value as number, -100, 100);
    return { success: true, paramUpdates: { saturation: value }, description: `Set saturation to ${value}` };
  },
};

export const adjustSharpness: ToolDefinition = {
  name: "adjust_sharpness",
  description: "Adjust the sharpness of the image. Higher values enhance edges and fine details.",
  parameters: {
    value: { type: "number", description: "Sharpness value from 0 (no sharpening) to 100 (maximum)", minimum: 0, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const value = clamp(args.value as number, 0, 100);
    return { success: true, paramUpdates: { sharpness: value }, description: `Set sharpness to ${value}` };
  },
};

export const adjustWarmth: ToolDefinition = {
  name: "adjust_warmth",
  description: "Adjust color temperature. Positive values add warmth (yellow/orange tint), negative values add coolness (blue tint).",
  parameters: {
    value: { type: "number", description: "Warmth value from -100 (cooler/bluer) to 100 (warmer/yellower)", minimum: -100, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const value = clamp(args.value as number, -100, 100);
    return { success: true, paramUpdates: { warmth: value }, description: `Set warmth to ${value}` };
  },
};
