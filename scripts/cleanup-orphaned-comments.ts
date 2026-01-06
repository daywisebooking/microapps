/**
 * Cleanup script to remove orphaned comments
 * Orphaned comments are those whose parentId points to a non-existent comment
 */

import { adminDb } from "../src/lib/instant"

async function cleanupOrphanedComments() {
  if (!adminDb) {
    console.error("❌ Admin DB not available. Make sure INSTANT_ADMIN_TOKEN is set in .env.local")
    process.exit(1)
  }

  console.log("🔍 Fetching all comments...")

  // Get all comments
  const result = await adminDb.query({
    comments: {}
  })

  const allComments = result?.comments || []
  console.log(`📊 Total comments in database: ${allComments.length}`)

  // Find orphaned comments (comments with parentId that doesn't exist)
  const commentIds = new Set(allComments.map((c: any) => c.id))
  const orphanedComments = allComments.filter((comment: any) => {
    // If comment has a parentId, check if parent exists
    if (comment.parentId) {
      return !commentIds.has(comment.parentId)
    }
    return false
  })

  if (orphanedComments.length === 0) {
    console.log("✅ No orphaned comments found! Database is clean.")
    return
  }

  console.log(`\n🗑️  Found ${orphanedComments.length} orphaned comment(s):`)
  orphanedComments.forEach((comment: any) => {
    console.log(`  - ID: ${comment.id}`)
    console.log(`    Parent ID: ${comment.parentId} (missing)`)
    console.log(`    Content: "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"`)
    console.log(`    Created: ${new Date(comment.createdAt).toLocaleString()}`)
    console.log()
  })

  // Delete orphaned comments
  const deleteTransactions = orphanedComments.map((comment: any) => 
    adminDb.tx.comments[comment.id].delete()
  )

  console.log(`🧹 Deleting ${orphanedComments.length} orphaned comment(s)...`)
  await adminDb.transact(deleteTransactions)

  console.log("✅ Cleanup complete! Orphaned comments have been removed.")
  console.log(`📉 Removed ${orphanedComments.length} orphaned comment(s)`)
}

// Run the cleanup
cleanupOrphanedComments()
  .then(() => {
    console.log("\n🎉 Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error during cleanup:", error)
    process.exit(1)
  })

