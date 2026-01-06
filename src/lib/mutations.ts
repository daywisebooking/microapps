// Server-side mutation helpers for InstantDB
// These mutations use the admin client for server-side operations

import { adminDb } from "./instant"
import type { Vote, Favorite, Comment, CommentVote, Report, App, User, Featured } from "./instant"
import { db } from "./instant-client"
import { id as generateInstantId } from "@instantdb/react"

// Import InstantDB's id generator for proper UUID generation
let id: () => string

// Lazy load the id function from @instantdb/admin (server-side only)
function generateId(): string {
  if (!id) {
    try {
      const adminModule = require("@instantdb/admin")
      id = adminModule.id || adminModule.default?.id
    } catch (error) {
      // Fallback for build time or if module not available
      // This should never happen in production, but provides safety
      console.error("Failed to load @instantdb/admin id generator:", error)
      return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }
  return id()
}

// Vote mutations
export async function toggleVote(
  userId: string,
  appId: string,
  direction: "up" | "down"
): Promise<{ success: boolean; vote?: Vote; error?: string }> {
  if (!adminDb) {
    // Mock mode - return success
    return {
      success: true,
      vote: {
        id: generateId(),
        userId,
        appId,
        direction,
        createdAt: Date.now(),
      },
    }
  }

  try {
    // Check if vote already exists
    const existingVotes = await adminDb.query({
      votes: {
        $: {
          where: {
            userId,
            appId
          }
        }
      }
    })

    const existingVote = existingVotes?.votes?.[0]
    const voteId = existingVote?.id || generateId()

    // Calculate the vote count delta based on the action
    let countDelta = 0
    let voteTransaction

    if (existingVote && existingVote.direction === direction) {
      // Toggle off - remove vote
      voteTransaction = adminDb.tx.votes[existingVote.id].delete()
      countDelta = existingVote.direction === "up" ? -1 : 1
    } else if (existingVote) {
      // Update vote direction (switching from up to down or vice versa)
      voteTransaction = adminDb.tx.votes[existingVote.id].update({ direction })
      countDelta = direction === "up" ? 2 : -2
    } else {
      // Create new vote
      voteTransaction = adminDb.tx.votes[voteId].update({
        userId,
        appId,
        direction,
        createdAt: Date.now(),
      })
      countDelta = direction === "up" ? 1 : -1
    }

    // Get current app data to calculate new vote count
    const appQuery = await adminDb.query({
      apps: {
        $: {
          where: { id: appId }
        }
      }
    })

    const currentApp = appQuery?.apps?.[0]
    const currentVoteCount = currentApp?.voteCount || 0
    const newVoteCount = currentVoteCount + countDelta

    // Atomic transaction: update vote and app count together
    await adminDb.transact([
      voteTransaction,
      adminDb.tx.apps[appId].update({ voteCount: newVoteCount })
    ])

    // Track vote event (if adding/changing vote, not removing)
    if (!(existingVote && existingVote.direction === direction)) {
      try {
        const eventId = generateId()
        await adminDb.transact([
          adminDb.tx.events[eventId].update({
            userId: userId || null,
            eventType: "vote",
            appId: appId || null,
            metadata: { direction },
            createdAt: Date.now(),
          }),
        ])
      } catch (error) {
        console.error("Failed to track vote event:", error)
        // Don't fail the mutation if event tracking fails
      }
    }

    return {
      success: true,
      vote: existingVote && existingVote.direction === direction ? undefined : {
        id: voteId,
        userId,
        appId,
        direction,
        createdAt: Date.now(),
      },
    }
  } catch (error: any) {
    console.error("Vote mutation error:", error)
    return { success: false, error: error.message || "Failed to record vote" }
  }
}

// Favorite mutations
export async function toggleFavorite(
  userId: string,
  appId: string
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> {
  if (!adminDb) {
    // Mock mode - return success
    return { success: true, isFavorite: true }
  }

  try {
    // Check if favorite already exists
    const existingFavorites = await adminDb.query({
      favorites: {
        $: {
          where: {
            userId,
            appId
          }
        }
      }
    })

    const existingFavorite = existingFavorites?.favorites?.[0]
    let isFavorite = false

    if (existingFavorite) {
      // Remove favorite (toggle off)
      await adminDb.transact([
        adminDb.tx.favorites[existingFavorite.id].delete()
      ])
      isFavorite = false
    } else {
      // Create favorite
      const favoriteId = generateId()
      await adminDb.transact([
        adminDb.tx.favorites[favoriteId].update({
          userId,
          appId,
          createdAt: Date.now(),
        })
      ])
      isFavorite = true
    }

    // Recalculate favorite count for the app
    const allFavoritesForApp = await adminDb.query({
      favorites: {
        $: {
          where: { appId }
        }
      }
    })

    const favorites = allFavoritesForApp?.favorites || []
    const newFavoriteCount = favorites.length

    // Update the app's favoriteCount field
    await adminDb.transact([
      adminDb.tx.apps[appId].update({ favoriteCount: newFavoriteCount })
    ])

    // Track favorite event (only when favoriting, not unfavoriting)
    if (db && isFavorite) {
      try {
        const eventId = generateInstantId()
        await db.transact([
          db.tx.events[eventId].update({
            userId: userId || null,
            eventType: "favorite",
            appId: appId || null,
            metadata: {},
            createdAt: Date.now(),
          }),
        ])
      } catch (error) {
        console.error("Failed to track favorite event:", error)
        // Don't fail the mutation if event tracking fails
      }
    }

    return { success: true, isFavorite }
  } catch (error: any) {
    console.error("Favorite mutation error:", error)
    return { success: false, isFavorite: false, error: error.message || "Failed to toggle favorite" }
  }
}

// Comment mutations
export async function createComment(
  userId: string,
  appId: string,
  content: string,
  type: "general" | "feature" | "bug",
  parentId?: string | null,
  status: "published" | "pending_review" | "removed" = "published"
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  if (!adminDb) {
    // Mock mode - return success
    return {
      success: true,
      comment: {
        id: generateId(),
        appId,
        userId,
        parentId: parentId || null,
        content,
        type,
        status,
        voteCount: 0,
        createdAt: Date.now(),
      },
    }
  }

  try {
    // Ensure user record exists in $users namespace and has a username
    const userQuery = await adminDb.query({
      $users: {
        $: {
          where: { id: userId }
        }
      }
    })
    
    const user = userQuery?.$users?.[0]
    const { generateRandomUsername } = require("./utils")
    
    if (!user) {
      // User doesn't exist in $users namespace - create the record with username
      const username = generateRandomUsername()
      try {
        console.log('[Mutations] Attempting to create user record in $users:', { userId, username })
        
        const result = await adminDb.transact([
          adminDb.tx.$users[userId].update({
            username: username,
            createdAt: Date.now()
          })
        ])
        
        console.log('[Mutations] Transaction result:', result)
        console.log(`[Mutations] Created user record with username for ${userId}: ${username}`)
        
        // Verify the user was actually created
        const verifyResult = await adminDb.query({
          $users: {
            $: {
              where: { id: userId }
            }
          }
        })
        console.log('[Mutations] Verification - User in $users:', verifyResult?.$users?.[0])
      } catch (userCreateError: any) {
        console.error('[Mutations] Failed to create user record - FULL ERROR:', {
          error: userCreateError,
          message: userCreateError?.message,
          stack: userCreateError?.stack,
          body: userCreateError?.body,
          hint: userCreateError?.hint,
          userId,
          username
        })
        // Continue anyway - the comment can still be created
      }
    } else if (!user.username) {
      // User exists but no username - add it
      const username = generateRandomUsername()
      try {
        console.log('[Mutations] Attempting to add username to existing user in $users:', { userId, username })
        
        const result = await adminDb.transact([
          adminDb.tx.$users[userId].update({ username })
        ])
        
        console.log('[Mutations] Transaction result:', result)
        console.log(`[Mutations] Added username to existing user ${userId}: ${username}`)
        
        // Verify the username was actually added
        const verifyResult = await adminDb.query({
          $users: {
            $: {
              where: { id: userId }
            }
          }
        })
        console.log('[Mutations] Verification - User in $users after update:', verifyResult?.$users?.[0])
      } catch (usernameError: any) {
        console.error('[Mutations] Failed to add username - FULL ERROR:', {
          error: usernameError,
          message: usernameError?.message,
          stack: usernameError?.stack,
          body: usernameError?.body,
          hint: usernameError?.hint,
          userId,
          username
        })
        // Continue anyway - the comment can still be created
      }
    }
    
    const commentId = generateId()
    
    await adminDb.transact([
      adminDb.tx.comments[commentId].update({
        appId,
        userId,
        parentId: parentId || null,
        content,
        type,
        status,
        voteCount: 0,
        createdAt: Date.now(),
      })
    ])

    return {
      success: true,
      comment: {
        id: commentId,
        appId,
        userId,
        parentId: parentId || null,
        content,
        type,
        status,
        voteCount: 0,
        createdAt: Date.now(),
      },
    }
  } catch (error: any) {
    console.error("Comment creation error:", error)
    return { success: false, error: error.message || "Failed to create comment" }
  }
}

export async function deleteComment(
  userId: string,
  commentId: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    // Mock mode - return success
    return { success: true }
  }

  try {
    if (isAdmin) {
      // Admin can delete any comment - just verify comment exists
      const result = await adminDb.query({
        comments: {
          $: {
            where: {
              id: commentId
            }
          }
        }
      })

      if (!result?.comments || result.comments.length === 0) {
        return { success: false, error: "Comment not found" }
      }
    } else {
      // Non-admin: Verify comment belongs to user (authorization check)
      const result = await adminDb.query({
        comments: {
          $: {
            where: {
              id: commentId,
              userId
            }
          }
        }
      })

      if (!result?.comments || result.comments.length === 0) {
        return { success: false, error: "Comment not found or unauthorized" }
      }
    }

    await adminDb.transact([
      adminDb.tx.comments[commentId].delete()
    ])

    return { success: true }
  } catch (error: any) {
    console.error("Comment deletion error:", error)
    return { success: false, error: error.message || "Failed to delete comment" }
  }
}

// Comment vote mutations
export async function toggleCommentVote(
  userId: string,
  commentId: string,
  direction: "up" | "down"
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    // Mock mode - return success
    return { success: true }
  }

  try {
    // Check if vote already exists
    const existingVotes = await adminDb.query({
      commentVotes: {
        $: {
          where: {
            userId,
            commentId
          }
        }
      }
    })

    const existingVote = existingVotes?.commentVotes?.[0]
    const voteId = existingVote?.id || generateId()

    if (existingVote && existingVote.direction === direction) {
      // Remove vote if same direction (toggle off)
      await adminDb.transact([
        adminDb.tx.commentVotes[existingVote.id].delete()
      ])
    } else if (existingVote) {
      // Update vote direction
      await adminDb.transact([
        adminDb.tx.commentVotes[existingVote.id].update({ direction })
      ])
    } else {
      // Create new vote
      await adminDb.transact([
        adminDb.tx.commentVotes[voteId].update({
          userId,
          commentId,
          direction,
          createdAt: Date.now(),
        })
      ])
    }

    // After updating votes, recalculate and update comment's voteCount
    const allVotesForComment = await adminDb.query({
      commentVotes: {
        $: {
          where: { commentId }
        }
      }
    })

    const votes = allVotesForComment?.commentVotes || []
    const upvotes = votes.filter((v: any) => v.direction === "up").length
    const downvotes = votes.filter((v: any) => v.direction === "down").length
    const newVoteCount = upvotes - downvotes

    // Update the comment's voteCount field
    await adminDb.transact([
      adminDb.tx.comments[commentId].update({ voteCount: newVoteCount })
    ])

    return { success: true }
  } catch (error: any) {
    console.error("Comment vote mutation error:", error)
    return { success: false, error: error.message || "Failed to record comment vote" }
  }
}

// Report mutations
export async function createReport(
  userId: string,
  commentId: string,
  reason: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  if (!adminDb) {
    // Mock mode - return success
    return {
      success: true,
      report: {
        id: generateId(),
        commentId,
        userId,
        reason,
        status: "pending",
        type: "user_report",
        createdAt: Date.now(),
      },
    }
  }

  try {
    const reportId = generateId()

    await adminDb.transact([
      adminDb.tx.reports[reportId].update({
        commentId,
        userId,
        reason,
        status: "pending",
        type: "user_report",
        createdAt: Date.now(),
      })
    ])

    return {
      success: true,
      report: {
        id: reportId,
        commentId,
        userId,
        reason,
        status: "pending",
        type: "user_report",
        createdAt: Date.now(),
      },
    }
  } catch (error: any) {
    console.error("Report creation error:", error)
    return { success: false, error: error.message || "Failed to create report" }
  }
}

// Create auto-report for moderation violations
export async function createAutoReport(
  commentId: string,
  violations: string[],
  reason: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  if (!adminDb) {
    // Mock mode - return success
    return {
      success: true,
      report: {
        id: generateId(),
        commentId,
        userId: "system",
        reason,
        status: "pending",
        type: "auto_flag",
        violations,
        createdAt: Date.now(),
      },
    }
  }

  try {
    const reportId = generateId()

    await adminDb.transact([
      adminDb.tx.reports[reportId].update({
        commentId,
        userId: "system",
        reason,
        status: "pending",
        type: "auto_flag",
        violations,
        createdAt: Date.now(),
      })
    ])

    return {
      success: true,
      report: {
        id: reportId,
        commentId,
        userId: "system",
        reason,
        status: "pending",
        type: "auto_flag",
        violations,
        createdAt: Date.now(),
      },
    }
  } catch (error: any) {
    console.error("Auto-report creation error:", error)
    return { success: false, error: error.message || "Failed to create auto-report" }
  }
}

// Admin mutations

// Create app
export async function createApp(
  data: {
    name: string
    slug: string
    tagline: string
    description: string
    tags: string[]
    logoUrl?: string
    websiteUrl?: string
  }
): Promise<{ success: boolean; app?: App; error?: string }> {
  if (!adminDb) {
    // Mock mode
    return {
      success: true,
      app: {
        id: generateId(),
        slug: data.slug,
        name: data.name,
        description: data.description,
        tagline: data.tagline,
        tags: data.tags || [],
        logoUrl: data.logoUrl || "",
        websiteUrl: data.websiteUrl || "",
        createdAt: Date.now(),
        voteCount: 0,
        favoriteCount: 0,
      },
    }
  }

  try {
    const appId = generateId()
    
    await adminDb.transact([
      adminDb.tx.apps[appId].update({
        slug: data.slug,
        name: data.name,
        description: data.description,
        tagline: data.tagline,
        tags: data.tags || [],
        logoUrl: data.logoUrl || "",
        websiteUrl: data.websiteUrl || "",
        createdAt: Date.now(),
        voteCount: 0,
        favoriteCount: 0,
      })
    ])

    return {
      success: true,
      app: {
        id: appId,
        slug: data.slug,
        name: data.name,
        description: data.description,
        tagline: data.tagline,
        tags: data.tags || [],
        logoUrl: data.logoUrl || "",
        websiteUrl: data.websiteUrl || "",
        createdAt: Date.now(),
        voteCount: 0,
        favoriteCount: 0,
      },
    }
  } catch (error: any) {
    console.error("App creation error:", error)
    return { success: false, error: error.message || "Failed to create app" }
  }
}

// Update app
export async function updateApp(
  appId: string,
  data: Partial<{
    name: string
    slug: string
    tagline: string
    description: string
    tags: string[]
    logoUrl: string
    websiteUrl: string
  }>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: true }
  }

  try {
    // Verify app exists
    const existingApp = await adminDb.query({
      apps: {
        $: {
          where: {
            id: appId
          }
        }
      }
    })

    if (!existingApp?.apps || existingApp.apps.length === 0) {
      return { success: false, error: "App not found" }
    }

    await adminDb.transact([
      adminDb.tx.apps[appId].update(data)
    ])

    return { success: true }
  } catch (error: any) {
    console.error("App update error:", error)
    return { success: false, error: error.message || "Failed to update app" }
  }
}

// Delete app
export async function deleteApp(appId: string): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: true }
  }

  try {
    // Verify app exists
    const existingApp = await adminDb.query({
      apps: {
        $: {
          where: {
            id: appId
          }
        }
      }
    })

    if (!existingApp?.apps || existingApp.apps.length === 0) {
      return { success: false, error: "App not found" }
    }

    await adminDb.transact([
      adminDb.tx.apps[appId].delete()
    ])

    return { success: true }
  } catch (error: any) {
    console.error("App deletion error:", error)
    return { success: false, error: error.message || "Failed to delete app" }
  }
}

// Toggle user disabled status
export async function toggleUserStatus(
  userId: string,
  disabled: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: true }
  }

  try {
    // Verify user exists
    const existingUser = await adminDb.query({
      $users: {
        $: {
          where: {
            id: userId
          }
        }
      }
    })

    if (!existingUser?.$users || existingUser.$users.length === 0) {
      return { success: false, error: "User not found" }
    }

    await adminDb.transact([
      adminDb.tx.$users[userId].update({ disabled })
    ])

    return { success: true }
  } catch (error: any) {
    console.error("User status toggle error:", error)
    return { success: false, error: error.message || "Failed to update user status" }
  }
}

// Moderate report (approve or reject)
export async function moderateReport(
  reportId: string,
  action: "approve" | "reject"
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: true }
  }

  try {
    // Verify report exists
    const existingReport = await adminDb.query({
      reports: {
        $: {
          where: {
            id: reportId
          }
        }
      }
    })

    if (!existingReport?.reports || existingReport.reports.length === 0) {
      return { success: false, error: "Report not found" }
    }

    const report = existingReport.reports[0]
    const status = action === "approve" ? "approved" : "rejected"
    
    await adminDb.transact([
      adminDb.tx.reports[reportId].update({ status })
    ])

    // If approving (removing comment), set comment status to removed or delete
    if (action === "approve" && report.commentId) {
      // For auto-flagged comments, set status to removed
      // For user-reported comments, delete entirely
      if (report.type === "auto_flag") {
        await adminDb.transact([
          adminDb.tx.comments[report.commentId].update({ status: "removed" })
        ])
      } else {
        await adminDb.transact([
          adminDb.tx.comments[report.commentId].delete()
        ])
      }
    }
    
    // If rejecting (keeping comment), set comment status to published if it was pending
    if (action === "reject" && report.commentId && report.type === "auto_flag") {
      await adminDb.transact([
        adminDb.tx.comments[report.commentId].update({ status: "published" })
      ])
    }

    return { success: true }
  } catch (error: any) {
    console.error("Report moderation error:", error)
    return { success: false, error: error.message || "Failed to moderate report" }
  }
}

// Set featured app
export async function setFeaturedApp(appId: string, badges?: string[]): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: true }
  }

  try {
    // Verify app exists
    const existingApp = await adminDb.query({
      apps: {
        $: {
          where: {
            id: appId
          }
        }
      }
    })

    if (!existingApp?.apps || existingApp.apps.length === 0) {
      return { success: false, error: "App not found" }
    }

    // Get existing featured app and remove it
    const existingFeatured = await adminDb.query({
      featured: {
        $: {}
      }
    })

    const transactions = []

    // Delete existing featured app if any
    if (existingFeatured?.featured && existingFeatured.featured.length > 0) {
      for (const featured of existingFeatured.featured) {
        transactions.push(adminDb.tx.featured[featured.id].delete())
      }
    }

    // Create new featured app
    const featuredId = generateId()
    transactions.push(
      adminDb.tx.featured[featuredId].update({
        appId,
        badges: badges || [],
        createdAt: Date.now(),
      })
    )

    await adminDb.transact(transactions)

    return { success: true }
  } catch (error: any) {
    console.error("Set featured app error:", error)
    return { success: false, error: error.message || "Failed to set featured app" }
  }
}

// Clear featured app
export async function clearFeaturedApp(): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: true }
  }

  try {
    // Get all featured apps and remove them
    const existingFeatured = await adminDb.query({
      featured: {
        $: {}
      }
    })

    if (!existingFeatured?.featured || existingFeatured.featured.length === 0) {
      return { success: true } // Already clear
    }

    const transactions = []
    for (const featured of existingFeatured.featured) {
      transactions.push(adminDb.tx.featured[featured.id].delete())
    }

    await adminDb.transact(transactions)

    return { success: true }
  } catch (error: any) {
    console.error("Clear featured app error:", error)
    return { success: false, error: error.message || "Failed to clear featured app" }
  }
}

