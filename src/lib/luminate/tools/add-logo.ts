import { Overlay } from "../types";
import { ToolDefinition } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const addImage: ToolDefinition = {
  name: "add_image",
  description:
    "Place the user's attached image file on the photo at a specific position and size. Position and size are in percentages of the image dimensions (0-100). Can be called multiple times to place the image at different positions.",
  parameters: {
    x: {
      type: "number",
      description:
        "X position of the image's top-left corner as a percentage of image width (0 = left edge, 100 = right edge)",
      minimum: 0,
      maximum: 100,
      required: true,
    },
    y: {
      type: "number",
      description:
        "Y position of the image's top-left corner as a percentage of image height (0 = top edge, 100 = bottom edge)",
      minimum: 0,
      maximum: 100,
      required: true,
    },
    width: {
      type: "number",
      description: "Width of the placed image as a percentage of the photo width",
      minimum: 0.5,
      maximum: 100,
      required: true,
    },
    height: {
      type: "number",
      description: "Height of the placed image as a percentage of the photo height",
      minimum: 0.5,
      maximum: 100,
      required: true,
    },
    opacity: {
      type: "number",
      description: "Opacity from 0 (transparent) to 1 (fully opaque)",
      minimum: 0,
      maximum: 1,
      required: true,
    },
  },
  execute: async (ctx, args) => {
    if (!ctx.logoImageBase64 || !ctx.logoMimeType) {
      return {
        success: false,
        description:
          "No image file attached. The user must attach an image file in the chat before this tool can be used.",
      };
    }

    const overlay: Overlay = {
      id: crypto.randomUUID(),
      type: "image",
      xPercent: clamp(args.x as number, 0, 100),
      yPercent: clamp(args.y as number, 0, 100),
      widthPercent: clamp(args.width as number, 0.5, 100),
      heightPercent: clamp(args.height as number, 0.5, 100),
      color: "",
      opacity: clamp(args.opacity as number, 0, 1),
      imageBase64: ctx.logoImageBase64,
      imageMimeType: ctx.logoMimeType,
    };

    return {
      success: true,
      overlayAdd: overlay,
      description: `Placed image at (${overlay.xPercent.toFixed(1)}%, ${overlay.yPercent.toFixed(1)}%) size ${overlay.widthPercent.toFixed(1)}%x${overlay.heightPercent.toFixed(1)}% opacity ${Math.round(overlay.opacity * 100)}%`,
    };
  },
};
