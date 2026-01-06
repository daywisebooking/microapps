"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { useUser } from "@/lib/auth"
import { createCommentAPI } from "@/lib/api"

interface CommentReplyFormProps {
  appId: string
  parentId: string
  onCancel: () => void
  onReplyCreated?: () => void
}

export function CommentReplyForm({ appId, parentId, onCancel, onReplyCreated }: CommentReplyFormProps) {
  const { user } = useUser()
  const [content, setContent] = useState("")
  const [type, setType] = useState<"general" | "feature" | "bug">("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus the textarea when the form mounts
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError("Please enter a reply")
      return
    }

    if (!user) {
      setError("You must be logged in to reply")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createCommentAPI(appId, content.trim(), type, (user as any).id, parentId)

    if (result.success) {
      setContent("")
      setType("general")
      onReplyCreated?.()
      onCancel()
    } else {
      setError(result.error || "Failed to post reply")
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 mb-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Comment Type Selector */}
      <div className="mb-3">
        <div className="flex gap-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name={`type-${parentId}`}
              value="general"
              checked={type === "general"}
              onChange={(e) => setType(e.target.value as "general")}
              className="mr-1.5"
            />
            <span className="text-xs text-gray-700">General</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name={`type-${parentId}`}
              value="feature"
              checked={type === "feature"}
              onChange={(e) => setType(e.target.value as "feature")}
              className="mr-1.5"
            />
            <span className="text-xs text-[#282828]">Feature</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name={`type-${parentId}`}
              value="bug"
              checked={type === "bug"}
              onChange={(e) => setType(e.target.value as "bug")}
              className="mr-1.5"
            />
            <span className="text-xs text-red-700">Bug</span>
          </label>
        </div>
      </div>

      {/* Comment Content */}
      <div className="mb-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your reply..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#282828] focus:border-transparent resize-none text-sm"
          rows={3}
          maxLength={5000}
          disabled={isSubmitting}
        />
        <div className="text-xs text-gray-500 mt-1">
          {content.length}/5000 characters
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          size="sm"
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? "Posting..." : "Reply"}
        </Button>
      </div>
    </form>
  )
}

