"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { db } from "@/lib/instant-client"

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d")
  
  const eventsQuery = db ? db.useQuery({ events: {} }) : null
  const appsQuery = db ? db.useQuery({ apps: {} }) : null
  const votesQuery = db ? db.useQuery({ votes: {} }) : null
  const commentsQuery = db ? db.useQuery({ comments: {} }) : null
  const favoritesQuery = db ? db.useQuery({ favorites: {} }) : null

  const stats = useMemo(() => {
    const now = Date.now()
    const timeRangeMs = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "all": Infinity,
    }[timeRange]

    // Filter events by time range
    const filteredEvents = eventsQuery?.data?.events?.filter(
      (e: any) => now - e.createdAt < timeRangeMs
    ) || []

    // Filter votes by time range
    const filteredVotes = votesQuery?.data?.votes?.filter(
      (v: any) => now - v.createdAt < timeRangeMs
    ) || []

    // Filter comments by time range
    const filteredComments = commentsQuery?.data?.comments?.filter(
      (c: any) => now - c.createdAt < timeRangeMs
    ) || []

    // Filter favorites by time range
    const filteredFavorites = favoritesQuery?.data?.favorites?.filter(
      (f: any) => now - f.createdAt < timeRangeMs
    ) || []

    const views = filteredEvents.filter((e: any) => e.eventType === "app_view").length
    const votes = filteredVotes.length
    const comments = filteredComments.length
    const favorites = filteredFavorites.length

    // Top apps by views
    const appViews = new Map<string, number>()
    filteredEvents
      .filter((e: any) => e.eventType === "app_view" && e.appId)
      .forEach((e: any) => {
        appViews.set(e.appId, (appViews.get(e.appId) || 0) + 1)
      })

    const topApps = Array.from(appViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([appId, count]) => ({
        app: appsQuery?.data?.apps?.find((a: any) => a.id === appId),
        views: count,
      }))
      .filter((item) => item.app) // Filter out apps that don't exist

    // Top apps by favorites
    const appFavorites = new Map<string, number>()
    filteredFavorites.forEach((f: any) => {
      if (f.appId) {
        appFavorites.set(f.appId, (appFavorites.get(f.appId) || 0) + 1)
      }
    })

    const topAppsByFavorites = Array.from(appFavorites.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([appId, count]) => ({
        app: appsQuery?.data?.apps?.find((a: any) => a.id === appId),
        favorites: count,
      }))
      .filter((item) => item.app)

    // Top apps by upvotes (using voteCount from apps)
    const topAppsByUpvotes = (appsQuery?.data?.apps || [])
      .filter((a: any) => a.voteCount > 0)
      .sort((a: any, b: any) => (b.voteCount || 0) - (a.voteCount || 0))
      .slice(0, 3)
      .map((app: any) => ({
        app,
        votes: app.voteCount || 0,
      }))

    // Worst performing apps (lowest vote counts)
    const worstApps = (appsQuery?.data?.apps || [])
      .sort((a: any, b: any) => (a.voteCount || 0) - (b.voteCount || 0))
      .slice(0, 3)
      .map((app: any) => ({
        app,
        votes: app.voteCount || 0,
      }))

    return { views, votes, comments, favorites, topApps, topAppsByFavorites, topAppsByUpvotes, worstApps }
  }, [eventsQuery?.data, votesQuery?.data, commentsQuery?.data, favoritesQuery?.data, appsQuery?.data, timeRange])

  if (!db) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>
        <div className="text-center py-12 text-gray-500">
          InstantDB is not configured. Please set NEXT_PUBLIC_INSTANT_APP_ID
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("7d")}
            className={`px-4 py-2 rounded text-sm ${
              timeRange === "7d"
                ? "bg-[#282828] text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-4 py-2 rounded text-sm ${
              timeRange === "30d"
                ? "bg-[#282828] text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`px-4 py-2 rounded text-sm ${
              timeRange === "all"
                ? "bg-[#282828] text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Views</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.views}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Votes</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.votes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Comments</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.comments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Favorites</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.favorites}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Apps by Views</h2>
            {stats.topApps.length === 0 ? (
              <div className="text-gray-500">No data available</div>
            ) : (
              <div className="space-y-3">
                {stats.topApps.map((item: any, index: number) => (
                  <div
                    key={item.app.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{item.app.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.views} views</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Apps by Favorites</h2>
            {stats.topAppsByFavorites.length === 0 ? (
              <div className="text-gray-500">No data available</div>
            ) : (
              <div className="space-y-3">
                {stats.topAppsByFavorites.map((item: any, index: number) => (
                  <div
                    key={item.app.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{item.app.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.favorites} favorites</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Apps by Upvotes</h2>
            {stats.topAppsByUpvotes.length === 0 ? (
              <div className="text-gray-500">No data available</div>
            ) : (
              <div className="space-y-3">
                {stats.topAppsByUpvotes.map((item: any, index: number) => (
                  <div
                    key={item.app.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{item.app.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.votes} upvotes</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Worst Performing Apps</h2>
            {stats.worstApps.length === 0 ? (
              <div className="text-gray-500">No data available</div>
            ) : (
              <div className="space-y-3">
                {stats.worstApps.map((item: any, index: number) => (
                  <div
                    key={item.app.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{item.app.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.votes} upvotes</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
