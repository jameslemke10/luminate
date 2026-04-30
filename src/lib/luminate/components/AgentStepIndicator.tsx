"use client";

import { Wrench, CheckCircle, AlertCircle, Brain, Loader2 } from "lucide-react";
import { AgentEvent } from "../agent/types";

interface AgentStepIndicatorProps {
  steps: AgentEvent[];
}

function StepRow({ icon, children, muted }: { icon: React.ReactNode; children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`flex items-start gap-2 text-xs ${muted ? "text-zinc-400" : "text-zinc-600"}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export function AgentStepIndicator({ steps }: AgentStepIndicatorProps) {
  if (steps.length === 0) return null;

  // Group into meaningful display items: merge tool_call + tool_result pairs,
  // skip noisy params_update/logo_update, promote complete/error
  const items: { key: number; node: React.ReactNode }[] = [];
  let i = 0;

  while (i < steps.length) {
    const step = steps[i];

    if (step.type === "thinking") {
      items.push({
        key: i,
        node: (
          <StepRow icon={<Brain className="w-3.5 h-3.5 text-blue-500" />}>
            {step.reasoning}
          </StepRow>
        ),
      });
      i++;
    } else if (step.type === "tool_call") {
      // Look ahead for the matching tool_result
      const resultStep = i + 1 < steps.length && steps[i + 1].type === "tool_result" ? steps[i + 1] : null;
      const args = Object.entries(step.toolArgs ?? {})
        .map(([k, v]) => `${k}: ${typeof v === "number" ? (Number.isInteger(v) ? v : (v as number).toFixed(1)) : v}`)
        .join(", ");
      items.push({
        key: i,
        node: (
          <StepRow icon={<Wrench className="w-3.5 h-3.5 text-amber-500" />}>
            <span className="font-medium text-zinc-700">{step.toolName}</span>
            <span className="text-zinc-400 ml-1">({args})</span>
            {resultStep && (
              <span className="text-zinc-400 ml-1">— {resultStep.description}</span>
            )}
          </StepRow>
        ),
      });
      i += resultStep ? 2 : 1;
    } else if (step.type === "tool_result") {
      // Orphan result (shouldn't happen often, but handle it)
      items.push({
        key: i,
        node: (
          <StepRow icon={<CheckCircle className="w-3.5 h-3.5 text-green-500" />} muted>
            {step.description}
          </StepRow>
        ),
      });
      i++;
    } else if (step.type === "params_update" || step.type === "logo_update") {
      // Skip these — the tool_call/result already describes what happened
      i++;
    } else if (step.type === "error") {
      items.push({
        key: i,
        node: (
          <StepRow icon={<AlertCircle className="w-3.5 h-3.5 text-red-500" />}>
            <span className="text-red-600">{step.error}</span>
          </StepRow>
        ),
      });
      i++;
    } else if (step.type === "complete") {
      // Skip — the AI response is rendered separately in the chat
      i++;
    } else {
      i++;
    }
  }

  // If the last visible step is a tool call/result (no complete yet), show a spinner
  const lastStep = steps[steps.length - 1];
  const stillWorking = lastStep.type !== "complete" && lastStep.type !== "error";

  return (
    <div className="flex flex-col gap-1.5 py-1 pl-1 border-l-2 border-zinc-200">
      {items.map(({ key, node }) => (
        <div key={key} className="pl-2">{node}</div>
      ))}
      {stillWorking && (
        <div className="pl-2">
          <StepRow icon={<Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />} muted>
            Working...
          </StepRow>
        </div>
      )}
    </div>
  );
}
