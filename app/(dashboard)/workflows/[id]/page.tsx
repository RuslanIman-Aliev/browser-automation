import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { Room } from "@/features/workflows/components/room"
import { WorkflowRunsProvider } from "@/features/workflows/components/workflow-runs-provider"

import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { LiveblocksError } from "@liveblocks/node"
import { ReactFlowProvider } from "@xyflow/react"
import { notFound } from "next/navigation"
import { getWorkflow } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"
export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { orgId } = await auth()

  if (!orgId) notFound()

  const workflow = await getWorkflow(orgId, id)
  if (!workflow) notFound()

  // ID tokens carry no permissions of their own — the room grants them. Members
  // of this workflow's org get write access via the `orgId` group in their token.
  try {
    await liveblocks.getOrCreateRoom(id, {
      defaultAccesses: [],
      groupsAccesses: {
        [orgId]: ["room:write"],
      },
      metadata: {
        workflowId: id,
        orgId,
      },
    })
  } catch (error) {
    if (error instanceof LiveblocksError) {
      console.error(
        `Failed to get or create room ${id}: ${error.status} - ${error.message}`
      )
    } else {
      console.error(`Unexpected error creating room ${id}:`, error)
    }
    throw error
  }

  // Read-only and scoped to this one workflow's runs, so it's safe to hand to
  // the browser. Runs are tagged `workflow:<id>` when triggered.
  const publicAccessToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        tags: [`workflow:${id}`],
      },
    },
    expirationTime: "1h",
  })

  // The provider sits above both the canvas and the sidebar's palette, so they
  // share one React Flow store and the palette can add nodes to the canvas.
  return (
    <Room roomId={id}>
      <ReactFlowProvider>
        <WorkflowRunsProvider
          workflowId={id}
          publicAccessToken={publicAccessToken}
        >
          <WorkflowShell workflowId={id} />
        </WorkflowRunsProvider>
      </ReactFlowProvider>
    </Room>
  )
}
