import { Stagehand } from "@browserbasehq/stagehand"

export async function observePage({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const actions = await stagehand.observe(instruction)

  // Only the selector and description are meaningful downstream — the rest of
  // Stagehand's Action shape is replay detail for its own act().
  return {
    matches: actions.map(({ selector, description }) => ({
      selector,
      description,
    })),
  }
}
