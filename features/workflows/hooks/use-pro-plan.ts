"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

// Both shared with the server-side gate in ../actions — import from there
// directly to render a plain <Link> instead of the imperative `upgrade()`.
import { PRICING_PATH, PRO_PLAN } from "../lib/plan"

export type ProPlan = {
  // Whether the active org is subscribed to pro. False until Clerk hydrates —
  // gate on `isLoaded` before treating it as a definitive "no".
  isPro: boolean
  isLoaded: boolean
  // Sends the user to the pricing page to subscribe.
  upgrade: () => void
}

/**
 * Whether the active organization is on the pro plan, plus a way to send
 * someone off to upgrade. Use it to gate pro-only affordances in the canvas and
 * its panels:
 *
 * ```tsx
 * const { isPro, isLoaded, upgrade } = useProPlan()
 * if (!isLoaded) return null
 * return isPro ? <ScheduleTrigger /> : <Button onClick={upgrade}>Upgrade</Button>
 * ```
 *
 * Reads the session token rather than the network, so it costs nothing to call
 * from several components at once.
 */
export function useProPlan(): ProPlan {
  const { has, isLoaded, orgId } = useAuth()
  const router = useRouter()

  const upgrade = useCallback(() => router.push(PRICING_PATH), [router])

  // `has` is undefined until Clerk hydrates, and there is nothing to bill
  // without an active org — either way the honest answer is "not pro yet",
  // which is why callers should branch on `isLoaded` before hiding anything.
  const isPro =
    isLoaded && Boolean(orgId) && (has?.({ plan: PRO_PLAN }) ?? false)

  return { isPro, isLoaded, upgrade }
}
