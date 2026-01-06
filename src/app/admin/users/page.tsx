"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminUsers } from "@/lib/hooks/useAdmin"
import { useUser } from "@/lib/auth"
import { db } from "@/lib/instant-client"
import type { User } from "@/lib/instant"

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers()
  const { user: currentUser } = useUser()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleToggleStatus = async (targetUser: User) => {
    if (!currentUser || !db || isUpdating) return

    const newDisabledStatus = !targetUser.disabled

    setIsUpdating(targetUser.id)

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": (currentUser as any).id || "",
          "x-user-type": (currentUser as any).type || "",
        },
        body: JSON.stringify({
          userId: targetUser.id,
          disabled: newDisabledStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update user status")
      }

      // Update in InstantDB
      await db.transact([
        db.tx.$users[targetUser.id].update({
          disabled: newDisabledStatus,
        }),
      ])
    } catch (err: any) {
      alert(err.message || "Failed to update user status")
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No users found.</p>
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{user.email}</h3>
                    <p className="text-sm text-gray-500">
                      Role: {user.type || "user"} | Created:{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                      {user.disabled && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                          Disabled
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {user.id === (currentUser as any)?.id ? (
                      <span className="text-sm text-gray-400">Current user</span>
                    ) : user.disabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        disabled={isUpdating === user.id}
                      >
                        {isUpdating === user.id ? "Updating..." : "Enable"}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        disabled={isUpdating === user.id}
                      >
                        {isUpdating === user.id ? "Updating..." : "Disable"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

