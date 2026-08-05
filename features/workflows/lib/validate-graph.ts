import { WorkflowGraph } from "@/lib/db/schema"
import toposort from "toposort"

export function validateGraph({ nodes, edges }: WorkflowGraph): string[] {
  const problems: string[] = []

  // Check for cycles in the graph
  const triggers = nodes.filter((n) => n.data.kind === "trigger").length
  if (triggers !== 1) {
    problems.push(`Graph must have exactly one trigger node, found ${triggers}`)
  }

  if (edges.length === 0) {
    problems.push("Graph must have at least one edge")
  } else {
    try {
      toposort(edges.map((e) => [e.source, e.target]))
    } catch (error) {
      problems.push("The graph contains cycles.")
    }
  }

  return problems
}
