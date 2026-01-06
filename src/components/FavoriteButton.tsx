"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useUser } from "@/lib/auth"
import { useState } from "react"
import { useUserFavoriteForApp, useAppById } from "@/lib/hooks/useApps"
import { toggleFavoriteClient } from "@/lib/client-mutations"

interface FavoriteButtonProps {
  appId: string
  compact?: boolean
  showCount?: boolean
}

export function FavoriteButton({ 
  appId, 
  compact = false,
  showCount = true 
}: FavoriteButtonProps) {
  const { user } = useUser()
  const userId = (user as any)?.id
  const { data: existingFavorite } = useUserFavoriteForApp(userId, appId)
  const { data: app } = useAppById(appId)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleFavorite = async () => {
    if (!user || isLoading || !app) return

    setIsLoading(true)

    try {
      const result = await toggleFavoriteClient(
        userId,
        appId,
        existingFavorite,
        app.favoriteCount || 0
      )

      if (!result.success) {
        alert(result.error || "Failed to toggle favorite")
      }
    } catch (error) {
      console.error("Favorite error:", error)
      alert("Failed to toggle favorite")
    } finally {
      setIsLoading(false)
    }
  }

  const isFavorited = !!existingFavorite
  const displayCount = app?.favoriteCount || 0

  if (!user) {
    // Show read-only view for non-logged-in users
    return (
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <Heart className="w-4 h-4" />
        {showCount && <span>{displayCount}</span>}
      </div>
    )
  }

  return (
    <Button
      variant={isFavorited ? "default" : "outline"}
      size={compact ? "sm" : "sm"}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleToggleFavorite()
      }}
      disabled={isLoading}
      className={`flex items-center gap-1 ${
        isFavorited 
          ? "bg-[#282828] hover:bg-[#1a1a1a] text-white border-[#282828]" 
          : "hover:bg-gray-100"
      }`}
    >
      <Heart 
        className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`}
      />
      {showCount && <span className={isFavorited ? "text-white" : ""}>{displayCount}</span>}
    </Button>
  )
}
