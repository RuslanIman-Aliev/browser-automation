import { auth, clerkClient } from "@clerk/nextjs/server"

// Clerk caps `getUserList` at 500 per request — chunk well below that so a
// large `resolveUsers` batch still resolves in one round trip per chunk.
const CHUNK_SIZE = 100

type UserInfo = Liveblocks["UserMeta"]["info"]

export async function POST(request: Request) {
  const { userId, orgId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!orgId) {
    return new Response("No active organization", { status: 403 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  const userIds = (body as { userIds?: unknown } | null)?.userIds

  if (
    !Array.isArray(userIds) ||
    userIds.some((id) => typeof id !== "string" || id.length === 0)
  ) {
    return new Response("Expected { userIds: string[] }", { status: 400 })
  }

  if (userIds.length === 0) {
    return Response.json([])
  }

  // Look each ID up once, even when Liveblocks asks for duplicates
  const uniqueIds = [...new Set(userIds as string[])]
  const chunks: string[][] = []

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(i, i + CHUNK_SIZE))
  }

  const client = await clerkClient()

  const responses = await Promise.all(
    chunks.map((chunk) =>
      client.users.getUserList({ userId: chunk, limit: chunk.length })
    )
  )

  const usersById = new Map<string, UserInfo>()

  for (const { data } of responses) {
    for (const user of data) {
      usersById.set(user.id, {
        name:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress ??
          "Anonymous",
        avatar: user.imageUrl,
      })
    }
  }

  // Same order as the request, `null` for IDs Clerk doesn't know
  const users = (userIds as string[]).map((id) => usersById.get(id) ?? null)

  return Response.json(users)
}
