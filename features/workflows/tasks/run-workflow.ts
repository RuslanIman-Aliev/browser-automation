import { logger, metadata, task } from "@trigger.dev/sdk"
import { getWorkflow } from "../data"
import toposort from "toposort"
import { Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"
import { interpolate, type NodeOutputs } from "../lib/interpolate"

// One node's live progress, published to the run's metadata under "steps" so
// the canvas can subscribe and light up each node as the run moves through it.
export type RunStep = {
  nodeId: string
  status: "pending" | "running" | "done" | "failed"
}

export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
    const workflow = await getWorkflow(orgId, workflowId)

    if (!workflow.graph) {
      throw new Error("Workflow has no graph")
    }

    const { nodes, edges } = workflow.graph
    const byId = new Map(nodes.map((n) => [n.id, n]))

    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))

    logger.log(
      `Running workflow ${workflowId} with nodes in order: ${order.join(", ")}`
    )

    let stagehand: Stagehand | undefined
    const getStagehand = async () => {
      if (!stagehand) {
        stagehand = new Stagehand({
          env: "BROWSERBASE",
          apiKey: process.env.BROWSERBASE_API_KEY!,
          model: "google/gemini-2.5-flash",
          disablePino: true,
        })
      }
      await stagehand?.init()
      return stagehand
    }

    // Only nodes with an executor actually do anything — a start node, say, has
    // nothing to run — so those are the steps the canvas tracks.
    const runnable = order.filter((id) => nodeExecutors[byId.get(id)!.data.type])

    const steps: RunStep[] = runnable.map((nodeId) => ({
      nodeId,
      status: "pending",
    }))
    metadata.set("steps", steps)

    // Each node's result, keyed by its id, so later nodes can reference it
    // through {{ nodeId.path }} placeholders in their field values. The
    // topological order guarantees a referenced node has already run.
    const outputs: NodeOutputs = {}

    for (const step of steps) {
      const node = byId.get(step.nodeId)!
      logger.log(`Running node ${step.nodeId} of kind ${node?.data.kind}`)

      const executor = nodeExecutors[node.data.type]!

      const values = Object.fromEntries(
        Object.entries(node.data.values).map(([key, value]) => [
          key,
          interpolate(value, outputs),
        ])
      )

      step.status = "running"
      metadata.set("steps", steps)
      // Metadata flushes in the background, so without forcing it here the
      // "running" state would be overwritten by "done" before it was ever
      // pushed — the canvas would never show the node as in-flight.
      await metadata.flush()

      try {
        outputs[step.nodeId] = await executor({ values, getStagehand })
      } catch (error) {
        step.status = "failed"
        metadata.set("steps", steps)
        // A thrown run returns no output, so this flush is the only way the
        // failed state ever reaches the canvas.
        await metadata.flush()
        throw error
      }

      step.status = "done"
      metadata.set("steps", steps)
    }

    // Returned as well as published, so a successful run's finished state is
    // guaranteed even if the last metadata write never flushed.
    return { steps }
  },
})
