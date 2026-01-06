import { NextRequest, NextResponse } from "next/server"
import { voteSchema } from "@/lib/validations"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { toggleVote } from "@/lib/mutations"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request (would come from auth session in production)
    // For now, we'll get it from headers or InstantDB auth
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
    const validationResult = voteSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { appId, direction } = validationResult.data

    // Check if user is authenticated (in production, verify session)
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Implement vote logic with InstantDB
    const result = await toggleVote(userId, appId, direction)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to record vote" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Vote recorded", vote: result.vote },
      { status: 200 }
    )
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

