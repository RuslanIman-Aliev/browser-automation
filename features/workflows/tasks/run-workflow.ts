import { logger, task } from "@trigger.dev/sdk"
import { getWorkflow } from "../data"
import toposort from "toposort"
import { Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"

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

    for (const nodeId of order) {
      const node = byId.get(nodeId)!
      logger.log(`Running node ${nodeId} of kind ${node?.data.kind}`)

      const executor = nodeExecutors[node.data.type]
      if (executor) await executor({ values: node.data.values, getStagehand })
    }
  },
})
