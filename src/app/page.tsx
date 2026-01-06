"use client"

import { AppsList } from "@/components/AppsList"
import { useFeaturedApp } from "@/lib/hooks/useApps"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

// Badge display component
function FeaturedBadge({ badge }: { badge: string }) {
  const badgeConfig: Record<string, { label: string; color: string }> = {
    "new": { label: "New", color: "bg-green-500" },
    "recently-updated": { label: "Recently Updated", color: "bg-[#282828]" },
    "trending": { label: "Trending", color: "bg-orange-500" },
    "popular": { label: "Popular", color: "bg-purple-500" },
    "editors-choice": { label: "Editor's Choice", color: "bg-yellow-500" },
    "hot": { label: "Hot", color: "bg-red-500" },
  }
  
  const config = badgeConfig[badge] || { label: badge, color: "bg-gray-500" }
  
  return (
    <span className={`${config.color} text-white text-xs font-semibold px-2.5 py-0.5 rounded`}>
      {config.label}
    </span>
  )
}

export default function Home() {
  const { data: featured, badges, isLoading: featuredLoading } = useFeaturedApp()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {!featuredLoading && featured && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured App</h2>
          <Link href={`/app/${featured.slug}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featured.logoUrl}
                        alt={featured.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {featured.name}
                      </h3>
                      {badges && badges.length > 0 && (
                        <div className="flex gap-1.5">
                          {badges.map((badge) => (
                            <FeaturedBadge key={badge} badge={badge} />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-lg text-gray-600">{featured.tagline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>
      )}

      <section className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Top 10 Apps</h1>
        <AppsList limit={10} showRanking={true} />
      </section>

      <section>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Apps</h1>
        <AppsList gridCols="2x2" />
      </section>
    </div>
  )
}
