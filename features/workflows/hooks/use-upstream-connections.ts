"use client"

import { getIncomers, useStore } from "@xyflow/react"
import { useMemo } from "react"

import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "../nodes/node-registry"

// One value a node can pull in from somewhere upstream, ready to render as a
// row in a picker: the token to insert, what to call it, and which node type it
// came from so the caller can show the matching icon.
export type UpstreamConnection = {
  // The placeholder to drop into a field, e.g. "{{ a1b2.title }}". Unique
  // across the list, so it doubles as a React key.
  token: string
  label: string
  nodeType: NodeType
}

/**
 * Every output produced anywhere upstream of `node` — not just its direct
 * parents — so a field can reference upstream data without anyone typing a raw
 * node id. Re-computes as edges are connected and disconnected.
 */
export function useUpstreamConnections(
  node: StepNodeType | undefined
): UpstreamConnection[] {
  const nodes = useStore((state) => state.nodes as StepNodeType[])
  const edges = useStore((state) => state.edges)

  return useMemo(() => {
    if (!node) return []

    // Walk the graph backwards a level at a time, so the nodes feeding this one
    // directly come first and more distant ancestors trail behind. `seen` keeps
    // a cycle from looping forever and stops a diamond listing a node twice.
    const seen = new Set([node.id])
    const queue = [node]
    const ancestors: StepNodeType[] = []

    while (queue.length > 0) {
      for (const incomer of getIncomers(queue.shift()!, nodes, edges)) {
        if (seen.has(incomer.id)) continue
        seen.add(incomer.id)
        ancestors.push(incomer)
        queue.push(incomer)
      }
    }

    // A node type declares its outputs in the registry; the run stores results
    // under the node id, which is what the token has to point at.
    return ancestors.flatMap((ancestor) =>
      nodeRegistry[ancestor.data.type].outputs.map((output) => ({
        token: `{{ ${ancestor.id}.${output.path} }}`,
        label: `${ancestor.data.title} · ${output.label}`,
        nodeType: ancestor.data.type,
      }))
    )
  }, [node, nodes, edges])
}
