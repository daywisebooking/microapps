"use client"

import { AppCard } from "./AppCard"
import { useApps } from "@/lib/hooks/useApps"

interface AppsListProps {
  limit?: number
  gridCols?: "2x2" | "default"
  showRanking?: boolean
}

export function AppsList({ limit, gridCols = "default", showRanking = false }: AppsListProps) {
  const { data: apps, isLoading } = useApps()

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const displayedApps = limit ? apps.slice(0, limit) : apps

  if (displayedApps.length === 0) {
    return <div className="text-center py-12 text-gray-500">No apps found.</div>
  }

  const gridClass = gridCols === "2x2" 
    ? "grid gap-6 grid-cols-1 md:grid-cols-2" 
    : "grid gap-6 md:grid-cols-2 lg:grid-cols-3"

  return (
    <div className={gridClass}>
      {displayedApps.map((app, index) => (
        <AppCard 
          key={app.id} 
          app={app} 
          rank={showRanking ? index + 1 : undefined}
        />
      ))}
    </div>
  )
}
