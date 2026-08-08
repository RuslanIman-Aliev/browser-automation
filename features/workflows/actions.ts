"use server"

import { auth } from "@clerk/nextjs/server"
import { runs, tasks } from "@trigger.dev/sdk"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { liveblocks } from "@/lib/liveblocks"

import { WorkflowGraph } from "@/lib/db/schema"
import { createWorkflow, deleteWorkflow, saveWorkflowGraph } from "./data"
import { PRO_PLAN } from "./lib/plan"
import type { runWorkflowTask } from "./tasks/run-workflow"

export async function createWorkflowAction(name: string) {
  // `has` reads the plan off the session claims, so this costs no round trip.
  // The sidebar hides the button for a non-pro org, but that is only a nudge —
  // this is the check that actually holds, since the action is reachable
  // directly. Order matters: without an active org `has` would fall through to
  // whatever personal subscription the user happens to have.
  const { orgId, has } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  if (!has({ plan: PRO_PLAN })) {
    throw new Error("Creating a workflow requires the pro plan")
  }

  const workflow = await createWorkflow(orgId, name)

  revalidatePath("/workflows", "layout")
  redirect(`/workflows/${workflow.id}`)
}

export async function deleteWorkflowAction(workflowId: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  // The org-scoped delete doubles as the authorization check: a workflow owned
  // by another org matches nothing and comes back undefined.
  const workflow = await deleteWorkflow(orgId, workflowId)

  if (!workflow) {
    throw new Error("Workflow not found")
  }

  // The room is keyed by the workflow id. Deleting it after the row means a
  // failure here can't strand a workflow whose collaborative state is already
  // gone; a leftover room is harmless since ids are never reused.
  try {
    await liveblocks.deleteRoom(workflowId)
  } catch (error) {
    console.error(`Failed to delete room ${workflowId}:`, error)
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function runWorkflowAction({
  workflowId,
  graph,
}: {
  workflowId: string
  graph: WorkflowGraph
}) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  await saveWorkflowGraph({ orgId, id: workflowId, graph })

  const handle = await tasks.trigger<typeof runWorkflowTask>(
    "run-workflow",
    {
      workflowId,
      orgId,
    },
    {
      tags: [`workflow:${workflowId}`],
    }
  )

  return { runId: handle.id }
}

export async function cancelWorkflowRunAction(runId: string) {
  const { orgId } = await auth()
  if (!orgId) {
    throw new Error("No active organization")
  }
  await runs.cancel(runId)
}
