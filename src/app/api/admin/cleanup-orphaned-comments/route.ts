import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/instant"
import { verifyAdmin } from "@/lib/admin"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || null
    const userType = request.headers.get("x-user-type") || null

    // Verify admin access
    const adminCheck = await verifyAdmin(userId, userType)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Admin DB not configured" },
        { status: 500 }
      )
    }

    // Get all comments
    const result = await adminDb.query({
      comments: {}
    })

    const allComments = result?.comments || []
    
    // Find orphaned comments (comments with parentId that doesn't exist)
    const commentIds = new Set(allComments.map((c: any) => c.id))
    const orphanedComments = allComments.filter((comment: any) => {
      if (comment.parentId) {
        return !commentIds.has(comment.parentId)
      }
      return false
    })

    if (orphanedComments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orphaned comments found",
        totalComments: allComments.length,
        orphanedCount: 0
      })
    }

    // Delete orphaned comments
    const deleteTransactions = orphanedComments.map((comment: any) => 
      adminDb.tx.comments[comment.id].delete()
    )

    await adminDb.transact(deleteTransactions)

    return NextResponse.json({
      success: true,
      message: `Deleted ${orphanedComments.length} orphaned comment(s)`,
      totalComments: allComments.length,
      orphanedCount: orphanedComments.length,
      orphanedComments: orphanedComments.map((c: any) => ({
        id: c.id,
        parentId: c.parentId,
        content: c.content.substring(0, 50)
      }))
    })
  } catch (error: any) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to cleanup orphaned comments" },
      { status: 500 }
    )
  }
}

