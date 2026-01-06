import { NextRequest, NextResponse } from "next/server"
import { commentSchema } from "@/lib/validations"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { createComment, createAutoReport } from "@/lib/mutations"
import { moderateContent, getModerationErrorMessage } from "@/lib/moderation"
import { ModerationErrorType } from "@/types/moderation"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || null

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(writeRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Validate input
    const body = await request.json()
    const validationResult = commentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { appId, content, parentId, type } = validationResult.data

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Content moderation check
    const moderationResult = await moderateContent(content, userId, appId)

    // Determine comment status based on moderation result
    // Always publish comments immediately for better UX
    // Moderation will still create auto-reports for admin review
    const commentStatus = "published"

    if (!moderationResult.allowed) {
      // Log moderation details server-side (for admin review)
      console.log("Comment auto-flagged for moderation:", {
        userId,
        appId,
        contentPreview: content.substring(0, 100),
        errors: moderationResult.errors,
        metadata: moderationResult.metadata,
      })
    }

    // Log warnings if any (for monitoring)
    if (moderationResult.warnings && moderationResult.warnings.length > 0) {
      console.log("Comment moderation warnings:", {
        userId,
        appId,
        warnings: moderationResult.warnings,
        metadata: moderationResult.metadata,
      })
    }

    // Create comment in InstantDB (with appropriate status)
    const result = await createComment(userId, appId, content, type, parentId, commentStatus)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create comment" },
        { status: 500 }
      )
    }

    // If comment was flagged by moderation, create an auto-report
    if (!moderationResult.allowed && result.comment) {
      const violations = moderationResult.errors.map(e => e.type)
      const violationDetails = moderationResult.errors.map(e => {
        if (e.type === ModerationErrorType.PROFANITY && e.details?.violations) {
          return `Profanity: ${e.details.violations.join(", ")}`
        }
        if (e.type === ModerationErrorType.SPAM && e.details?.score) {
          return `Spam (score: ${e.details.score})`
        }
        return e.message
      }).join("; ")

      const reportReason = `Auto-flagged: ${violationDetails}`

      const reportResult = await createAutoReport(
        result.comment.id,
        violations,
        reportReason
      )

      if (!reportResult.success) {
        console.error("Failed to create auto-report:", reportResult.error)
        // Don't fail the comment creation if report fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        comment: result.comment,
        flagged: !moderationResult.allowed,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Comment error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get("appId")

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      )
    }

    // Fetch comments from InstantDB
    // Note: InstantDB React queries work client-side via hooks
    // For server-side API routes, we return empty array
    // Client-side should use useCommentsByApp hook instead
    return NextResponse.json(
      { comments: [] },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

