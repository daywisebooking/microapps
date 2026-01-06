"use client"

import { ReactNode } from "react"
import { db } from "@/lib/instant-client"
import { AuthModalProvider } from "@/contexts/AuthModalContext"

// InstantDB Provider wrapper
// InstantDB's init already provides React context, but we wrap it here for consistency
export function Providers({ children }: { children: ReactNode }) {
  // InstantDB's db object from init() already provides context
  // Wrap with AuthModalProvider to enable login modal throughout the app
  return <AuthModalProvider>{children}</AuthModalProvider>
}

