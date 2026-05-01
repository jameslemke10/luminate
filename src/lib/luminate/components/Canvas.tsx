"use client";

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { EditParams, WatermarkOverlay, Overlay } from "../types";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasProps {
  imageSrc: string | null;
  params: EditParams;
  backgroundRemovedSrc?: string | null;
  cropMode?: boolean;
  onCropComplete?: (dataUrl: string) => void;
  onCropCancel?: () => void;
  showOriginal?: boolean;
  watermark?: WatermarkOverlay | null;
  onWatermarkMove?: (xPercent: number, yPercent: number) => void;
  watermarkSelected?: boolean;
  overlays?: Overlay[];
}

export interface CanvasHandle {
  exportImage: () => string | null;
}

type DragMode =
  | "none"
  | "crop-draw"
  | "crop-move"
  | "crop-nw" | "crop-ne" | "crop-sw" | "crop-se"
  | "crop-n" | "crop-s" | "crop-e" | "crop-w"
  | "watermark-drag";

const HANDLE_SIZE = 8;

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  function Canvas(
    {
      imageSrc, params, backgroundRemovedSrc, cropMode, onCropComplete, onCropCancel,
      showOriginal, watermark, onWatermarkMove, watermarkSelected, overlays = [],
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const watermarkImgRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

    const [mode, setMode] = useState<DragMode>("none");
    const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const wmDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const [cropRect, setCropRect] = useState<CropRect | null>(null);
    const cropDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const cropStartRect = useRef<CropRect | null>(null);

    const [zoom, setZoom] = useState(1);

    // Load watermark image
    useEffect(() => {
      if (!watermark?.config.imageUrl) { watermarkImgRef.current = null; return; }
      const img = new Image();
      img.onload = () => { watermarkImgRef.current = img; if (imageRef.current) renderCanvas(imageRef.current, params); };
      img.src = watermark.config.imageUrl;
    }, [watermark?.config.imageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      const src = backgroundRemovedSrc || imageSrc;
      if (!src) return;
      const img = new Image();
      img.onload = () => { imageRef.current = img; renderCanvas(img, params); };
      img.src = src;
    }, [imageSrc, backgroundRemovedSrc]); // eslint-disable-line react-hooks/exhaustive-deps

    // Preload image overlays
    useEffect(() => {
      const imageOverlays = overlays.filter((o) => o.type === "image" && o.imageBase64);
      const currentIds = new Set(imageOverlays.map((o) => o.id));
      for (const id of overlayImagesRef.current.keys()) {
        if (!currentIds.has(id)) overlayImagesRef.current.delete(id);
      }
      for (const o of imageOverlays) {
        if (overlayImagesRef.current.has(o.id)) continue;
        const img = new Image();
        img.onload = () => {
          overlayImagesRef.current.set(o.id, img);
          if (imageRef.current) renderCanvas(imageRef.current, params);
        };
        img.src = `data:${o.imageMimeType};base64,${o.imageBase64}`;
      }
    }, [overlays]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      if (imageRef.current) renderCanvas(imageRef.current, params);
    }, [params, showOriginal, watermark, watermarkSelected, zoom, overlays]); // eslint-disable-line react-hooks/exhaustive-deps

    const getDrawInfo = useCallback((img: HTMLImageElement) => {
      const container = containerRef.current;
      if (!container) return null;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const cAspect = cw / ch;
      let dw: number, dh: number;
      if (imgAspect > cAspect) { dw = cw; dh = cw / imgAspect; }
      else { dh = ch; dw = ch * imgAspect; }
      // Apply zoom
      dw *= zoom;
      dh *= zoom;
      const scale = Math.min(img.naturalWidth / dw, img.naturalHeight / dh, 1);
      return { drawWidth: dw, drawHeight: dh, scale };
    }, [zoom]);

    const drawImageWithParams = useCallback(
      (ctx: CanvasRenderingContext2D, img: HTMLImageElement, p: EditParams,
       cw: number, ch: number, dw: number, dh: number) => {
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(p.flipX ? -1 : 1, p.flipY ? -1 : 1);
        const filters: string[] = [];
        if (p.brightness && p.brightness !== 0) filters.push(`brightness(${1 + p.brightness / 100})`);
        if (p.contrast && p.contrast !== 0) filters.push(`contrast(${1 + p.contrast / 100})`);
        if (p.saturation && p.saturation !== 0) filters.push(`saturate(${1 + p.saturation / 100})`);
        if (p.warmth && p.warmth !== 0) {
          const a = Math.abs(p.warmth) / 100;
          if (p.warmth > 0) filters.push(`sepia(${a * 0.3})`);
          else filters.push(`hue-rotate(${a * 30}deg)`);
        }
        ctx.filter = filters.length > 0 ? filters.join(" ") : "none";
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }, []
    );

    const getWatermarkRect = useCallback(
      (cw: number, ch: number): CropRect | null => {
        if (!watermark) return null;
        const x = (watermark.xPercent / 100) * cw;
        const y = (watermark.yPercent / 100) * ch;
        if (watermark.config.text) {
          const fontSize = Math.max(14, cw * watermark.config.scale * 0.08);
          return { x, y, width: watermark.config.text.length * fontSize * 0.6, height: fontSize * 1.3 };
        }
        if (watermark.config.imageUrl && watermarkImgRef.current) {
          const logo = watermarkImgRef.current;
          const logoW = cw * watermark.config.scale;
          const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
          return { x, y, width: logoW, height: logoH };
        }
        return null;
      }, [watermark]
    );

    const drawOverlays = useCallback(
      (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
        for (const o of overlays) {
          const x = (o.xPercent / 100) * cw;
          const y = (o.yPercent / 100) * ch;
          const w = (o.widthPercent / 100) * cw;
          const h = (o.heightPercent / 100) * ch;
          ctx.save();
          ctx.globalAlpha = o.opacity;
          if (o.type === "rectangle") {
            ctx.fillStyle = o.color;
            ctx.fillRect(x, y, w, h);
          } else if (o.type === "image") {
            const cached = overlayImagesRef.current.get(o.id);
            if (cached) ctx.drawImage(cached, x, y, w, h);
          }
          ctx.restore();
        }
      },
      [overlays]
    );

    const drawWatermark = useCallback(
      (ctx: CanvasRenderingContext2D, cw: number, ch: number, drawBounds: boolean) => {
        if (!watermark) return;
        const x = (watermark.xPercent / 100) * cw;
        const y = (watermark.yPercent / 100) * ch;
        ctx.save();
        ctx.globalAlpha = watermark.config.opacity;
        if (watermark.config.text) {
          const fontSize = Math.max(14, cw * watermark.config.scale * 0.08);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = "white";
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = fontSize * 0.05;
          ctx.strokeText(watermark.config.text, x, y + fontSize);
          ctx.fillText(watermark.config.text, x, y + fontSize);
        }
        if (watermark.config.imageUrl && watermarkImgRef.current) {
          const logo = watermarkImgRef.current;
          const logoW = cw * watermark.config.scale;
          const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
          ctx.drawImage(logo, x, y, logoW, logoH);
        }
        ctx.restore();
        if (drawBounds) {
          const rect = getWatermarkRect(cw, ch);
          if (rect) {
            ctx.save();
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8);
            ctx.setLineDash([]);
            ctx.fillStyle = "#3b82f6";
            const hs = 6;
            for (const [hx, hy] of [
              [rect.x - 4, rect.y - 4], [rect.x + rect.width + 4 - hs, rect.y - 4],
              [rect.x - 4, rect.y + rect.height + 4 - hs], [rect.x + rect.width + 4 - hs, rect.y + rect.height + 4 - hs],
            ]) { ctx.fillRect(hx, hy, hs, hs); }
            ctx.restore();
          }
        }
      },
      [watermark, getWatermarkRect]
    );

    const renderCanvas = useCallback(
      (img: HTMLImageElement, p: EditParams) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const info = getDrawInfo(img);
        if (!info) return;
        const { drawWidth, drawHeight, scale } = info;
        canvas.width = drawWidth * scale;
        canvas.height = drawHeight * scale;
        canvas.style.width = `${drawWidth}px`;
        canvas.style.height = `${drawHeight}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const cw = canvas.width, ch = canvas.height;
        const dw = drawWidth * scale, dh = drawHeight * scale;
        ctx.clearRect(0, 0, cw, ch);
        if (showOriginal) {
          const noEdit: EditParams = { brightness: 0, contrast: 0, saturation: 0, sharpness: 0, warmth: 0, exposure: 0, highlights: 0, shadows: 0, rotation: 0, flipX: false, flipY: false };
          drawImageWithParams(ctx, img, noEdit, cw, ch, dw, dh);
          ctx.save();
          ctx.font = `bold ${12 * scale}px sans-serif`;
          ctx.fillStyle = "white"; ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 4;
          ctx.textAlign = "left"; ctx.fillText("Original", 10 * scale, 24 * scale);
          ctx.restore();
        } else {
          drawImageWithParams(ctx, img, p, cw, ch, dw, dh);
          drawWatermark(ctx, cw, ch, !!watermarkSelected);
          drawOverlays(ctx, cw, ch);
          applyToneCurve(ctx, cw, ch, p.exposure ?? 0, p.highlights ?? 0, p.shadows ?? 0);
          if (p.sharpness && p.sharpness > 0) applySharpness(ctx, cw, ch, p.sharpness);
        }
      },
      [getDrawInfo, drawImageWithParams, drawWatermark, drawOverlays, showOriginal, watermark, watermarkSelected]
    );

    // Export clean (no bounding box)
    useImperativeHandle(ref, () => ({
      exportImage: () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return null;
        const info = getDrawInfo(imageRef.current);
        if (!info) return canvas.toDataURL("image/png");
        const { drawWidth, drawHeight, scale } = info;
        const offscreen = document.createElement("canvas");
        offscreen.width = drawWidth * scale; offscreen.height = drawHeight * scale;
        const ctx = offscreen.getContext("2d");
        if (!ctx) return null;
        const cw = offscreen.width, ch = offscreen.height, dw = drawWidth * scale, dh = drawHeight * scale;
        drawImageWithParams(ctx, imageRef.current, params, cw, ch, dw, dh);
        drawOverlays(ctx, cw, ch);
        applyToneCurve(ctx, cw, ch, params.exposure ?? 0, params.highlights ?? 0, params.shadows ?? 0);
        if (params.sharpness && params.sharpness > 0) applySharpness(ctx, cw, ch, params.sharpness);
        if (watermark) {
          const x = (watermark.xPercent / 100) * cw, y = (watermark.yPercent / 100) * ch;
          ctx.save(); ctx.globalAlpha = watermark.config.opacity;
          if (watermark.config.text) {
            const fs = Math.max(14, cw * watermark.config.scale * 0.08);
            ctx.font = `bold ${fs}px sans-serif`; ctx.fillStyle = "white";
            ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = fs * 0.05;
            ctx.strokeText(watermark.config.text, x, y + fs); ctx.fillText(watermark.config.text, x, y + fs);
          }
          if (watermark.config.imageUrl && watermarkImgRef.current) {
            const logo = watermarkImgRef.current;
            const logoW = cw * watermark.config.scale;
            ctx.drawImage(logo, x, y, logoW, (logo.naturalHeight / logo.naturalWidth) * logoW);
          }
          ctx.restore();
        }
        return offscreen.toDataURL("image/png");
      },
    }));

    const getCanvasPos = useCallback((e: MouseEvent | React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    // Determine which crop handle is under the mouse
    const getCropHandle = useCallback((pos: { x: number; y: number }): DragMode | null => {
      if (!cropRect) return null;
      const h = HANDLE_SIZE;
      const { x, y, width: w, height: ht } = cropRect;
      // Corners
      if (Math.abs(pos.x - x) < h && Math.abs(pos.y - y) < h) return "crop-nw";
      if (Math.abs(pos.x - (x + w)) < h && Math.abs(pos.y - y) < h) return "crop-ne";
      if (Math.abs(pos.x - x) < h && Math.abs(pos.y - (y + ht)) < h) return "crop-sw";
      if (Math.abs(pos.x - (x + w)) < h && Math.abs(pos.y - (y + ht)) < h) return "crop-se";
      // Edges
      if (pos.x > x + h && pos.x < x + w - h && Math.abs(pos.y - y) < h) return "crop-n";
      if (pos.x > x + h && pos.x < x + w - h && Math.abs(pos.y - (y + ht)) < h) return "crop-s";
      if (pos.y > y + h && pos.y < y + ht - h && Math.abs(pos.x - x) < h) return "crop-w";
      if (pos.y > y + h && pos.y < y + ht - h && Math.abs(pos.x - (x + w)) < h) return "crop-e";
      // Inside
      if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + ht) return "crop-move";
      return null;
    }, [cropRect]);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        const pos = getCanvasPos(e);
        if (cropMode) {
          const handle = getCropHandle(pos);
          if (handle) {
            setMode(handle);
            cropDragOffset.current = { x: pos.x - (cropRect?.x ?? 0), y: pos.y - (cropRect?.y ?? 0) };
            cropStartRect.current = cropRect ? { ...cropRect } : null;
            dragStart.current = pos;
          } else {
            setMode("crop-draw");
            dragStart.current = pos;
            setCropRect(null);
          }
          return;
        }
        if (watermark && onWatermarkMove) {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          wmDragOffset.current = {
            x: pos.x - (watermark.xPercent / 100) * rect.width,
            y: pos.y - (watermark.yPercent / 100) * rect.height,
          };
          setMode("watermark-drag");
        }
      },
      [cropMode, cropRect, watermark, onWatermarkMove, getCanvasPos, getCropHandle]
    );

    useEffect(() => {
      if (mode === "none") return;
      const handleMove = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        if (mode === "crop-draw") {
          setCropRect({
            x: Math.max(0, Math.min(dragStart.current.x, pos.x)),
            y: Math.max(0, Math.min(dragStart.current.y, pos.y)),
            width: Math.min(Math.abs(pos.x - dragStart.current.x), rect.width),
            height: Math.min(Math.abs(pos.y - dragStart.current.y), rect.height),
          });
          return;
        }
        if (mode === "crop-move" && cropRect) {
          const dx = pos.x - dragStart.current.x;
          const dy = pos.y - dragStart.current.y;
          const sr = cropStartRect.current!;
          setCropRect({
            x: Math.max(0, Math.min(sr.x + dx, rect.width - sr.width)),
            y: Math.max(0, Math.min(sr.y + dy, rect.height - sr.height)),
            width: sr.width, height: sr.height,
          });
          return;
        }
        // Resize handles
        if (mode.startsWith("crop-") && cropStartRect.current) {
          const sr = cropStartRect.current;
          const dx = pos.x - dragStart.current.x;
          const dy = pos.y - dragStart.current.y;
          let { x, y, width, height } = sr;
          if (mode.includes("e")) { width = Math.max(20, sr.width + dx); }
          if (mode.includes("w")) { x = sr.x + dx; width = Math.max(20, sr.width - dx); }
          if (mode.includes("s")) { height = Math.max(20, sr.height + dy); }
          if (mode.includes("n")) { y = sr.y + dy; height = Math.max(20, sr.height - dy); }
          setCropRect({ x: Math.max(0, x), y: Math.max(0, y), width, height });
          return;
        }
        if (mode === "watermark-drag" && onWatermarkMove) {
          const adjX = pos.x - wmDragOffset.current.x;
          const adjY = pos.y - wmDragOffset.current.y;
          onWatermarkMove(
            Math.max(-20, Math.min(100, (adjX / rect.width) * 100)),
            Math.max(-20, Math.min(100, (adjY / rect.height) * 100))
          );
        }
      };
      const handleUp = () => setMode("none");
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
    }, [mode, cropRect, onWatermarkMove]);

    // Crop: export just the crop region from the rendered canvas
    const handleCropApply = useCallback(() => {
      if (!cropRect || !canvasRef.current || !onCropComplete) return;
      const canvas = canvasRef.current;
      const displayW = canvas.getBoundingClientRect().width;
      const displayH = canvas.getBoundingClientRect().height;
      const scaleX = canvas.width / displayW;
      const scaleY = canvas.height / displayH;

      // Crop from the current canvas content (includes transforms)
      const sx = cropRect.x * scaleX;
      const sy = cropRect.y * scaleY;
      const sw = cropRect.width * scaleX;
      const sh = cropRect.height * scaleY;

      const offscreen = document.createElement("canvas");
      offscreen.width = sw;
      offscreen.height = sh;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      onCropComplete(offscreen.toDataURL("image/png"));
      setCropRect(null);
    }, [cropRect, onCropComplete]);

    const getCursorForMode = useCallback((pos?: { x: number; y: number }) => {
      if (!cropMode) return watermark ? "cursor-grab" : "";
      if (!cropRect) return "cursor-crosshair";
      if (!pos) return "cursor-crosshair";
      const h = getCropHandle(pos);
      if (h === "crop-nw" || h === "crop-se") return "cursor-nwse-resize";
      if (h === "crop-ne" || h === "crop-sw") return "cursor-nesw-resize";
      if (h === "crop-n" || h === "crop-s") return "cursor-ns-resize";
      if (h === "crop-e" || h === "crop-w") return "cursor-ew-resize";
      if (h === "crop-move") return "cursor-move";
      return "cursor-crosshair";
    }, [cropMode, cropRect, watermark, getCropHandle]);

    const [cursorClass, setCursorClass] = useState("");
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (mode !== "none") return; // during drag, don't update cursor
      const pos = getCanvasPos(e);
      setCursorClass(getCursorForMode(pos));
    }, [mode, getCanvasPos, getCursorForMode]);

    return (
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-full rounded-xl overflow-auto bg-white border border-zinc-200 shadow-sm"
        style={{
          backgroundImage: "linear-gradient(45deg, #f4f4f5 25%, transparent 25%), linear-gradient(-45deg, #f4f4f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f4f4f5 75%), linear-gradient(-45deg, transparent 75%, #f4f4f5 75%)",
          backgroundSize: "16px 16px", backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        }}
      >
        <div className="relative" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}>
          <canvas ref={canvasRef} className={`max-w-none ${cursorClass}`} />

          {/* Crop overlay */}
          {cropMode && cropRect && cropRect.width > 5 && cropRect.height > 5 && (
            <>
              <div className="absolute inset-0 bg-black/40 pointer-events-none"
                style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${cropRect.x}px ${cropRect.y}px, ${cropRect.x}px ${cropRect.y + cropRect.height}px, ${cropRect.x + cropRect.width}px ${cropRect.y + cropRect.height}px, ${cropRect.x + cropRect.width}px ${cropRect.y}px, ${cropRect.x}px ${cropRect.y}px)` }}
              />
              <div className="absolute border-2 border-white shadow-lg pointer-events-none"
                style={{ left: cropRect.x, top: cropRect.y, width: cropRect.width, height: cropRect.height }}>
                <div className="absolute inset-0">
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                </div>
                {/* Corner handles */}
                {[
                  { left: -4, top: -4 }, { right: -4, top: -4 },
                  { left: -4, bottom: -4 }, { right: -4, bottom: -4 },
                ].map((style, i) => (
                  <div key={i} className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm pointer-events-none" style={style} />
                ))}
                {/* Edge handles */}
                {[
                  { left: "50%", top: -4, transform: "translateX(-50%)" },
                  { left: "50%", bottom: -4, transform: "translateX(-50%)" },
                  { left: -4, top: "50%", transform: "translateY(-50%)" },
                  { right: -4, top: "50%", transform: "translateY(-50%)" },
                ].map((style, i) => (
                  <div key={`e${i}`} className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-sm pointer-events-none" style={style} />
                ))}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded whitespace-nowrap">
                  {Math.round(cropRect.width)} x {Math.round(cropRect.height)}
                </div>
              </div>
              {mode === "none" && (
                <div className="absolute flex gap-1.5 z-10"
                  style={{
                    left: Math.max(0, cropRect.x + cropRect.width / 2 - 60),
                    top: Math.min(cropRect.y + cropRect.height + 12, parseFloat(canvasRef.current?.style.height || "999") - 36),
                  }}>
                  <button onClick={handleCropApply}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md shadow-lg hover:bg-blue-700 transition-colors">
                    Apply Crop
                  </button>
                  <button onClick={() => { setCropRect(null); onCropCancel?.(); }}
                    className="px-3 py-1.5 bg-white text-zinc-700 text-xs font-medium rounded-md shadow-lg hover:bg-zinc-50 border border-zinc-200 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {cropMode && !cropRect && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-4 py-2 bg-black/60 text-white text-sm rounded-lg backdrop-blur-sm">
                Click and drag to select crop area
              </div>
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 border border-zinc-200 rounded-lg shadow-sm p-0.5">
          <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" title="Zoom out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-zinc-500 font-mono w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" title="Zoom in">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
);

function applyToneCurve(
  ctx: CanvasRenderingContext2D, width: number, height: number,
  exposure: number, highlights: number, shadows: number
) {
  if (exposure === 0 && highlights === 0 && shadows === 0) return;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  // Pre-compute a 256-entry lookup table for speed
  const lut = new Uint8Array(256);
  const gamma = exposure !== 0 ? 1 / (1 + exposure / 100) : 1;
  const hStr = highlights / 200; // -0.5 to 0.5
  const sStr = shadows / 200;
  for (let i = 0; i < 256; i++) {
    let v = i / 255;
    // Exposure: gamma curve
    if (gamma !== 1) v = Math.pow(v, gamma);
    // Highlights: affect upper luminance (smoothly ramp from 0.5 to 1.0)
    if (hStr !== 0) {
      const hMask = Math.max(0, (v - 0.5) * 2); // 0 at mid, 1 at white
      v = v + hStr * hMask * (1 - v); // push toward white or pull back
    }
    // Shadows: affect lower luminance (smoothly ramp from 0 to 0.5)
    if (sStr !== 0) {
      const sMask = Math.max(0, 1 - v * 2); // 1 at black, 0 at mid
      v = v + sStr * sMask * v; // push toward mid or pull toward black
    }
    lut[i] = Math.max(0, Math.min(255, Math.round(v * 255)));
  }
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
  ctx.putImageData(imageData, 0, 0);
}

function applySharpness(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const strength = amount / 200;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const blurred = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        blurred[i + c] = (
          data[((y-1)*width+(x-1))*4+c] + data[((y-1)*width+x)*4+c] + data[((y-1)*width+(x+1))*4+c] +
          data[(y*width+(x-1))*4+c] + data[(y*width+x)*4+c] + data[(y*width+(x+1))*4+c] +
          data[((y+1)*width+(x-1))*4+c] + data[((y+1)*width+x)*4+c] + data[((y+1)*width+(x+1))*4+c]
        ) / 9;
      }
    }
  }
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i+c] = Math.max(0, Math.min(255, data[i+c] + strength * (data[i+c] - blurred[i+c])));
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
