"use client"

import { useState } from "react"
import { SearchBar } from "@/components/SearchBar"
import { AppCard } from "@/components/AppCard"
import { useSearchApps, useAllTags } from "@/lib/hooks/useApps"
import { Button } from "@/components/ui/button"

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { data: apps, isLoading: appsLoading } = useSearchApps(
    searchQuery,
    selectedTags.length > 0 ? selectedTags : undefined
  )
  const { data: allTags, isLoading: tagsLoading } = useAllTags()

  const loading = appsLoading || tagsLoading

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Apps</h1>

      <div className="mb-8">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Filter by tags:</h2>
        <div className="flex flex-wrap gap-2">
          {allTags?.map((tag) => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTags([])}
            className="mt-2"
          >
            Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No apps found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}

