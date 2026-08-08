import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import {
  nodeRegistry,
  type NodeType,
} from "@/features/workflows/nodes/node-registry"

/**
 * The accent-colored icon chip, mirroring the node on the canvas. Shared by the
 * sidebar's palette and editor and by the console's step rows.
 */
export function NodeIcon({
  type,
  running,
  className,
  iconClassName,
}: {
  type: NodeType
  // Spins in place of the node's icon, keeping the chip and its accent, so a
  // step in flight still reads as the node it belongs to.
  running?: boolean
  className?: string
  iconClassName?: string
}) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  const iconClasses = cn("size-3.5", iconClassName)

  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      {running ? (
        <Spinner className={iconClasses} />
      ) : (
        <Icon className={iconClasses} />
      )}
    </span>
  )
}
