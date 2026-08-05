import { Stagehand } from "@browserbasehq/stagehand"

export async function extractFromPage({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  // Without a schema, extract resolves to Stagehand's default shape: a single
  // `extraction` string holding whatever the instruction asked for.
  const { extraction } = await stagehand.extract(instruction)

  return { extraction }
}
