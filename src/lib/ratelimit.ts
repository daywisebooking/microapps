import type { NextRequest } from "next/server"

// Use any to avoid type imports that trigger build-time analysis
type RatelimitType = any

// Lazy initialization to avoid build-time errors when Redis is not configured
let _writeRateLimiter: RatelimitType | null = null
let _reportRateLimiter: RatelimitType | null = null

function getWriteRateLimiter(): RatelimitType | null {
  if (_writeRateLimiter !== null) {
    return _writeRateLimiter
  }
  
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      // Use Function constructor to make require truly dynamic and avoid build-time analysis
      const requireFunc = new Function('module', 'return require(module)')
      const upstashRatelimit = requireFunc("@upstash/ratelimit")
      const upstashRedis = requireFunc("@upstash/redis")
      const RatelimitClass = upstashRatelimit.Ratelimit
      const Redis = upstashRedis.Redis
      
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      _writeRateLimiter = new RatelimitClass({
        redis,
        limiter: RatelimitClass.slidingWindow(10, "10 s"),
        analytics: true,
      })
    } catch (error) {
      console.warn("Failed to initialize Upstash write rate limiter:", error)
      _writeRateLimiter = null
    }
  }
  
  return _writeRateLimiter
}

function getReportRateLimiter(): RatelimitType | null {
  if (_reportRateLimiter !== null) {
    return _reportRateLimiter
  }
  
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      // Use Function constructor to make require truly dynamic and avoid build-time analysis
      const requireFunc = new Function('module', 'return require(module)')
      const upstashRatelimit = requireFunc("@upstash/ratelimit")
      const upstashRedis = requireFunc("@upstash/redis")
      const RatelimitClass = upstashRatelimit.Ratelimit
      const Redis = upstashRedis.Redis
      
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      _reportRateLimiter = new RatelimitClass({
        redis,
        limiter: RatelimitClass.slidingWindow(5, "1 m"),
        analytics: true,
      })
    } catch (error) {
      console.warn("Failed to initialize Upstash report rate limiter:", error)
      _reportRateLimiter = null
    }
  }
  
  return _reportRateLimiter
}

// Export getter functions that initialize lazily
// These are called at runtime, avoiding build-time analysis issues
export function writeRateLimiter(): RatelimitType | null {
  return getWriteRateLimiter()
}

export function reportRateLimiter(): RatelimitType | null {
  return getReportRateLimiter()
}

// In-memory fallback for development (simple implementation)
const inMemoryLimits = new Map<string, { count: number; resetAt: number }>()

function getInMemoryLimit(identifier: string, limit: number, window: number): boolean {
  const now = Date.now()
  const key = identifier
  const record = inMemoryLimits.get(key)

  if (!record || now > record.resetAt) {
    inMemoryLimits.set(key, { count: 1, resetAt: now + window })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Get identifier for rate limiting (IP address or user ID)
export function getRateLimitIdentifier(
  request: NextRequest,
  userId?: string
): string {
  // Prefer user ID if available (more accurate)
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
  return `ip:${ip}`
}

// Check rate limit
// Accepts either a Ratelimit instance, null, or a function that returns Ratelimit | null
export async function checkRateLimit(
  limiter: RatelimitType | null | (() => RatelimitType | null),
  identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  // Handle function getters
  const actualLimiter = typeof limiter === 'function' ? limiter() : limiter
  
  // If Redis is configured, use Upstash rate limiter
  if (actualLimiter) {
    try {
      const result = await actualLimiter.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch (error) {
      console.error("Rate limit error:", error)
      // On error, allow the request (fail open)
      return { success: true }
    }
  }

  // Fallback to in-memory rate limiting for development
  // Use same limits as writeRateLimiter: 10 per 10 seconds
  const allowed = getInMemoryLimit(identifier, 10, 10 * 1000)
  return {
    success: allowed,
    limit: 10,
    remaining: allowed ? 9 : 0, // Approximate
    reset: Date.now() + 10 * 1000,
  }
}
