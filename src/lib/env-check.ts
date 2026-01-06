/**
 * Environment Variable Validation
 * 
 * This module checks that critical environment variables are set,
 * especially in production environments. It helps catch configuration
 * errors before they cause runtime issues.
 */

interface EnvCheckResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates that all required environment variables are set
 * Returns validation results with errors and warnings
 */
export function validateEnvironment(): EnvCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const isProduction = process.env.NODE_ENV === 'production'

  // Check required variables
  if (!process.env.NEXT_PUBLIC_INSTANT_APP_ID) {
    errors.push('NEXT_PUBLIC_INSTANT_APP_ID is not set')
  }

  if (!process.env.INSTANT_ADMIN_TOKEN) {
    errors.push('INSTANT_ADMIN_TOKEN is not set')
  }

  // Production-specific checks
  if (isProduction) {
    // In production, admin emails MUST be configured via env var
    if (!process.env.ADMIN_EMAILS) {
      errors.push('ADMIN_EMAILS is not set (required in production)')
    }

    // Warn if rate limiting is not configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      warnings.push(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. ' +
        'Using in-memory rate limiting (not recommended for production)'
      )
    }

    // Warn if moderation is disabled in production
    if (process.env.MODERATION_ENABLED === 'false') {
      warnings.push('MODERATION_ENABLED is set to false in production')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates environment and throws if there are critical errors
 * Use this at application startup to fail fast if misconfigured
 */
export function assertValidEnvironment(): void {
  const result = validateEnvironment()

  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      console.warn(`[ENV WARNING] ${warning}`)
    })
  }

  if (!result.isValid) {
    const errorMessage = [
      'Environment validation failed:',
      ...result.errors.map(err => `  - ${err}`),
      '',
      'Please check your environment variables and ensure all required values are set.',
      'See .env.example for a template.',
    ].join('\n')

    throw new Error(errorMessage)
  }
}

/**
 * Logs environment status (useful for debugging)
 * Only logs in development mode to avoid exposing info in production logs
 */
export function logEnvironmentStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    const result = validateEnvironment()
    
    console.log('[ENV CHECK] Environment validation:', {
      isValid: result.isValid,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length,
      nodeEnv: process.env.NODE_ENV,
      hasInstantDB: !!process.env.NEXT_PUBLIC_INSTANT_APP_ID,
      hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      hasAdminEmails: !!process.env.ADMIN_EMAILS,
    })

    if (result.errors.length > 0) {
      console.error('[ENV CHECK] Errors:', result.errors)
    }

    if (result.warnings.length > 0) {
      console.warn('[ENV CHECK] Warnings:', result.warnings)
    }
  }
}

