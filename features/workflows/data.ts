import { db } from "@/lib/db"
import { workflows } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export function listWorkflows(orgId: string) {
  return db.select().from(workflows).where(eq(workflows.orgId, orgId))
}

export async function createWorkflow(orgId: string, name: string) {
  const [workflow] = await db.insert(workflows).values({ orgId, name }).returning()
  return workflow
}
