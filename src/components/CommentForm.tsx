"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { useUser } from "@/lib/auth"
import { createCommentAPI } from "@/lib/api"
import Link from "next/link"

interface CommentFormProps {
  appId: string
  onCommentCreated?: () => void
}

export function CommentForm({ appId, onCommentCreated }: CommentFormProps) {
  const { user } = useUser()
  const [content, setContent] = useState("")
  const [type, setType] = useState<"general" | "feature" | "bug">("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError("Please enter a comment")
      return
    }

    if (!user) {
      setError("You must be logged in to comment")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createCommentAPI(appId, content.trim(), type, (user as any).id)

    if (result.success) {
      setContent("")
      setType("general")
      onCommentCreated?.()
    } else {
      setError(result.error || "Failed to post comment")
    }

    setIsSubmitting(false)
  }

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-3">Please log in to leave a comment</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave a Comment</h3>
      
      {/* Comment Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="type"
              value="general"
              checked={type === "general"}
              onChange={(e) => setType(e.target.value as "general")}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">General</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="type"
              value="feature"
              checked={type === "feature"}
              onChange={(e) => setType(e.target.value as "feature")}
              className="mr-2"
            />
            <span className="text-sm text-[#282828]">Feature Request</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="type"
              value="bug"
              checked={type === "bug"}
              onChange={(e) => setType(e.target.value as "bug")}
              className="mr-2"
            />
            <span className="text-sm text-red-700">Bug Report</span>
          </label>
        </div>
      </div>

      {/* Comment Content */}
      <div className="mb-4">
        <label htmlFor="comment-content" className="block text-sm font-medium text-gray-700 mb-2">
          Your Comment
        </label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts, feature requests, or bug reports..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#282828] focus:border-transparent resize-none"
          rows={4}
          maxLength={5000}
          disabled={isSubmitting}
        />
        <div className="text-xs text-gray-500 mt-1">
          {content.length}/5000 characters
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  )
}

