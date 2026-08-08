import { PricingTable } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function PricingPage() {
  // Subscriptions are billed to the active organization, so there has to be
  // one. Clerk normally routes signed-in users through the choose-organization
  // task before they ever get here; this covers hitting the URL directly.
  const { orgId } = await auth()
  if (!orgId) redirect("/choose-organization")

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-6 py-10">
      <div className="max-w-2xl space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Plans for your organization
        </h1>
        <p className="text-sm text-muted-foreground">
          Billing is per organization — everyone in this workspace shares the
          plan.
        </p>
      </div>
      <div className="w-full max-w-4xl">
        {/* `for="organization"` is what makes this show the org plans rather
            than personal ones; without it the table reads as empty, since this
            instance has no user plans. Redirecting after checkout mints a fresh
            session token, so `has({ plan })` sees the new plan right away. */}
        <PricingTable for="organization" newSubscriptionRedirectUrl="/" />
      </div>
    </div>
  )
}
