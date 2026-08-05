import type { Stagehand } from "@browserbasehq/stagehand"
import { openUrl } from "./node-url"
import { NodeType, ActionNodeType } from "./node-registry"

export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
}

export type NodeExecutor = (context: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ values, getStagehand }) => 
    openUrl({ stagehand: await getStagehand(), url: values.url })
  } satisfies Record<ActionNodeType, NodeExecutor>

