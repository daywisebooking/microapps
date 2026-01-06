"use client"

import { db } from "@/lib/instant-client"
import { useMemo } from "react"
import type { Comment } from "@/lib/instant"
import { voteCommentAPI } from "@/lib/api"

// Hook to query comments for an app
export function useCommentsByApp(appId: string) {
  if (!db) {
    return { data: [], isLoading: false }
  }

  // Always call the hook (Rules of Hooks) but query will be empty if no appId
  const instantQuery = db.useQuery({
    comments: appId ? {
      $: {
        where: { 
          appId
        },
      },
    } : undefined,
    $users: {},
  })

  const comments = useMemo(() => {
    // Return empty if no appId or no data
    if (!appId || !instantQuery?.data?.comments) return []
    
    return instantQuery.data.comments
      .map((comment: any) => {
        const user = instantQuery.data.$users?.find((u: any) => u.id === comment.userId)
        return {
          id: comment.id,
          appId: comment.appId,
          userId: comment.userId,
          userName: user?.username || "Anonymous",
          parentId: comment.parentId || null,
          content: comment.content,
          type: comment.type as "general" | "feature" | "bug",
          status: comment.status || "published",
          voteCount: comment.voteCount || 0,
          createdAt: comment.createdAt,
        }
      }) as (Comment & { userName: string })[]
  }, [appId, instantQuery?.data])

  return { data: comments, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to track user's votes on comments
export function useCommentVotes(userId: string | null) {
  if (!db || !userId) {
    return { 
      votes: new Map<string, "up" | "down">(), 
      isLoading: false,
      voteComment: async () => ({ success: false, error: "Not authenticated" })
    }
  }

  const instantQuery = db.useQuery({
    commentVotes: {
      $: {
        where: { userId },
      },
    },
  })

  const votesMap = useMemo(() => {
    const map = new Map<string, "up" | "down">()
    if (instantQuery?.data?.commentVotes) {
      instantQuery.data.commentVotes.forEach((vote: any) => {
        map.set(vote.commentId, vote.direction)
      })
    }
    return map
  }, [instantQuery?.data])

  const voteComment = async (commentId: string, direction: "up" | "down") => {
    return await voteCommentAPI(commentId, direction, userId)
  }

  return { 
    votes: votesMap, 
    isLoading: instantQuery?.isLoading ?? false,
    voteComment
  }
}
