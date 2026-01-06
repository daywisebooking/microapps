import { NextRequest, NextResponse } from "next/server"
import { moderateReportSchema } from "@/lib/validations"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { moderateReport } from "@/lib/mutations"
import { verifyAdmin } from "@/lib/admin"

// GET - List all reports (moderation queue)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Note: InstantDB queries work client-side via hooks
    // For server-side, return empty array - client should use InstantDB hooks
    return NextResponse.json(
      { reports: [] },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin comments GET error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// POST - Moderate report (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

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
    const validationResult = moderateReportSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { reportId, action } = validationResult.data

    const result = await moderateReport(reportId, action)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to moderate report" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin comments POST error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

