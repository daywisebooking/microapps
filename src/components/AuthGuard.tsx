"use client"

import { useUser } from "@/lib/auth"
import { useAuthModal } from "@/contexts/AuthModalContext"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading } = useUser()
  const { openLoginModal } = useAuthModal()

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      fallback || (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Please log in to continue.</p>
          <Button onClick={openLoginModal}>
            Login
          </Button>
        </div>
      )
    )
  }

  return <>{children}</>
}

