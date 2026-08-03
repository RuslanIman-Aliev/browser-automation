"use client"

import { Loader2Icon, PlayIcon } from "lucide-react"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"

import { runWorkflowAction } from "../actions"

export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleRun() {
    startTransition(async () => {
      await runWorkflowAction(workflowId)
    })
  }

  return (
    <div className="flex size-full items-center justify-center">
      <Button onClick={handleRun} disabled={isPending}>
        {isPending ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
        Run
      </Button>
    </div>
  )
}
