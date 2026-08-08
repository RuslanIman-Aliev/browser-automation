import { logger, metadata, task } from "@trigger.dev/sdk"
import { getWorkflow } from "../data"
import toposort from "toposort"
import { Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"
import type { NodeType } from "../nodes/node-registry"
import { interpolate, type NodeOutputs } from "../lib/interpolate"

export type RunStepStatus = "pending" | "running" | "done" | "failed"

// One node's live progress, published to the run's metadata under "steps" so
// the canvas can subscribe and light up each node as the run moves through it,
// and the console can show what every step did.
export type RunStep = {
  nodeId: string
  // The node's type and title as of when the run started. The graph is
  // editable, so a finished run can't count on looking them up again — this is
  // what the console renders its icon and title from.
  nodeType: NodeType
  title: string
  status: RunStepStatus
  // Epoch ms the executor was entered, so a step still in flight can be timed
  // against the clock; durationMs lands when it settles, done or failed.
  startedAt?: number
  durationMs?: number
  // Whatever the executor resolved with — the same value later nodes read
  // through their {{ nodeId.path }} placeholders.
  output?: unknown
  // The thrown error's message, on the one step that failed.
  error?: string
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

    // Every connected node is a step, including ones with nothing to run like
    // the start trigger, so the canvas and the console account for the whole
    // graph rather than quietly leaving nodes out.
    const steps: RunStep[] = order.map((nodeId) => {
      const { type, title } = byId.get(nodeId)!.data
      return { nodeId, nodeType: type, title, status: "pending" }
    })

    // metadata only takes plain JSON. Every value in a step is JSON, but the
    // optional fields and the `unknown` output don't line up with that type, so
    // the cast lives here rather than at each of the five call sites.
    const publishSteps = () =>
      metadata.set(
        "steps",
        steps as unknown as Parameters<typeof metadata.set>[1]
      )

    publishSteps()

    // Each node's result, keyed by its id, so later nodes can reference it
    // through {{ nodeId.path }} placeholders in their field values. The
    // topological order guarantees a referenced node has already run.
    const outputs: NodeOutputs = {}

    for (const step of steps) {
      const node = byId.get(step.nodeId)!
      logger.log(`Running node ${step.nodeId} of kind ${node?.data.kind}`)

      const executor = nodeExecutors[node.data.type]

      // A trigger has no executor: no work to do and no output. It settles as
      // done the moment the run reaches it, rather than sitting at "pending"
      // for the life of the run and reading as skipped. No duration either —
      // nothing ran, so there's nothing to have taken time.
      if (!executor) {
        step.status = "done"
        publishSteps()
        continue
      }

      const values = Object.fromEntries(
        Object.entries(node.data.values).map(([key, value]) => [
          key,
          interpolate(value, outputs),
        ])
      )

      const startedAt = Date.now()
      step.status = "running"
      step.startedAt = startedAt
      publishSteps()
      // Metadata flushes in the background, so without forcing it here the
      // "running" state would be overwritten by "done" before it was ever
      // pushed — the canvas would never show the node as in-flight.
      await metadata.flush()

      try {
        const output = await executor({ values, getStagehand })
        outputs[step.nodeId] = output
        step.output = output
      } catch (error) {
        step.status = "failed"
        step.durationMs = Date.now() - startedAt
        step.error = error instanceof Error ? error.message : String(error)
        publishSteps()
        // A thrown run returns no output, so this flush is the only way the
        // failed state ever reaches the canvas.
        await metadata.flush()
        throw error
      }

      step.status = "done"
      step.durationMs = Date.now() - startedAt
      publishSteps()
    }

    // Returned as well as published, so a successful run's finished state is
    // guaranteed even if the last metadata write never flushed.
    return { steps }
  },
})
