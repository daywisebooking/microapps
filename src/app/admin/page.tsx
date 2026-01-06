"use client"

import { useAdminStats } from "@/lib/hooks/useAdmin"

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Apps</h3>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "..." : stats.totalApps}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "..." : stats.totalUsers}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Reports</h3>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "..." : stats.pendingReports}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Votes</h3>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "..." : stats.totalVotes}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Comments</h3>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "..." : stats.totalComments}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Favorites</h3>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "..." : stats.totalFavorites}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500">Activity tracking coming soon</p>
      </div>
    </div>
  )
}
