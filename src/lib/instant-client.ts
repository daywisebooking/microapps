"use client"

// Client-side InstantDB initialization
// This file should ONLY be imported in client components

import { init } from "@instantdb/react"

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID

if (!APP_ID && process.env.NODE_ENV !== 'production') {
  console.warn("NEXT_PUBLIC_INSTANT_APP_ID is not set. InstantDB features will be disabled.")
}

// Initialize InstantDB client (for React hooks)
// Note: InstantDB is schema-less, so we don't pass a schema here
// The schema is defined in the InstantDB dashboard
// Disable devtools in production for security
export const db = APP_ID ? init({ 
  appId: APP_ID,
  devtool: process.env.NODE_ENV !== 'production'
}) : null

