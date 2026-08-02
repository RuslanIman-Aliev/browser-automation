"use client"

import { PlusIcon, WorkflowIcon } from "lucide-react"
import { useTransition } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import type { Workflow } from "@/lib/db/schema"

export function WorkflowNav({
  workflows,
  createWorkflowAction,
}: {
  workflows: Workflow[]
  createWorkflowAction: (name: string) => Promise<void>
}) {
  const { state } = useSidebar()
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    startTransition(() => createWorkflowAction(generateSlug()))
  }

  if (state === "collapsed") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton>
                <WorkflowIcon />
                <span className="sr-only">Workflows</span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent side="right" align="start">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleCreate} disabled={isPending}>
                    <PlusIcon />
                    <span>New workflow</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarSeparator />
              <SidebarMenu>
                {workflows.map((workflow) => (
                  <SidebarMenuItem key={workflow.id}>
                    <SidebarMenuButton>
                      <span>{workflow.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {workflows.map((workflow) => (
        <SidebarMenuItem key={workflow.id}>
          <SidebarMenuButton>
            <span>{workflow.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
