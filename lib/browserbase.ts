import Browserbase from "@browserbasehq/sdk"

// The core Browserbase SDK, for everything about a session that Stagehand
// doesn't cover — recordings, replays, live view, logs.
//
// Server-side only: this holds the secret API key, so never import it from a
// client component. Replays reach the browser through
// app/api/replays/[sessionId] instead.
export const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
})
