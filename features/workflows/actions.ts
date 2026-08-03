"use server"

import { auth } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { helloWorldTask } from "@/src/trigger/example"

import { liveblocks } from "@/lib/liveblocks"

import { createWorkflow, deleteWorkflow } from "./data"

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
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

export async function runWorkflowAction(workflowId: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    workflowId,
    orgId,
  })

  return { runId: handle.id }
}
