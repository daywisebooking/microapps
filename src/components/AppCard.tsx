"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { App } from "@/lib/instant"
import { VoteButtons } from "./VoteButtons"
import { FavoriteButton } from "./FavoriteButton"
// Using img tag instead of Next Image for placeholder URLs

interface AppCardProps {
  app: App
  rank?: number
}

export function AppCard({ app, rank }: AppCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <Link href={`/app/${app.slug}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {rank && (
              <div className="flex-shrink-0 w-8 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">
                  {rank}
                </span>
              </div>
            )}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {app.logoUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={app.logoUrl}
                      alt={app.name}
                      className="w-full h-full object-cover"
                    />
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {app.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-[#282828]">
                {app.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2 break-words">
                {app.tagline}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                <VoteButtons appId={app.id} compact />
                <FavoriteButton appId={app.id} compact showCount />
                <div className="flex gap-2 flex-wrap">
                  {app.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

