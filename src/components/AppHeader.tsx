"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import type { App } from "@/lib/instant"
import { VoteButtons } from "./VoteButtons"
import { FavoriteButton } from "./FavoriteButton"
import { useEffect, useRef } from "react"
import { trackEvent } from "@/lib/analytics"
import { useUser } from "@/lib/auth"

interface AppHeaderProps {
  app: App
}

export function AppHeader({ app }: AppHeaderProps) {
  const { user } = useUser()
  const trackedAppId = useRef<string | null>(null)

  // Track app view once per app (not on every user state change)
  useEffect(() => {
    // Only track once per unique app
    if (trackedAppId.current !== app.id) {
      trackedAppId.current = app.id
      const userId = (user as any)?.id
      trackEvent("app_view", {
        userId,
        appId: app.id,
        metadata: {
          appName: app.name,
          appSlug: app.slug,
        }
      })
    }
  }, [app.id, app.name, app.slug, user])

  return (
    <div className="border-b border-gray-200 pb-8 mb-8">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
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
              <span className="text-4xl font-bold text-gray-400">
                {app.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words">{app.name}</h1>
          <p className="text-lg text-gray-600 mb-4 break-words">{app.tagline}</p>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <VoteButtons appId={app.id} />
              <FavoriteButton appId={app.id} />
            </div>
            <Button variant="default" size="sm" asChild>
              <a href={app.websiteUrl} target="_blank" rel="noopener noreferrer">
                Visit Website
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {app.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

