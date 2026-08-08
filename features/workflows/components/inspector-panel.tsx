"use client"

import type { ReactNode } from "react"

import type { RunStep } from "../tasks/run-workflow"
import type { ConsoleSelection } from "./logs-panel"
import { NodeIcon, ReplayIcon } from "./node-icon"
import { SessionReplay } from "./session-replay"
import { useWorkflowRuns } from "./workflow-runs-provider"

// What to say when a step has nothing to show — either it hasn't produced a
// result yet, or it finished without one.
function emptyNote(step: RunStep) {
  switch (step.status) {
    case "pending":
      return "This step didn't run."
    case "running":
      return "This step is still running."
    case "failed":
      return "This step failed without an error message."
    default:
      return "This step produced no output."
  }
}

// What the step left behind: its error if it threw, otherwise its output as
// formatted JSON.
function Result({ step }: { step: RunStep }) {
  if (step.error) {
    return (
      <pre className="text-xs whitespace-pre-wrap text-destructive">
        {step.error}
      </pre>
    )
  }

  // A step can legitimately output null, so only an absent output is empty.
  if (step.output === undefined) {
    return <p className="text-xs text-muted-foreground">{emptyNote(step)}</p>
  }

  return (
    <pre className="text-xs whitespace-pre-wrap">
      {JSON.stringify(step.output, null, 2)}
    </pre>
  )
}

// The titled frame both kinds of selection are shown in, so a step's output
// and a run's replay sit in the same chrome.
function Pane({
  icon,
  title,
  children,
}: {
  icon?: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    // The panel around this sets its width, and the drag handle draws the line
    // that used to be this panel's left border.
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-1.5">
        {icon}
        <span className="truncate text-xs font-semibold">{title}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
    </div>
  )
}

/**
 * Whatever the console has selected, beside the logs: a step's result, or the
 * recording of a whole run. Looks the selection up itself rather than taking it
 * as a prop, so what the ConsolePanel holds stays down to the ids.
 */
export function InspectorPanel({ selection }: { selection: ConsoleSelection }) {
  const runs = useWorkflowRuns()
  const run = runs.find((run) => run.id === selection.runId)

  if (selection.kind === "replay") {
    return (
      <Pane
        icon={
          <ReplayIcon className="size-5 rounded-sm" iconClassName="size-3" />
        }
        title="Replay"
      >
        {run?.sessionId ? (
          // Keyed by the session so switching runs builds a fresh player
          // rather than re-pointing the one already holding a video.
          <SessionReplay key={run.sessionId} sessionId={run.sessionId} />
        ) : (
          <p className="text-xs text-muted-foreground">
            This recording is no longer available.
          </p>
        )}
      </Pane>
    )
  }

  const step = run?.steps.find((step) => step.nodeId === selection.nodeId)

  return (
    <Pane
      icon={
        step && (
          <NodeIcon
            type={step.nodeType}
            className="size-5 rounded-sm"
            iconClassName="size-3"
          />
        )
      }
      title={step?.title ?? "Step"}
    >
      {step ? (
        <Result step={step} />
      ) : (
        // The run scrolled out of the subscription's window while its step was
        // still selected.
        <p className="text-xs text-muted-foreground">
          This step is no longer available.
        </p>
      )}
    </Pane>
  )
}
