"use client";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/lib/luminate/components/LuminateEditor.tsx
import { useRef as useRef4, useState as useState6, useCallback as useCallback4, useEffect as useEffect4 } from "react";
import {
  SlidersHorizontal,
  Stamp,
  Sparkles as Sparkles2,
  Undo2 as Undo22,
  Redo2,
  RefreshCw,
  Download,
  Plus as Plus2,
  Eye,
  GripVertical,
  Upload
} from "lucide-react";

// src/lib/luminate/hooks/useEditorState.ts
import { useCallback, useState } from "react";

// src/lib/luminate/types.ts
var DEFAULT_EDIT_PARAMS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  warmth: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  rotation: 0,
  flipX: false,
  flipY: false
};

// src/lib/luminate/hooks/useEditorState.ts
var MAX_HISTORY = 50;
function useEditorState() {
  const [state, setState] = useState({
    originalImage: null,
    currentParams: __spreadValues({}, DEFAULT_EDIT_PARAMS),
    history: [__spreadValues({}, DEFAULT_EDIT_PARAMS)],
    historyIndex: 0,
    isProcessing: false,
    backgroundRemoved: false
  });
  const setImage = useCallback((dataUrl) => {
    setState({
      originalImage: dataUrl,
      currentParams: __spreadValues({}, DEFAULT_EDIT_PARAMS),
      history: [__spreadValues({}, DEFAULT_EDIT_PARAMS)],
      historyIndex: 0,
      isProcessing: false,
      backgroundRemoved: false
    });
  }, []);
  const updateParams = useCallback((newParams) => {
    setState((prev) => {
      const merged = __spreadValues(__spreadValues({}, prev.currentParams), newParams);
      const newHistory = [
        ...prev.history.slice(0, prev.historyIndex + 1),
        merged
      ].slice(-MAX_HISTORY);
      return __spreadProps(__spreadValues({}, prev), {
        currentParams: merged,
        history: newHistory,
        historyIndex: newHistory.length - 1
      });
    });
  }, []);
  const setParams = useCallback((params) => {
    setState((prev) => {
      const newHistory = [
        ...prev.history.slice(0, prev.historyIndex + 1),
        params
      ].slice(-MAX_HISTORY);
      return __spreadProps(__spreadValues({}, prev), {
        currentParams: params,
        history: newHistory,
        historyIndex: newHistory.length - 1
      });
    });
  }, []);
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return __spreadProps(__spreadValues({}, prev), {
        currentParams: prev.history[newIndex],
        historyIndex: newIndex
      });
    });
  }, []);
  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return __spreadProps(__spreadValues({}, prev), {
        currentParams: prev.history[newIndex],
        historyIndex: newIndex
      });
    });
  }, []);
  const reset = useCallback(() => {
    setState((prev) => __spreadProps(__spreadValues({}, prev), {
      currentParams: __spreadValues({}, DEFAULT_EDIT_PARAMS),
      history: [...prev.history, __spreadValues({}, DEFAULT_EDIT_PARAMS)],
      historyIndex: prev.history.length,
      backgroundRemoved: false
    }));
  }, []);
  const clearImage = useCallback(() => {
    setState({
      originalImage: null,
      currentParams: __spreadValues({}, DEFAULT_EDIT_PARAMS),
      history: [__spreadValues({}, DEFAULT_EDIT_PARAMS)],
      historyIndex: 0,
      isProcessing: false,
      backgroundRemoved: false
    });
  }, []);
  const setProcessing = useCallback((isProcessing) => {
    setState((prev) => __spreadProps(__spreadValues({}, prev), { isProcessing }));
  }, []);
  const setBackgroundRemoved = useCallback((backgroundRemoved) => {
    setState((prev) => __spreadProps(__spreadValues({}, prev), { backgroundRemoved }));
  }, []);
  return {
    state,
    setImage,
    clearImage,
    updateParams,
    setParams,
    undo,
    redo,
    reset,
    setProcessing,
    setBackgroundRemoved
  };
}

// src/lib/luminate/components/Canvas.tsx
import {
  useEffect,
  useRef,
  useCallback as useCallback2,
  forwardRef,
  useImperativeHandle,
  useState as useState2
} from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var HANDLE_SIZE = 8;
var Canvas = forwardRef(
  function Canvas2({
    imageSrc,
    params,
    backgroundRemovedSrc,
    cropMode,
    onCropComplete,
    onCropCancel,
    showOriginal,
    watermark,
    onWatermarkMove,
    watermarkSelected
  }, ref) {
    var _a;
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const watermarkImgRef = useRef(null);
    const containerRef = useRef(null);
    const [mode, setMode] = useState2("none");
    const dragStart = useRef({ x: 0, y: 0 });
    const wmDragOffset = useRef({ x: 0, y: 0 });
    const [cropRect, setCropRect] = useState2(null);
    const cropDragOffset = useRef({ x: 0, y: 0 });
    const cropStartRect = useRef(null);
    const [zoom, setZoom] = useState2(1);
    useEffect(() => {
      if (!(watermark == null ? void 0 : watermark.config.imageUrl)) {
        watermarkImgRef.current = null;
        return;
      }
      const img = new Image();
      img.onload = () => {
        watermarkImgRef.current = img;
        if (imageRef.current) renderCanvas(imageRef.current, params);
      };
      img.src = watermark.config.imageUrl;
    }, [watermark == null ? void 0 : watermark.config.imageUrl]);
    useEffect(() => {
      const src = backgroundRemovedSrc || imageSrc;
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        renderCanvas(img, params);
      };
      img.src = src;
    }, [imageSrc, backgroundRemovedSrc]);
    useEffect(() => {
      if (imageRef.current) renderCanvas(imageRef.current, params);
    }, [params, showOriginal, watermark, watermarkSelected, zoom]);
    const getDrawInfo = useCallback2((img) => {
      const container = containerRef.current;
      if (!container) return null;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const cAspect = cw / ch;
      let dw, dh;
      if (imgAspect > cAspect) {
        dw = cw;
        dh = cw / imgAspect;
      } else {
        dh = ch;
        dw = ch * imgAspect;
      }
      dw *= zoom;
      dh *= zoom;
      const scale = Math.min(img.naturalWidth / dw, img.naturalHeight / dh, 1);
      return { drawWidth: dw, drawHeight: dh, scale };
    }, [zoom]);
    const drawImageWithParams = useCallback2(
      (ctx, img, p, cw, ch, dw, dh) => {
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        if (p.rotation) ctx.rotate(p.rotation * Math.PI / 180);
        ctx.scale(p.flipX ? -1 : 1, p.flipY ? -1 : 1);
        const filters = [];
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
      },
      []
    );
    const getWatermarkRect = useCallback2(
      (cw, ch) => {
        if (!watermark) return null;
        const x = watermark.xPercent / 100 * cw;
        const y = watermark.yPercent / 100 * ch;
        if (watermark.config.text) {
          const fontSize = Math.max(14, cw * watermark.config.scale * 0.08);
          return { x, y, width: watermark.config.text.length * fontSize * 0.6, height: fontSize * 1.3 };
        }
        if (watermark.config.imageUrl && watermarkImgRef.current) {
          const logo = watermarkImgRef.current;
          const logoW = cw * watermark.config.scale;
          const logoH = logo.naturalHeight / logo.naturalWidth * logoW;
          return { x, y, width: logoW, height: logoH };
        }
        return null;
      },
      [watermark]
    );
    const drawWatermark = useCallback2(
      (ctx, cw, ch, drawBounds) => {
        if (!watermark) return;
        const x = watermark.xPercent / 100 * cw;
        const y = watermark.yPercent / 100 * ch;
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
          const logoH = logo.naturalHeight / logo.naturalWidth * logoW;
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
              [rect.x - 4, rect.y - 4],
              [rect.x + rect.width + 4 - hs, rect.y - 4],
              [rect.x - 4, rect.y + rect.height + 4 - hs],
              [rect.x + rect.width + 4 - hs, rect.y + rect.height + 4 - hs]
            ]) {
              ctx.fillRect(hx, hy, hs, hs);
            }
            ctx.restore();
          }
        }
      },
      [watermark, getWatermarkRect]
    );
    const renderCanvas = useCallback2(
      (img, p) => {
        var _a2, _b, _c;
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
          const noEdit = { brightness: 0, contrast: 0, saturation: 0, sharpness: 0, warmth: 0, exposure: 0, highlights: 0, shadows: 0, rotation: 0, flipX: false, flipY: false };
          drawImageWithParams(ctx, img, noEdit, cw, ch, dw, dh);
          ctx.save();
          ctx.font = `bold ${12 * scale}px sans-serif`;
          ctx.fillStyle = "white";
          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = 4;
          ctx.textAlign = "left";
          ctx.fillText("Original", 10 * scale, 24 * scale);
          ctx.restore();
        } else {
          drawImageWithParams(ctx, img, p, cw, ch, dw, dh);
          drawWatermark(ctx, cw, ch, !!watermarkSelected);
          applyToneCurve(ctx, cw, ch, (_a2 = p.exposure) != null ? _a2 : 0, (_b = p.highlights) != null ? _b : 0, (_c = p.shadows) != null ? _c : 0);
          if (p.sharpness && p.sharpness > 0) applySharpness(ctx, cw, ch, p.sharpness);
        }
      },
      [getDrawInfo, drawImageWithParams, drawWatermark, showOriginal, watermark, watermarkSelected]
    );
    useImperativeHandle(ref, () => ({
      exportImage: () => {
        var _a2, _b, _c;
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return null;
        const info = getDrawInfo(imageRef.current);
        if (!info) return canvas.toDataURL("image/png");
        const { drawWidth, drawHeight, scale } = info;
        const offscreen = document.createElement("canvas");
        offscreen.width = drawWidth * scale;
        offscreen.height = drawHeight * scale;
        const ctx = offscreen.getContext("2d");
        if (!ctx) return null;
        const cw = offscreen.width, ch = offscreen.height, dw = drawWidth * scale, dh = drawHeight * scale;
        drawImageWithParams(ctx, imageRef.current, params, cw, ch, dw, dh);
        applyToneCurve(ctx, cw, ch, (_a2 = params.exposure) != null ? _a2 : 0, (_b = params.highlights) != null ? _b : 0, (_c = params.shadows) != null ? _c : 0);
        if (params.sharpness && params.sharpness > 0) applySharpness(ctx, cw, ch, params.sharpness);
        if (watermark) {
          const x = watermark.xPercent / 100 * cw, y = watermark.yPercent / 100 * ch;
          ctx.save();
          ctx.globalAlpha = watermark.config.opacity;
          if (watermark.config.text) {
            const fs = Math.max(14, cw * watermark.config.scale * 0.08);
            ctx.font = `bold ${fs}px sans-serif`;
            ctx.fillStyle = "white";
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.lineWidth = fs * 0.05;
            ctx.strokeText(watermark.config.text, x, y + fs);
            ctx.fillText(watermark.config.text, x, y + fs);
          }
          if (watermark.config.imageUrl && watermarkImgRef.current) {
            const logo = watermarkImgRef.current;
            const logoW = cw * watermark.config.scale;
            ctx.drawImage(logo, x, y, logoW, logo.naturalHeight / logo.naturalWidth * logoW);
          }
          ctx.restore();
        }
        return offscreen.toDataURL("image/png");
      }
    }));
    const getCanvasPos = useCallback2((e) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);
    const getCropHandle = useCallback2((pos) => {
      if (!cropRect) return null;
      const h = HANDLE_SIZE;
      const { x, y, width: w, height: ht } = cropRect;
      if (Math.abs(pos.x - x) < h && Math.abs(pos.y - y) < h) return "crop-nw";
      if (Math.abs(pos.x - (x + w)) < h && Math.abs(pos.y - y) < h) return "crop-ne";
      if (Math.abs(pos.x - x) < h && Math.abs(pos.y - (y + ht)) < h) return "crop-sw";
      if (Math.abs(pos.x - (x + w)) < h && Math.abs(pos.y - (y + ht)) < h) return "crop-se";
      if (pos.x > x + h && pos.x < x + w - h && Math.abs(pos.y - y) < h) return "crop-n";
      if (pos.x > x + h && pos.x < x + w - h && Math.abs(pos.y - (y + ht)) < h) return "crop-s";
      if (pos.y > y + h && pos.y < y + ht - h && Math.abs(pos.x - x) < h) return "crop-w";
      if (pos.y > y + h && pos.y < y + ht - h && Math.abs(pos.x - (x + w)) < h) return "crop-e";
      if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + ht) return "crop-move";
      return null;
    }, [cropRect]);
    const handleMouseDown = useCallback2(
      (e) => {
        var _a2, _b;
        const pos = getCanvasPos(e);
        if (cropMode) {
          const handle = getCropHandle(pos);
          if (handle) {
            setMode(handle);
            cropDragOffset.current = { x: pos.x - ((_a2 = cropRect == null ? void 0 : cropRect.x) != null ? _a2 : 0), y: pos.y - ((_b = cropRect == null ? void 0 : cropRect.y) != null ? _b : 0) };
            cropStartRect.current = cropRect ? __spreadValues({}, cropRect) : null;
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
            x: pos.x - watermark.xPercent / 100 * rect.width,
            y: pos.y - watermark.yPercent / 100 * rect.height
          };
          setMode("watermark-drag");
        }
      },
      [cropMode, cropRect, watermark, onWatermarkMove, getCanvasPos, getCropHandle]
    );
    useEffect(() => {
      if (mode === "none") return;
      const handleMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (mode === "crop-draw") {
          setCropRect({
            x: Math.max(0, Math.min(dragStart.current.x, pos.x)),
            y: Math.max(0, Math.min(dragStart.current.y, pos.y)),
            width: Math.min(Math.abs(pos.x - dragStart.current.x), rect.width),
            height: Math.min(Math.abs(pos.y - dragStart.current.y), rect.height)
          });
          return;
        }
        if (mode === "crop-move" && cropRect) {
          const dx = pos.x - dragStart.current.x;
          const dy = pos.y - dragStart.current.y;
          const sr = cropStartRect.current;
          setCropRect({
            x: Math.max(0, Math.min(sr.x + dx, rect.width - sr.width)),
            y: Math.max(0, Math.min(sr.y + dy, rect.height - sr.height)),
            width: sr.width,
            height: sr.height
          });
          return;
        }
        if (mode.startsWith("crop-") && cropStartRect.current) {
          const sr = cropStartRect.current;
          const dx = pos.x - dragStart.current.x;
          const dy = pos.y - dragStart.current.y;
          let { x, y, width, height } = sr;
          if (mode.includes("e")) {
            width = Math.max(20, sr.width + dx);
          }
          if (mode.includes("w")) {
            x = sr.x + dx;
            width = Math.max(20, sr.width - dx);
          }
          if (mode.includes("s")) {
            height = Math.max(20, sr.height + dy);
          }
          if (mode.includes("n")) {
            y = sr.y + dy;
            height = Math.max(20, sr.height - dy);
          }
          setCropRect({ x: Math.max(0, x), y: Math.max(0, y), width, height });
          return;
        }
        if (mode === "watermark-drag" && onWatermarkMove) {
          const adjX = pos.x - wmDragOffset.current.x;
          const adjY = pos.y - wmDragOffset.current.y;
          onWatermarkMove(
            Math.max(-20, Math.min(100, adjX / rect.width * 100)),
            Math.max(-20, Math.min(100, adjY / rect.height * 100))
          );
        }
      };
      const handleUp = () => setMode("none");
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }, [mode, cropRect, onWatermarkMove]);
    const handleCropApply = useCallback2(() => {
      if (!cropRect || !canvasRef.current || !onCropComplete) return;
      const canvas = canvasRef.current;
      const displayW = canvas.getBoundingClientRect().width;
      const displayH = canvas.getBoundingClientRect().height;
      const scaleX = canvas.width / displayW;
      const scaleY = canvas.height / displayH;
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
    const getCursorForMode = useCallback2((pos) => {
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
    const [cursorClass, setCursorClass] = useState2("");
    const handleMouseMove = useCallback2((e) => {
      if (mode !== "none") return;
      const pos = getCanvasPos(e);
      setCursorClass(getCursorForMode(pos));
    }, [mode, getCanvasPos, getCursorForMode]);
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref: containerRef,
        className: "relative flex items-center justify-center w-full h-full rounded-xl overflow-auto bg-white border border-zinc-200 shadow-sm",
        style: {
          backgroundImage: "linear-gradient(45deg, #f4f4f5 25%, transparent 25%), linear-gradient(-45deg, #f4f4f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f4f4f5 75%), linear-gradient(-45deg, transparent 75%, #f4f4f5 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px"
        },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, children: [
            /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: `max-w-none ${cursorClass}` }),
            cropMode && cropRect && cropRect.width > 5 && cropRect.height > 5 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute inset-0 bg-black/40 pointer-events-none",
                  style: { clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${cropRect.x}px ${cropRect.y}px, ${cropRect.x}px ${cropRect.y + cropRect.height}px, ${cropRect.x + cropRect.width}px ${cropRect.y + cropRect.height}px, ${cropRect.x + cropRect.width}px ${cropRect.y}px, ${cropRect.x}px ${cropRect.y}px)` }
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "absolute border-2 border-white shadow-lg pointer-events-none",
                  style: { left: cropRect.x, top: cropRect.y, width: cropRect.width, height: cropRect.height },
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
                      /* @__PURE__ */ jsx("div", { className: "absolute left-1/3 top-0 bottom-0 w-px bg-white/30" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute left-2/3 top-0 bottom-0 w-px bg-white/30" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute top-1/3 left-0 right-0 h-px bg-white/30" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute top-2/3 left-0 right-0 h-px bg-white/30" })
                    ] }),
                    [
                      { left: -4, top: -4 },
                      { right: -4, top: -4 },
                      { left: -4, bottom: -4 },
                      { right: -4, bottom: -4 }
                    ].map((style, i) => /* @__PURE__ */ jsx("div", { className: "absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm pointer-events-none", style }, i)),
                    [
                      { left: "50%", top: -4, transform: "translateX(-50%)" },
                      { left: "50%", bottom: -4, transform: "translateX(-50%)" },
                      { left: -4, top: "50%", transform: "translateY(-50%)" },
                      { right: -4, top: "50%", transform: "translateY(-50%)" }
                    ].map((style, i) => /* @__PURE__ */ jsx("div", { className: "absolute w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-sm pointer-events-none", style }, `e${i}`)),
                    /* @__PURE__ */ jsxs("div", { className: "absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded whitespace-nowrap", children: [
                      Math.round(cropRect.width),
                      " x ",
                      Math.round(cropRect.height)
                    ] })
                  ]
                }
              ),
              mode === "none" && /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "absolute flex gap-1.5 z-10",
                  style: {
                    left: Math.max(0, cropRect.x + cropRect.width / 2 - 60),
                    top: Math.min(cropRect.y + cropRect.height + 12, parseFloat(((_a = canvasRef.current) == null ? void 0 : _a.style.height) || "999") - 36)
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: handleCropApply,
                        className: "px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md shadow-lg hover:bg-blue-700 transition-colors",
                        children: "Apply Crop"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => {
                          setCropRect(null);
                          onCropCancel == null ? void 0 : onCropCancel();
                        },
                        className: "px-3 py-1.5 bg-white text-zinc-700 text-xs font-medium rounded-md shadow-lg hover:bg-zinc-50 border border-zinc-200 transition-colors",
                        children: "Cancel"
                      }
                    )
                  ]
                }
              )
            ] }),
            cropMode && !cropRect && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "px-4 py-2 bg-black/60 text-white text-sm rounded-lg backdrop-blur-sm", children: "Click and drag to select crop area" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 border border-zinc-200 rounded-lg shadow-sm p-0.5", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setZoom((z) => Math.max(0.25, z - 0.25)),
                className: "p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors",
                title: "Zoom out",
                children: /* @__PURE__ */ jsx(ZoomOut, { className: "w-3.5 h-3.5" })
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-zinc-500 font-mono w-10 text-center tabular-nums", children: [
              Math.round(zoom * 100),
              "%"
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setZoom((z) => Math.min(3, z + 0.25)),
                className: "p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors",
                title: "Zoom in",
                children: /* @__PURE__ */ jsx(ZoomIn, { className: "w-3.5 h-3.5" })
              }
            )
          ] })
        ]
      }
    );
  }
);
function applyToneCurve(ctx, width, height, exposure, highlights, shadows) {
  if (exposure === 0 && highlights === 0 && shadows === 0) return;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const lut = new Uint8Array(256);
  const gamma = exposure !== 0 ? 1 / (1 + exposure / 100) : 1;
  const hStr = highlights / 200;
  const sStr = shadows / 200;
  for (let i = 0; i < 256; i++) {
    let v = i / 255;
    if (gamma !== 1) v = Math.pow(v, gamma);
    if (hStr !== 0) {
      const hMask = Math.max(0, (v - 0.5) * 2);
      v = v + hStr * hMask * (1 - v);
    }
    if (sStr !== 0) {
      const sMask = Math.max(0, 1 - v * 2);
      v = v + sStr * sMask * v;
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
function applySharpness(ctx, width, height, amount) {
  const strength = amount / 200;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const blurred = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        blurred[i + c] = (data[((y - 1) * width + (x - 1)) * 4 + c] + data[((y - 1) * width + x) * 4 + c] + data[((y - 1) * width + (x + 1)) * 4 + c] + data[(y * width + (x - 1)) * 4 + c] + data[(y * width + x) * 4 + c] + data[(y * width + (x + 1)) * 4 + c] + data[((y + 1) * width + (x - 1)) * 4 + c] + data[((y + 1) * width + x) * 4 + c] + data[((y + 1) * width + (x + 1)) * 4 + c]) / 9;
      }
    }
  }
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.max(0, Math.min(255, data[i + c] + strength * (data[i + c] - blurred[i + c])));
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// src/lib/luminate/components/Toolbar.tsx
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop
} from "lucide-react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled
}) {
  return /* @__PURE__ */ jsxs2("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex justify-between items-center text-xs", children: [
      /* @__PURE__ */ jsx2("span", { className: "text-zinc-500 font-medium", children: label }),
      /* @__PURE__ */ jsx2(
        "input",
        {
          type: "number",
          value,
          min,
          max,
          step,
          onChange: (e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          },
          disabled,
          className: "w-12 text-right text-zinc-500 font-mono tabular-nums bg-transparent border-none focus:outline-none focus:text-zinc-800 disabled:text-zinc-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        }
      )
    ] }),
    /* @__PURE__ */ jsx2(
      "input",
      {
        type: "range",
        min,
        max,
        step,
        value,
        onChange: (e) => onChange(Number(e.target.value)),
        disabled,
        className: "w-full cursor-pointer"
      }
    )
  ] });
}
function Toolbar({
  params,
  onUpdateParams,
  disabled,
  cropMode,
  onToggleCrop
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const btnClass = (active) => `p-2 rounded-lg transition-colors ${disabled ? "text-zinc-300 cursor-not-allowed" : active ? "text-blue-600 bg-blue-50" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"}`;
  return /* @__PURE__ */ jsxs2("div", { className: "flex flex-col gap-4 p-4", children: [
    /* @__PURE__ */ jsxs2("div", { children: [
      /* @__PURE__ */ jsx2("h3", { className: "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2", children: "Transform" }),
      /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => {
              var _a2;
              return onUpdateParams({ rotation: ((_a2 = params.rotation) != null ? _a2 : 0) - 90 });
            },
            disabled,
            className: btnClass(),
            title: "Rotate left 90\xB0",
            children: /* @__PURE__ */ jsx2(RotateCcw, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => {
              var _a2;
              return onUpdateParams({ rotation: ((_a2 = params.rotation) != null ? _a2 : 0) + 90 });
            },
            disabled,
            className: btnClass(),
            title: "Rotate right 90\xB0",
            children: /* @__PURE__ */ jsx2(RotateCw, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => onUpdateParams({ flipX: !params.flipX }),
            disabled,
            className: btnClass(params.flipX),
            title: "Flip horizontal",
            children: /* @__PURE__ */ jsx2(FlipHorizontal, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: () => onUpdateParams({ flipY: !params.flipY }),
            disabled,
            className: btnClass(params.flipY),
            title: "Flip vertical",
            children: /* @__PURE__ */ jsx2(FlipVertical, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx2("div", { className: "w-px h-4 bg-zinc-200 mx-1" }),
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: onToggleCrop,
            disabled,
            className: btnClass(cropMode),
            title: "Crop",
            children: /* @__PURE__ */ jsx2(Crop, { className: "w-4 h-4" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx2(
      SliderControl,
      {
        label: "Rotation",
        value: (_a = params.rotation) != null ? _a : 0,
        min: -180,
        max: 180,
        step: 0.5,
        onChange: (v) => onUpdateParams({ rotation: v }),
        disabled
      }
    ),
    /* @__PURE__ */ jsxs2("div", { className: "flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx2("h3", { className: "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider", children: "Adjustments" }),
      /* @__PURE__ */ jsx2(
        SliderControl,
        {
          label: "Brightness",
          value: (_b = params.brightness) != null ? _b : 0,
          min: -100,
          max: 100,
          onChange: (v) => onUpdateParams({ brightness: v }),
          disabled
        }
      ),
      /* @__PURE__ */ jsx2(
        SliderControl,
        {
          label: "Contrast",
          value: (_c = params.contrast) != null ? _c : 0,
          min: -100,
          max: 100,
          onChange: (v) => onUpdateParams({ contrast: v }),
          disabled
        }
      ),
      /* @__PURE__ */ jsx2(
        SliderControl,
        {
          label: "Saturation",
          value: (_d = params.saturation) != null ? _d : 0,
          min: -100,
          max: 100,
          onChange: (v) => onUpdateParams({ saturation: v }),
          disabled
        }
      ),
      /* @__PURE__ */ jsx2(
        SliderControl,
        {
          label: "Sharpness",
          value: (_e = params.sharpness) != null ? _e : 0,
          min: 0,
          max: 100,
          onChange: (v) => onUpdateParams({ sharpness: v }),
          disabled
        }
      ),
      /* @__PURE__ */ jsx2(
        SliderControl,
        {
          label: "Warmth",
          value: (_f = params.warmth) != null ? _f : 0,
          min: -100,
          max: 100,
          onChange: (v) => onUpdateParams({ warmth: v }),
          disabled
        }
      ),
      /* @__PURE__ */ jsx2("h3", { className: "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mt-2", children: "Tone" }),
      /* @__PURE__ */ jsx2(
        SliderControl,
        {
          label: "Exposure",
          value: (_g = params.exposure) != null ? _g : 0,
          min: -100,
          max: 100,
          onChange: (v) => onUpdateParams({ exposure: v }),
          disabled
        }
      ),
      /* @__PURE__ */ jsx2(
        SliderControl,
        {
          label: "Highlights",
          value: (_h = params.highlights) != null ? _h : 0,
          min: -100,
          max: 100,
          onChange: (v) => onUpdateParams({ highlights: v }),
          disabled
        }
      ),
      /* @__PURE__ */ jsx2(
        SliderControl,
        {
          label: "Shadows",
          value: (_i = params.shadows) != null ? _i : 0,
          min: -100,
          max: 100,
          onChange: (v) => onUpdateParams({ shadows: v }),
          disabled
        }
      )
    ] })
  ] });
}

// src/lib/luminate/components/AIChat.tsx
import { Loader2 as Loader22, X, ArrowUp, Bot, Plus, Wand2, ChevronDown, Paperclip, ImagePlus, Sparkles, SunMedium, Layers } from "lucide-react";
import { useCallback as useCallback3, useRef as useRef2, useState as useState3, useEffect as useEffect2 } from "react";

// src/lib/luminate/components/AgentStepIndicator.tsx
import { Wrench, CheckCircle, AlertCircle, Brain, Loader2 } from "lucide-react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function StepRow({ icon, children, muted }) {
  return /* @__PURE__ */ jsxs3("div", { className: `flex items-start gap-2 text-xs ${muted ? "text-zinc-400" : "text-zinc-600"}`, children: [
    /* @__PURE__ */ jsx3("span", { className: "mt-0.5 shrink-0", children: icon }),
    /* @__PURE__ */ jsx3("span", { className: "min-w-0 break-words", children })
  ] });
}
function AgentStepIndicator({ steps }) {
  var _a;
  if (steps.length === 0) return null;
  const items = [];
  let i = 0;
  while (i < steps.length) {
    const step = steps[i];
    if (step.type === "thinking") {
      items.push({
        key: i,
        node: /* @__PURE__ */ jsx3(StepRow, { icon: /* @__PURE__ */ jsx3(Brain, { className: "w-3.5 h-3.5 text-blue-500" }), children: step.reasoning })
      });
      i++;
    } else if (step.type === "tool_call") {
      const resultStep = i + 1 < steps.length && steps[i + 1].type === "tool_result" ? steps[i + 1] : null;
      const args = Object.entries((_a = step.toolArgs) != null ? _a : {}).map(([k, v]) => `${k}: ${typeof v === "number" ? Number.isInteger(v) ? v : v.toFixed(1) : v}`).join(", ");
      items.push({
        key: i,
        node: /* @__PURE__ */ jsxs3(StepRow, { icon: /* @__PURE__ */ jsx3(Wrench, { className: "w-3.5 h-3.5 text-amber-500" }), children: [
          /* @__PURE__ */ jsx3("span", { className: "font-medium text-zinc-700", children: step.toolName }),
          /* @__PURE__ */ jsxs3("span", { className: "text-zinc-400 ml-1", children: [
            "(",
            args,
            ")"
          ] }),
          resultStep && /* @__PURE__ */ jsxs3("span", { className: "text-zinc-400 ml-1", children: [
            "\u2014 ",
            resultStep.description
          ] })
        ] })
      });
      i += resultStep ? 2 : 1;
    } else if (step.type === "tool_result") {
      items.push({
        key: i,
        node: /* @__PURE__ */ jsx3(StepRow, { icon: /* @__PURE__ */ jsx3(CheckCircle, { className: "w-3.5 h-3.5 text-green-500" }), muted: true, children: step.description })
      });
      i++;
    } else if (step.type === "params_update" || step.type === "logo_update") {
      i++;
    } else if (step.type === "error") {
      items.push({
        key: i,
        node: /* @__PURE__ */ jsx3(StepRow, { icon: /* @__PURE__ */ jsx3(AlertCircle, { className: "w-3.5 h-3.5 text-red-500" }), children: /* @__PURE__ */ jsx3("span", { className: "text-red-600", children: step.error }) })
      });
      i++;
    } else if (step.type === "complete") {
      i++;
    } else {
      i++;
    }
  }
  const lastStep = steps[steps.length - 1];
  const stillWorking = lastStep.type !== "complete" && lastStep.type !== "error";
  return /* @__PURE__ */ jsxs3("div", { className: "flex flex-col gap-1.5 py-1 pl-1 border-l-2 border-zinc-200", children: [
    items.map(({ key, node }) => /* @__PURE__ */ jsx3("div", { className: "pl-2", children: node }, key)),
    stillWorking && /* @__PURE__ */ jsx3("div", { className: "pl-2", children: /* @__PURE__ */ jsx3(StepRow, { icon: /* @__PURE__ */ jsx3(Loader2, { className: "w-3.5 h-3.5 text-zinc-400 animate-spin" }), muted: true, children: "Working..." }) })
  ] });
}

// src/lib/luminate/components/AIChat.tsx
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function AIChat({
  onSubmit,
  onAgentEdit,
  isProcessing,
  lastExplanation,
  lastParams,
  previousParams,
  hasImage = false,
  agentSteps = []
}) {
  const [instruction, setInstruction] = useState3("");
  const [turns, setTurns] = useState3([]);
  const [agentMode, setAgentMode] = useState3(true);
  const [logoImage, setLogoImage] = useState3(null);
  const [logoMimeType, setLogoMimeType] = useState3(null);
  const [showModeMenu, setShowModeMenu] = useState3(false);
  const [noImageNudge, setNoImageNudge] = useState3(false);
  const logoInputRef = useRef2(null);
  const textareaRef = useRef2(null);
  const scrollRef = useRef2(null);
  const modeMenuRef = useRef2(null);
  const isDisabled = isProcessing;
  useEffect2(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 120;
    if (el.scrollHeight > maxH) {
      el.style.height = maxH + "px";
      el.style.overflowY = "auto";
    } else {
      el.style.height = el.scrollHeight + "px";
      el.style.overflowY = "hidden";
    }
  }, [instruction]);
  useEffect2(() => {
    const handler = (e) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect2(() => {
    if (agentSteps.length === 0) return;
    setTurns((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = __spreadProps(__spreadValues({}, updated[updated.length - 1]), { steps: agentSteps });
      return updated;
    });
  }, [agentSteps]);
  const prevExplanationRef = useRef2(lastExplanation);
  useEffect2(() => {
    if (lastExplanation && lastExplanation !== prevExplanationRef.current) {
      prevExplanationRef.current = lastExplanation;
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.aiResponse === lastExplanation) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = __spreadProps(__spreadValues({}, last), {
          aiResponse: lastExplanation,
          params: lastParams,
          prevParams: previousParams
        });
        return updated;
      });
    }
  }, [lastExplanation, lastParams, previousParams]);
  useEffect2(() => {
    var _a;
    (_a = scrollRef.current) == null ? void 0 : _a.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, agentSteps]);
  const handleLogoUpload = useCallback3((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      var _a;
      if ((_a = e.target) == null ? void 0 : _a.result) {
        setLogoImage(e.target.result);
        setLogoMimeType(file.type);
      }
    };
    reader.readAsDataURL(file);
  }, []);
  useEffect2(() => {
    if (hasImage) setNoImageNudge(false);
  }, [hasImage]);
  const handleSubmit = async (text) => {
    if (!text.trim() || isDisabled) return;
    if (!hasImage) {
      setNoImageNudge(true);
      return;
    }
    setNoImageNudge(false);
    const submitted = text.trim();
    setInstruction("");
    setTurns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), userMessage: submitted, steps: [], attachedLogo: !!logoImage }
    ]);
    if (agentMode && onAgentEdit) {
      let logoB64;
      let logoMT;
      if (logoImage) {
        const match = logoImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          logoMT = match[1];
          logoB64 = match[2];
        }
      }
      await onAgentEdit(submitted, logoB64, logoMT);
    } else {
      await onSubmit(submitted);
    }
  };
  return /* @__PURE__ */ jsxs4("div", { className: "flex flex-col h-full min-h-0", children: [
    /* @__PURE__ */ jsx4("div", { ref: scrollRef, className: "flex-1 overflow-y-auto min-h-0", children: turns.length === 0 ? /* @__PURE__ */ jsxs4("div", { className: "flex flex-col items-center justify-center h-full px-6 select-none", children: [
      /* @__PURE__ */ jsxs4("div", { className: "relative mb-6", children: [
        /* @__PURE__ */ jsx4("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20", children: /* @__PURE__ */ jsx4(Sparkles, { className: "w-8 h-8 text-white" }) }),
        /* @__PURE__ */ jsx4("div", { className: "absolute -top-2 -right-3 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md rotate-12", children: /* @__PURE__ */ jsx4(SunMedium, { className: "w-4 h-4 text-white" }) }),
        /* @__PURE__ */ jsx4("div", { className: "absolute -bottom-2 -left-3 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md -rotate-12", children: /* @__PURE__ */ jsx4(Layers, { className: "w-4 h-4 text-white" }) })
      ] }),
      /* @__PURE__ */ jsx4("h3", { className: "text-base font-semibold text-zinc-800 mb-1", children: "AI Photo Editor" }),
      !hasImage ? /* @__PURE__ */ jsxs4("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx4("p", { className: "text-sm text-zinc-400 mb-4 max-w-[220px] leading-relaxed", children: "Drop a photo on the canvas to get started, then tell me what to change" }),
        /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-dashed border-zinc-200", children: [
          /* @__PURE__ */ jsx4(ImagePlus, { className: "w-4 h-4 text-zinc-300" }),
          /* @__PURE__ */ jsx4("span", { className: "text-xs text-zinc-400", children: "Add an image to begin" })
        ] })
      ] }) : /* @__PURE__ */ jsx4("p", { className: "text-sm text-zinc-400 max-w-[220px] text-center leading-relaxed", children: "Describe the edits you want \u2014 adjust lighting, add a logo, remove backgrounds, and more" })
    ] }) : /* @__PURE__ */ jsx4("div", { className: "flex flex-col gap-4 pb-2", children: turns.map((turn, turnIdx) => {
      const isCurrentTurn = turnIdx === turns.length - 1;
      const stepsToShow = isCurrentTurn ? agentSteps : turn.steps;
      return /* @__PURE__ */ jsxs4("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxs4("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx4("div", { className: "w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsx4("span", { className: "text-[10px] font-bold text-white", children: "U" }) }),
          /* @__PURE__ */ jsxs4("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx4("p", { className: "text-sm text-zinc-800 leading-relaxed", children: turn.userMessage }),
            turn.attachedLogo && /* @__PURE__ */ jsxs4("span", { className: "inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-zinc-100 rounded text-[10px] text-zinc-500", children: [
              /* @__PURE__ */ jsx4(Paperclip, { className: "w-2.5 h-2.5" }),
              " logo attached"
            ] })
          ] })
        ] }),
        stepsToShow.length > 0 && /* @__PURE__ */ jsx4("div", { className: "ml-8", children: /* @__PURE__ */ jsx4(AgentStepIndicator, { steps: stepsToShow }) }),
        turn.aiResponse && /* @__PURE__ */ jsxs4("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx4("div", { className: "w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsx4(Bot, { className: "w-3.5 h-3.5 text-white" }) }),
          /* @__PURE__ */ jsx4("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx4("p", { className: "text-sm text-zinc-700 leading-relaxed", children: turn.aiResponse }) })
        ] }),
        isCurrentTurn && isProcessing && !turn.aiResponse && stepsToShow.length === 0 && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2 ml-8", children: [
          /* @__PURE__ */ jsx4(Loader22, { className: "w-3.5 h-3.5 text-zinc-400 animate-spin" }),
          /* @__PURE__ */ jsx4("span", { className: "text-xs text-zinc-400", children: "Working..." })
        ] }),
        !isCurrentTurn && /* @__PURE__ */ jsx4("div", { className: "h-px bg-zinc-100 mt-1" })
      ] }, turn.id);
    }) }) }),
    /* @__PURE__ */ jsxs4("div", { className: "border-t border-zinc-100 pt-3 shrink-0", children: [
      /* @__PURE__ */ jsx4(
        "input",
        {
          ref: logoInputRef,
          type: "file",
          accept: "image/*",
          className: "hidden",
          onChange: (e) => {
            var _a;
            const f = (_a = e.target.files) == null ? void 0 : _a[0];
            if (f) handleLogoUpload(f);
          }
        }
      ),
      noImageNudge && /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg", children: [
        /* @__PURE__ */ jsx4(ImagePlus, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" }),
        /* @__PURE__ */ jsx4("span", { className: "text-xs text-amber-700", children: "Drop or upload a photo on the canvas first, then I can edit it for you" })
      ] }),
      logoImage && /* @__PURE__ */ jsx4("div", { className: "flex items-center gap-1.5 mb-2 ml-0.5", children: /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1.5 pl-1 pr-2 py-0.5 bg-zinc-100 rounded-md border border-zinc-200", children: [
        /* @__PURE__ */ jsx4("div", { className: "w-5 h-5 rounded overflow-hidden shrink-0", children: /* @__PURE__ */ jsx4("img", { src: logoImage, alt: "Logo", className: "w-full h-full object-contain bg-white" }) }),
        /* @__PURE__ */ jsx4("span", { className: "text-[11px] text-zinc-600", children: "Logo" }),
        /* @__PURE__ */ jsx4(
          "button",
          {
            onClick: () => {
              setLogoImage(null);
              setLogoMimeType(null);
            },
            className: "ml-0.5 p-0.5 rounded hover:bg-zinc-200 transition-colors",
            children: /* @__PURE__ */ jsx4(X, { className: "w-3 h-3 text-zinc-400" })
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs4("div", { className: "relative border border-zinc-200 rounded-xl bg-zinc-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all", children: [
        /* @__PURE__ */ jsx4(
          "textarea",
          {
            ref: textareaRef,
            value: instruction,
            onChange: (e) => setInstruction(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(instruction);
              }
            },
            placeholder: turns.length > 0 ? "Ask for more edits..." : "Describe what you want...",
            disabled: isDisabled,
            rows: 1,
            className: "w-full bg-transparent px-3 pt-2.5 pb-9 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          }
        ),
        /* @__PURE__ */ jsxs4("div", { className: "absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 pb-1.5", children: [
          /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx4(
              "button",
              {
                onClick: () => {
                  var _a;
                  return (_a = logoInputRef.current) == null ? void 0 : _a.click();
                },
                disabled: isDisabled,
                title: "Attach file",
                className: "p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                children: /* @__PURE__ */ jsx4(Plus, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsxs4("div", { className: "relative", ref: modeMenuRef, children: [
              /* @__PURE__ */ jsxs4(
                "button",
                {
                  onClick: () => setShowModeMenu(!showModeMenu),
                  className: "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors",
                  children: [
                    agentMode ? /* @__PURE__ */ jsxs4(Fragment2, { children: [
                      /* @__PURE__ */ jsx4(Bot, { className: "w-3.5 h-3.5 text-purple-500" }),
                      /* @__PURE__ */ jsx4("span", { children: "Agent" })
                    ] }) : /* @__PURE__ */ jsxs4(Fragment2, { children: [
                      /* @__PURE__ */ jsx4(Wand2, { className: "w-3.5 h-3.5 text-blue-500" }),
                      /* @__PURE__ */ jsx4("span", { children: "Quick" })
                    ] }),
                    /* @__PURE__ */ jsx4(ChevronDown, { className: "w-3 h-3" })
                  ]
                }
              ),
              showModeMenu && /* @__PURE__ */ jsxs4("div", { className: "absolute bottom-full left-0 mb-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden z-10", children: [
                /* @__PURE__ */ jsxs4(
                  "button",
                  {
                    onClick: () => {
                      setAgentMode(true);
                      setShowModeMenu(false);
                    },
                    className: `flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors ${agentMode ? "bg-purple-50 text-purple-700" : "text-zinc-600 hover:bg-zinc-50"}`,
                    children: [
                      /* @__PURE__ */ jsx4(Bot, { className: "w-3.5 h-3.5" }),
                      /* @__PURE__ */ jsxs4("div", { children: [
                        /* @__PURE__ */ jsx4("div", { className: "font-medium", children: "Agent Mode" }),
                        /* @__PURE__ */ jsx4("div", { className: "text-[10px] text-zinc-400", children: "Multi-step reasoning" })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs4(
                  "button",
                  {
                    onClick: () => {
                      setAgentMode(false);
                      setShowModeMenu(false);
                    },
                    className: `flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors ${!agentMode ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-50"}`,
                    children: [
                      /* @__PURE__ */ jsx4(Wand2, { className: "w-3.5 h-3.5" }),
                      /* @__PURE__ */ jsxs4("div", { children: [
                        /* @__PURE__ */ jsx4("div", { className: "font-medium", children: "Quick Edit" }),
                        /* @__PURE__ */ jsx4("div", { className: "text-[10px] text-zinc-400", children: "Single-shot edit" })
                      ] })
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx4(
            "button",
            {
              onClick: () => handleSubmit(instruction),
              disabled: isDisabled || !instruction.trim(),
              className: "p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 rounded-lg transition-colors shrink-0",
              children: isProcessing ? /* @__PURE__ */ jsx4(Loader22, { className: "w-3.5 h-3.5 text-white animate-spin" }) : /* @__PURE__ */ jsx4(ArrowUp, { className: "w-3.5 h-3.5 text-white" })
            }
          )
        ] })
      ] })
    ] })
  ] });
}

// src/lib/luminate/components/BackgroundRemoval.tsx
import { Eraser, Loader2 as Loader23, Undo2 } from "lucide-react";
import { useState as useState4 } from "react";
import { Fragment as Fragment3, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function BackgroundRemoval({
  imageSrc,
  isRemoved,
  onRemove,
  onRestore,
  disabled
}) {
  const [isProcessing, setIsProcessing] = useState4(false);
  const [progress, setProgress] = useState4("");
  const handleRemove = async () => {
    if (!imageSrc || isProcessing) return;
    setIsProcessing(true);
    setProgress("Loading model...");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      setProgress("Processing image...");
      const result = await removeBackground(blob, {
        progress: (key, current, total) => {
          if (key === "compute:inference") {
            const pct = total > 0 ? Math.round(current / total * 100) : 0;
            setProgress(`Removing background... ${pct}%`);
          } else if (key === "fetch:model") {
            setProgress("Downloading AI model...");
          }
        }
      });
      setProgress("Finalizing...");
      const reader = new FileReader();
      reader.onload = (e) => {
        var _a;
        if ((_a = e.target) == null ? void 0 : _a.result) {
          onRemove(e.target.result);
        }
        setIsProcessing(false);
        setProgress("");
      };
      reader.readAsDataURL(result);
    } catch (error) {
      console.error("Background removal failed:", error);
      setIsProcessing(false);
      setProgress("");
    }
  };
  if (isRemoved) {
    return /* @__PURE__ */ jsxs5(
      "button",
      {
        onClick: onRestore,
        className: "flex items-center gap-2 w-full py-2 px-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg text-sm transition-colors",
        children: [
          /* @__PURE__ */ jsx5(Undo2, { className: "w-4 h-4" }),
          "Restore Background"
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs5("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsx5(
      "button",
      {
        onClick: handleRemove,
        disabled: disabled || !imageSrc || isProcessing,
        className: "flex items-center gap-2 w-full py-2 px-3 bg-purple-50 border border-purple-200 hover:bg-purple-100 disabled:bg-zinc-50 disabled:border-zinc-200 text-purple-700 disabled:text-zinc-400 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed",
        children: isProcessing ? /* @__PURE__ */ jsxs5(Fragment3, { children: [
          /* @__PURE__ */ jsx5(Loader23, { className: "w-4 h-4 animate-spin" }),
          progress || "Processing..."
        ] }) : /* @__PURE__ */ jsxs5(Fragment3, { children: [
          /* @__PURE__ */ jsx5(Eraser, { className: "w-4 h-4" }),
          "Remove Background"
        ] })
      }
    ),
    isProcessing && /* @__PURE__ */ jsx5("p", { className: "text-[11px] text-zinc-400 px-1", children: "This runs entirely in your browser. First use downloads a ~40MB model." })
  ] });
}

// src/lib/luminate/components/WatermarkPanel.tsx
import { Type, ImagePlus as ImagePlus2, X as X2, Trash2 } from "lucide-react";
import { useState as useState5, useRef as useRef3, useEffect as useEffect3 } from "react";
import { Fragment as Fragment4, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function WatermarkPanel({
  watermark,
  onAdd,
  onUpdate,
  onRemove,
  disabled
}) {
  const [mode, setMode] = useState5("image");
  const [text, setText] = useState5("");
  const [logoPreview, setLogoPreview] = useState5(null);
  const fileRef = useRef3(null);
  useEffect3(() => {
    if (watermark == null ? void 0 : watermark.config.imageUrl) {
      setLogoPreview(watermark.config.imageUrl);
    }
  }, [watermark == null ? void 0 : watermark.config.imageUrl]);
  const handleLogoUpload = (file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      var _a;
      if ((_a = e.target) == null ? void 0 : _a.result) {
        setLogoPreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };
  const handleAdd = () => {
    if (mode === "text" && text.trim()) {
      onAdd("text", text.trim());
    } else if (mode === "image" && logoPreview) {
      onAdd("image", logoPreview);
    }
  };
  const isActive = !!watermark;
  return /* @__PURE__ */ jsx6("div", { className: `flex flex-col gap-4 min-w-0 overflow-hidden ${disabled ? "opacity-50 pointer-events-none" : ""}`, children: isActive ? /* @__PURE__ */ jsxs6(Fragment4, { children: [
    /* @__PURE__ */ jsxs6("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx6("p", { className: "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider", children: "Active Watermark" }),
      /* @__PURE__ */ jsxs6(
        "button",
        {
          onClick: onRemove,
          className: "flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors",
          children: [
            /* @__PURE__ */ jsx6(Trash2, { className: "w-3 h-3" }),
            "Remove"
          ]
        }
      )
    ] }),
    watermark.config.imageUrl && /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-200", children: [
      /* @__PURE__ */ jsx6(
        "img",
        {
          src: watermark.config.imageUrl,
          alt: "Logo",
          className: "w-10 h-10 object-contain rounded bg-white border border-zinc-100"
        }
      ),
      /* @__PURE__ */ jsx6("p", { className: "text-xs text-zinc-500", children: "Logo watermark" })
    ] }),
    watermark.config.text && /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-200", children: [
      /* @__PURE__ */ jsx6("div", { className: "w-10 h-10 flex items-center justify-center rounded bg-white border border-zinc-100", children: /* @__PURE__ */ jsx6(Type, { className: "w-5 h-5 text-zinc-400" }) }),
      /* @__PURE__ */ jsxs6("p", { className: "text-xs text-zinc-500 truncate", children: [
        "\u201C",
        watermark.config.text,
        "\u201D"
      ] })
    ] }),
    /* @__PURE__ */ jsxs6("div", { className: "flex flex-col gap-1.5", children: [
      /* @__PURE__ */ jsxs6("div", { className: "flex justify-between text-xs", children: [
        /* @__PURE__ */ jsx6("span", { className: "text-zinc-500 font-medium", children: "Opacity" }),
        /* @__PURE__ */ jsxs6("span", { className: "text-zinc-400 font-mono tabular-nums", children: [
          Math.round(watermark.config.opacity * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx6(
        "input",
        {
          type: "range",
          min: 5,
          max: 100,
          value: watermark.config.opacity * 100,
          onChange: (e) => onUpdate({ opacity: Number(e.target.value) / 100 }),
          className: "w-full cursor-pointer"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs6("div", { className: "flex flex-col gap-1.5", children: [
      /* @__PURE__ */ jsxs6("div", { className: "flex justify-between text-xs", children: [
        /* @__PURE__ */ jsx6("span", { className: "text-zinc-500 font-medium", children: "Size" }),
        /* @__PURE__ */ jsxs6("span", { className: "text-zinc-400 font-mono tabular-nums", children: [
          Math.round(watermark.config.scale * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx6(
        "input",
        {
          type: "range",
          min: 3,
          max: 80,
          value: watermark.config.scale * 100,
          onChange: (e) => onUpdate({ scale: Number(e.target.value) / 100 }),
          className: "w-full cursor-pointer"
        }
      )
    ] }),
    /* @__PURE__ */ jsx6("p", { className: "text-[11px] text-zinc-400 break-words", children: "Drag on canvas to reposition. Press Delete to remove." })
  ] }) : /* @__PURE__ */ jsxs6(Fragment4, { children: [
    /* @__PURE__ */ jsxs6("div", { children: [
      /* @__PURE__ */ jsx6("p", { className: "text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2", children: "Type" }),
      /* @__PURE__ */ jsxs6("div", { className: "flex gap-1 bg-zinc-100 rounded-lg p-0.5", children: [
        /* @__PURE__ */ jsxs6(
          "button",
          {
            onClick: () => setMode("image"),
            className: `flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${mode === "image" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`,
            children: [
              /* @__PURE__ */ jsx6(ImagePlus2, { className: "w-3.5 h-3.5" }),
              " Logo"
            ]
          }
        ),
        /* @__PURE__ */ jsxs6(
          "button",
          {
            onClick: () => setMode("text"),
            className: `flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${mode === "text" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`,
            children: [
              /* @__PURE__ */ jsx6(Type, { className: "w-3.5 h-3.5" }),
              " Text"
            ]
          }
        )
      ] })
    ] }),
    mode === "text" ? /* @__PURE__ */ jsx6(
      "input",
      {
        type: "text",
        value: text,
        onChange: (e) => setText(e.target.value),
        placeholder: "Watermark text...",
        className: "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      }
    ) : /* @__PURE__ */ jsxs6("div", { children: [
      /* @__PURE__ */ jsx6(
        "input",
        {
          ref: fileRef,
          type: "file",
          accept: "image/*",
          className: "hidden",
          onChange: (e) => {
            var _a;
            const file = (_a = e.target.files) == null ? void 0 : _a[0];
            if (file) handleLogoUpload(file);
          }
        }
      ),
      logoPreview ? /* @__PURE__ */ jsxs6("div", { className: "relative", children: [
        /* @__PURE__ */ jsxs6(
          "div",
          {
            className: "flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors",
            onClick: () => {
              var _a;
              return (_a = fileRef.current) == null ? void 0 : _a.click();
            },
            children: [
              /* @__PURE__ */ jsx6(
                "img",
                {
                  src: logoPreview,
                  alt: "Logo preview",
                  className: "w-12 h-12 object-contain rounded bg-white border border-zinc-100"
                }
              ),
              /* @__PURE__ */ jsxs6("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx6("p", { className: "text-sm text-zinc-600 font-medium", children: "Logo ready" }),
                /* @__PURE__ */ jsx6("p", { className: "text-xs text-zinc-400", children: "Click to change" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx6(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              setLogoPreview(null);
            },
            className: "absolute top-1.5 right-1.5 p-1 bg-zinc-200 hover:bg-zinc-300 rounded-full transition-colors",
            children: /* @__PURE__ */ jsx6(X2, { className: "w-3 h-3 text-zinc-500" })
          }
        )
      ] }) : /* @__PURE__ */ jsxs6(
        "button",
        {
          onClick: () => {
            var _a;
            return (_a = fileRef.current) == null ? void 0 : _a.click();
          },
          className: "w-full py-6 px-3 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-lg text-sm text-zinc-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all",
          children: [
            /* @__PURE__ */ jsx6(ImagePlus2, { className: "w-5 h-5 mx-auto mb-1" }),
            "Upload logo"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx6(
      "button",
      {
        onClick: handleAdd,
        disabled: mode === "text" && !text.trim() || mode === "image" && !logoPreview,
        className: "w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 text-white disabled:text-zinc-400 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed",
        children: "Add to Image"
      }
    )
  ] }) });
}

// src/lib/luminate/components/LuminateEditor.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function LuminateEditor({
  apiEndpoint = "/api/ai-edit",
  onExport
}) {
  const canvasRef = useRef4(null);
  const fileInputRef = useRef4(null);
  const {
    state,
    setImage,
    updateParams,
    setParams,
    undo,
    redo,
    reset,
    setProcessing,
    setBackgroundRemoved
  } = useEditorState();
  const [activeTab, setActiveTab] = useState6("ai");
  const [bgRemovedSrc, setBgRemovedSrc] = useState6(null);
  const [lastExplanation, setLastExplanation] = useState6();
  const [lastAIParams, setLastAIParams] = useState6(null);
  const [preAIParams, setPreAIParams] = useState6(null);
  const [watermark, setWatermark] = useState6(null);
  const [cropMode, setCropMode] = useState6(false);
  const [showOriginal, setShowOriginal] = useState6(false);
  const [isDragging, setIsDragging] = useState6(false);
  const [sessions, setSessions] = useState6([]);
  const [activeSessionId, setActiveSessionId] = useState6(null);
  const [agentSteps, setAgentSteps] = useState6([]);
  const [sidebarWidth, setSidebarWidth] = useState6(400);
  const [isResizing, setIsResizing] = useState6(false);
  const resizeRef = useRef4(null);
  const hasImage = !!state.originalImage;
  useEffect4(() => {
    const handleKeyDown = (e) => {
      var _a;
      if ((e.key === "Delete" || e.key === "Backspace") && watermark) {
        const tag = (_a = e.target) == null ? void 0 : _a.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setWatermark(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [watermark]);
  useEffect4(() => {
    if (!isResizing) return;
    const handleMove = (e) => {
      if (!resizeRef.current) return;
      setSidebarWidth(Math.max(280, Math.min(600, resizeRef.current.startWidth + (resizeRef.current.startX - e.clientX))));
    };
    const handleUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isResizing]);
  const makeThumbnail = useCallback4((dataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = 120;
        const aspect = img.naturalWidth / img.naturalHeight;
        const w = aspect > 1 ? size : size * aspect;
        const h = aspect > 1 ? size / aspect : size;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.6));
      };
      img.src = dataUrl;
    });
  }, []);
  const resetEditorState = useCallback4(() => {
    setBgRemovedSrc(null);
    setWatermark(null);
    setCropMode(false);
    setShowOriginal(false);
    setLastExplanation(void 0);
    setLastAIParams(null);
    setPreAIParams(null);
    setAgentSteps([]);
  }, []);
  const handleLoadImage = useCallback4(
    async (dataUrl) => {
      const thumb = await makeThumbnail(dataUrl);
      const id = crypto.randomUUID();
      setSessions((prev) => [...prev, { id, thumbnail: thumb, originalImage: dataUrl, timestamp: Date.now() }]);
      setActiveSessionId(id);
      setImage(dataUrl);
      resetEditorState();
    },
    [setImage, makeThumbnail, resetEditorState]
  );
  const handleFiles = useCallback4(
    (files) => {
      const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArr.length === 0) return;
      fileArr.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          var _a;
          if ((_a = e.target) == null ? void 0 : _a.result) {
            const dataUrl = e.target.result;
            if (idx === 0) {
              handleLoadImage(dataUrl);
            } else {
              makeThumbnail(dataUrl).then((thumb) => {
                setSessions((prev) => [...prev, {
                  id: crypto.randomUUID(),
                  thumbnail: thumb,
                  originalImage: dataUrl,
                  timestamp: Date.now()
                }]);
              });
            }
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [handleLoadImage, makeThumbnail]
  );
  const handleSwitchSession = useCallback4(
    (session) => {
      if (session.id === activeSessionId) return;
      setActiveSessionId(session.id);
      setImage(session.originalImage);
      resetEditorState();
    },
    [activeSessionId, setImage, resetEditorState]
  );
  const handleDrop = useCallback4(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );
  const handleAIEdit = useCallback4(
    async (instruction) => {
      if (!state.originalImage) return;
      setProcessing(true);
      setLastExplanation(void 0);
      setPreAIParams(__spreadValues({}, state.currentParams));
      setLastAIParams(null);
      try {
        const match = state.originalImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) throw new Error("Invalid image data");
        const [, mimeType, imageBase64] = match;
        const res = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, mimeType, instruction }) });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "AI request failed");
        }
        const result = await res.json();
        setParams(result.params);
        setLastAIParams(result.params);
        setLastExplanation(result.explanation);
      } catch (error) {
        setLastExplanation(`Error: ${error instanceof Error ? error.message : "Failed"}`);
      } finally {
        setProcessing(false);
      }
    },
    [state.originalImage, state.currentParams, apiEndpoint, setParams, setProcessing]
  );
  const handleAgentEdit = useCallback4(
    async (instruction, logoBase64, logoMimeType) => {
      var _a, _b;
      if (!state.originalImage) return;
      setProcessing(true);
      setAgentSteps([]);
      setLastExplanation(void 0);
      setPreAIParams(__spreadValues({}, state.currentParams));
      setLastAIParams(null);
      try {
        const match = state.originalImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) throw new Error("Invalid image data");
        const [, mimeType, imageBase64] = match;
        const res = await fetch("/api/agent-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            mimeType,
            instruction,
            currentParams: state.currentParams,
            logoImageBase64: logoBase64,
            logoMimeType
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Agent request failed");
        }
        const reader = (_a = res.body) == null ? void 0 : _a.getReader();
        if (!reader) throw new Error("No response stream");
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = (_b = lines.pop()) != null ? _b : "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);
            try {
              const event = JSON.parse(json);
              setAgentSteps((prev) => [...prev, event]);
              if (event.type === "params_update" && event.currentParams) {
                setParams(event.currentParams);
                setLastAIParams(event.currentParams);
              }
              if (event.type === "logo_update" && event.logoPlacement) {
                const lp = event.logoPlacement;
                setWatermark({
                  config: {
                    imageUrl: `data:${lp.mimeType};base64,${lp.imageBase64}`,
                    opacity: lp.opacity,
                    scale: lp.scale
                  },
                  xPercent: lp.xPercent,
                  yPercent: lp.yPercent
                });
              }
              if (event.type === "complete") setLastExplanation(event.explanation);
              if (event.type === "error") setLastExplanation(`Error: ${event.error}`);
            } catch (e) {
            }
          }
        }
      } catch (error) {
        setLastExplanation(`Error: ${error instanceof Error ? error.message : "Failed"}`);
        setAgentSteps((prev) => [...prev, { type: "error", error: error instanceof Error ? error.message : "Failed" }]);
      } finally {
        setProcessing(false);
      }
    },
    [state.originalImage, state.currentParams, setParams, setProcessing]
  );
  const handleExport = useCallback4(() => {
    var _a;
    const dataUrl = (_a = canvasRef.current) == null ? void 0 : _a.exportImage();
    if (dataUrl) {
      if (onExport) onExport(dataUrl);
      else {
        const link = document.createElement("a");
        link.download = "luminate-export.png";
        link.href = dataUrl;
        link.click();
      }
    }
  }, [onExport]);
  const handleAddWatermark = useCallback4((type, content) => {
    setWatermark({
      config: { text: type === "text" ? content : void 0, imageUrl: type === "image" ? content : void 0, opacity: 0.7, scale: 0.2 },
      xPercent: 40,
      yPercent: 40
    });
  }, []);
  const handleUpdateWatermark = useCallback4(
    (updates) => {
      setWatermark((prev) => prev ? __spreadProps(__spreadValues({}, prev), { config: __spreadValues(__spreadValues({}, prev.config), updates) }) : null);
    },
    []
  );
  const handleWatermarkMove = useCallback4(
    (xPercent, yPercent) => {
      setWatermark((prev) => prev ? __spreadProps(__spreadValues({}, prev), { xPercent, yPercent }) : null);
    },
    []
  );
  const handleBackgroundRemove = useCallback4(
    (resultDataUrl) => {
      setBgRemovedSrc(resultDataUrl);
      setBackgroundRemoved(true);
    },
    [setBackgroundRemoved]
  );
  const handleBackgroundRestore = useCallback4(() => {
    setBgRemovedSrc(null);
    setBackgroundRemoved(false);
  }, [setBackgroundRemoved]);
  const handleReset = useCallback4(() => {
    reset();
    resetEditorState();
  }, [reset, resetEditorState]);
  const handleCropComplete = useCallback4(
    (croppedDataUrl) => {
      setImage(croppedDataUrl);
      setCropMode(false);
      setBgRemovedSrc(null);
    },
    [setImage]
  );
  const tabs = [
    { id: "ai", label: "AI", icon: /* @__PURE__ */ jsx7(Sparkles2, { className: "w-4 h-4" }) },
    { id: "adjust", label: "Adjust", icon: /* @__PURE__ */ jsx7(SlidersHorizontal, { className: "w-4 h-4" }) },
    { id: "watermark", label: "Watermark", icon: /* @__PURE__ */ jsx7(Stamp, { className: "w-4 h-4" }) }
  ];
  return /* @__PURE__ */ jsxs7("div", { className: "flex h-full", children: [
    /* @__PURE__ */ jsx7(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/*",
        multiple: true,
        className: "hidden",
        onChange: (e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          e.target.value = "";
        }
      }
    ),
    /* @__PURE__ */ jsxs7("div", { className: "flex-1 flex flex-col min-w-0", children: [
      sessions.length > 1 && /* @__PURE__ */ jsxs7("div", { className: "flex items-center gap-2 px-4 pt-3 pb-1 overflow-x-auto", children: [
        sessions.map((s) => /* @__PURE__ */ jsx7(
          "button",
          {
            onClick: () => handleSwitchSession(s),
            className: `shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${s.id === activeSessionId ? "border-blue-500 shadow-md" : "border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100"}`,
            children: /* @__PURE__ */ jsx7("img", { src: s.thumbnail, alt: "", className: "w-full h-full object-cover" })
          },
          s.id
        )),
        /* @__PURE__ */ jsx7(
          "button",
          {
            onClick: () => {
              var _a;
              return (_a = fileInputRef.current) == null ? void 0 : _a.click();
            },
            className: "shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-zinc-300 hover:border-blue-400 flex items-center justify-center text-zinc-400 hover:text-blue-500 transition-colors",
            children: /* @__PURE__ */ jsx7(Plus2, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx7("div", { className: "flex-1 p-4 select-none", children: hasImage ? /* @__PURE__ */ jsxs7("div", { className: "h-full relative", children: [
        /* @__PURE__ */ jsx7(
          Canvas,
          {
            ref: canvasRef,
            imageSrc: state.originalImage,
            params: state.currentParams,
            backgroundRemovedSrc: bgRemovedSrc,
            cropMode,
            onCropComplete: handleCropComplete,
            onCropCancel: () => setCropMode(false),
            showOriginal,
            watermark,
            onWatermarkMove: handleWatermarkMove,
            watermarkSelected: activeTab === "watermark" && !!watermark
          }
        ),
        /* @__PURE__ */ jsxs7("div", { className: "absolute top-2 right-2 flex items-center gap-1", children: [
          /* @__PURE__ */ jsx7(
            "button",
            {
              onMouseDown: () => setShowOriginal(true),
              onMouseUp: () => setShowOriginal(false),
              onMouseLeave: () => setShowOriginal(false),
              className: `p-2 rounded-lg shadow-sm border transition-colors ${showOriginal ? "bg-blue-600 border-blue-600 text-white" : "bg-white/90 border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-white"}`,
              title: "Hold to see original",
              children: /* @__PURE__ */ jsx7(Eye, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx7(
            "button",
            {
              onClick: () => {
                var _a;
                return (_a = fileInputRef.current) == null ? void 0 : _a.click();
              },
              className: "p-2 rounded-lg shadow-sm border bg-white/90 border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-white transition-colors",
              title: "Add photos",
              children: /* @__PURE__ */ jsx7(Plus2, { className: "w-4 h-4" })
            }
          )
        ] })
      ] }) : (
        /* Upload area — replaces canvas when no image loaded */
        /* @__PURE__ */ jsxs7(
          "div",
          {
            className: `h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${isDragging ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-100" : "border-zinc-300 bg-white hover:border-blue-400 hover:shadow-md"}`,
            onDragOver: (e) => {
              e.preventDefault();
              setIsDragging(true);
            },
            onDragLeave: () => setIsDragging(false),
            onDrop: handleDrop,
            onClick: () => {
              var _a;
              return (_a = fileInputRef.current) == null ? void 0 : _a.click();
            },
            children: [
              /* @__PURE__ */ jsx7("div", { className: `p-3 rounded-xl mb-3 ${isDragging ? "bg-blue-100" : "bg-zinc-100"}`, children: /* @__PURE__ */ jsx7(Upload, { className: `w-7 h-7 ${isDragging ? "text-blue-500" : "text-zinc-400"}` }) }),
              /* @__PURE__ */ jsx7("p", { className: "text-base font-medium text-zinc-700", children: "Drop photos here or click to browse" }),
              /* @__PURE__ */ jsx7("p", { className: "text-sm text-zinc-400 mt-1", children: "PNG, JPG, WebP \u2014 select multiple" })
            ]
          }
        )
      ) })
    ] }),
    /* @__PURE__ */ jsx7(
      "div",
      {
        className: `w-1.5 flex items-center justify-center cursor-col-resize hover:bg-blue-100 transition-colors group ${isResizing ? "bg-blue-200" : ""}`,
        onMouseDown: (e) => {
          setIsResizing(true);
          resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };
        },
        children: /* @__PURE__ */ jsx7(GripVertical, { className: "w-3 h-3 text-zinc-300 group-hover:text-blue-400" })
      }
    ),
    /* @__PURE__ */ jsxs7("div", { className: "border-l border-zinc-200 bg-white flex flex-col min-w-0 overflow-hidden", style: { width: sidebarWidth }, children: [
      /* @__PURE__ */ jsxs7("div", { className: "flex items-center justify-between px-4 py-2.5 border-b border-zinc-100", children: [
        /* @__PURE__ */ jsxs7("div", { className: "flex items-center gap-0.5", children: [
          /* @__PURE__ */ jsx7(
            "button",
            {
              onClick: undo,
              disabled: state.historyIndex <= 0 || !hasImage,
              className: "p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors",
              title: "Undo",
              children: /* @__PURE__ */ jsx7(Undo22, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx7(
            "button",
            {
              onClick: redo,
              disabled: state.historyIndex >= state.history.length - 1 || !hasImage,
              className: "p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors",
              title: "Redo",
              children: /* @__PURE__ */ jsx7(Redo2, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx7("div", { className: "w-px h-4 bg-zinc-200 mx-1" }),
          /* @__PURE__ */ jsx7(
            "button",
            {
              onClick: handleReset,
              disabled: !hasImage,
              className: "p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors",
              title: "Reset all",
              children: /* @__PURE__ */ jsx7(RefreshCw, { className: "w-3.5 h-3.5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs7(
          "button",
          {
            onClick: handleExport,
            disabled: !hasImage,
            className: "flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm font-medium rounded-lg transition-colors",
            children: [
              /* @__PURE__ */ jsx7(Download, { className: "w-3.5 h-3.5" }),
              " Export"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx7("div", { className: "flex border-b border-zinc-200", children: tabs.map((tab) => /* @__PURE__ */ jsxs7(
        "button",
        {
          onClick: () => setActiveTab(tab.id),
          className: `flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"}`,
          children: [
            tab.icon,
            " ",
            tab.label,
            activeTab === tab.id && /* @__PURE__ */ jsx7("span", { className: "absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full" })
          ]
        },
        tab.id
      )) }),
      /* @__PURE__ */ jsxs7("div", { className: "flex-1 overflow-y-auto min-w-0 flex flex-col", children: [
        activeTab === "adjust" && /* @__PURE__ */ jsxs7("div", { className: "flex flex-col flex-1", children: [
          /* @__PURE__ */ jsx7(
            Toolbar,
            {
              params: state.currentParams,
              onUpdateParams: updateParams,
              disabled: !hasImage,
              cropMode,
              onToggleCrop: () => setCropMode((v) => !v)
            }
          ),
          /* @__PURE__ */ jsx7("div", { className: "px-4 pb-4", children: /* @__PURE__ */ jsx7(
            BackgroundRemoval,
            {
              imageSrc: state.originalImage,
              isRemoved: state.backgroundRemoved,
              onRemove: handleBackgroundRemove,
              onRestore: handleBackgroundRestore
            }
          ) })
        ] }),
        activeTab === "watermark" && /* @__PURE__ */ jsx7("div", { className: "p-4 min-w-0 overflow-hidden", children: /* @__PURE__ */ jsx7(
          WatermarkPanel,
          {
            watermark,
            onAdd: handleAddWatermark,
            disabled: !hasImage,
            onUpdate: handleUpdateWatermark,
            onRemove: () => setWatermark(null)
          }
        ) }),
        activeTab === "ai" && /* @__PURE__ */ jsx7("div", { className: "flex-1 flex flex-col min-h-0 p-4", children: /* @__PURE__ */ jsx7(
          AIChat,
          {
            onSubmit: handleAIEdit,
            onAgentEdit: handleAgentEdit,
            isProcessing: state.isProcessing,
            lastExplanation,
            lastParams: lastAIParams,
            previousParams: preAIParams,
            agentSteps,
            hasImage
          }
        ) })
      ] })
    ] })
  ] });
}

// src/lib/luminate/components/ImageUpload.tsx
import { Upload as Upload2, Image as ImageIcon } from "lucide-react";
import { useCallback as useCallback5, useRef as useRef5, useState as useState7 } from "react";
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function ImageUpload({ onImageLoad }) {
  const [isDragging, setIsDragging] = useState7(false);
  const inputRef = useRef5(null);
  const handleFile = useCallback5(
    (file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        var _a;
        if ((_a = e.target) == null ? void 0 : _a.result) {
          onImageLoad(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad]
  );
  const handleDrop = useCallback5(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );
  return /* @__PURE__ */ jsxs8(
    "div",
    {
      className: `
        flex flex-col items-center justify-center w-full h-full
        border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
        ${isDragging ? "border-blue-400 bg-blue-50" : "border-zinc-300 hover:border-zinc-400 bg-white"}
      `,
      onDragOver: (e) => {
        e.preventDefault();
        setIsDragging(true);
      },
      onDragLeave: () => setIsDragging(false),
      onDrop: handleDrop,
      onClick: () => {
        var _a;
        return (_a = inputRef.current) == null ? void 0 : _a.click();
      },
      children: [
        /* @__PURE__ */ jsx8(
          "input",
          {
            ref: inputRef,
            type: "file",
            accept: "image/*",
            className: "hidden",
            onChange: (e) => {
              var _a;
              const file = (_a = e.target.files) == null ? void 0 : _a[0];
              if (file) handleFile(file);
            }
          }
        ),
        /* @__PURE__ */ jsxs8("div", { className: "flex flex-col items-center gap-3 text-zinc-400", children: [
          /* @__PURE__ */ jsx8("div", { className: `p-4 rounded-full ${isDragging ? "bg-blue-100" : "bg-zinc-100"}`, children: isDragging ? /* @__PURE__ */ jsx8(ImageIcon, { className: "w-8 h-8 text-blue-500" }) : /* @__PURE__ */ jsx8(Upload2, { className: "w-8 h-8 text-zinc-400" }) }),
          /* @__PURE__ */ jsxs8("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx8("p", { className: "text-sm font-medium text-zinc-600", children: "Drop your photo here or click to browse" }),
            /* @__PURE__ */ jsx8("p", { className: "text-xs text-zinc-400 mt-1", children: "PNG, JPG, WebP" })
          ] })
        ] })
      ]
    }
  );
}

// src/lib/luminate/components/HomeScreen.tsx
import {
  Upload as Upload3,
  Sparkles as Sparkles3,
  SlidersHorizontal as SlidersHorizontal2,
  Eraser as Eraser2,
  Stamp as Stamp2,
  Image as ImageIcon2,
  Clock
} from "lucide-react";
import { useCallback as useCallback6, useRef as useRef6, useState as useState8 } from "react";
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var FEATURES = [
  {
    icon: /* @__PURE__ */ jsx9(Sparkles3, { className: "w-5 h-5" }),
    title: "AI-Powered Editing",
    description: "Describe what you want or upload a reference photo. AI analyzes and adjusts -- no hallucinated pixels.",
    color: "bg-blue-50 text-blue-600 border-blue-100"
  },
  {
    icon: /* @__PURE__ */ jsx9(ImageIcon2, { className: "w-5 h-5" }),
    title: "Match Style",
    description: "Upload a gold-standard photo and instantly match its lighting, color grading, and mood.",
    color: "bg-purple-50 text-purple-600 border-purple-100"
  },
  {
    icon: /* @__PURE__ */ jsx9(SlidersHorizontal2, { className: "w-5 h-5" }),
    title: "Manual Controls",
    description: "Fine-tune brightness, contrast, saturation, warmth, sharpness, rotation, and crop.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100"
  },
  {
    icon: /* @__PURE__ */ jsx9(Eraser2, { className: "w-5 h-5" }),
    title: "Background Removal",
    description: "Remove backgrounds entirely in your browser. No uploads, no API keys, free.",
    color: "bg-orange-50 text-orange-600 border-orange-100"
  },
  {
    icon: /* @__PURE__ */ jsx9(Stamp2, { className: "w-5 h-5" }),
    title: "Watermark & Logo",
    description: "Add text or logo watermarks. Drag to position, adjust opacity and size live.",
    color: "bg-pink-50 text-pink-600 border-pink-100"
  }
];
function HomeScreen({ onImageLoad, sessions = [], onRestoreSession }) {
  const [isDragging, setIsDragging] = useState8(false);
  const inputRef = useRef6(null);
  const handleFile = useCallback6(
    (file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        var _a;
        if ((_a = e.target) == null ? void 0 : _a.result) onImageLoad(e.target.result);
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad]
  );
  const handleDrop = useCallback6(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );
  return /* @__PURE__ */ jsx9("div", { className: "flex flex-col items-center h-full overflow-y-auto bg-zinc-50", children: /* @__PURE__ */ jsxs9("div", { className: "w-full max-w-2xl px-6 py-10 flex flex-col items-center gap-8", children: [
    /* @__PURE__ */ jsxs9(
      "div",
      {
        className: `w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${isDragging ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-100" : "border-zinc-300 bg-white hover:border-blue-400 hover:shadow-md"}`,
        onDragOver: (e) => {
          e.preventDefault();
          setIsDragging(true);
        },
        onDragLeave: () => setIsDragging(false),
        onDrop: handleDrop,
        onClick: () => {
          var _a;
          return (_a = inputRef.current) == null ? void 0 : _a.click();
        },
        children: [
          /* @__PURE__ */ jsx9(
            "input",
            {
              ref: inputRef,
              type: "file",
              accept: "image/*",
              className: "hidden",
              onChange: (e) => {
                var _a;
                const f = (_a = e.target.files) == null ? void 0 : _a[0];
                if (f) handleFile(f);
              }
            }
          ),
          /* @__PURE__ */ jsxs9("div", { className: "flex flex-col items-center gap-3 py-12 px-6", children: [
            /* @__PURE__ */ jsx9("div", { className: `p-3 rounded-xl ${isDragging ? "bg-blue-100" : "bg-zinc-100"}`, children: /* @__PURE__ */ jsx9(Upload3, { className: `w-7 h-7 ${isDragging ? "text-blue-500" : "text-zinc-400"}` }) }),
            /* @__PURE__ */ jsxs9("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx9("p", { className: "text-base font-medium text-zinc-700", children: "Drop your photo here or click to browse" }),
              /* @__PURE__ */ jsx9("p", { className: "text-sm text-zinc-400 mt-1", children: "PNG, JPG, WebP" })
            ] })
          ] })
        ]
      }
    ),
    sessions.length > 0 && /* @__PURE__ */ jsxs9("div", { className: "w-full", children: [
      /* @__PURE__ */ jsxs9("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ jsx9(Clock, { className: "w-4 h-4 text-zinc-400" }),
        /* @__PURE__ */ jsx9("h2", { className: "text-sm font-semibold text-zinc-500", children: "Recent" })
      ] }),
      /* @__PURE__ */ jsx9("div", { className: "grid grid-cols-4 sm:grid-cols-5 gap-2", children: sessions.slice().reverse().map((session) => /* @__PURE__ */ jsxs9(
        "button",
        {
          onClick: () => onRestoreSession == null ? void 0 : onRestoreSession(session),
          className: "group relative aspect-square rounded-lg overflow-hidden border border-zinc-200 hover:border-blue-400 hover:shadow-md transition-all bg-white",
          children: [
            /* @__PURE__ */ jsx9("img", { src: session.thumbnail, alt: "", className: "w-full h-full object-cover" }),
            /* @__PURE__ */ jsx9("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" })
          ]
        },
        session.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "w-full", children: [
      /* @__PURE__ */ jsx9("h2", { className: "text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 text-center", children: "What you can do" }),
      /* @__PURE__ */ jsx9("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: FEATURES.map((f) => /* @__PURE__ */ jsxs9("div", { className: "flex gap-3 p-4 rounded-xl bg-white border border-zinc-100 hover:shadow-sm transition-shadow", children: [
        /* @__PURE__ */ jsx9("div", { className: `p-2 rounded-lg border shrink-0 h-fit ${f.color}`, children: f.icon }),
        /* @__PURE__ */ jsxs9("div", { children: [
          /* @__PURE__ */ jsx9("p", { className: "text-sm font-medium text-zinc-800", children: f.title }),
          /* @__PURE__ */ jsx9("p", { className: "text-xs text-zinc-400 mt-0.5 leading-relaxed", children: f.description })
        ] })
      ] }, f.title)) })
    ] })
  ] }) });
}
export {
  AIChat,
  BackgroundRemoval,
  Canvas,
  DEFAULT_EDIT_PARAMS,
  HomeScreen,
  ImageUpload,
  LuminateEditor,
  Toolbar,
  WatermarkPanel,
  useEditorState
};
//# sourceMappingURL=index.mjs.map