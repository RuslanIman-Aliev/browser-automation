"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type { RunStep, runWorkflowTask } from "../tasks/run-workflow"

// A run's lifecycle boiled down to what the console shows. Trigger's own status
// has a dozen members, and every one of them lands in one of these buckets.
export type WorkflowRunStatus =
  "queued" | "running" | "completed" | "failed" | "canceled"

export type WorkflowRun = {
  id: string
  status: WorkflowRunStatus
  // Whether the run is still on its way to finishing, so the UI knows to keep
  // showing in-flight state rather than a settled result.
  isLive: boolean
  createdAt: Date
  finishedAt?: Date
  // A run can die without any one step recording why — a crash, a timeout, a
  // failure before the first executor — so the run carries its own error too.
  error?: string
  // The Browserbase session this run drove, for a panel to replay. Absent
  // until the run finishes, and absent afterwards on runs that never opened a
  // session — a graph of nothing but a send-email node never touches a
  // browser.
  sessionId?: string
  steps: RunStep[]
}

export type LatestRunSteps = {
  steps: RunStep[]
  isLive: boolean
}

const WorkflowRunsContext = createContext<WorkflowRun[] | null>(null)

/**
 * Subscribes once to every run of this workflow and shares them with the whole
 * canvas — the newest run's step statuses light up the nodes, and the console
 * reads the full history. One subscription per workflow, however many
 * components read from it.
 *
 * The token is a Public Access Token scoped to read these runs, minted on the
 * server and handed down as a prop.
 */
export function WorkflowRunsProvider({
  workflowId,
  publicAccessToken,
  children,
}: {
  workflowId: string
  publicAccessToken: string
  children: ReactNode
}) {
  const { runs } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    { accessToken: publicAccessToken }
  )

  const value = useMemo<WorkflowRun[]>(
    () =>
      [...runs]
        // The subscription doesn't promise an order, so sort newest first
        // rather than trusting the array's positions.
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((run) => {
          const status: WorkflowRunStatus = run.isCancelled
            ? "canceled"
            : run.isFailed
              ? "failed"
              : run.isSuccess
                ? "completed"
                : run.isExecuting || run.isWaiting
                  ? "running"
                  : "queued"

          // The task returns its steps on success, which is the settled truth
          // for a finished run. Metadata carries the same list as the run
          // progresses, and is all there is while it's still going or if it
          // failed partway.
          const steps =
            run.output?.steps ?? (run.metadata?.steps as RunStep[] | undefined)

          return {
            id: run.id,
            status,
            isLive: run.isQueued || run.isExecuting || run.isWaiting,
            createdAt: run.createdAt,
            finishedAt: run.finishedAt,
            error: run.error?.message,
            // Only ever from the output, never from metadata: Browserbase
            // can't serve the recording until the session closes, so the id is
            // deliberately withheld until the run has finished.
            sessionId: run.output?.sessionId,
            steps: steps ?? [],
          }
        }),
    [runs]
  )

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

/** Every run of this workflow, newest first, each with its steps. */
export function useWorkflowRuns(): WorkflowRun[] {
  const context = useContext(WorkflowRunsContext)

  if (!context) {
    throw new Error(
      "useWorkflowRuns must be used within a WorkflowRunsProvider"
    )
  }

  return context
}

/** The newest run's per-node step statuses, and whether that run is still live. */
export function useLatestRunSteps(): LatestRunSteps {
  const [latest] = useWorkflowRuns()

  return useMemo(
    () => ({ steps: latest?.steps ?? [], isLive: latest?.isLive ?? false }),
    [latest]
  )
}
