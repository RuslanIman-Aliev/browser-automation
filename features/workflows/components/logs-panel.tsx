"use client"

import prettyMs from "pretty-ms"

import { cn } from "@/lib/utils"

import type { RunStep } from "../tasks/run-workflow"
import { NodeIcon } from "./node-icon"
import {
  useWorkflowRuns,
  type WorkflowRun,
  type WorkflowRunStatus,
} from "./workflow-runs-provider"

// Which step is selected. A node id only identifies a step within its own run,
// so the run has to come along with it.
export type StepSelection = { runId: string; nodeId: string }

const runStatusStyles: Record<WorkflowRunStatus, string> = {
  queued: "text-muted-foreground",
  running: "text-blue-500",
  completed: "text-emerald-600 dark:text-emerald-500",
  failed: "text-destructive",
  canceled: "text-muted-foreground",
}

// One run's heading. Sticky, so the run a step belongs to stays visible while
// the list scrolls past it.
function RunHeader({ run }: { run: WorkflowRun }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-1.5">
      <span
        className={cn(
          "text-xs font-semibold capitalize",
          runStatusStyles[run.status]
        )}
      >
        {run.status}
      </span>
      <span className="text-xs text-muted-foreground">
        {run.createdAt.toLocaleTimeString()}
      </span>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
        {run.steps.length} {run.steps.length === 1 ? "step" : "steps"}
      </span>
    </div>
  )
}

// One step of one run: its node's chip and title, and what it cost in time.
function StepRow({
  step,
  isLive,
  isSelected,
  onSelect,
}: {
  step: RunStep
  // Whether the run this step belongs to is still going.
  isLive: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  // A run that dies mid-step leaves that step marked "running" in the last
  // state we saw, so only spin while the run is actually still going.
  const isRunning = step.status === "running" && isLive
  const isFailed = step.status === "failed"
  // Either the run hasn't reached this step yet or it never will, because an
  // earlier step failed. Both read as "didn't run".
  const isPending = step.status === "pending"

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent/50",
        isSelected && "bg-accent hover:bg-accent",
        isPending && "opacity-60"
      )}
    >
      <NodeIcon
        type={step.nodeType}
        running={isRunning}
        className={cn(isPending && "grayscale")}
      />
      <span
        className={cn(
          "truncate text-xs font-medium",
          isFailed && "text-destructive",
          isPending && "text-muted-foreground"
        )}
      >
        {step.title}
      </span>
      {step.durationMs !== undefined && (
        <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
          {prettyMs(step.durationMs)}
        </span>
      )}
    </button>
  )
}

/**
 * Every run of this workflow, newest first, with its steps listed underneath.
 * Selection is owned by the ConsolePanel above — this only reports the clicks.
 */
export function LogsPanel({
  selected,
  onSelectStep,
}: {
  selected: StepSelection | null
  onSelectStep: (selection: StepSelection) => void
}) {
  const runs = useWorkflowRuns()

  if (runs.length === 0) {
    return (
      <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
        No runs yet
      </div>
    )
  }

  return (
    // min-w-0 so the list gives way to the inspector beside it rather than
    // pushing it off, and step titles truncate instead of stretching the row.
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
      {runs.map((run) => (
        <div key={run.id}>
          <RunHeader run={run} />
          {run.steps.map((step) => (
            <StepRow
              key={step.nodeId}
              step={step}
              isLive={run.isLive}
              isSelected={
                selected?.runId === run.id && selected.nodeId === step.nodeId
              }
              onSelect={() =>
                onSelectStep({ runId: run.id, nodeId: step.nodeId })
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}
