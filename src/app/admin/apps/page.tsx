"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAdminApps } from "@/lib/hooks/useAdmin"
import { useUser } from "@/lib/auth"
import { db } from "@/lib/instant-client"
import type { App } from "@/lib/instant"

export default function AdminAppsPage() {
  const { data: apps, isLoading } = useAdminApps()
  const { user } = useUser()
  const [showForm, setShowForm] = useState(false)
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    tags: "",
    logoUrl: "",
    websiteUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    setIsSubmitting(true)
    setError(null)

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const payload = {
        ...formData,
        tags: tagsArray,
      }

      if (editingApp) {
        // Update app
        const response = await fetch("/api/admin/apps", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": (user as any).id || "",
            "x-user-type": (user as any).type || "",
          },
          body: JSON.stringify({
            id: editingApp.id,
            ...payload,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to update app")
        }

        // Update in InstantDB
        await db.transact([
          db.tx.apps[editingApp.id].update({
            ...payload,
          }),
        ])
      } else {
        // Create app
        const response = await fetch("/api/admin/apps", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": (user as any).id || "",
            "x-user-type": (user as any).type || "",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to create app")
        }

        const { app } = await response.json()

        // Create in InstantDB
        await db.transact([
          db.tx.apps[app.id].update({
            ...app,
          }),
        ])
      }

      // Reset form
      setFormData({
        name: "",
        slug: "",
        tagline: "",
        description: "",
        tags: "",
        logoUrl: "",
        websiteUrl: "",
      })
      setShowForm(false)
      setEditingApp(null)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (app: App) => {
    setEditingApp(app)
    setFormData({
      name: app.name,
      slug: app.slug,
      tagline: app.tagline,
      description: app.description,
      tags: app.tags.join(", "),
      logoUrl: app.logoUrl || "",
      websiteUrl: app.websiteUrl || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (appId: string) => {
    if (!user || !db || !confirm("Are you sure you want to delete this app?")) return

    try {
      const response = await fetch("/api/admin/apps", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": (user as any).id || "",
          "x-user-type": (user as any).type || "",
        },
        body: JSON.stringify({ id: appId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete app")
      }

      // Delete from InstantDB
      await db.transact([db.tx.apps[appId].delete()])
    } catch (err: any) {
      alert(err.message || "Failed to delete app")
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingApp(null)
    setFormData({
      name: "",
      slug: "",
      tagline: "",
      description: "",
      tags: "",
      logoUrl: "",
      websiteUrl: "",
    })
    setError(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Apps</h1>
        <Button onClick={() => setShowForm(!showForm)} disabled={showForm}>
          Add App
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingApp ? "Edit App" : "Create New App"}
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <Input
                  placeholder="App name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <Input
                  placeholder="app-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline *
                </label>
                <Input
                  placeholder="Short tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={4}
                  placeholder="App description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <Input
                  placeholder="tag1, tag2, tag3"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <Input
                  placeholder="https://example.com"
                  value={formData.websiteUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingApp ? "Update App" : "Create App"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading apps...</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No apps yet. Create your first app!</p>
          </div>
        ) : (
          apps.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{app.name}</h3>
                    <p className="text-sm text-gray-500">{app.slug}</p>
                    <p className="text-sm text-gray-600 mt-1">{app.tagline}</p>
                    <div className="flex gap-2 mt-2">
                      {app.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(app)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(app.id)}
                    >
                      Delete
                    </Button>
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

