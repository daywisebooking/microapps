// Moderation type definitions

export interface ModerationResult {
  allowed: boolean
  errors: ModerationError[]
  warnings?: string[]
  metadata?: ModerationMetadata
}

export interface ModerationError {
  type: ModerationErrorType
  message: string
  details?: any
}

export enum ModerationErrorType {
  PROFANITY = 'profanity',
  SPAM = 'spam',
  BLOCKED_PATTERN = 'blocked_pattern',
  INVALID_LINK = 'invalid_link',
  TOO_MANY_LINKS = 'too_many_links',
  DUPLICATE = 'duplicate',
}

export interface ModerationMetadata {
  profanityCount?: number
  spamScore?: number
  linkCount?: number
  similarity?: number
  matchedPatterns?: string[]
}

export interface ProfanityResult {
  isClean: boolean
  violations: string[]
  sanitized?: string
}

export interface SpamResult {
  isSpam: boolean
  reasons: string[]
  score: number
}

export interface LinkValidationResult {
  isValid: boolean
  urls: string[]
  violations: string[]
}

export interface DuplicateResult {
  isDuplicate: boolean
  similarity: number
  existingCommentId?: string
}

export interface PatternCheckResult {
  isBlocked: boolean
  matchedPatterns: string[]
}

