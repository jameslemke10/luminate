import { ToolDefinition } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

const POSITION_COORDS: Record<string, { xPercent: number; yPercent: number }> = {
  "top-left": { xPercent: 3, yPercent: 3 },
  "top-right": { xPercent: 85, yPercent: 3 },
  "bottom-left": { xPercent: 3, yPercent: 90 },
  "bottom-right": { xPercent: 85, yPercent: 90 },
  "center": { xPercent: 42, yPercent: 42 },
};

export const addLogo: ToolDefinition = {
  name: "add_logo",
  description: "Place the user's pre-uploaded logo on the image at a specified position. The logo must be uploaded by the user before calling this tool.",
  parameters: {
    position: {
      type: "string",
      description: "Where to place the logo on the image",
      enum: ["top-left", "top-right", "bottom-left", "bottom-right", "center"],
      required: true,
    },
    scale: {
      type: "number",
      description: "Logo size as a fraction of image width (0.03 = tiny, 0.15 = medium, 0.5 = large)",
      minimum: 0.03,
      maximum: 0.5,
      required: true,
    },
    opacity: {
      type: "number",
      description: "Logo opacity from 0 (invisible) to 1 (fully opaque). Use 0.8-1.0 for a professional look.",
      minimum: 0,
      maximum: 1,
      required: true,
    },
  },
  execute: async (ctx, args) => {
    if (!ctx.logoImageBase64 || !ctx.logoMimeType) {
      return { success: false, description: "No logo image uploaded. Please upload a logo first." };
    }

    const position = (args.position as string) || "top-left";
    const scale = clamp(args.scale as number, 0.03, 0.5);
    const opacity = clamp(args.opacity as number, 0, 1);
    const coords = POSITION_COORDS[position] ?? POSITION_COORDS["top-left"];

    return {
      success: true,
      logoPlacement: {
        imageBase64: ctx.logoImageBase64,
        mimeType: ctx.logoMimeType,
        position: position as "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center",
        xPercent: coords.xPercent,
        yPercent: coords.yPercent,
        scale,
        opacity,
      },
      description: `Placed logo at ${position} with ${Math.round(scale * 100)}% size and ${Math.round(opacity * 100)}% opacity`,
    };
  },
};
