import { z } from "zod"

// Vote schema
export const voteSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  direction: z.enum(["up", "down"]),
})

// Comment schema
export const commentSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  content: z.string().min(1, "Content is required").max(5000, "Content is too long"),
  parentId: z.string().nullable().optional(),
  type: z.enum(["general", "feature", "bug"]),
})

// Favorite schema
export const favoriteSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
})

// Report schema
export const reportSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason is too long"),
})

// Comment vote schema
export const commentVoteSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
  direction: z.enum(["up", "down"]),
})

// Admin schemas
export const createAppSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug is too long").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  tagline: z.string().min(1, "Tagline is required").max(200, "Tagline is too long"),
  description: z.string().min(1, "Description is required").max(5000, "Description is too long"),
  tags: z.array(z.string()).max(10, "Too many tags"),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
})

export const updateAppSchema = createAppSchema.partial().extend({
  id: z.string().min(1, "App ID is required"),
})

export const deleteAppSchema = z.object({
  id: z.string().min(1, "App ID is required"),
})

export const toggleUserStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  disabled: z.boolean(),
})

export const moderateReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  action: z.enum(["approve", "reject"]),
})

export const setFeaturedAppSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  badges: z.array(z.string()).optional(),
})

// Type exports
export type VoteInput = z.infer<typeof voteSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type FavoriteInput = z.infer<typeof favoriteSchema>
export type ReportInput = z.infer<typeof reportSchema>
export type CommentVoteInput = z.infer<typeof commentVoteSchema>
export type CreateAppInput = z.infer<typeof createAppSchema>
export type UpdateAppInput = z.infer<typeof updateAppSchema>
export type DeleteAppInput = z.infer<typeof deleteAppSchema>
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>
export type ModerateReportInput = z.infer<typeof moderateReportSchema>
export type SetFeaturedAppInput = z.infer<typeof setFeaturedAppSchema>

