# Micro Apps Hub

A discovery and voting platform for micro apps targeting solo and small service businesses.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: InstantDB (to be integrated in Milestone 2)
- **Authentication**: InstantDB Magic Codes (to be implemented in Milestone 3)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utilities and API layer
└── mock/            # Mock data (Milestone 1)
```

## Milestones

- ✅ **Milestone 1**: Frontend-only UI with mocked data
- ✅ **Milestone 2**: Wire InstantDB read queries
- ✅ **Milestone 3**: Auth (magic codes)
- ✅ **Milestone 4**: Write operations + validation + rate limits
- ✅ **Milestone 5**: Admin panel
- ⏳ **Milestone 6**: Analytics

## Environment Variables

### Required
- `NEXT_PUBLIC_INSTANT_APP_ID`: InstantDB app ID (required for Milestone 2+)
- `INSTANT_ADMIN_TOKEN`: InstantDB admin token (required for server-side operations)
- `ADMIN_EMAILS`: Comma-separated list of admin email addresses (e.g., `admin@example.com,admin2@example.com`)

### Optional - Rate Limiting
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL (recommended for production)
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token (recommended for production)

Note: If Redis is not configured, the app will use in-memory rate limiting, which is suitable for development but not recommended for production with multiple instances.

### Optional - Content Moderation
- `MODERATION_ENABLED`: Enable/disable content moderation (default: `true`)
- `MODERATION_STRICT_MODE`: Enable strict moderation mode (default: `false`)
- `PROFANITY_FILTER_ENABLED`: Enable profanity filtering (default: `true`)
- `AUTO_SANITIZE_PROFANITY`: Auto-replace profanity with asterisks (default: `false`)
- `MAX_LINKS_PER_COMMENT`: Maximum URLs allowed per comment (default: `2`)
- `ALLOW_URL_SHORTENERS`: Allow URL shorteners like bit.ly (default: `false`)
- `DUPLICATE_CHECK_WINDOW_MINUTES`: Time window for duplicate detection (default: `5`)
- `DUPLICATE_SIMILARITY_THRESHOLD`: Similarity threshold for duplicates 0-1 (default: `0.9`)
- `SPAM_SCORE_THRESHOLD`: Spam score threshold 0-100 (default: `70`)
- `MAX_REPEATED_CHARS`: Max repeated characters before flagging (default: `5`)
- `MAX_CAPS_RATIO`: Max capitalization ratio 0-1 (default: `0.5`)
- `MAX_PUNCTUATION_RATIO`: Max punctuation ratio 0-1 (default: `0.2`)

See `.env.example` for all required variables.

## Security

### Important Security Notes

- **Never commit `.env` or `.env.local` files** - These contain sensitive credentials
- **Admin emails are configured via environment variables** - No hardcoded admin credentials in source code
- **Set `NODE_ENV=production` in production** - This disables debug logging and dev-only features
- **Use Upstash Redis for production rate limiting** - In-memory rate limiting doesn't work across multiple instances
- **Review InstantDB permissions** - Ensure proper read/write rules are configured in your InstantDB dashboard

### Pre-Deployment Checklist

Before deploying to production:

- [ ] Set all required environment variables in your hosting platform
- [ ] Set `NODE_ENV=production`
- [ ] Configure `ADMIN_EMAILS` with your actual admin email addresses
- [ ] Set up Upstash Redis and configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] Verify InstantDB permissions are properly configured
- [ ] Test admin login and functionality
- [ ] Verify no `.env` files are in git history: `git log --all --full-history -- "*.env*"`
- [ ] Run `npm run build` to ensure the app builds successfully
- [ ] Check for any exposed secrets in the codebase
- [ ] Review content moderation settings for your use case

## Development

### Admin Access

In development mode, admin access can be granted via:
1. Setting `ADMIN_EMAILS` environment variable (recommended)
2. Fallback to hardcoded email if `ADMIN_EMAILS` is not set (development only)

In production, `ADMIN_EMAILS` **must** be set via environment variables.

### Scripts

The `/scripts` directory contains one-time migration scripts and utilities. These should not be deployed to production. See `/scripts/README.md` for details.

