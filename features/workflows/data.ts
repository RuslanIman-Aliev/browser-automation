import { db } from "@/lib/db"
import { workflows } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export function listWorkflows(orgId: string) {
  return db.select().from(workflows).where(eq(workflows.orgId, orgId))
}

export async function getWorkflow(orgId: string, id: string) {
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
    .limit(1)
  return workflow
}

// Scoped to the org, so a workflow owned by another org matches nothing and no
// row comes back. Returns the deleted workflow, or undefined if there was none.
export async function deleteWorkflow(orgId: string, id: string) {
  const [workflow] = await db
    .delete(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
    .returning()
  return workflow
}

export async function createWorkflow(orgId: string, name: string) {
  const [workflow] = await db.insert(workflows).values({ orgId, name }).returning()
  return workflow
}
