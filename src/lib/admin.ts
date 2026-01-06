// Admin helper functions
import { adminDb } from "./instant"

// Helper to check if InstantDB admin is actually configured
// Checks environment variables rather than proxy existence
function isAdminDbConfigured(): boolean {
  const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID
  const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN
  return !!(APP_ID && ADMIN_TOKEN)
}

// Helper to verify admin access using InstantDB admin client
export async function verifyAdmin(
  userId: string | null,
  userType?: string | null
): Promise<{ isAdmin: boolean; error?: string }> {
  // Step 1: Check if userId exists
  if (!userId) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[verifyAdmin] Denied: No userId provided")
    }
    return { isAdmin: false, error: "Unauthorized: No user ID provided" }
  }

  const isDevMode = process.env.NODE_ENV === "development"
  const adminDbConfigured = isAdminDbConfigured()

  if (process.env.NODE_ENV === 'development') {
    console.log("[verifyAdmin] Checking admin access:", {
      userId,
      userType,
      adminDbConfigured,
      isDevMode,
    })
  }

  // Step 2: Check if adminDb is actually configured (env vars exist)
  if (!adminDbConfigured) {
    // Step 3: If not configured → trust userType header in dev mode
    if (isDevMode && userType === "admin") {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          "[verifyAdmin] Granted: Admin access via userType header (dev mode - InstantDB admin not configured)"
        )
      }
      return { isAdmin: true }
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(
        "[verifyAdmin] Denied: InstantDB admin not configured and userType is not 'admin'"
      )
    }
    return {
      isAdmin: false,
      error: "InstantDB admin not configured. Please set NEXT_PUBLIC_INSTANT_APP_ID and INSTANT_ADMIN_TOKEN",
    }
  }

  // Step 4: If configured → query database
  try {
    // Query the user to check if they're an admin
    const result = await adminDb.query({
      $users: {
        $: {
          where: {
            id: userId,
            type: "admin",
          },
        },
      },
    })

    const userFoundInDb = result?.$users && result.$users.length > 0

    // If query succeeds and user found → grant/deny based on DB result
    if (userFoundInDb) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[verifyAdmin] Granted: User ${userId} found in database with admin type`
        )
      }
      return { isAdmin: true }
    }

    // If query succeeds but user NOT found AND userType === "admin" → grant in dev mode
    if (!userFoundInDb && userType === "admin" && isDevMode) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[verifyAdmin] Granted: User ${userId} not found in database but userType is 'admin' (dev mode)`
        )
      }
      return { isAdmin: true }
    }

    // User not found in DB and no admin userType header
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[verifyAdmin] Denied: User ${userId} not found in database with admin type`
      )
    }
    return {
      isAdmin: false,
      error: "User not found in database or does not have admin privileges",
    }
  } catch (error: any) {
    console.error("[verifyAdmin] Database query error:", error)

    // If query fails → fall back to userType header in dev mode
    if (userType === "admin" && isDevMode) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          "[verifyAdmin] Granted: Admin access via userType header (dev mode - database query failed)"
        )
      }
      return { isAdmin: true }
    }

    return {
      isAdmin: false,
      error: `Failed to verify admin access: ${error.message || "Unknown error"}`,
    }
  }
}

