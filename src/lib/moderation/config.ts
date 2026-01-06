// Moderation configuration
export const moderationConfig = {
  enabled: process.env.MODERATION_ENABLED !== 'false',
  strictMode: process.env.MODERATION_STRICT_MODE === 'true',
  
  // Link validation
  maxLinks: parseInt(process.env.MAX_LINKS_PER_COMMENT || '2'),
  allowUrlShorteners: process.env.ALLOW_URL_SHORTENERS === 'true',
  
  // Duplicate detection
  duplicateWindowMinutes: parseInt(process.env.DUPLICATE_CHECK_WINDOW_MINUTES || '5'),
  duplicateSimilarityThreshold: parseFloat(process.env.DUPLICATE_SIMILARITY_THRESHOLD || '0.9'),
  
  // Spam detection
  spamScoreThreshold: parseInt(process.env.SPAM_SCORE_THRESHOLD || '70'),
  maxRepeatedChars: parseInt(process.env.MAX_REPEATED_CHARS || '5'),
  maxCapsRatio: parseFloat(process.env.MAX_CAPS_RATIO || '0.5'),
  maxPunctuationRatio: parseFloat(process.env.MAX_PUNCTUATION_RATIO || '0.2'),
  
  // Profanity
  profanityEnabled: process.env.PROFANITY_FILTER_ENABLED !== 'false',
  autoSanitize: process.env.AUTO_SANITIZE_PROFANITY === 'true',
  
  // Blocked domains (common spam/phishing domains)
  blockedDomains: [
    'bit.ly',
    'tinyurl.com',
    't.co',
    'goo.gl',
    'ow.ly',
    // Add more as needed
  ],
  
  // Blocked patterns (regex patterns for common spam)
  blockedPatterns: [
    /click here/i,
    /buy now/i,
    /limited time/i,
    /act now/i,
    /free money/i,
    /make money fast/i,
    // Add more as needed
  ],
} as const

