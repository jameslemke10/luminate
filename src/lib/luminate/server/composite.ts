import sharp from "sharp";
import { Overlay } from "../types";

export async function compositeCurrentState(
  imageBase64: string,
  mimeType: string,
  overlays: Overlay[]
): Promise<string> {
  const imageBuffer = Buffer.from(imageBase64, "base64");
  let pipeline = sharp(imageBuffer);

  if (overlays.length === 0) {
    const output = await pipeline.resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    return output.toString("base64");
  }

  const metadata = await sharp(imageBuffer).metadata();
  const imgW = metadata.width ?? 1;
  const imgH = metadata.height ?? 1;

  const compositeInputs: sharp.OverlayOptions[] = [];

  for (const o of overlays) {
    const left = Math.max(0, Math.min(Math.round((o.xPercent / 100) * imgW), imgW - 1));
    const top = Math.max(0, Math.min(Math.round((o.yPercent / 100) * imgH), imgH - 1));
    const w = Math.max(1, Math.round((o.widthPercent / 100) * imgW));
    const h = Math.max(1, Math.round((o.heightPercent / 100) * imgH));

    if (o.type === "rectangle") {
      const alpha = Math.round(o.opacity * 255);
      const hex = o.color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      const svg = `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="rgba(${r},${g},${b},${alpha / 255})"/></svg>`;
      compositeInputs.push({ input: Buffer.from(svg), top, left });
    }

    if (o.type === "image" && o.imageBase64) {
      const imgBuf = Buffer.from(o.imageBase64, "base64");
      let resized = await sharp(imgBuf)
        .resize(w, h, { fit: "fill" })
        .ensureAlpha()
        .png()
        .toBuffer();

      if (o.opacity < 1) {
        const { data, info } = await sharp(resized)
          .raw()
          .toBuffer({ resolveWithObject: true });
        for (let i = 3; i < data.length; i += 4) {
          data[i] = Math.round(data[i] * o.opacity);
        }
        resized = await sharp(data, {
          raw: { width: info.width, height: info.height, channels: 4 },
        }).png().toBuffer();
      }

      compositeInputs.push({ input: resized, top, left });
    }
  }

  const output = await pipeline
    .composite(compositeInputs)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  return output.toString("base64");
}
