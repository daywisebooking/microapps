"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminReports } from "@/lib/hooks/useAdmin"
import { useUser } from "@/lib/auth"
import { db } from "@/lib/instant-client"

export default function AdminCommentsPage() {
  const { data: reports, isLoading } = useAdminReports()
  const { user } = useUser()
  const [isModerating, setIsModerating] = useState<string | null>(null)

  const handleModerate = async (reportId: string, action: "approve" | "reject") => {
    if (!user || !db || isModerating) return

    setIsModerating(reportId)

    try {
      const response = await fetch("/api/admin/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": (user as any).id || "",
          "x-user-type": (user as any).type || "",
        },
        body: JSON.stringify({
          reportId,
          action,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to moderate report")
      }

      const report = reports.find((r) => r.id === reportId)

      // Update report status in InstantDB
      await db.transact([
        db.tx.reports[reportId].update({
          status: action === "approve" ? "approved" : "rejected",
        }),
      ])

      // Handle comment based on report type and action
      if (report?.commentId) {
        if (action === "approve") {
          // Approve = Remove comment
          if (report.type === "auto_flag") {
            // For auto-flagged comments, set status to removed
            await db.transact([
              db.tx.comments[report.commentId].update({ status: "removed" })
            ])
          } else {
            // For user reports, delete entirely
            await db.transact([db.tx.comments[report.commentId].delete()])
          }
        } else if (action === "reject" && report.type === "auto_flag") {
          // Reject = Publish comment (only for auto-flagged)
          await db.transact([
            db.tx.comments[report.commentId].update({ status: "published" })
          ])
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to moderate report")
    } finally {
      setIsModerating(null)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Comment Moderation</h1>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No reported comments to review.</p>
          </div>
        ) : (
          reports.map((report: any) => {
            const isAutoFlag = report.type === "auto_flag"
            const violationBadges = report.violations || []
            
            return (
              <Card key={report.id} className={isAutoFlag ? "border-orange-300" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isAutoFlag && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Auto-Flagged
                          </span>
                          {violationBadges.length > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              {violationBadges.join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mb-3 p-3 bg-gray-50 rounded">
                        <p className="text-gray-700 mb-1">
                          <strong>Comment:</strong> {report.comment?.content || "Comment not found"}
                        </p>
                        {report.comment && (
                          <p className="text-xs text-gray-500 mt-1">
                            Type: {report.comment.type} | Status: {report.comment.status || "published"} | App ID: {report.comment.appId}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {isAutoFlag ? (
                          <>System Auto-Flag | {new Date(report.createdAt).toLocaleDateString()}</>
                        ) : (
                          <>
                            Reported by: {report.reporter?.email || "Unknown"} |{" "}
                            {new Date(report.createdAt).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleModerate(report.id, "approve")}
                        disabled={isModerating === report.id}
                      >
                        {isModerating === report.id ? "Processing..." : "Remove Comment"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModerate(report.id, "reject")}
                        disabled={isModerating === report.id}
                      >
                        {isModerating === report.id ? "Processing..." : isAutoFlag ? "Publish Comment" : "Reject Report"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

