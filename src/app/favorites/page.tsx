"use client"

import { AppCard } from "@/components/AppCard"
import { AuthGuard } from "@/components/AuthGuard"
import { useUser } from "@/lib/auth"
import { useUserFavorites, useApps } from "@/lib/hooks/useApps"
import { useMemo } from "react"

export default function FavoritesPage() {
  const { user } = useUser()
  const userId = (user as any)?.id
  const { data: userFavorites, isLoading: favoritesLoading } = useUserFavorites(userId)
  const { data: allApps, isLoading: appsLoading } = useApps()

  // Filter apps to show only favorited ones
  const favoritedApps = useMemo(() => {
    if (!userFavorites || !allApps) return []
    const favoriteAppIds = new Set(userFavorites.map((fav: any) => fav.appId))
    return allApps.filter(app => favoriteAppIds.has(app.id))
  }, [userFavorites, allApps])

  const isLoading = favoritesLoading || appsLoading

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Favorites</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading your favorites...</p>
          </div>
        ) : favoritedApps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven&apos;t favorited any apps yet.</p>
            <p className="text-sm text-gray-400">
              Browse apps and click the heart icon to add them to your favorites.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1">
            {favoritedApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

