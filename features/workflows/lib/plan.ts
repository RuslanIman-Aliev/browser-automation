// Billing is per organization, and one plan gates the premium surface: creating
// workflows at all, and adding the agent node to a canvas.
//
// These live here rather than next to either gate because both the server
// actions and the client hook need them. A slug that drifted between the two
// would fail silently — the UI would offer something the action then rejects,
// or worse, hide something the org has paid for.

// Scoped with `org:` so the check can only ever match an organization's
// subscription, never a personal one. Clerk stores plan claims scope-prefixed
// and splits this on the colon; a bare "pro" would search both scopes.
export const PRO_PLAN = "org:pro"

// Where a non-pro org goes to subscribe.
export const PRICING_PATH = "/pricing"
