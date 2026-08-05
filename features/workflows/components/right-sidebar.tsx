"use client"

import { useRef, useState, useTransition } from "react"
import { useReactFlow, useStore } from "@xyflow/react"
import { MoreHorizontal, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { deleteWorkflowAction, runWorkflowAction } from "@/features/workflows/actions"
import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import { validateGraph } from "../lib/validate-graph"
import {
  useUpstreamConnections,
  type UpstreamConnection,
} from "../hooks/use-upstream-connections"

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// The accent-colored icon chip, mirroring the node on the canvas.
function NodeIcon({
  type,
  className,
  iconClassName,
}: {
  type: NodeType
  className?: string
  iconClassName?: string
}) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      <Icon className={cn("size-3.5", iconClassName)} />
    </span>
  )
}

// A titled, scrollable panel. Each tab renders its content inside one.
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor tab — edits the fields of the selected node.
// ---------------------------------------------------------------------------

// Either kind of control a field renders as. Both carry a caret, which is what
// the Connections chips insert at.
type FieldElement = HTMLInputElement | HTMLTextAreaElement

// A single editor field for a node property: a text area when the field opts
// into multi-line, a single-line input otherwise.
function Field({
  field,
  value,
  onChange,
  onFocus,
  register,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  // Hands the rendered control to the Inspector, which needs the live element
  // to read its caret. Named rather than passed as `ref` so it types the same
  // for the input and the text area.
  register: React.RefCallback<FieldElement>
}) {
  if (field.multiline) {
    return (
      <Textarea
        id={field.key}
        ref={register}
        value={value}
        placeholder={field.placeholder}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <Input
      id={field.key}
      ref={register}
      value={value}
      placeholder={field.placeholder}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// Every output reachable from upstream of the selected node, one chip each.
// Clicking a chip drops its {{ }} token into a field.
function Connections({
  connections,
  onInsert,
}: {
  connections: UpstreamConnection[]
  onInsert: (token: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border p-3">
      <span className="text-xs font-medium text-muted-foreground">
        Connections
      </span>
      <div className="flex flex-wrap gap-1">
        {connections.map((connection) => (
          <Button
            key={connection.token}
            variant="outline"
            size="xs"
            className="max-w-full"
            title={connection.token}
            onClick={() => onInsert(connection.token)}
          >
            <NodeIcon
              type={connection.nodeType}
              className="size-4 rounded-sm"
              iconClassName="size-3"
            />
            <span className="truncate">{connection.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const connections = useUpstreamConnections(node)

  // The field a chip inserts into: the one focused most recently, or the node's
  // first field until one has been touched.
  const [activeKey, setActiveKey] = useState<string>()
  // The live controls, keyed by field, so an insert can land at the caret.
  const elements = useRef(new Map<string, FieldElement>())

  // Selecting a different node means a different set of fields.
  const [prevNodeId, setPrevNodeId] = useState(node?.id)
  if (node?.id !== prevNodeId) {
    setPrevNodeId(node?.id)
    setActiveKey(undefined)
  }

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]

  const setValue = (key: string, value: string) =>
    updateNodeData(node.id, { values: { ...values, [key]: value } })

  const insert = (token: string) => {
    const key = activeKey ?? def.fields[0]?.key
    if (!key) return

    const element = elements.current.get(key)
    const value = values[key] ?? ""
    // Only trust the caret on a field the user actually focused — an untouched
    // control reports a caret at 0, which would insert in front of its value.
    const focused = activeKey === key ? element : undefined
    const start = focused?.selectionStart ?? value.length
    const end = focused?.selectionEnd ?? value.length

    setValue(key, value.slice(0, start) + token + value.slice(end))
    setActiveKey(key)

    // The click moved focus to the chip. Once the new value has rendered, hand
    // focus back with the caret sitting just past what we inserted.
    const caret = start + token.length
    requestAnimationFrame(() => {
      element?.focus()
      element?.setSelectionRange(caret, caret)
    })
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key} className="text-xs">
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              <Field
                field={field}
                value={values[field.key] ?? ""}
                onChange={(value) => setValue(field.key, value)}
                onFocus={() => setActiveKey(field.key)}
                register={(element) => {
                  if (element) elements.current.set(field.key, element)
                  else elements.current.delete(field.key)
                }}
              />
            </div>
          ))
        )}
      </div>
      {connections.length > 0 && (
        <Connections connections={connections} onInsert={insert} />
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Toolbar tab — adds nodes to the canvas, grouped by kind.
// ---------------------------------------------------------------------------

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below.
const definitions = Object.values(nodeRegistry)

// The Toolbar tab: a button per node type that adds it to the canvas.
function Palette() {
  const { getNodes, addNodes, screenToFlowPosition } =
    useReactFlow<StepNodeType>()
  // The pane lives in the canvas, so its on-screen rect is the only way to know
  // where the middle of the current view is from over here in the sidebar.
  const pane = useStore((state) => state.domNode)

  const add = (type: NodeType) => {
    const def = nodeRegistry[type]
    const nodes = getNodes()

    if (
      def.kind === "trigger" &&
      nodes.some((n) => n.data.kind === "trigger")
    ) {
      toast.error("A workflow can only have one trigger")
      return
    }

    // Number repeats of a type ("Open URL 1", "Open URL 2") so they stay easy to
    // tell apart, reusing numbers freed up by deleted nodes.
    const titles = new Set(nodes.map((n) => n.data.title))
    let count = 1
    while (titles.has(`${def.label} ${count}`)) count++

    const rect = pane?.getBoundingClientRect()

    addNodes({
      id: crypto.randomUUID(),
      type: "step",
      position: rect
        ? screenToFlowPosition({
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          })
        : { x: 0, y: 0 },
      // Place the node by its center, so it lands in the middle of the view
      origin: [0.5, 0.5],
      data: {
        type,
        kind: def.kind,
        title: `${def.label} ${count}`,
        values: {},
      },
    })
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => (
                  <Button
                    key={def.type}
                    variant="ghost"
                    onClick={() => add(def.type as NodeType)}
                    className="justify-start gap-2.5 px-1.5 text-xs"
                  >
                    <NodeIcon type={def.type as NodeType} />
                    {def.label}
                  </Button>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

// The "..." menu for workflow-level actions.
function ActionsMenu({ workflowId }: { workflowId: string }) {
  const [isPending, startTransition] = useTransition()

  // The action redirects home once the workflow and its room are gone.
  const handleDelete = () => {
    startTransition(() => deleteWorkflowAction(workflowId))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          className="text-xs [&_svg:not([class*='size-'])]:size-3.5"
          disabled={isPending}
          onSelect={handleDelete}
        >
          <Trash2 />
          Delete workflow
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Kicks off a run of the current workflow.
function RunButton({workflowId}: {workflowId: string}) {
  const {getNodes, getEdges} = useReactFlow<StepNodeType>()
  const [isPending, startTransition] = useTransition()
   return (
    <Button
      size="sm"
      variant="secondary"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const graph = {nodes: getNodes(), edges: getEdges()}
          const problems = validateGraph(graph)
          if (problems.length > 0) {
            toast.error(problems.join(" "))
            return
          }
          startTransition(async () => {
            await runWorkflowAction({workflowId, graph})
          })
        })
      }}
    >
      <Play fill="primary" />
      Run
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState("toolbar")

  // TODO: read the currently selected node from React Flow.
  const selected = useStore(
    (state) => state.nodes.find((n) => n.selected) as StepNodeType | undefined
  )

  // TODO: auto-switch to the Editor tab when the selection changes.

  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id)
  if(selected?.id !== prevSelectedId) {
    setPrevSelectedId(selected?.id)
    setTab("editor")
  }
  return (
    <ResizablePanel
      className="bg-background"
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      groupResizeBehavior="preserve-pixel-size"
    >
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton workflowId={workflowId}/>
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector node={selected} />
        </TabsContent>
      </Tabs>
    </ResizablePanel>
  )
}
