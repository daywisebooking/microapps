/**
 * Debug script to investigate comment counter issue
 */

import { adminDb } from "../src/lib/instant"

async function debugComments() {
  if (!adminDb) {
    console.error("❌ Admin DB not available")
    process.exit(1)
  }

  console.log("🔍 Debugging comment counter issue...\n")

  // Get the Daywise Booking app
  const appsResult = await adminDb.query({
    apps: {}
  })

  console.log(`📱 Total apps: ${appsResult?.apps?.length || 0}`)
  
  const daywiseApp = appsResult?.apps?.find((app: any) => 
    app.slug === "daywise-booking" || app.name?.includes("Daywise")
  )

  if (daywiseApp) {
    console.log(`\n✅ Found Daywise Booking app:`)
    console.log(`   ID: ${daywiseApp.id}`)
    console.log(`   Name: ${daywiseApp.name}`)
    console.log(`   Slug: ${daywiseApp.slug}`)
  } else {
    console.log("\n❌ Could not find Daywise Booking app")
    console.log("\nAll apps:")
    appsResult?.apps?.forEach((app: any, i: number) => {
      console.log(`  ${i + 1}. ${app.name} (${app.slug}) - ID: ${app.id}`)
    })
  }

  // Get ALL comments
  const commentsResult = await adminDb.query({
    comments: {}
  })

  const allComments = commentsResult?.comments || []
  console.log(`\n💬 Total comments in database: ${allComments.length}`)

  if (daywiseApp && allComments.length > 0) {
    const daywiseComments = allComments.filter((c: any) => c.appId === daywiseApp.id)
    console.log(`   Comments for Daywise Booking: ${daywiseComments.length}`)
    
    if (daywiseComments.length > 0) {
      console.log(`\n📝 Comment details:`)
      daywiseComments.forEach((comment: any, i: number) => {
        console.log(`\n   ${i + 1}. ID: ${comment.id}`)
        console.log(`      Parent ID: ${comment.parentId || 'null (root comment)'}`)
        console.log(`      Status: ${comment.status || 'published'}`)
        console.log(`      Content: "${comment.content.substring(0, 50)}..."`)
        console.log(`      Created: ${new Date(comment.createdAt).toLocaleString()}`)
      })

      // Check for orphans
      const commentIds = new Set(daywiseComments.map((c: any) => c.id))
      const orphans = daywiseComments.filter((c: any) => 
        c.parentId && !commentIds.has(c.parentId)
      )

      if (orphans.length > 0) {
        console.log(`\n⚠️  Found ${orphans.length} orphaned comment(s)`)
        orphans.forEach((comment: any) => {
          console.log(`   - ${comment.id} (parent ${comment.parentId} is missing)`)
        })
      }
    }
  }

  // Show comments by app
  if (allComments.length > 0) {
    const byApp = allComments.reduce((acc: any, comment: any) => {
      acc[comment.appId] = (acc[comment.appId] || 0) + 1
      return acc
    }, {})

    console.log(`\n📊 Comments by app:`)
    Object.entries(byApp).forEach(([appId, count]) => {
      const app = appsResult?.apps?.find((a: any) => a.id === appId)
      console.log(`   ${app?.name || 'Unknown app'} (${appId}): ${count} comment(s)`)
    })
  }
}

debugComments()
  .then(() => {
    console.log("\n✅ Debug complete")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error:", error)
    process.exit(1)
  })

