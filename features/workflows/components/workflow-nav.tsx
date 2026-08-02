"use client"

import { PlusIcon, WorkflowIcon } from "lucide-react"

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

const workflows = [
  "Hiring Signals",
  "Vendor Comparison",
  "Account Research Brief",
  "Stock Market Brief",
  "Hacker News Digest",
  "Daily AI News Briefing",
  "Roadtrip Planner",
  "Solve Today's Wordle",
]

export function WorkflowNav() {
  const { state } = useSidebar()

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
                  <SidebarMenuButton>
                    <PlusIcon />
                    <span>New workflow</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarSeparator />
              <SidebarMenu>
                {workflows.map((workflow) => (
                  <SidebarMenuItem key={workflow}>
                    <SidebarMenuButton>
                      <span>{workflow}</span>
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
        <SidebarMenuItem key={workflow}>
          <SidebarMenuButton>
            <span>{workflow}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
