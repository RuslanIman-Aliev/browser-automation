import { Stagehand } from "@browserbasehq/stagehand"

export async function actOnPage({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const result = await stagehand.act(instruction)

  // Read the URL after the action, since it may well have navigated.
  const page = stagehand.context.pages()[0]

  return { success: result.success, message: result.message, url: page.url() }
}
