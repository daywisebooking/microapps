import { Filter } from 'bad-words'
import { moderationConfig } from './config'
import type { ProfanityResult } from '@/types/moderation'

// Initialize profanity filter
const filter = new Filter()

// Add custom words to filter for hate speech, slurs, and discriminatory language
const customBadWords: string[] = [
  // Homophobic slurs
  'fag', 'faggot', 'faggots', 'fags', 'dyke', 'dykes', 'queer',
  
  // Racial slurs (common variants)
  'nigger', 'nigga', 'niggas', 'nig', 'coon', 'spic', 'spics',
  'chink', 'chinks', 'gook', 'gooks', 'kike', 'kikes', 'wetback',
  'beaner', 'towelhead', 'raghead', 'sand nigger',
  
  // Transphobic slurs
  'tranny', 'trannies', 'shemale', 'heshe',
  
  // Ableist slurs
  'retard', 'retarded', 'retards', 'tard', 'spaz', 'spastic',
  
  // Misogynistic slurs
  'cunt', 'cunts', 'whore', 'whores', 'slut', 'sluts',
]

// Add words to filter
customBadWords.forEach(word => filter.addWords(word))

// Derogatory phrases and context patterns
const derogatorPatterns = [
  // Homophobic usage
  /\b(that'?s|this is|so|really|pretty|very)\s+(gay|homo)\b/i,
  /\b(no homo|full homo)\b/i,
  
  // Racial hate speech patterns
  /\b(go back to|deport|send back).*?(africa|mexico|china|middle east|your country)/i,
  /\b(all|every|most)\s+(blacks|whites|asians|mexicans|muslims|jews|arabs)\s+(are|do|have)/i,
  
  // General derogatory patterns
  /\b(fucking|damn|stupid)\s+(gay|homo|trans|black|white|asian|mexican|muslim|jew)\b/i,
]

/**
 * Check content for profanity
 */
export function checkProfanity(content: string): ProfanityResult {
  if (!moderationConfig.profanityEnabled) {
    return { isClean: true, violations: [] }
  }

  const violations: string[] = []
  
  // Check for profanity using bad-words library
  const isProfane = filter.isProfane(content)
  
  if (isProfane) {
    // Get list of profane words found
    const words = content.split(/\s+/)
    words.forEach(word => {
      if (filter.isProfane(word)) {
        violations.push(word)
      }
    })
  }

  // Check for derogatory phrases and context patterns
  derogatorPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const matches = content.match(pattern)
      if (matches) {
        violations.push(matches[0])
      }
    }
  })
  
  // Check for leet-speak variations (basic)
  const leetPatterns = [
    /f[*@#$%^&!]+ck/i,
    /sh[*@#$%^&!]+t/i,
    /b[*@#$%^&!]+tch/i,
    /a[*@#$%^&!]+s/i,
    /d[*@#$%^&!]+mn/i,
    /n[*@#$%^&!]+gg[*@#$%^&!]*[ae]r?/i,
    /f[*@#$%^&!]+gg[*@#$%^&!]*[o0]t/i,
  ]
  
  leetPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const matches = content.match(pattern)
      if (matches) {
        violations.push(...matches)
      }
    }
  })

  // Remove duplicates
  const uniqueViolations = Array.from(new Set(violations))

  let sanitized: string | undefined
  if (moderationConfig.autoSanitize && uniqueViolations.length > 0) {
    sanitized = filter.clean(content)
  }

  return {
    isClean: uniqueViolations.length === 0,
    violations: uniqueViolations,
    sanitized,
  }
}

