"use client"

import { ArrowUp, ArrowDown, Trash2, MessageSquare } from "lucide-react"
import { type Comment } from "@/lib/instant"
import { useState } from "react"
import { deleteCommentAPI } from "@/lib/api"
import { useUser } from "@/lib/auth"
import { useCommentVotes } from "@/lib/hooks/useComments"
import { CommentReplyForm } from "./CommentReplyForm"
import { getRelativeTime } from "@/lib/time-utils"

interface CommentWithUserName extends Comment {
  userName: string
}

interface CommentThreadProps {
  comment: CommentWithUserName
  allComments: CommentWithUserName[]
  level?: number
}

export function CommentThread({ comment, allComments, level = 0 }: CommentThreadProps) {
  const { user } = useUser()
  const { votes, voteComment } = useCommentVotes(user?.id || null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  
  const userVote = votes.get(comment.id)
  const isCommentAuthor = user?.id === comment.userId
  const isAdmin = (user as any)?.type === "admin"
  const canDelete = isCommentAuthor || isAdmin

  // Get direct replies to this comment
  const replies = allComments.filter(c => c.parentId === comment.id)

  const typeColors = {
    general: "bg-gray-100 text-gray-700",
    feature: "bg-gray-100 text-[#282828]",
    bug: "bg-red-100 text-red-700",
  }

  const handleVote = async (direction: "up" | "down") => {
    if (!user) {
      alert("Please log in to vote on comments")
      return
    }

    setIsVoting(true)
    const result = await voteComment(comment.id, direction)
    
    if (!result.success) {
      alert(result.error || "Failed to vote")
    }
    
    setIsVoting(false)
  }

  const handleDelete = async () => {
    if (!canDelete || !user) return

    const confirmed = confirm("Are you sure you want to delete this comment? This action cannot be undone.")
    if (!confirmed) return

    setIsDeleting(true)
    const result = await deleteCommentAPI(comment.id, (user as any).id, (user as any).type)

    if (!result.success) {
      alert(result.error || "Failed to delete comment")
      setIsDeleting(false)
    }
    // If successful, the comment will be removed from the UI via InstantDB reactivity
  }

  if (isDeleting) {
    return null // Comment is being deleted, hide it immediately
  }

  return (
    <div className={level > 0 ? "relative pl-8" : "relative"}>
      {/* Threading line for nested comments */}
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200" />
      )}
      
      <div className="py-2">
        <div className="flex items-start gap-3">
          {/* Vote buttons column */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={() => handleVote("up")}
              disabled={isVoting || !user}
              className={`p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                userVote === "up" ? "text-green-600" : "text-gray-400"
              }`}
              title={!user ? "Login to vote" : "Upvote"}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <span className={`text-xs font-bold ${
              userVote === "up" 
                ? "text-green-600" 
                : userVote === "down" 
                ? "text-red-600" 
                : "text-gray-700"
            }`}>
              {comment.voteCount || 0}
            </span>
            <button
              onClick={() => handleVote("down")}
              disabled={isVoting || !user}
              className={`p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                userVote === "down" ? "text-red-600" : "text-gray-400"
              }`}
              title={!user ? "Login to vote" : "Downvote"}
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 text-sm">{comment.userName}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[comment.type]}`}>
                {comment.type}
              </span>
              <span className="text-xs text-gray-500">
                {getRelativeTime(comment.createdAt)}
              </span>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title={isAdmin && !isCommentAuthor ? "Delete comment (admin)" : "Delete comment"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-gray-800 text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
            
            {/* Action buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                disabled={!user}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!user ? "Login to reply" : "Reply"}
              >
                <MessageSquare className="w-4 h-4" />
                Reply
              </button>
            </div>

            {/* Reply form */}
            {showReplyForm && user && (
              <CommentReplyForm
                appId={comment.appId}
                parentId={comment.id}
                onCancel={() => setShowReplyForm(false)}
                onReplyCreated={() => setShowReplyForm(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              allComments={allComments}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentsListProps {
  comments: CommentWithUserName[]
}

export function CommentsList({ comments }: CommentsListProps) {
  // Get root comments (comments with no parent)
  const rootComments = comments.filter((c) => c.parentId === null)

  // Sort root comments by vote count (descending)
  const sortedRootComments = [...rootComments].sort((a, b) => {
    return (b.voteCount || 0) - (a.voteCount || 0)
  })

  if (sortedRootComments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedRootComments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          allComments={comments}
          level={0}
        />
      ))}
    </div>
  )
}
