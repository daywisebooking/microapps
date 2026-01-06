import { moderationConfig } from './config'
import type { PatternCheckResult } from '@/types/moderation'

/**
 * Check content against blocked patterns
 */
export function checkBlockedPatterns(content: string): PatternCheckResult {
  const matchedPatterns: string[] = []

  moderationConfig.blockedPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      // Extract the matched text (first 50 chars)
      const match = content.match(pattern)
      if (match) {
        matchedPatterns.push(match[0].substring(0, 50))
      }
    }
  })

  return {
    isBlocked: matchedPatterns.length > 0,
    matchedPatterns,
  }
}

