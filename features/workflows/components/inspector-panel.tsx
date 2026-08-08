"use client"

import type { RunStep } from "../tasks/run-workflow"
import type { StepSelection } from "./logs-panel"
import { NodeIcon } from "./node-icon"
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

/**
 * The result of the step selected in the console, beside the logs. Looks the
 * step up itself rather than taking it as a prop, so the selection the
 * ConsolePanel holds stays down to the two ids that identify it.
 */
export function InspectorPanel({ selection }: { selection: StepSelection }) {
  const runs = useWorkflowRuns()

  const step = runs
    .find((run) => run.id === selection.runId)
    ?.steps.find((step) => step.nodeId === selection.nodeId)

  return (
    // The panel around this sets its width, and the drag handle draws the line
    // that used to be this panel's left border.
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-1.5">
        {step && (
          <NodeIcon
            type={step.nodeType}
            className="size-5 rounded-sm"
            iconClassName="size-3"
          />
        )}
        <span className="truncate text-xs font-semibold">
          {step?.title ?? "Step"}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {step ? (
          <Result step={step} />
        ) : (
          // The run scrolled out of the subscription's window while its step
          // was still selected.
          <p className="text-xs text-muted-foreground">
            This step is no longer available.
          </p>
        )}
      </div>
    </div>
  )
}
