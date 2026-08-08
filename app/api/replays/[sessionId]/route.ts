import { NotFoundError } from "@browserbasehq/sdk"
import { auth } from "@clerk/nextjs/server"

import { browserbase } from "@/lib/browserbase"

/** The HLS media playlist type Browserbase serves a replay as. */
const HLS_CONTENT_TYPE = "application/vnd.apple.mpegurl"

// A playlist's segment URLs are signed and expire, and a replay is only for the
// org that ran it — neither response belongs in any cache.
const BASE_HEADERS = { "Cache-Control": "no-store" }

// Browserbase finishes writing a recording some time after the session closes,
// and answers 404 until it has. That's indistinguishable from a session that
// never existed, so both come back as 202 and the client polls: a caller
// waiting on a fresh run gets its replay, and a caller asking for a session
// that will never exist gives up on its own deadline.
const notReady = () =>
  Response.json({ status: "pending" }, { status: 202, headers: BASE_HEADERS })

/**
 * Proxies a Browserbase session's HLS replay playlist.
 *
 * Retrieval needs the secret API key, so the browser can never ask Browserbase
 * for this directly. 200 with the .m3u8 body once the recording exists, 202
 * while it doesn't yet — poll until it flips.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/replays/[sessionId]">
) {
  const { userId, orgId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401, headers: BASE_HEADERS })
  }

  // A replay only exists as part of an org's workflow run, so there's nothing
  // to serve to a user who isn't acting as one.
  //
  // NOTE: this authorizes "some org", not "the org that ran this session" —
  // every run in the app shares one Browserbase project, so an org that
  // learned another org's session id could replay it. Closing that needs the
  // run's org recorded against its session id somewhere we can check.
  if (!orgId) {
    return new Response("No active organization", {
      status: 403,
      headers: BASE_HEADERS,
    })
  }

  const { sessionId } = await ctx.params
  const requestedPage = new URL(request.url).searchParams.get("page")

  try {
    const replay = await browserbase.sessions.replays.retrieve(sessionId)

    // Metadata can exist before any page of it does.
    if (replay.pages.length === 0) {
      return notReady()
    }

    // A long session's recording is split across several playlists. Default to
    // the first; the count goes out as a header so a caller can tell there's
    // more and ask for the rest by page id.
    const page = requestedPage
      ? replay.pages.find(({ pageId }) => pageId === requestedPage)
      : replay.pages[0]

    if (!page) {
      return new Response(`This replay has no page ${requestedPage}`, {
        status: 404,
        headers: BASE_HEADERS,
      })
    }

    const playlist = await browserbase.sessions.replays.retrievePage(
      sessionId,
      page.pageId
    )

    // The playlist's segment URLs are absolute, signed CDN links, so the
    // browser fetches the video itself and only the manifest is proxied.
    return new Response(await playlist.text(), {
      status: 200,
      headers: {
        ...BASE_HEADERS,
        "Content-Type": HLS_CONTENT_TYPE,
        "X-Replay-Page-Count": String(replay.pageCount),
      },
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notReady()
    }

    // Anything else is Browserbase failing rather than lagging — don't let a
    // poller read it as "keep waiting".
    console.error(`Failed to load replay for session ${sessionId}`, error)

    return new Response("Could not load replay", {
      status: 502,
      headers: BASE_HEADERS,
    })
  }
}
