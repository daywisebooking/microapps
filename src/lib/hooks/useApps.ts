"use client"

import { db } from "@/lib/instant-client"
import { useMemo } from "react"
import type { App } from "@/lib/instant"

// Hook to query all apps from InstantDB
export function useApps() {
  if (!db) {
    return { data: [], isLoading: false }
  }

  const instantQuery = db.useQuery({ apps: {} })

  // Convert InstantDB data to our App type
  const apps = useMemo(() => {
    if (!instantQuery?.data?.apps) return []
    return instantQuery.data.apps.map((app: any) => ({
      id: app.id,
      slug: app.slug,
      name: app.name,
      description: app.description,
      tagline: app.tagline,
      tags: app.tags || [],
      logoUrl: app.logoUrl,
      websiteUrl: app.websiteUrl,
      createdAt: app.createdAt,
      voteCount: app.voteCount || 0,
      favoriteCount: app.favoriteCount || 0,
    })) as App[]
  }, [instantQuery?.data])

  // Sort by voteCount descending for ranking
  const sortedApps = useMemo(() => {
    return [...apps].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
  }, [apps])

  return { data: sortedApps, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to query a single app by slug
export function useAppBySlug(slug: string) {
  if (!db) {
    return { data: null, isLoading: false }
  }

  const instantQuery = db.useQuery({ 
    apps: {
      $: {
        where: { slug },
      },
    },
  })

  const app = useMemo(() => {
    if (!instantQuery?.data?.apps || instantQuery.data.apps.length === 0) return null
    const appData = instantQuery.data.apps[0]
    return {
      id: appData.id,
      slug: appData.slug,
      name: appData.name,
      description: appData.description,
      tagline: appData.tagline,
      tags: appData.tags || [],
      logoUrl: appData.logoUrl,
      websiteUrl: appData.websiteUrl,
      createdAt: appData.createdAt,
      voteCount: appData.voteCount || 0,
      favoriteCount: appData.favoriteCount || 0,
    } as App
  }, [instantQuery?.data])

  return { data: app, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to query a single app by ID
export function useAppById(appId: string) {
  if (!db) {
    return { data: null, isLoading: false }
  }

  const instantQuery = db.useQuery({ 
    apps: {
      $: {
        where: { id: appId },
      },
    },
  })

  const app = useMemo(() => {
    if (!instantQuery?.data?.apps || instantQuery.data.apps.length === 0) return null
    const appData = instantQuery.data.apps[0]
    return {
      id: appData.id,
      slug: appData.slug,
      name: appData.name,
      description: appData.description,
      tagline: appData.tagline,
      tags: appData.tags || [],
      logoUrl: appData.logoUrl,
      websiteUrl: appData.websiteUrl,
      createdAt: appData.createdAt,
      voteCount: appData.voteCount || 0,
      favoriteCount: appData.favoriteCount || 0,
    } as App
  }, [instantQuery?.data])

  return { data: app, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get featured app from featured table
export function useFeaturedApp() {
  if (!db) {
    return { data: null, isLoading: false, badges: [] }
  }

  const instantQuery = db.useQuery({ 
    featured: {},
    apps: {},
  })

  const result = useMemo(() => {
    if (!instantQuery?.data?.featured || instantQuery.data.featured.length === 0) {
      return { app: null, badges: [] }
    }
    
    const featuredData = instantQuery.data.featured[0]
    const appData = instantQuery.data.apps?.find((a: any) => a.id === featuredData.appId)
    
    if (!appData) return { app: null, badges: [] }
    
    return {
      app: {
        id: appData.id,
        slug: appData.slug,
        name: appData.name,
        description: appData.description,
        tagline: appData.tagline,
        tags: appData.tags || [],
        logoUrl: appData.logoUrl,
        websiteUrl: appData.websiteUrl,
        createdAt: appData.createdAt,
        voteCount: appData.voteCount || 0,
        favoriteCount: appData.favoriteCount || 0,
      } as App,
      badges: featuredData.badges || []
    }
  }, [instantQuery?.data])

  return { 
    data: result.app, 
    badges: result.badges,
    isLoading: instantQuery?.isLoading ?? false 
  }
}

// Hook to search and filter apps
export function useSearchApps(query: string, tags?: string[]) {
  if (!db) {
    return { data: [], isLoading: false }
  }

  const instantQuery = db.useQuery({ apps: {} })

  const apps = useMemo(() => {
    if (!instantQuery?.data?.apps) return []
    
    let filtered = instantQuery.data.apps.map((app: any) => ({
      id: app.id,
      slug: app.slug,
      name: app.name,
      description: app.description,
      tagline: app.tagline,
      tags: app.tags || [],
      logoUrl: app.logoUrl,
      websiteUrl: app.websiteUrl,
      createdAt: app.createdAt,
      voteCount: app.voteCount || 0,
      favoriteCount: app.favoriteCount || 0,
    })) as App[]

    // Client-side tag filtering if tags provided (OR logic - show apps with ANY selected tag)
    if (tags && tags.length > 0) {
      filtered = filtered.filter((app) =>
        app.tags.some((tag) => tags.includes(tag))
      )
    }

    // Client-side search filtering if query provided
    if (query) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(lowerQuery) ||
          app.description.toLowerCase().includes(lowerQuery) ||
          app.tagline.toLowerCase().includes(lowerQuery) ||
          app.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
    }

    // Sort by voteCount descending
    return filtered.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
  }, [instantQuery?.data, query, tags])

  return { data: apps, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get all tags from apps
export function useAllTags() {
  if (!db) {
    return { data: [], isLoading: false }
  }

  const instantQuery = db.useQuery({
    apps: {},
  })

  const tags = useMemo(() => {
    if (!instantQuery?.data?.apps) return []
    const tagSet = new Set<string>()
    instantQuery.data.apps.forEach((app: any) => {
      if (app.tags && Array.isArray(app.tags)) {
        app.tags.forEach((tag: string) => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [instantQuery?.data])

  return { data: tags, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get all votes by a user
export function useUserVotes(userId: string | null | undefined) {
  const shouldQuery = db && userId
  
  const instantQuery = db?.useQuery(
    shouldQuery ? {
      votes: {
        $: {
          where: { userId },
        },
      },
    } : { votes: {} }
  )

  const votes = useMemo(() => {
    if (!shouldQuery || !instantQuery?.data?.votes) return []
    return instantQuery.data.votes
  }, [shouldQuery, instantQuery?.data])

  return { data: votes, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get all favorites by a user
export function useUserFavorites(userId: string | null | undefined) {
  const shouldQuery = db && userId
  
  const instantQuery = db?.useQuery(
    shouldQuery ? {
      favorites: {
        $: {
          where: { userId },
        },
      },
    } : { favorites: {} }
  )

  const favorites = useMemo(() => {
    if (!shouldQuery || !instantQuery?.data?.favorites) return []
    return instantQuery.data.favorites
  }, [shouldQuery, instantQuery?.data])

  return { data: favorites, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get user's vote for a specific app
export function useUserVoteForApp(userId: string | null | undefined, appId: string) {
  const shouldQuery = db && userId && appId
  
  const instantQuery = db?.useQuery(
    shouldQuery ? {
      votes: {
        $: {
          where: {
            userId,
            appId,
          },
        },
      },
    } : { votes: {} }
  )

  const vote = useMemo(() => {
    if (!shouldQuery || !instantQuery?.data?.votes || instantQuery.data.votes.length === 0) return null
    const voteData = instantQuery.data.votes[0] as any
    return voteData ? { id: voteData.id, direction: voteData.direction } : null
  }, [shouldQuery, instantQuery?.data])

  return { data: vote, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to check if user has favorited an app
export function useUserFavoriteForApp(userId: string | null | undefined, appId: string) {
  const shouldQuery = db && userId && appId
  
  const instantQuery = db?.useQuery(
    shouldQuery ? {
      favorites: {
        $: {
          where: {
            userId,
            appId,
          },
        },
      },
    } : { favorites: {} }
  )

  const favorite = useMemo(() => {
    if (!shouldQuery || !instantQuery?.data?.favorites || instantQuery.data.favorites.length === 0) return null
    return instantQuery.data.favorites[0]
  }, [shouldQuery, instantQuery?.data])

  return { data: favorite, isLoading: instantQuery?.isLoading ?? false }
}
