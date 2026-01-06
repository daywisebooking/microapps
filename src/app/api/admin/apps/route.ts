import { NextRequest, NextResponse } from "next/server"
import { createAppSchema, updateAppSchema, deleteAppSchema } from "@/lib/validations"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { createApp, updateApp, deleteApp } from "@/lib/mutations"
import { verifyAdmin } from "@/lib/admin"

// GET - List all apps (admin view)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Note: InstantDB queries work client-side via hooks
    // For server-side, return empty array - client should use useApps hook
    return NextResponse.json(
      { apps: [] },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin apps GET error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// POST - Create app
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(writeRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Validate input
    const body = await request.json()
    const validationResult = createAppSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const result = await createApp(validationResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create app" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, app: result.app },
      { status: 201 }
    )
  } catch (error) {
    console.error("Admin apps POST error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// PUT - Update app
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(writeRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Validate input
    const body = await request.json()
    const validationResult = updateAppSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validationResult.data
    const result = await updateApp(id, updateData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update app" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin apps PUT error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// DELETE - Delete app
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(writeRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Validate input
    const body = await request.json()
    const validationResult = deleteAppSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const result = await deleteApp(validationResult.data.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete app" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin apps DELETE error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

