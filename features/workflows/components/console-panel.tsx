"use client"

import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { InspectorPanel } from "./inspector-panel"
import { LogsPanel, selectionKey, type ConsoleSelection } from "./logs-panel"

/**
 * The console under the canvas. It owns what's selected in the run list —
 * either a step or a run's replay, never both — so the detail view of what
 * that row holds can sit beside the list. Clicking the selected row again
 * clears it.
 */
export function ConsolePanel() {
  const [selected, setSelected] = useState<ConsoleSelection | null>(null)

  const toggle = (selection: ConsoleSelection) =>
    setSelected((current) =>
      current && selectionKey(current) === selectionKey(selection)
        ? null
        : selection
    )

  return (
    <ResizablePanelGroup orientation="horizontal" className="bg-background">
      {/* Each panel is a flex row of its own so its content can stretch to the
          panel's full height, the way the plain flex split used to give it. */}
      <ResizablePanel id="logs" className="flex min-w-0" minSize="10rem">
        <LogsPanel selected={selected} onSelect={toggle} />
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
