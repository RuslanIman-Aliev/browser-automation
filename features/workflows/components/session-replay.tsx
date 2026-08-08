"use client"

import { useEffect, useRef, useState } from "react"

/** How often to re-ask the route while the recording is still being written. */
const POLL_INTERVAL_MS = 2_000

// How long to keep asking before calling it lost. A recording normally lands
// within seconds of the session closing; past a couple of minutes the far more
// likely explanation is that this session has no recording at all — 404 while
// pending and 404 for good are the same answer, so only a deadline tells them
// apart.
const POLL_TIMEOUT_MS = 120_000

type ReplayState =
  /** Waiting on Browserbase to finish writing the recording. */
  | { status: "waiting" }
  /** Playlist loaded and handed to the player. */
  | { status: "ready" }
  /** Gave up waiting — most likely there's no recording for this session. */
  | { status: "unavailable" }
  | { status: "error"; message: string }

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Plays back a Browserbase session's recording, given its session id.
 *
 * The recording isn't ready the moment a run ends, so this polls
 * /api/replays/[sessionId] until the playlist exists, then plays it with
 * hls.js. Renders its own waiting and failure states, so a caller can mount it
 * as soon as it has a session id.
 */
export function SessionReplay({
  sessionId,
  className,
}: {
  sessionId: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<ReplayState>({ status: "waiting" })

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    // The effect outlives its awaits, so every resumption checks this before
    // touching state or the player.
    let cancelled = false
    let player: { destroy: () => void } | undefined
    const controller = new AbortController()
    const url = `/api/replays/${sessionId}`

    const load = async () => {
      setState({ status: "waiting" })

      const deadline = Date.now() + POLL_TIMEOUT_MS

      // Poll until the playlist exists. 202 is the route relaying
      // Browserbase's "not ready yet", which is expected for a while after a
      // run finishes — anything else non-OK is a real failure.
      while (!cancelled) {
        let response: Response

        try {
          response = await fetch(url, { signal: controller.signal })
        } catch {
          if (cancelled) return
          setState({
            status: "error",
            message: "Couldn't reach the replay service.",
          })
          return
        }

        if (cancelled) return

        if (response.ok) break

        if (response.status !== 202) {
          setState({
            status: "error",
            message: `Couldn't load this replay (${response.status}).`,
          })
          return
        }

        if (Date.now() + POLL_INTERVAL_MS > deadline) {
          setState({ status: "unavailable" })
          return
        }

        await sleep(POLL_INTERVAL_MS)
      }

      if (cancelled) return

      // Loaded here rather than at module scope: it's a large library, and a
      // page that never opens a replay shouldn't pay for it.
      const { default: Hls } = await import("hls.js")

      if (cancelled) return

      if (Hls.isSupported()) {
        const hls = new Hls()
        player = hls

        hls.on(Hls.Events.ERROR, (_event, data) => {
          // hls.js recovers from non-fatal errors on its own; only a fatal one
          // means playback is actually over.
          if (data.fatal) {
            setState({ status: "error", message: "Playback failed." })
          }
        })

        hls.loadSource(url)
        hls.attachMedia(video)
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari plays HLS natively, and reports hls.js as unsupported because
        // it has no Media Source Extensions to drive.
        video.src = url
      } else {
        setState({
          status: "error",
          message: "This browser can't play HLS video.",
        })
        return
      }

      setState({ status: "ready" })
    }

    load()

    return () => {
      cancelled = true
      controller.abort()
      player?.destroy()
    }
  }, [sessionId])

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-black ${className ?? ""}`}
    >
      {/* Mounted through every state so the ref exists before the playlist
          does — the effect needs an element to attach the player to. */}
      <video
        ref={videoRef}
        controls
        playsInline
        className="aspect-video w-full"
      />

      {state.status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-neutral-300">
          {state.status === "waiting" && "Waiting for the recording…"}
          {state.status === "unavailable" &&
            "No recording available for this session."}
          {state.status === "error" && state.message}
        </div>
      )}
    </div>
  )
}
