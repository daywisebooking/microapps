import { NextRequest, NextResponse } from "next/server"
import { reportSchema } from "@/lib/validations"
import { reportRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { createReport } from "@/lib/mutations"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || null

    // Rate limiting (stricter for reports)
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(reportRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Validate input
    const body = await request.json()
    const validationResult = reportSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { commentId, reason } = validationResult.data

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Create report in InstantDB
    const result = await createReport(userId, commentId, reason)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create report" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Report submitted", report: result.report },
      { status: 201 }
    )
  } catch (error) {
    console.error("Report error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

