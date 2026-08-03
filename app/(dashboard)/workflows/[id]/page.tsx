import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { Room } from "@/features/workflows/components/room"

import {auth} from "@clerk/nextjs/server"
import { LiveblocksError } from "@liveblocks/node"
import { notFound } from "next/navigation"
import { getWorkflow } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"
export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const {orgId} = await auth()

  if(!orgId) notFound()

  const workflow = await getWorkflow(orgId, id)
  if(!workflow) notFound()

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

  return (
    <Room roomId={id}>
      <WorkflowShell workflowId={id} />
    </Room>
  )
}
