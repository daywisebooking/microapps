"use client"

import { AppHeader } from "./AppHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { CommentsList } from "./CommentThread"
import { CommentForm } from "./CommentForm"
import { useAppBySlug } from "@/lib/hooks/useApps"
import { useCommentsByApp } from "@/lib/hooks/useComments"

interface AppDetailProps {
  slug: string
}

export function AppDetail({ slug }: AppDetailProps) {
  const { data: app, isLoading: appLoading } = useAppBySlug(slug)
  const { data: comments, isLoading: commentsLoading } = useCommentsByApp(app?.id || "")

  const isLoading = appLoading || (app && commentsLoading)

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (!app) {
    return <div className="text-center py-12 text-gray-500">App not found.</div>
  }

  return (
    <>
      <AppHeader app={app} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comments">
            Comments ({comments?.filter(c => !c.status || c.status === "published")?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">{app.description}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Details
              </h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="mt-1">
                    <a
                      href={app.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#282828] hover:text-[#1a1a1a]"
                    >
                      {app.websiteUrl}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <CommentForm appId={app.id} />
          <CommentsList comments={comments as any} />
        </TabsContent>
      </Tabs>
    </>
  )
}
