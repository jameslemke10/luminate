"use client";

import { AlertCircle } from "lucide-react";
import { AgentEvent, ToolCallResult } from "../agent/types";

interface AgentStepIndicatorProps {
  steps: AgentEvent[];
  aiResponse?: string;
}

function formatArgs(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([k, v]) => `${k}: ${typeof v === "number" ? (Number.isInteger(v) ? v : (v as number).toFixed(1)) : v}`)
    .join(", ");
}

function TimelineNode({
  dotClass,
  isLast,
  children,
}: {
  dotClass: string;
  isLast: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pl-5 pb-0.5">
      {!isLast && (
        <div className="absolute left-[4.5px] top-3 bottom-0 w-px bg-zinc-200" />
      )}
      <div className={`absolute left-[2px] top-[6px] w-[7px] h-[7px] rounded-full ${dotClass}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ToolNode({ tool }: { tool: ToolCallResult }) {
  return (
    <span className="text-xs text-zinc-500 break-words">
      <span className="font-medium text-zinc-700">{tool.toolName}</span>
      <span className="text-zinc-400">({formatArgs(tool.toolArgs)})</span>
      <span className="text-zinc-400"> — {tool.description}</span>
    </span>
  );
}

export function AgentStepIndicator({ steps, aiResponse }: AgentStepIndicatorProps) {
  if (steps.length === 0) return null;

  const items: { key: number; node: React.ReactNode; dotClass: string }[] = [];
  let i = 0;

  while (i < steps.length) {
    const step = steps[i];

    if (step.type === "thinking") {
      const isLastStep = i === steps.length - 1 && !aiResponse;
      items.push({
        key: i,
        dotClass: isLastStep
          ? "bg-blue-400 ring-2 ring-blue-100 animate-pulse"
          : "bg-zinc-300",
        node: (
          <span className={`text-xs ${isLastStep ? "text-zinc-500" : "text-zinc-400"}`}>
            {step.reasoning}
          </span>
        ),
      });
      i++;
    } else if (step.type === "tool_batch") {
      const tools = step.tools ?? [];
      for (let t = 0; t < tools.length; t++) {
        items.push({
          key: i * 100 + t,
          dotClass: "bg-amber-400",
          node: <ToolNode tool={tools[t]} />,
        });
      }
      i++;
    } else if (step.type === "error") {
      items.push({
        key: i,
        dotClass: "bg-red-400",
        node: (
          <div className="flex items-start gap-1.5 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="text-red-600">{step.error}</span>
          </div>
        ),
      });
      i++;
    } else {
      i++;
    }
  }

  if (aiResponse) {
    items.push({
      key: -1,
      dotClass: "bg-zinc-400",
      node: <p className="text-sm text-zinc-700 leading-relaxed">{aiResponse}</p>,
    });
  }

  const lastStep = steps[steps.length - 1];
  const stillWorking =
    !aiResponse &&
    lastStep.type !== "complete" &&
    lastStep.type !== "error" &&
    lastStep.type !== "thinking";

  if (stillWorking) {
    items.push({
      key: -2,
      dotClass: "bg-zinc-300 ring-2 ring-zinc-100 animate-pulse",
      node: <span className="text-xs text-zinc-400">Working...</span>,
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map(({ key, node, dotClass }, idx) => (
        <TimelineNode
          key={key}
          dotClass={dotClass}
          isLast={idx === items.length - 1}
        >
          {node}
        </TimelineNode>
      ))}
    </div>
  );
}
