import { Stagehand } from "@browserbasehq/stagehand"

export async function runAgent({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const agent = stagehand.agent()

  // `completed` is the agent's own call on whether it finished the task, which
  // is distinct from `success` — it can succeed at running while giving up.
  const { success, message, completed } = await agent.execute(instruction)

  return { success, message, completed }
}
