"use client"

import { use } from "react"
import { AppDetail } from "@/components/AppDetail"

interface AppDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function AppDetailPage({ params }: AppDetailPageProps) {
  const { slug } = use(params)
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <AppDetail slug={slug} />
    </div>
  )
}

