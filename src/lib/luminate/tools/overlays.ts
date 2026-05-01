import { Overlay } from "../types";
import { ToolDefinition } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const addRectangle: ToolDefinition = {
  name: "add_rectangle",
  description:
    "Add a colored rectangle overlay on the image. Use this to cover up areas, add color blocks, or create masking regions. Position and size are in percentages of the image dimensions (0-100).",
  parameters: {
    x: {
      type: "number",
      description: "X position of the rectangle's top-left corner as a percentage of image width (0 = left edge, 100 = right edge)",
      minimum: 0,
      maximum: 100,
      required: true,
    },
    y: {
      type: "number",
      description: "Y position of the rectangle's top-left corner as a percentage of image height (0 = top edge, 100 = bottom edge)",
      minimum: 0,
      maximum: 100,
      required: true,
    },
    width: {
      type: "number",
      description: "Width of the rectangle as a percentage of image width",
      minimum: 0.5,
      maximum: 100,
      required: true,
    },
    height: {
      type: "number",
      description: "Height of the rectangle as a percentage of image height",
      minimum: 0.5,
      maximum: 100,
      required: true,
    },
    color: {
      type: "string",
      description: 'Hex color of the rectangle, e.g. "#ffffff" for white, "#000000" for black',
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
  execute: async (_ctx, args) => {
    const overlay: Overlay = {
      id: crypto.randomUUID(),
      type: "rectangle",
      xPercent: clamp(args.x as number, 0, 100),
      yPercent: clamp(args.y as number, 0, 100),
      widthPercent: clamp(args.width as number, 0.5, 100),
      heightPercent: clamp(args.height as number, 0.5, 100),
      color: (args.color as string) || "#ffffff",
      opacity: clamp(args.opacity as number, 0, 1),
    };

    return {
      success: true,
      overlayAdd: overlay,
      description: `Added ${overlay.color} rectangle at (${overlay.xPercent.toFixed(1)}%, ${overlay.yPercent.toFixed(1)}%) size ${overlay.widthPercent.toFixed(1)}%x${overlay.heightPercent.toFixed(1)}% opacity ${Math.round(overlay.opacity * 100)}%`,
    };
  },
};

export const removeOverlay: ToolDefinition = {
  name: "remove_overlay",
  description:
    "Remove an overlay by its ID. Use list_overlays or check the current overlay state to find the ID of the overlay you want to remove.",
  parameters: {
    id: {
      type: "string",
      description: "The ID of the overlay to remove",
      required: true,
    },
  },
  execute: async (ctx, args) => {
    const id = args.id as string;
    const exists = ctx.overlays.some((o) => o.id === id);
    if (!exists) {
      return {
        success: false,
        description: `No overlay found with ID "${id}". Current overlays: ${ctx.overlays.map((o) => o.id).join(", ") || "none"}`,
      };
    }
    return {
      success: true,
      overlayRemoveId: id,
      description: `Removed overlay ${id}`,
    };
  },
};

export const listOverlays: ToolDefinition = {
  name: "list_overlays",
  description: "List all current overlays on the image with their IDs, positions, and properties.",
  parameters: {},
  execute: async (ctx) => {
    if (ctx.overlays.length === 0) {
      return { success: true, description: "No overlays on the image." };
    }
    const summary = ctx.overlays
      .map(
        (o) =>
          `${o.id}: ${o.type} at (${o.xPercent.toFixed(1)}%, ${o.yPercent.toFixed(1)}%) size ${o.widthPercent.toFixed(1)}%x${o.heightPercent.toFixed(1)}% color=${o.color} opacity=${o.opacity}`
      )
      .join("; ");
    return { success: true, description: summary };
  },
};

export const viewImage: ToolDefinition = {
  name: "view_image",
  description:
    "Returns the current image WITH all overlays composited onto it. Use this to visually verify that rectangles and edits are in the correct position. The returned image shows exactly what the user sees. Always call this alongside your edits in the same batch.",
  parameters: {},
  execute: async (ctx) => {
    const parts: string[] = [];
    if (ctx.overlays.length > 0) {
      parts.push(
        `Overlays rendered on image: ${ctx.overlays.map((o) => `${o.id} at (${o.xPercent.toFixed(1)}%, ${o.yPercent.toFixed(1)}%) size ${o.widthPercent.toFixed(1)}%x${o.heightPercent.toFixed(1)}%`).join("; ")}`
      );
    } else {
      parts.push("No overlays. Showing original image.");
    }
    return {
      success: true,
      includeImage: true,
      description: parts.join("\n"),
    };
  },
};
