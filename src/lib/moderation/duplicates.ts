import { compareTwoStrings } from 'string-similarity'
import { adminDb } from '@/lib/instant'
import { moderationConfig } from './config'
import type { DuplicateResult } from '@/types/moderation'

/**
 * Check for duplicate comments
 */
export async function checkDuplicates(
  userId: string,
  appId: string,
  content: string
): Promise<DuplicateResult> {
  if (!adminDb) {
    // In mock mode, skip duplicate check
    return { isDuplicate: false, similarity: 0 }
  }

  try {
    // Calculate time window
    const windowStart = Date.now() - (moderationConfig.duplicateWindowMinutes * 60 * 1000)

    // Query all comments by the same user (filter in memory since createdAt isn't indexed)
    const result = await adminDb.query({
      comments: {
        $: {
          where: {
            userId,
          },
        },
      },
    })

    // Filter to recent comments in memory
    const allComments = (result?.comments || []) as Array<{ id: string; content: string; createdAt: number }>
    const recentComments = allComments.filter((comment) => comment.createdAt >= windowStart)

    // Check for exact duplicates
    const exactMatch = recentComments.find(
      (comment: { id: string; content: string }) => comment.content.trim().toLowerCase() === content.trim().toLowerCase()
    )

    if (exactMatch) {
      return {
        isDuplicate: true,
        similarity: 1.0,
        existingCommentId: exactMatch.id,
      }
    }

    // Check for similar content (fuzzy matching)
    let maxSimilarity = 0
    let mostSimilarComment: any = null

    recentComments.forEach((comment: { id: string; content: string }) => {
      const similarity = compareTwoStrings(
        content.trim().toLowerCase(),
        comment.content.trim().toLowerCase()
      )

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity
        mostSimilarComment = comment
      }
    })

    if (maxSimilarity >= moderationConfig.duplicateSimilarityThreshold) {
      return {
        isDuplicate: true,
        similarity: maxSimilarity,
        existingCommentId: mostSimilarComment?.id,
      }
    }

    return {
      isDuplicate: false,
      similarity: maxSimilarity,
    }
  } catch (error) {
    console.error('Duplicate check error:', error)
    // On error, allow the comment (fail open)
    return { isDuplicate: false, similarity: 0 }
  }
}

