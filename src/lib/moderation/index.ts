// Main moderation service
import { checkProfanity } from './profanity'
import { checkSpam } from './spam'
import { validateLinks } from './links'
import { checkBlockedPatterns } from './patterns'
import { checkDuplicates } from './duplicates'
import { moderationConfig } from './config'
import type { ModerationResult, ModerationError, ModerationMetadata } from '@/types/moderation'
import { ModerationErrorType } from '@/types/moderation'

/**
 * Main moderation function - checks all content rules
 */
export async function moderateContent(
  content: string,
  userId: string,
  appId: string
): Promise<ModerationResult> {
  if (!moderationConfig.enabled) {
    return {
      allowed: true,
      errors: [],
    }
  }

  const errors: ModerationError[] = []
  const warnings: string[] = []
  const metadata: ModerationMetadata = {}

  // 1. Profanity check (fast, fail fast)
  const profanityResult = checkProfanity(content)
  if (!profanityResult.isClean) {
    errors.push({
      type: ModerationErrorType.PROFANITY,
      message: 'Your comment contains inappropriate language',
      details: {
        violations: profanityResult.violations,
      },
    })
    metadata.profanityCount = profanityResult.violations.length
  }

  // 2. Blocked patterns check (fast)
  const patternResult = checkBlockedPatterns(content)
  if (patternResult.isBlocked) {
    errors.push({
      type: ModerationErrorType.BLOCKED_PATTERN,
      message: 'Your comment contains blocked content',
      details: {
        matchedPatterns: patternResult.matchedPatterns,
      },
    })
    metadata.matchedPatterns = patternResult.matchedPatterns
  }

  // 3. Link validation (medium speed)
  const linkResult = validateLinks(content)
  if (!linkResult.isValid) {
    linkResult.violations.forEach(violation => {
      if (violation.includes('Too many links')) {
        errors.push({
          type: ModerationErrorType.TOO_MANY_LINKS,
          message: `Too many links in your comment (max ${moderationConfig.maxLinks})`,
        })
      } else if (violation.includes('Invalid URL')) {
        errors.push({
          type: ModerationErrorType.INVALID_LINK,
          message: 'Your comment contains invalid links',
        })
      } else {
        errors.push({
          type: ModerationErrorType.INVALID_LINK,
          message: violation,
        })
      }
    })
  }
  metadata.linkCount = linkResult.urls.length

  // 4. Spam detection (medium speed)
  const spamResult = checkSpam(content)
  if (spamResult.isSpam) {
    errors.push({
      type: ModerationErrorType.SPAM,
      message: 'Your comment appears to be spam',
      details: {
        reasons: spamResult.reasons,
        score: spamResult.score,
      },
    })
    metadata.spamScore = spamResult.score
  } else if (spamResult.score > 30) {
    // Warning for borderline spam
    warnings.push('Your comment may be flagged as spam')
    metadata.spamScore = spamResult.score
  }

  // 5. Duplicate detection (slower, requires DB)
  // Only check if no critical errors found (optimization)
  if (errors.length === 0) {
    const duplicateResult = await checkDuplicates(userId, appId, content)
    if (duplicateResult.isDuplicate) {
      errors.push({
        type: ModerationErrorType.DUPLICATE,
        message: 'You have already posted a similar comment recently',
        details: {
          similarity: duplicateResult.similarity,
          existingCommentId: duplicateResult.existingCommentId,
        },
      })
      metadata.similarity = duplicateResult.similarity
    } else if (duplicateResult.similarity > 0.7) {
      // Warning for similar content
      warnings.push('Your comment is very similar to a previous one')
      metadata.similarity = duplicateResult.similarity
    }
  }

  return {
    allowed: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  }
}

/**
 * Get user-friendly error message
 */
export function getModerationErrorMessage(errors: ModerationError[]): string {
  if (errors.length === 0) {
    return 'Content approved'
  }

  // Return generic message to avoid revealing moderation details
  return 'Your comment does not meet our community guidelines. Please review and try again.'
}

