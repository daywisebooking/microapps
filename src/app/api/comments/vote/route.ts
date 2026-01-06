import { NextRequest, NextResponse } from "next/server"
import { commentVoteSchema } from "@/lib/validations"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { toggleCommentVote } from "@/lib/mutations"

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
    const validationResult = commentVoteSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { commentId, direction } = validationResult.data

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Implement comment vote logic with InstantDB
    const result = await toggleCommentVote(userId, commentId, direction)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to record comment vote" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Vote recorded" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Comment vote error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

