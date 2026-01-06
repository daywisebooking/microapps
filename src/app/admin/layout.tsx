"use client"

import { useUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || (user as any).type !== "admin")) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user || (user as any).type !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Admin Panel</h2>
            <nav className="space-y-2">
              <Link
                href="/admin"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/apps"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Apps
              </Link>
              <Link
                href="/admin/comments"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Comments
              </Link>
              <Link
                href="/admin/users"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Users
              </Link>
              <Link
                href="/admin/featured"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Featured
              </Link>
              <Link
                href="/admin/analytics"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Analytics
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}

