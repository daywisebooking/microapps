"use client"

import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"
import { useUser } from "@/lib/auth"
import { useState } from "react"
import { useUserVoteForApp, useAppById } from "@/lib/hooks/useApps"
import { toggleVoteClient } from "@/lib/client-mutations"

interface VoteButtonsProps {
  appId: string
  compact?: boolean
}

export function VoteButtons({ appId, compact = false }: VoteButtonsProps) {
  const { user } = useUser()
  const userId = (user as any)?.id
  const { data: existingVote } = useUserVoteForApp(userId, appId)
  const { data: app } = useAppById(appId)
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = async (direction: "up" | "down") => {
    if (!user || isLoading || !app) return

    setIsLoading(true)

    try {
      const result = await toggleVoteClient(
        userId,
        appId,
        direction,
        existingVote,
        app.voteCount || 0
      )

      if (!result.success) {
        alert(result.error || "Failed to record vote")
      }
    } catch (error) {
      console.error("Vote error:", error)
      alert("Failed to record vote")
    } finally {
      setIsLoading(false)
    }
  }

  const currentVote = existingVote?.direction as "up" | "down" | undefined
  const displayCount = app?.voteCount || 0

  if (!user) {
    // Show read-only view for non-logged-in users
    return (
      <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUp className="w-4 h-4" />
          <span>{displayCount}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
      <Button
        variant={currentVote === "up" ? "default" : "outline"}
        size={compact ? "sm" : "default"}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleVote("up")
        }}
        disabled={isLoading}
        className={`flex items-center gap-1 ${
          currentVote === "up" 
            ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
            : "hover:bg-gray-100"
        }`}
      >
        <ArrowUp className="w-4 h-4" />
      </Button>
      <Button
        variant={currentVote === "down" ? "default" : "outline"}
        size={compact ? "sm" : "default"}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleVote("down")
        }}
        disabled={isLoading}
        className={`flex items-center gap-1 ${
          currentVote === "down" 
            ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
            : "hover:bg-gray-100"
        }`}
      >
        <ArrowDown className="w-4 h-4" />
      </Button>
      <span className={`text-sm font-medium ${
        currentVote === "up" 
          ? "text-green-600" 
          : currentVote === "down" 
          ? "text-red-600" 
          : compact 
          ? "text-gray-500" 
          : "text-gray-700"
      }`}>
        {displayCount}
      </span>
    </div>
  )
}

