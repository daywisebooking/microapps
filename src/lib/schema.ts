// InstantDB schema types
// These types match the InstantDB schema structure

export interface User {
  id: string
  email: string
  username?: string
  type?: "admin" | "user"
  createdAt: number
  disabled?: boolean
}

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

export interface RankSnapshot {
  id: string
  appId: string
  rank: number
  voteCount: number
  createdAt: number
}

