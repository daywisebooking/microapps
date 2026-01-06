"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAdminFeatured, useAdminApps } from "@/lib/hooks/useAdmin"
import { useUser } from "@/lib/auth"
import { db } from "@/lib/instant-client"
import { id } from "@instantdb/react"

const BADGE_OPTIONS = [
  { id: "new", label: "New" },
  { id: "recently-updated", label: "Recently Updated" },
  { id: "trending", label: "Trending" },
  { id: "popular", label: "Popular" },
  { id: "editors-choice", label: "Editor's Choice" },
  { id: "hot", label: "Hot" },
]

export default function AdminFeaturedPage() {
  const { data: featured, isLoading: featuredLoading } = useAdminFeatured()
  const { data: apps, isLoading: appsLoading } = useAdminApps()
  const { user } = useUser()
  const [featuredAppId, setFeaturedAppId] = useState<string>("")
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (featured?.appId) {
      setFeaturedAppId(featured.appId)
      setSelectedBadges(featured.badges || [])
    }
  }, [featured])

  const handleBadgeToggle = (badgeId: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId)
        ? prev.filter((b) => b !== badgeId)
        : [...prev, badgeId]
    )
  }

  const handleClearFeatured = async () => {
    if (!user || !db) return
    
    if (!confirm("Are you sure you want to clear the featured app?")) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/featured", {
        method: "DELETE",
        headers: {
          "x-user-id": (user as any).id || "",
          "x-user-type": (user as any).type || "",
        },
      })

      if (!response.ok) {
        let errorMessage = "Failed to clear featured app"
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch {
          // If JSON parsing fails, use default error message
        }
        throw new Error(errorMessage)
      }

      // Parse response JSON safely
      try {
        await response.json()
      } catch {
        // Empty response is ok for DELETE
      }

      // Update UI by clearing local state
      if (featured?.id && db) {
        await db.transact([db.tx.featured[featured.id].delete()])
      }
      
      setFeaturedAppId("")
      setSelectedBadges([])
    } catch (err: any) {
      setError(err.message || "Failed to clear featured app")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/featured", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": (user as any).id || "",
          "x-user-type": (user as any).type || "",
        },
        body: JSON.stringify({
          appId: featuredAppId,
          badges: selectedBadges,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to set featured app")
      }

      // Update featured app in InstantDB
      // First, delete existing featured apps
      if (featured?.id) {
        await db.transact([db.tx.featured[featured.id].delete()])
      }

      // Create new featured app with proper UUID
      const featuredId = id()
      await db.transact([
        db.tx.featured[featuredId].update({
          appId: featuredAppId,
          badges: selectedBadges,
          createdAt: Date.now(),
        }),
      ])
    } catch (err: any) {
      setError(err.message || "Failed to set featured app")
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentFeaturedApp = apps.find((app) => app.id === featuredAppId)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Featured App Configuration</h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select App *
              </label>
              <select
                value={featuredAppId}
                onChange={(e) => setFeaturedAppId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#282828]"
                required
              >
                <option value="">-- Select an app --</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.slug})
                  </option>
                ))}
              </select>
            </div>
            
            {currentFeaturedApp && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-900">{currentFeaturedApp.name}</p>
                <p className="text-xs text-gray-500">{currentFeaturedApp.tagline}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Featured Badges
              </label>
              <div className="space-y-2">
                {BADGE_OPTIONS.map((badge) => (
                  <label key={badge.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBadges.includes(badge.id)}
                      onChange={() => handleBadgeToggle(badge.id)}
                      className="w-4 h-4 text-[#282828] border-gray-300 rounded focus:ring-[#282828]"
                    />
                    <span className="text-sm text-gray-700">{badge.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select badges to display on the featured app card
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Setting..." : "Set Featured App"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {featuredLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">Loading current featured app...</p>
          </CardContent>
        </Card>
      ) : featured ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Current Featured App</h2>
            {featured.app ? (
              <div>
                <p className="text-gray-900 font-medium">{featured.app.name}</p>
                <p className="text-sm text-gray-500 mb-2">{featured.app.tagline}</p>
                {featured.badges && featured.badges.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {featured.badges.map((badgeId) => {
                      const badge = BADGE_OPTIONS.find((b) => b.id === badgeId)
                      return badge ? (
                        <span
                          key={badgeId}
                          className="px-2 py-1 bg-gray-100 text-[#282828] text-xs rounded"
                        >
                          {badge.label}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-400 mb-4">
                  Set on: {new Date(featured.createdAt).toLocaleDateString()}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearFeatured}
                  disabled={isSubmitting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isSubmitting ? "Clearing..." : "Clear Featured App"}
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">App not found (ID: {featured.appId})</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">No featured app is currently set.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

