import { moderationConfig } from './config'
import type { SpamResult } from '@/types/moderation'

/**
 * Check content for spam patterns
 */
export function checkSpam(content: string): SpamResult {
  const reasons: string[] = []
  let score = 0

  // Check for repeated characters (e.g., "aaaaaa", "!!!!!")
  const repeatedCharPattern = /(.)\1{4,}/g
  const repeatedMatches = content.match(repeatedCharPattern)
  if (repeatedMatches) {
    reasons.push(`Excessive repeated characters`)
    score += 30
  }

  // Check capitalization ratio
  const totalChars = content.replace(/\s/g, '').length
  if (totalChars > 0) {
    const capsChars = (content.match(/[A-Z]/g) || []).length
    const capsRatio = capsChars / totalChars
    
    if (capsRatio > moderationConfig.maxCapsRatio) {
      reasons.push(`Excessive capitalization (${Math.round(capsRatio * 100)}%)`)
      score += 25
    }
  }

  // Check punctuation ratio
  const punctuationChars = (content.match(/[!?.]{2,}/g) || []).length
  const punctuationRatio = punctuationChars / Math.max(totalChars, 1)
  
  if (punctuationRatio > moderationConfig.maxPunctuationRatio) {
    reasons.push(`Excessive punctuation`)
    score += 20
  }

  // Check for suspicious spam patterns
  const spamPatterns = [
    /click here/i,
    /buy now/i,
    /limited time/i,
    /act now/i,
    /free money/i,
    /make money/i,
    /work from home/i,
    /get rich/i,
    /guaranteed/i,
    /no risk/i,
  ]

  let spamPatternMatches = 0
  spamPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      spamPatternMatches++
    }
  })

  if (spamPatternMatches >= 2) {
    reasons.push(`Multiple spam keywords detected`)
    score += 30
  } else if (spamPatternMatches === 1) {
    score += 10
  }

  // Check for excessive links (handled separately, but add to spam score)
  const urlPattern = /https?:\/\/[^\s]+/gi
  const urlMatches = content.match(urlPattern)
  if (urlMatches && urlMatches.length > moderationConfig.maxLinks) {
    reasons.push(`Too many links`)
    score += 25
  }

  // Check for all caps words (more than 3 chars)
  const allCapsWords = content.match(/\b[A-Z]{4,}\b/g)
  if (allCapsWords && allCapsWords.length >= 3) {
    reasons.push(`Multiple all-caps words`)
    score += 15
  }

  // Check for excessive numbers (potential phone/credit card spam)
  const numberPattern = /\d{10,}/g
  if (numberPattern.test(content)) {
    reasons.push(`Suspicious number pattern`)
    score += 20
  }

  // Normalize score to 0-100
  score = Math.min(100, score)

  return {
    isSpam: score >= moderationConfig.spamScoreThreshold,
    reasons,
    score,
  }
}

