"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { LoginModal } from "@/components/LoginModal"

interface AuthModalContextType {
  openLoginModal: () => void
  closeLoginModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Only render the modal after client-side mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const openLoginModal = () => setIsOpen(true)
  const closeLoginModal = () => setIsOpen(false)

  return (
    <AuthModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}
      {isMounted && <LoginModal open={isOpen} onOpenChange={setIsOpen} />}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider")
  }
  return context
}

