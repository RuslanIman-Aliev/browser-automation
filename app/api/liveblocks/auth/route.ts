import { auth, currentUser } from "@clerk/nextjs/server"

import { liveblocks } from "@/lib/liveblocks"

export async function POST() {
  const { userId, orgId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!orgId) {
    return new Response("No active organization", { status: 403 })
  }

  const user = await currentUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  // ID token auth: Liveblocks reads permissions from the room itself, so rooms
  // must be created server-side with `groupsAccesses` keyed by the Clerk org ID.
  const { status, body } = await liveblocks.identifyUser(
    {
      userId,

      // Org-scoped access — rooms grant `room:write` to the org they belong to
      groupIds: [orgId],
    },
    {
      userInfo: {
        name:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress ??
          "Anonymous",
        avatar: user.imageUrl,
      },
    }
  )

  return new Response(body, { status })
}
