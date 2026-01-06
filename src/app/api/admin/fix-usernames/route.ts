import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/instant"
import { generateRandomUsername } from "@/lib/utils"

// Admin endpoint to fix existing users without usernames
// TODO: Re-enable admin check after initial migration
export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled admin check for initial migration
    // const userId = request.headers.get("x-user-id")
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Get all users without usernames
    const allUsers = await (adminDb as any).query({
      $users: {}
    })

    const usersWithoutUsernames = allUsers?.$users?.filter((u: any) => !u.username) || []
    
    console.log(`Found ${usersWithoutUsernames.length} users without usernames`)

    // Generate usernames for all users without one
    const transactions = []
    const updates: { email: string; username: string }[] = []
    
    for (const user of usersWithoutUsernames) {
      const username = generateRandomUsername()
      transactions.push((adminDb as any).tx.$users[user.id].update({ username }))
      updates.push({ email: user.email, username })
      console.log(`Generated username for ${user.email}: ${username}`)
    }

    // Execute all updates
    if (transactions.length > 0) {
      await (adminDb as any).transact(transactions)
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      users: updates
    })
  } catch (error: any) {
    console.error("Fix usernames error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fix usernames" },
      { status: 500 }
    )
  }
}

