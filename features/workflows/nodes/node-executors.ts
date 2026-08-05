import type { Stagehand } from "@browserbasehq/stagehand"
import { openUrl } from "./node-url"
import { actOnPage } from "./node-act"
import { extractFromPage } from "./node-extract"
import { observePage } from "./node-observe"
import { runAgent } from "./node-agent"
import { NodeType, ActionNodeType } from "./node-registry"

export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
}

export type NodeExecutor = (context: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ values, getStagehand }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url }),
  act: async ({ values, getStagehand }) =>
    actOnPage({
      stagehand: await getStagehand(),
      instruction: values.instruction,
    }),
  extract: async ({ values, getStagehand }) =>
    extractFromPage({
      stagehand: await getStagehand(),
      instruction: values.instruction,
    }),
  observe: async ({ values, getStagehand }) =>
    observePage({
      stagehand: await getStagehand(),
      instruction: values.instruction,
    }),
  agent: async ({ values, getStagehand }) =>
    runAgent({
      stagehand: await getStagehand(),
      instruction: values.instruction,
    }),
} satisfies Record<ActionNodeType, NodeExecutor>
