"use client";

import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
} from "lucide-react";
import { EditParams } from "../types";

interface ToolbarProps {
  params: EditParams;
  onUpdateParams: (params: Partial<EditParams>) => void;
  disabled?: boolean;
  cropMode?: boolean;
  onToggleCrop?: () => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
}: SliderControlProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-500 font-medium">{label}</span>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          disabled={disabled}
          className="w-12 text-right text-zinc-500 font-mono tabular-nums bg-transparent border-none focus:outline-none focus:text-zinc-800 disabled:text-zinc-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

export function Toolbar({
  params,
  onUpdateParams,
  disabled,
  cropMode,
  onToggleCrop,
}: ToolbarProps) {
  const btnClass = (active?: boolean) =>
    `p-2 rounded-lg transition-colors ${
      disabled
        ? "text-zinc-300 cursor-not-allowed"
        : active
          ? "text-blue-600 bg-blue-50"
          : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
    }`;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Transform buttons */}
      <div>
        <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Transform
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() =>
              onUpdateParams({ rotation: (params.rotation ?? 0) - 90 })
            }
            disabled={disabled}
            className={btnClass()}
            title="Rotate left 90°"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              onUpdateParams({ rotation: (params.rotation ?? 0) + 90 })
            }
            disabled={disabled}
            className={btnClass()}
            title="Rotate right 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdateParams({ flipX: !params.flipX })}
            disabled={disabled}
            className={btnClass(params.flipX)}
            title="Flip horizontal"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdateParams({ flipY: !params.flipY })}
            disabled={disabled}
            className={btnClass(params.flipY)}
            title="Flip vertical"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-200 mx-1" />
          <button
            onClick={onToggleCrop}
            disabled={disabled}
            className={btnClass(cropMode)}
            title="Crop"
          >
            <Crop className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fine rotation */}
      <SliderControl
        label="Rotation"
        value={params.rotation ?? 0}
        min={-180}
        max={180}
        step={0.5}
        onChange={(v) => onUpdateParams({ rotation: v })}
        disabled={disabled}
      />

      {/* Adjustment sliders */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Adjustments
        </h3>
        <SliderControl
          label="Brightness"
          value={params.brightness ?? 0}
          min={-100}
          max={100}
          onChange={(v) => onUpdateParams({ brightness: v })}
          disabled={disabled}
        />
        <SliderControl
          label="Contrast"
          value={params.contrast ?? 0}
          min={-100}
          max={100}
          onChange={(v) => onUpdateParams({ contrast: v })}
          disabled={disabled}
        />
        <SliderControl
          label="Saturation"
          value={params.saturation ?? 0}
          min={-100}
          max={100}
          onChange={(v) => onUpdateParams({ saturation: v })}
          disabled={disabled}
        />
        <SliderControl
          label="Sharpness"
          value={params.sharpness ?? 0}
          min={0}
          max={100}
          onChange={(v) => onUpdateParams({ sharpness: v })}
          disabled={disabled}
        />
        <SliderControl
          label="Warmth"
          value={params.warmth ?? 0}
          min={-100}
          max={100}
          onChange={(v) => onUpdateParams({ warmth: v })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
