// Analytics utilities for tracking events

import { db } from "./instant-client"
import type { Event } from "./instant"
import { id } from "@instantdb/react"

export type EventType = "app_view" | "vote" | "favorite" | "comment_create" | "search"

export async function trackEvent(
  eventType: EventType,
  data: {
    userId?: string
    appId?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  if (!db) {
    console.warn("InstantDB not configured - event not tracked:", eventType, data)
    return
  }

  try {
    // Generate a unique ID for the event using InstantDB's id()
    const eventId = id()
    
    // Create event record in InstantDB
    await db.transact([
      db.tx.events[eventId].update({
        userId: data.userId || null,
        eventType,
        appId: data.appId || null,
        metadata: data.metadata || {},
        createdAt: Date.now(),
      }),
    ])
  } catch (error) {
    console.error("Failed to track event:", error)
    // Don't throw - analytics failures shouldn't break the app
  }
}

// Client-side tracking helper
export function useAnalytics() {
  return {
    track: trackEvent,
  }
}
