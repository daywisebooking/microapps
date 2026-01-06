// Server-side InstantDB types and admin initialization
// DO NOT import @instantdb/react here - use instant-client.ts for client-side

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN

// Initialize InstantDB admin client (for server-side operations)
// This should only be used in API routes and server-side code
// Using a getter function to avoid importing @instantdb/admin at build time
let adminDbInstance: any = null
let initializationAttempted = false
let initializationError: Error | null = null

function getAdminDbInstance() {
  // Only initialize at runtime, not during build
  if (typeof window !== 'undefined') {
    return null // Admin DB is server-side only
  }
  
  if (adminDbInstance !== null) {
    return adminDbInstance
  }
  
  // If we've already tried and failed, don't try again
  if (initializationAttempted) {
    return null
  }
  
  initializationAttempted = true
  
  if (APP_ID && ADMIN_TOKEN) {
    try {
      // Dynamic require - only executed at runtime
      const adminModule = require("@instantdb/admin")
      const initAdmin = adminModule.init || adminModule.default?.init || adminModule.default
      adminDbInstance = initAdmin({ appId: APP_ID, adminToken: ADMIN_TOKEN })
      return adminDbInstance
    } catch (error) {
      // Store error to avoid repeated attempts
      initializationError = error instanceof Error ? error : new Error(String(error))
      // Silently fail if admin module can't be loaded
      console.warn("InstantDB admin not available:", initializationError.message)
      return null
    }
  }
  
  return null
}

// Export as a proxy that only loads adminDb when actually accessed at runtime
export const adminDb = new Proxy({} as any, {
  get(_target, prop) {
    const db = getAdminDbInstance()
    if (!db) {
      // Return a no-op function for methods, undefined for properties
      if (typeof prop === 'string' && (prop === 'query' || prop === 'transact' || prop === 'tx')) {
        return () => Promise.resolve(null)
      }
      return undefined
    }
    const value = db[prop]
    return typeof value === 'function' ? value.bind(db) : value
  },
  has(_target, prop) {
    // CRITICAL FIX: Don't trigger initialization in the 'has' trap
    // This prevents crashes during module evaluation when Next.js checks property existence
    // Just return true for known properties if we have config, false otherwise
    if (typeof window !== 'undefined') {
      return false
    }
    // Only return true for properties we know exist, without initializing
    // This prevents the require() from being called during module evaluation
    return prop === 'query' || prop === 'transact' || prop === 'tx'
  }
})

// Type definitions for our data models
export interface App {
  id: string
  slug: string
  name: string
  description: string
  tagline: string
  tags: string[]
  logoUrl: string
  websiteUrl: string
  createdAt: number
  voteCount?: number
  favoriteCount?: number
}

export interface User {
  id: string
  email: string
  username?: string
  type?: "admin" | "user"
  createdAt: number
  disabled?: boolean
}

export interface Vote {
  id: string
  userId: string
  appId: string
  direction: "up" | "down"
  createdAt: number
}

export interface Favorite {
  id: string
  userId: string
  appId: string
  createdAt: number
}

export type CommentType = "general" | "feature" | "bug"
export type CommentStatus = "published" | "pending_review" | "removed"

export interface Comment {
  id: string
  appId: string
  userId: string
  parentId: string | null
  content: string
  type: CommentType
  status?: CommentStatus
  voteCount?: number
  createdAt: number
}

export interface CommentVote {
  id: string
  userId: string
  commentId: string
  direction: "up" | "down"
  createdAt: number
}

export type ReportType = "user_report" | "auto_flag"

export interface Report {
  id: string
  commentId: string
  userId: string
  reason: string
  status: "pending" | "approved" | "rejected"
  type?: ReportType
  violations?: string[]
  createdAt: number
}

export interface Event {
  id: string
  userId?: string
  eventType: "app_view" | "vote" | "favorite" | "comment_create" | "search"
  appId?: string
  metadata?: Record<string, any>
  createdAt: number
}

export interface Featured {
  id: string
  appId: string
  badges?: string[]
  createdAt: number
}
