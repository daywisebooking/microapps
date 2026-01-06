# Content Moderation System

This directory contains the content moderation system for the Micro Apps Hub platform.

## Overview

The moderation system provides comprehensive content filtering including:
- **Profanity filtering**: Detects and blocks inappropriate language
- **Spam detection**: Identifies spam patterns and suspicious content
- **Link validation**: Validates URLs and enforces link limits
- **Pattern blocking**: Blocks content matching configured patterns
- **Duplicate detection**: Prevents users from posting duplicate or very similar comments

## Architecture

```
src/lib/moderation/
├── index.ts          # Main moderation service (orchestrates all checks)
├── config.ts         # Configuration and environment variables
├── profanity.ts      # Profanity filter module
├── spam.ts           # Spam detection module
├── links.ts          # URL validation module
├── patterns.ts       # Pattern blocking module
└── duplicates.ts      # Duplicate detection module
```

## Usage

### Basic Usage

```typescript
import { moderateContent } from '@/lib/moderation'

const result = await moderateContent(content, userId, appId)

if (!result.allowed) {
  // Handle moderation errors
  console.log(result.errors)
}
```

### Integration in API Routes

The moderation system is already integrated into `/api/comments` route. It runs automatically when comments are created.

## Configuration

All configuration is done via environment variables (see `config.ts`):

- `MODERATION_ENABLED`: Enable/disable moderation (default: `true`)
- `PROFANITY_FILTER_ENABLED`: Enable profanity filtering (default: `true`)
- `MAX_LINKS_PER_COMMENT`: Maximum URLs per comment (default: `2`)
- `SPAM_SCORE_THRESHOLD`: Spam score threshold 0-100 (default: `70`)
- `DUPLICATE_CHECK_WINDOW_MINUTES`: Time window for duplicates (default: `5`)
- And more... (see `config.ts` for full list)

## Moderation Checks

### 1. Profanity Filter
- Uses `bad-words` library
- Detects leet-speak variations (e.g., "f*ck", "sh1t")
- Configurable word list
- Optional auto-sanitization

### 2. Spam Detection
- Repeated characters detection
- Excessive capitalization check
- Punctuation ratio analysis
- Spam keyword detection
- Suspicious pattern matching

### 3. Link Validation
- URL format validation
- Domain blocking (shorteners, spam domains)
- Link count limits
- Protocol validation (http/https only)

### 4. Pattern Blocking
- Regex pattern matching
- Configurable blocked patterns
- Case-insensitive matching

### 5. Duplicate Detection
- Exact duplicate detection
- Fuzzy matching (similarity threshold)
- Time-windowed checks (recent comments only)
- Per-user tracking

## Error Handling

The moderation system returns structured errors:

```typescript
interface ModerationResult {
  allowed: boolean
  errors: ModerationError[]
  warnings?: string[]
  metadata?: ModerationMetadata
}
```

Error types:
- `profanity`: Inappropriate language detected
- `spam`: Spam content detected
- `blocked_pattern`: Matched blocked pattern
- `invalid_link`: Invalid URL format
- `too_many_links`: Exceeded link limit
- `duplicate`: Duplicate or similar comment detected

## Performance

- **Profanity check**: <1ms (fastest, fail-fast)
- **Pattern check**: <1ms (fast)
- **Link validation**: <2ms (medium)
- **Spam detection**: <5ms (medium)
- **Duplicate check**: 10-50ms (requires DB query)

Checks are executed in order, with fastest checks first for optimal performance.

## Security

- All checks run **server-side only** (cannot be bypassed)
- Generic error messages to users (no details leakage)
- Full details logged server-side for admin review
- Fail-safe: On errors, system allows content (fail-open)

## Future Enhancements

- Client-side validation (optional, for UX)
- Admin UI for managing blocked patterns
- Machine learning spam detection
- Sentiment analysis
- Auto-moderation actions
- User reputation system

