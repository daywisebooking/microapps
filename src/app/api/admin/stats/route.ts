import { NextRequest, NextResponse } from "next/server"

// GET - Get admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    // Dynamic import to avoid build-time evaluation issues
    const { verifyAdmin } = await import("@/lib/admin")
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
    // For server-side, return basic stats - client should use InstantDB hooks for real data
    return NextResponse.json(
      {
        totalApps: 0,
        totalUsers: 0,
        pendingReports: 0,
        totalVotes: 0,
        totalComments: 0,
        totalFavorites: 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin stats GET error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

