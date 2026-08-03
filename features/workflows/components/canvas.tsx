"use client"

import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow"
import "@liveblocks/react-flow/style.css"
import { AvatarStack } from "@liveblocks/react-ui"
import "@liveblocks/react-ui/style.css"
import {
  Background,
  ConnectionLineType,
  Controls,
  NodeTypes,
  Panel,
  ReactFlow,
  type ColorMode,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useTheme } from "next-themes"
import { useSyncExternalStore, type CSSProperties } from "react"
import { StepNodeType } from "../nodes/node-registry"
import { StepNode } from "./step-node"

const nodeTypes: NodeTypes = {
  step: StepNode,
}

const initialNodes: StepNodeType[] = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: {
      type: "start",
      kind: "trigger",
      title: "Start",
      values: {},
    },
  },
]
const initialEdges: Edge[] = [
  { id: "start-open-url", source: "start", target: "open-url" },
]

const subscribeToNothing = () => () => {}
const getMountedSnapshot = () => true
const getServerSnapshot = () => false

/**
 * False during the server render and the hydration pass, true afterwards, so
 * the first client render matches the server output exactly.
 */
function useMounted() {
  return useSyncExternalStore(
    subscribeToNothing,
    getMountedSnapshot,
    getServerSnapshot
  )
}

export function Canvas() {
  const mounted = useMounted()
  const { resolvedTheme } = useTheme()
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<StepNodeType, Edge>({
      suspense: true,
      nodes: { initial: initialNodes },
      edges: { initial: initialEdges },
    })

  return (
    <div className="size-full">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        colorMode={mounted ? (resolvedTheme as ColorMode) : "light"}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border)" }}
        fitView
        defaultEdgeOptions={{
          style: { stroke: "var(--border)" },
          type: "smoothstep",
        }}
        style={
          {
            "--xy-background-color": "var(--background)",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as CSSProperties
        }
        maxZoom={1}
      >
        <Background />
        <Controls />
        <Cursors />
        <Panel position="top-right">
          <AvatarStack />
        </Panel>
      </ReactFlow>
    </div>
  )
}
