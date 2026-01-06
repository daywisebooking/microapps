import { isURL } from 'validator'
import { moderationConfig } from './config'
import type { LinkValidationResult } from '@/types/moderation'

/**
 * Extract URLs from content
 */
function extractUrls(content: string): string[] {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
  const matches = content.match(urlPattern) || []
  return matches
}

/**
 * Validate URLs in content
 */
export function validateLinks(content: string): LinkValidationResult {
  const urls = extractUrls(content)
  const violations: string[] = []

  // Check link count
  if (urls.length > moderationConfig.maxLinks) {
    violations.push(`Too many links (${urls.length} found, max ${moderationConfig.maxLinks})`)
  }

  // Validate each URL
  urls.forEach(url => {
    // Basic URL validation
    if (!isURL(url, { 
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
    })) {
      violations.push(`Invalid URL format: ${url.substring(0, 50)}`)
      return
    }

    // Check against blocked domains
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      
      // Check if it's a URL shortener
      const isShortener = hostname.includes('bit.ly') || 
                         hostname.includes('tinyurl.com') ||
                         hostname.includes('t.co') ||
                         hostname.includes('goo.gl') ||
                         hostname.includes('ow.ly') ||
                         hostname.includes('short.link')
      
      if (isShortener && !moderationConfig.allowUrlShorteners) {
        violations.push(`URL shorteners are not allowed: ${hostname}`)
      }

      // Check against blocked domains list
      const isBlocked = moderationConfig.blockedDomains.some(domain => 
        hostname.includes(domain.toLowerCase())
      )
      
      if (isBlocked) {
        violations.push(`Blocked domain: ${hostname}`)
      }
    } catch (error) {
      violations.push(`Invalid URL: ${url.substring(0, 50)}`)
    }
  })

  return {
    isValid: violations.length === 0,
    urls,
    violations,
  }
}

