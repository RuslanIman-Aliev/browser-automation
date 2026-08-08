"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock, PlusIcon, WorkflowIcon } from "lucide-react"
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

import { useProPlan } from "../hooks/use-pro-plan"

function WorkflowLink({ workflow }: { workflow: Workflow }) {
  const pathname = usePathname()
  const href = `/workflows/${workflow.id}`

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === href}>
        <Link href={href}>
          <span>{workflow.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function WorkflowNav({
  workflows,
  createWorkflowAction,
}: {
  workflows: Workflow[]
  createWorkflowAction: (name: string) => Promise<void>
}) {
  const { state } = useSidebar()
  const [isPending, startTransition] = useTransition()
  const { isPro, isLoaded, upgrade } = useProPlan()

  // Creating a workflow is pro-only. Until Clerk hydrates the plan is unknown,
  // so the button waits rather than flashing a lock at subscribers — see the
  // matching gate in ../actions, which is the one that actually enforces it.
  const locked = isLoaded && !isPro

  const handleCreate = () => {
    if (locked) {
      upgrade()
      return
    }
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
                  <SidebarMenuButton
                    onClick={handleCreate}
                    disabled={isPending || !isLoaded}
                    title={
                      locked ? "Creating workflows is a pro feature" : undefined
                    }
                  >
                    <PlusIcon />
                    <span>New workflow</span>
                    {locked && (
                      <Lock className="ml-auto size-3 text-muted-foreground" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarSeparator />
              <SidebarMenu>
                {workflows.map((workflow) => (
                  <WorkflowLink key={workflow.id} workflow={workflow} />
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
        <WorkflowLink key={workflow.id} workflow={workflow} />
      ))}
    </SidebarMenu>
  )
}
