import type { Stagehand } from "@browserbasehq/stagehand"
import { openUrl } from "./node-url"
import { actOnPage } from "./node-act"
import { extractFromPage } from "./node-extract"
import { observePage } from "./node-observe"
import { runAgent } from "./node-agent"
import { sendEmail } from "./node-send-email"
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
  // No getStagehand call — sending mail needs no browser, and the getter is
  // lazy, so a run of only this node never opens a Browserbase session.
  "send-email": async ({ values }) =>
    sendEmail({
      to: values.to,
      subject: values.subject,
      body: values.body,
    }),
} satisfies Record<ActionNodeType, NodeExecutor>
