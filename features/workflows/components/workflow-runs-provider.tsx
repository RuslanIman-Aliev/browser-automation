"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type { RunStep, runWorkflowTask } from "../tasks/run-workflow"

export type LatestRunSteps = {
  steps: RunStep[]
  // Whether that run is still on its way to finishing, so the canvas knows to
  // keep showing in-flight state rather than a settled result.
  isLive: boolean
}

const WorkflowRunsContext = createContext<LatestRunSteps | null>(null)

/**
 * Subscribes once to every run of this workflow and shares the newest run's
 * step statuses with the whole canvas. One subscription per workflow, however
 * many components read from it.
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

  const value = useMemo<LatestRunSteps>(() => {
    // The subscription doesn't promise an order, so pick the newest run rather
    // than trusting the array's position.
    const latest = runs.reduce<(typeof runs)[number] | undefined>(
      (newest, run) =>
        !newest || run.createdAt > newest.createdAt ? run : newest,
      undefined
    )

    if (!latest) return { steps: [], isLive: false }

    // The task returns its steps on success, which is the settled truth for a
    // finished run. Metadata carries the same list as the run progresses, and
    // is all there is while it's still going or if it failed partway.
    const steps =
      latest.output?.steps ?? (latest.metadata?.steps as RunStep[] | undefined)

    return {
      steps: steps ?? [],
      isLive: latest.status === "QUEUED" || latest.status === "EXECUTING",
    }
  }, [runs])

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

/** The newest run's per-node step statuses, and whether that run is still live. */
export function useLatestRunSteps(): LatestRunSteps {
  const context = useContext(WorkflowRunsContext)

  if (!context) {
    throw new Error(
      "useLatestRunSteps must be used within a WorkflowRunsProvider"
    )
  }

  return context
}
