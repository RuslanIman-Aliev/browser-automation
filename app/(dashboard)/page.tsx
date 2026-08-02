import { PlusIcon, WorkflowIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WorkflowIcon />
          </EmptyMedia>
          <EmptyTitle>No workflow selected</EmptyTitle>
          <EmptyDescription>
            Select a workflow from the sidebar or create a new one to get
            started.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>
            <PlusIcon data-icon="inline-start" />
            New workflow
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
