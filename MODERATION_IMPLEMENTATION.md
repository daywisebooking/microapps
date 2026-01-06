# Comment Moderation System Implementation

## Overview
Successfully implemented an auto-flagging moderation system that creates pending comments for review when violations are detected, instead of blocking them entirely.

## What Was Implemented

### 1. Schema Updates (`src/lib/schema.ts`)
- Added `CommentStatus` type: `"published" | "pending_review" | "removed"`
- Added `status` field to `Comment` interface
- Added `ReportType` type: `"user_report" | "auto_flag"`
- Added `type` and `violations` fields to `Report` interface

### 2. Mutations (`src/lib/mutations.ts`)
- Updated `createComment()` to accept optional `status` parameter (defaults to "published")
- Added `createAutoReport()` function to create system-generated reports with violation details
- Updated `createReport()` to include `type: "user_report"`
- Enhanced `moderateReport()` to:
  - Set comment status to "removed" for approved auto-flagged comments
  - Set comment status to "published" for rejected auto-flagged comments
  - Delete comments entirely for approved user reports

### 3. Comment Creation API (`src/app/api/comments/route.ts`)
- Modified to create comments with `status: "pending_review"` when moderation fails
- Automatically creates an auto-report with violation details
- Returns `flagged: true` in response when comment is auto-flagged
- Comments are no longer blocked - they're created but hidden

### 4. Comment Queries (`src/lib/hooks/useComments.ts`)
- Updated `useCommentsByApp()` to filter out non-published comments
- Only shows comments with `status: "published"` or no status (backwards compatibility)
- Includes status in returned comment data

### 5. Admin Panel (`src/app/admin/comments/page.tsx`)
- Enhanced to display auto-flagged comments with orange border
- Shows "Auto-Flagged" badge for system-generated reports
- Displays violation types (profanity, spam, etc.)
- Shows comment status in details
- Updated button labels:
  - "Remove Comment" for approve action
  - "Publish Comment" for reject action on auto-flags
  - "Reject Report" for reject action on user reports

## Database Schema Requirements

**IMPORTANT:** You need to update your InstantDB schema to include these new fields:

```javascript
// In your InstantDB schema configuration
{
  comments: {
    // ... existing fields ...
    status: "string", // "published" | "pending_review" | "removed"
  },
  reports: {
    // ... existing fields ...
    type: "string", // "user_report" | "auto_flag"
    violations: "array", // Array of violation types
  }
}
```

## How It Works

### Flow for Comments with Violations

```
1. User posts comment with profanity
   ↓
2. Moderation detects violation
   ↓
3. Comment created with status="pending_review"
   ↓
4. Auto-report created with violation details
   ↓
5. Comment hidden from public view
   ↓
6. Admin sees report in moderation panel
   ↓
7. Admin can:
   - Remove Comment (sets status to "removed")
   - Publish Comment (sets status to "published")
```

### Flow for Clean Comments

```
1. User posts clean comment
   ↓
2. Moderation passes
   ↓
3. Comment created with status="published"
   ↓
4. Immediately visible to everyone
```

## Enhanced Hate Speech Detection

The moderation system includes comprehensive detection for:
- **Homophobic language**: Slurs and derogatory phrases like "this is gay"
- **Racial hate speech**: All major racial slurs and discriminatory patterns
- **Transphobic content**: Slurs and misgendering language
- **Ableist language**: Disability-related slurs
- **Misogynistic content**: Gendered slurs and derogatory terms

See `HATE_SPEECH_MODERATION.md` for complete details.

## Testing the Implementation

1. **Post a comment with profanity or hate speech**
   - Try: swear words, "this is gay", racial slurs, etc.
   - Comment should be created successfully
   - User sees their comment posted
   - Comment is NOT visible to other users

2. **Check admin panel** (`/admin/comments`)
   - Should see an auto-flagged report with orange border
   - Shows "Auto-Flagged" badge
   - Displays violation type (e.g., "profanity")
   - Shows the detected violations

3. **Moderate the comment**
   - Click "Remove Comment" to permanently hide it
   - Click "Publish Comment" to make it visible to everyone (rare, for false positives)

## Backwards Compatibility

- Comments without a `status` field are treated as "published"
- Existing comments will continue to work
- Reports without a `type` field are treated as user reports

## Next Steps

1. **Update InstantDB Schema**: Add the `status`, `type`, and `violations` fields
2. **Test thoroughly**: Post comments with various violations
3. **Monitor**: Check that auto-reports are being created correctly
4. **Optional**: Add user notification when their comment is flagged for review

