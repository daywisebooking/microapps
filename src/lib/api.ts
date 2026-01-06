// This file provides helper functions for server-side usage with InstantDB
// For client components, use InstantDB hooks directly from lib/hooks
// Note: This file doesn't import db since it's client-side only

import type { App as AppType } from "./schema"
import type { Comment as CommentType } from "./schema"

// Re-export types for compatibility
export type { App, Comment } from "./schema"

// Helper to convert InstantDB app to our App type
function convertApp(app: any): AppType {
  return {
    id: app.id,
    slug: app.slug,
    name: app.name,
    description: app.description,
    tagline: app.tagline,
    tags: app.tags || [],
    logoUrl: app.logoUrl,
    websiteUrl: app.websiteUrl,
    createdAt: app.createdAt,
    voteCount: app.voteCount || 0,
    favoriteCount: app.favoriteCount || 0,
  }
}

// Helper to convert InstantDB comment to our Comment type
function convertComment(comment: any, users: any[]): CommentType & { userName: string } {
  const user = users.find((u) => u.id === comment.userId)
  return {
    id: comment.id,
    appId: comment.appId,
    userId: comment.userId,
    userName: user?.username || "Anonymous",
    parentId: comment.parentId,
    content: comment.content,
    type: comment.type as "general" | "feature" | "bug",
    voteCount: comment.voteCount || 0,
    createdAt: comment.createdAt,
  }
}

// Note: These functions are kept for server-side compatibility
// Client components should use hooks from lib/hooks instead
// InstantDB is primarily designed for client-side React hooks

export async function getApps(): Promise<AppType[]> {
  // Note: Server-side queries would need InstantDB server SDK
  // For now, return empty array - use client hooks instead
  return []
}

export async function getAppBySlug(slug: string): Promise<AppType | null> {
  // Note: Server-side queries would need InstantDB server SDK
  // For now, return null - use client hooks instead
  return null
}

export async function getCommentsByApp(appId: string): Promise<(CommentType & { userName: string })[]> {
  // Note: Server-side queries would need InstantDB server SDK
  // For now, return empty array - use client hooks instead
  return []
}

export async function getFeaturedApp(): Promise<AppType | null> {
  // Note: Server-side queries would need InstantDB server SDK
  // For now, return null - use client hooks instead
  return null
}

export async function searchApps(query: string, tags?: string[]): Promise<AppType[]> {
  // Note: Server-side queries would need InstantDB server SDK
  // For now, return empty array - use client hooks instead
  return []
}

export async function getAllTags(): Promise<string[]> {
  // Note: Server-side queries would need InstantDB server SDK
  // For now, return empty array - use client hooks instead
  return []
}

// Client-side API helpers for comment actions
// These call the API routes with proper authentication

export async function createCommentAPI(
  appId: string,
  content: string,
  type: "general" | "feature" | "bug",
  userId: string,
  parentId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ appId, content, type, parentId }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create comment" }
    }

    return { success: true }
  } catch (error) {
    console.error("Create comment error:", error)
    return { success: false, error: "Network error. Please try again." }
  }
}

export async function voteCommentAPI(
  commentId: string,
  direction: "up" | "down",
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/comments/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ commentId, direction }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to vote on comment" }
    }

    return { success: true }
  } catch (error) {
    console.error("Vote comment error:", error)
    return { success: false, error: "Network error. Please try again." }
  }
}

export async function deleteCommentAPI(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        "x-user-id": userId,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to delete comment" }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete comment error:", error)
    return { success: false, error: "Network error. Please try again." }
  }
}
