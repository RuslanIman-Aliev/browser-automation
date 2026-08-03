"use client"

import { ReactNode } from "react"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"
import { Spinner } from "@/components/ui/spinner"

export function Room({
  children,
  roomId,
}: {
  children: ReactNode
  roomId: string
}) {
  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint="/api/liveblocks/auth"
      resolveUsers={async ({ userIds }) => {
        try {
          const response = await fetch("/api/liveblocks/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds }),
          })

          if (!response.ok) {
            return undefined
          }

          return await response.json()
        } catch {
          return undefined
        }
      }}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>
          <Spinner className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"/>
        </div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
