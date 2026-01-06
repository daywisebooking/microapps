"use client"

import { db } from "./instant-client"
import { useState, useEffect } from "react"
import type { User } from "./instant"
import { generateRandomUsername } from "./utils"

// Mock auth storage key
const MOCK_AUTH_KEY = "microapps_mock_auth"
const MOCK_CODE_KEY = "microapps_mock_code"

// Development mode: Mock auth functions when InstantDB is not configured
function getMockCode(email: string): string | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(`${MOCK_CODE_KEY}_${email}`)
  if (!stored) return null
  const { code, expires } = JSON.parse(stored)
  if (Date.now() > expires) {
    localStorage.removeItem(`${MOCK_CODE_KEY}_${email}`)
    return null
  }
  return code
}

function setMockCode(email: string, code: string): void {
  if (typeof window === "undefined") return
  // Code expires in 10 minutes
  const expires = Date.now() + 10 * 60 * 1000
  localStorage.setItem(`${MOCK_CODE_KEY}_${email}`, JSON.stringify({ code, expires }))
}

function setMockUser(user: User): void {
  if (typeof window === "undefined") return
  localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(user))
}

function getMockUser(): User | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(MOCK_AUTH_KEY)
  return stored ? JSON.parse(stored) : null
}

function clearMockAuth(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(MOCK_AUTH_KEY)
  // Clear all mock codes
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(MOCK_CODE_KEY)) {
      localStorage.removeItem(key)
    }
  })
}

// InstantDB auth utilities
// InstantDB handles auth through the db.auth object

export async function requestCode(email: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    // Development mode: Generate a mock code
    // In development, use "123456" as the code for easy testing
    const mockCode = "123456"
    setMockCode(email, mockCode)
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    console.log(`[DEV MODE] Magic code for ${email}: ${mockCode}`)
    return { success: true }
  }

  try {
    // InstantDB magic code auth - request code
    await db.auth.sendMagicCode({ email })
    return { success: true }
  } catch (error: any) {
    // Generic error message - don't reveal if email exists
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function verifyCode(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    // Development mode: Check mock code
    const storedCode = getMockCode(email)
    
    if (!storedCode) {
      return { success: false, error: "Code expired. Please request a new one." }
    }
    
    if (storedCode !== code) {
      return { success: false, error: "Invalid code. Please try again." }
    }
    
    // Create mock user
    // In dev mode, set admin type for specific emails
    // Admin emails are configured via ADMIN_EMAILS environment variable (comma-separated)
    // In development, falls back to a default for convenience
    const adminEmailsFromEnv = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    const devFallback = process.env.NODE_ENV === 'development' ? ['hello@daywisebooking.com'] : []
    const adminEmails = adminEmailsFromEnv.length > 0 ? adminEmailsFromEnv : devFallback
    const isAdmin = adminEmails.includes(email.toLowerCase())
    
    // Import username generator
    const { generateRandomUsername } = require("./utils")
    
    const mockUser: User = {
      id: `mock_${Date.now()}`,
      email,
      username: generateRandomUsername(),
      type: isAdmin ? "admin" : "user",
      createdAt: Date.now(),
    }
    
    setMockUser(mockUser)
    // Clear the code after successful login
    localStorage.removeItem(`${MOCK_CODE_KEY}_${email}`)
    
    // Trigger auth change event for useUser hook
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"))
    }
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    return { success: true }
  }

  try {
    // InstantDB magic code auth - verify code
    await db.auth.signInWithMagicCode({ email, code })
    
    // Username will be generated lazily when user creates their first comment
    // This is handled in mutations.ts createComment function
    
    return { success: true }
  } catch (error: any) {
    // Generic error message - don't reveal if code was close
    return { success: false, error: "Invalid code. Please try again." }
  }
}

export async function logout(): Promise<void> {
  if (!db) {
    // Development mode: Clear mock auth
    clearMockAuth()
    // Trigger auth change event for useUser hook
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"))
    }
    return
  }
  await db.auth.signOut()
}

// Hook to get current user
// InstantDB provides useAuth() method on the db object
export function useUser() {
  const [mockUser, setMockUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!db) {
      // Development mode: Read from localStorage
      const user = getMockUser()
      setMockUserState(user)
      setIsLoading(false)
      
      // Listen for storage changes (for logout/login from other tabs)
      const handleStorageChange = () => {
        const updatedUser = getMockUser()
        setMockUserState(updatedUser)
      }
      
      if (typeof window !== "undefined") {
        window.addEventListener("storage", handleStorageChange)
        // Also listen for custom events for same-tab updates
        window.addEventListener("auth-change", handleStorageChange)
        
        return () => {
          window.removeEventListener("storage", handleStorageChange)
          window.removeEventListener("auth-change", handleStorageChange)
        }
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  if (!db) {
    // Return mock user when db is not available
    return { user: mockUser, isLoading }
  }

  // InstantDB provides useAuth() directly on the db object
  const auth = db.useAuth()
  
  return {
    user: auth?.user || null,
    isLoading: auth?.isLoading || false,
  }
}
