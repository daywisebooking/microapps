import { NextRequest, NextResponse } from "next/server"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { deleteComment } from "@/lib/mutations"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id") || null
    const { id } = await params
    const commentId = id

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(writeRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify comment belongs to user, then delete from InstantDB
    const result = await deleteComment(userId, commentId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete comment" },
        { status: result.error === "Unauthorized" ? 403 : 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Comment deleted" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete comment error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

