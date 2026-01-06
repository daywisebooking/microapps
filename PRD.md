# Micro Apps Hub - Product Requirements Document

## 1) Goal

Build Micro Apps Hub: a discovery + voting platform for micro apps targeting solo/small service businesses, with comments, favorites, and an admin CMS.

## 2) Users and roles

- **Anonymous user**: browse, search, view app pages.
- **Authenticated user**: vote, favorite, comment, report.
- **Admin**: manage apps, moderate comments, manage featured build, view analytics.

## 3) Core features

### Home
- Top ranked apps + featured build

### Browse
- Search + tag filtering

### App detail
- Overview + comments tab

### Voting
- Upvote/downvote (toggle behavior)

### Favorites
- User favorites list

### Comments
- Threaded replies, types (general/feature/bug), voting, reporting

### Admin
- Apps CRUD, user disable, moderation queue, featured config, analytics

## 4) Non-functional requirements (strict)

- Rate limiting on every endpoint (IP + user-based where possible).
- Input validation on every write endpoint.
- Secure session handling aligned with OWASP session guidance (secure cookies, rotation strategy as needed).
- No sensitive error leakage (generic messages, structured logging server-side).
- Secrets only in env vars (no keys in client bundles).

## 5) Data model

- **Users**: id, email, role (admin/user), createdAt, disabled
- **Apps**: id, slug, name, description, tagline, tags, logoUrl, websiteUrl, createdAt, voteCount, favoriteCount
- **Votes**: id, userId, appId, direction (up/down), createdAt
- **Favorites**: id, userId, appId, createdAt
- **Comments**: id, appId, userId, parentId, content, type (general/feature/bug), voteCount, createdAt
- **CommentVotes**: id, userId, commentId, direction, createdAt
- **Reports**: id, commentId, userId, reason, status, createdAt
- **Events**: id, userId, eventType, appId, metadata (JSON), createdAt
- **Featured**: id, appId, createdAt
- **RankSnapshots**: id, appId, rank, voteCount, createdAt

Implementation must map cleanly to InstantDB schema/permissions.

## 6) API surface (Next route handlers)

Define route handlers for:

- **auth**: request code, verify code, logout, me
- **apps**: list, detail
- **votes**: vote
- **favorites**: toggle, list
- **comments**: list by app, create, delete, vote, report
- **admin**: apps CRUD, users disable, moderation actions, featured config, analytics

All must be rate limited and validated.

## 7) UI requirements (Apple App Store-like)

- Clean list rows/cards, strong hierarchy, lots of whitespace
- No gradients
- Consistent spacing and typography
- "Familiar" navigation (top nav, segmented tabs on detail)

## 8) Deployment requirements

- Must deploy cleanly to Vercel (Vercel CLI supported).
- All env vars documented in .env.example
- Build must pass TypeScript, lint, and produce no runtime secrets leakage

