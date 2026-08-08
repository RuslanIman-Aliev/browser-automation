"use client"

import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { InspectorPanel } from "./inspector-panel"
import { LogsPanel, type StepSelection } from "./logs-panel"

/**
 * The console under the canvas. It owns the selected step — clicking a step
 * selects it, clicking the same one again clears it — so the detail view of
 * what that step produced can sit beside the list.
 */
export function ConsolePanel() {
  const [selected, setSelected] = useState<StepSelection | null>(null)

  const toggleStep = (selection: StepSelection) =>
    setSelected((current) =>
      current?.runId === selection.runId && current.nodeId === selection.nodeId
        ? null
        : selection
    )

  return (
    <ResizablePanelGroup orientation="horizontal" className="bg-background">
      {/* Each panel is a flex row of its own so its content can stretch to the
          panel's full height, the way the plain flex split used to give it. */}
      <ResizablePanel id="logs" className="flex min-w-0" minSize="10rem">
        <LogsPanel selected={selected} onSelectStep={toggleStep} />
      </ResizablePanel>
      {selected && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="inspector"
            className="flex min-w-0"
            defaultSize="24rem"
            minSize="10rem"
          >
            <InspectorPanel selection={selected} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
