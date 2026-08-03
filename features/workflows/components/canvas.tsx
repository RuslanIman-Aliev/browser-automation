"use client"

import {
  addEdge,
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type ColorMode,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import { useTheme } from "next-themes"
import { useCallback, useSyncExternalStore, type CSSProperties } from "react"

import "@xyflow/react/dist/style.css"

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "Start" },
    type: "input",
  },
  { id: "2", position: { x: 0, y: 120 }, data: { label: "Step" } },
  {
    id: "3",
    position: { x: 0, y: 240 },
    data: { label: "End" },
    type: "output",
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
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
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={mounted ? (resolvedTheme as ColorMode) : "light"}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border)"}}
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
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
