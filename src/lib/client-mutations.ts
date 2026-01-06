"use client"

// Client-side mutation helpers for InstantDB
// These mutations use the client db for direct transactions

import { db } from "./instant-client"
import { id as generateInstantId } from "@instantdb/react"

/**
 * Client-side vote toggle function
 * Uses InstantDB's client-side transactions for instant updates
 * 
 * @param userId - The user's ID
 * @param appId - The app's ID
 * @param direction - Vote direction ("up" or "down")
 * @param existingVote - The user's existing vote (if any)
 * @param currentVoteCount - The app's current vote count
 * @returns Promise with success status and any errors
 */
export async function toggleVoteClient(
  userId: string,
  appId: string,
  direction: "up" | "down",
  existingVote: { id: string; direction: string } | null,
  currentVoteCount: number
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Database not initialized" }
  }

  try {
    // Calculate the vote count delta based on the action
    let countDelta = 0
    const transactions = []

    if (existingVote && existingVote.direction === direction) {
      // Toggle off - remove vote
      transactions.push(db.tx.votes[existingVote.id].delete())
      countDelta = existingVote.direction === "up" ? -1 : 1
    } else if (existingVote) {
      // Update vote direction (switching from up to down or vice versa)
      transactions.push(
        db.tx.votes[existingVote.id].update({ direction })
      )
      countDelta = direction === "up" ? 2 : -2
    } else {
      // Create new vote
      const voteId = generateInstantId()
      transactions.push(
        db.tx.votes[voteId].update({
          userId,
          appId,
          direction,
          createdAt: Date.now(),
        })
      )
      countDelta = direction === "up" ? 1 : -1
    }

    // Calculate new vote count
    const newVoteCount = currentVoteCount + countDelta

    // Add transaction to update the app's vote count
    transactions.push(
      db.tx.apps[appId].update({ voteCount: newVoteCount })
    )

    // Execute all transactions atomically
    await db.transact(transactions)

    return { success: true }
  } catch (error: any) {
    console.error("Client vote mutation error:", error)
    return { success: false, error: error.message || "Failed to record vote" }
  }
}

/**
 * Client-side favorite toggle function
 * Uses InstantDB's client-side transactions for instant updates
 * 
 * @param userId - The user's ID
 * @param appId - The app's ID
 * @param existingFavorite - The user's existing favorite (if any)
 * @param currentFavoriteCount - The app's current favorite count
 * @returns Promise with success status, isFavorite state, and any errors
 */
export async function toggleFavoriteClient(
  userId: string,
  appId: string,
  existingFavorite: { id: string } | null,
  currentFavoriteCount: number
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> {
  if (!db) {
    return { success: false, isFavorite: false, error: "Database not initialized" }
  }

  try {
    const transactions = []
    let isFavorite = false
    let countDelta = 0

    if (existingFavorite) {
      // Remove favorite (toggle off)
      transactions.push(db.tx.favorites[existingFavorite.id].delete())
      isFavorite = false
      countDelta = -1
    } else {
      // Create favorite
      const favoriteId = generateInstantId()
      transactions.push(
        db.tx.favorites[favoriteId].update({
          userId,
          appId,
          createdAt: Date.now(),
        })
      )
      isFavorite = true
      countDelta = 1
    }

    // Calculate new favorite count
    const newFavoriteCount = currentFavoriteCount + countDelta

    // Add transaction to update the app's favorite count
    transactions.push(
      db.tx.apps[appId].update({ favoriteCount: newFavoriteCount })
    )

    // Execute all transactions atomically
    await db.transact(transactions)

    return { success: true, isFavorite }
  } catch (error: any) {
    console.error("Client favorite mutation error:", error)
    return { success: false, isFavorite: false, error: error.message || "Failed to toggle favorite" }
  }
}

