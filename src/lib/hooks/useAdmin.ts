"use client"

import { db } from "@/lib/instant-client"
import { useMemo } from "react"
import type { App, User, Report, Featured } from "@/lib/instant"
import { useUser } from "@/lib/auth"

// Hook to get all apps (admin view)
export function useAdminApps() {
  if (!db) {
    return { data: [], isLoading: false }
  }

  const instantQuery = db.useQuery({ apps: {} })

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

  return { data: apps, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get all users (admin view)
export function useAdminUsers() {
  if (!db) {
    return { data: [], isLoading: false }
  }

  const instantQuery = db.useQuery({ $users: {} })

  const users = useMemo(() => {
    if (!instantQuery?.data?.$users) return []
    return instantQuery.data.$users.map((user: any) => ({
      id: user.id,
      email: user.email,
      type: user.type || "user",
      createdAt: user.createdAt,
      disabled: user.disabled || false,
    })) as User[]
  }, [instantQuery?.data])

  return { data: users, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get all reports (moderation queue)
export function useAdminReports() {
  if (!db) {
    return { data: [], isLoading: false }
  }

  const instantQuery = db.useQuery({
    reports: {
      $: {
        where: { status: "pending" },
      },
    },
    comments: {},
    $users: {},
  })

  const reports = useMemo(() => {
    if (!instantQuery?.data?.reports) return []
    return instantQuery.data.reports.map((report: any) => ({
      id: report.id,
      commentId: report.commentId,
      userId: report.userId,
      reason: report.reason,
      status: report.status,
      type: report.type,
      violations: report.violations,
      createdAt: report.createdAt,
      // Attach comment and user data if available
      comment: instantQuery.data.comments?.find((c: any) => c.id === report.commentId),
      reporter: instantQuery.data.$users?.find((u: any) => u.id === report.userId),
    })) as (Report & { comment?: any; reporter?: any })[]
  }, [instantQuery?.data])

  return { data: reports, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get featured app
export function useAdminFeatured() {
  if (!db) {
    return { data: null, isLoading: false }
  }

  const instantQuery = db.useQuery({
    featured: {},
    apps: {},
  })

  const featured = useMemo(() => {
    if (!instantQuery?.data?.featured) return null
    const featuredData = instantQuery.data.featured?.[0]
    if (!featuredData) return null
    return {
      id: featuredData.id,
      appId: featuredData.appId,
      badges: featuredData.badges || [],
      createdAt: featuredData.createdAt,
      app: instantQuery.data.apps?.find((a: any) => a.id === featuredData.appId),
    } as Featured & { app?: App }
  }, [instantQuery?.data])

  return { data: featured, isLoading: instantQuery?.isLoading ?? false }
}

// Hook to get admin stats
export function useAdminStats() {
  if (!db) {
    return { data: { totalApps: 0, totalUsers: 0, pendingReports: 0, totalVotes: 0, totalComments: 0, totalFavorites: 0 }, isLoading: false }
  }

  const appsQuery = db.useQuery({ apps: {} })
  const usersQuery = db.useQuery({ $users: {} })
  const reportsQuery = db.useQuery({
    reports: {
      $: {
        where: { status: "pending" },
      },
    },
  })
  const votesQuery = db.useQuery({ votes: {} })
  const commentsQuery = db.useQuery({ comments: {} })
  const favoritesQuery = db.useQuery({ favorites: {} })

  const stats = useMemo(() => {
    return {
      totalApps: appsQuery?.data?.apps?.length || 0,
      totalUsers: usersQuery?.data?.$users?.length || 0,
      pendingReports: reportsQuery?.data?.reports?.length || 0,
      totalVotes: votesQuery?.data?.votes?.length || 0,
      totalComments: commentsQuery?.data?.comments?.length || 0,
      totalFavorites: favoritesQuery?.data?.favorites?.length || 0,
    }
  }, [
    appsQuery?.data,
    usersQuery?.data,
    reportsQuery?.data,
    votesQuery?.data,
    commentsQuery?.data,
    favoritesQuery?.data,
  ])

  const isLoading =
    appsQuery?.isLoading ||
    usersQuery?.isLoading ||
    reportsQuery?.isLoading ||
    votesQuery?.isLoading ||
    commentsQuery?.isLoading ||
    favoritesQuery?.isLoading ||
    false

  return { data: stats, isLoading }
}
