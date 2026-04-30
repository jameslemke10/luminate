import { ToolDefinition } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const rotate: ToolDefinition = {
  name: "rotate",
  description: "Rotate the image by a specified number of degrees. Use small values like -3 to 3 to straighten a tilted image. Use 90/-90 for quarter turns.",
  parameters: {
    degrees: { type: "number", description: "Rotation angle in degrees. Negative = counterclockwise, positive = clockwise.", minimum: -180, maximum: 180, required: true },
  },
  execute: async (_ctx, args) => {
    const degrees = clamp(args.degrees as number, -180, 180);
    return { success: true, paramUpdates: { rotation: degrees }, description: `Rotated image ${degrees}°` };
  },
};

export const crop: ToolDefinition = {
  name: "crop",
  description: "Crop the image to a rectangular region. Coordinates are percentages of the image dimensions (0-100). Use this to center a subject by cropping with equal padding around it.",
  parameters: {
    x: { type: "number", description: "Left edge as percentage of image width (0-100)", minimum: 0, maximum: 100, required: true },
    y: { type: "number", description: "Top edge as percentage of image height (0-100)", minimum: 0, maximum: 100, required: true },
    width: { type: "number", description: "Width of crop area as percentage of image width (1-100)", minimum: 1, maximum: 100, required: true },
    height: { type: "number", description: "Height of crop area as percentage of image height (1-100)", minimum: 1, maximum: 100, required: true },
  },
  execute: async (_ctx, args) => {
    const x = clamp(args.x as number, 0, 100);
    const y = clamp(args.y as number, 0, 100);
    const width = clamp(args.width as number, 1, 100 - x);
    const height = clamp(args.height as number, 1, 100 - y);
    return {
      success: true,
      paramUpdates: { crop: { x, y, width, height } },
      description: `Cropped to region (${x}%, ${y}%) with size ${width}%×${height}%`,
    };
  },
};

export const flip: ToolDefinition = {
  name: "flip",
  description: "Flip the image horizontally or vertically.",
  parameters: {
    direction: { type: "string", description: "Flip direction", enum: ["horizontal", "vertical"], required: true },
  },
  execute: async (ctx, args) => {
    const direction = args.direction as string;
    if (direction === "horizontal") {
      return { success: true, paramUpdates: { flipX: !ctx.currentParams.flipX }, description: "Flipped image horizontally" };
    }
    return { success: true, paramUpdates: { flipY: !ctx.currentParams.flipY }, description: "Flipped image vertically" };
  },
};
