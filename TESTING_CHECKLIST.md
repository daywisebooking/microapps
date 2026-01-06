# Comment Moderation Testing Checklist

## Prerequisites
1. ✅ Update InstantDB schema to include new fields:
   - `comments.status` (string)
   - `reports.type` (string)
   - `reports.violations` (array)

## Test Scenarios

### 1. Test Auto-Flagging with Profanity
**Steps:**
1. Navigate to any app detail page
2. Post a comment with profanity (e.g., "This is fucking awesome!")
3. Verify comment appears to be posted successfully (no error)
4. Refresh the page
5. Verify the comment does NOT appear in the public comment list

**Expected Results:**
- ✅ Comment creation succeeds
- ✅ Comment is hidden from public view
- ✅ No error message shown to user

### 2. Test Admin Panel - Auto-Flagged Comment
**Steps:**
1. Log in as admin
2. Navigate to `/admin/comments`
3. Look for the auto-flagged comment

**Expected Results:**
- ✅ Comment appears in moderation queue
- ✅ Has orange border
- ✅ Shows "Auto-Flagged" badge
- ✅ Displays violation type (e.g., "profanity")
- ✅ Shows detected violations in reason
- ✅ Shows comment status as "pending_review"
- ✅ Shows "System Auto-Flag" as reporter
- ✅ Has "Remove Comment" and "Publish Comment" buttons

### 3. Test Admin Action - Publish Comment
**Steps:**
1. In admin panel, find auto-flagged comment
2. Click "Publish Comment" button
3. Navigate back to the app detail page

**Expected Results:**
- ✅ Report status changes to "rejected"
- ✅ Comment becomes visible in public comment list
- ✅ Comment status changes to "published"

### 4. Test Admin Action - Remove Comment
**Steps:**
1. Post another comment with profanity
2. In admin panel, find the new auto-flagged comment
3. Click "Remove Comment" button
4. Navigate back to the app detail page

**Expected Results:**
- ✅ Report status changes to "approved"
- ✅ Comment remains hidden from public view
- ✅ Comment status changes to "removed"

### 5. Test Clean Comment
**Steps:**
1. Post a clean comment without any violations
2. Check if it appears immediately in the comment list

**Expected Results:**
- ✅ Comment is created with status "published"
- ✅ Comment appears immediately in public view
- ✅ No auto-report is created

### 6. Test Hate Speech Detection
**Steps:**
Test with comments containing hate speech:
- Homophobic: "this is gay", "that's so gay"
- Racial slurs: [test with any racial slur]
- Transphobic slurs: [test with transphobic language]
- Discriminatory patterns: "all [group] are [negative]"

**Expected Results:**
- ✅ All hate speech creates pending comments
- ✅ All hate speech creates auto-reports
- ✅ Violations marked as "profanity"
- ✅ Comments are hidden until admin review

### 7. Test Other Violations
**Steps:**
Test with comments that trigger other moderation rules:
- Spam (excessive caps, repeated characters)
- Too many links
- Blocked patterns ("click here", "buy now")

**Expected Results:**
- ✅ All violations create pending comments
- ✅ All violations create auto-reports
- ✅ Violation types are correctly identified
- ✅ Comments are hidden until approved

### 8. Test User-Reported Comments
**Steps:**
1. Post a clean comment
2. Report it using the report button
3. Check admin panel

**Expected Results:**
- ✅ User report appears in admin panel
- ✅ Does NOT have "Auto-Flagged" badge
- ✅ Shows reporter's email
- ✅ Has "Remove Comment" and "Reject Report" buttons
- ✅ Approve action deletes comment entirely (not just status change)

## Database Verification

After testing, verify in InstantDB:

### Comments Table
```
- Check that flagged comments have status: "pending_review"
- Check that published comments have status: "published"
- Check that removed comments have status: "removed"
```

### Reports Table
```
- Check auto-reports have type: "auto_flag"
- Check user reports have type: "user_report"
- Check violations array contains correct violation types
```

## Common Issues

### Issue: Comments not being flagged
**Solution:** Check that moderation is enabled in config:
- `MODERATION_ENABLED` should not be "false"
- `PROFANITY_FILTER_ENABLED` should not be "false"

### Issue: Auto-reports not appearing in admin
**Solution:** Verify InstantDB schema includes new fields

### Issue: Comments still blocked instead of flagged
**Solution:** Clear cache and restart dev server

## Success Criteria
- ✅ All profanity comments are auto-flagged
- ✅ Auto-flagged comments are hidden from public
- ✅ Admin can see and moderate auto-flagged comments
- ✅ Admin can publish or remove flagged comments
- ✅ Clean comments work normally
- ✅ User reports still work as before

