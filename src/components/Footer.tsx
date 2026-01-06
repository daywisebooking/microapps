"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { termsOfService } from "@/lib/legal/terms-of-service"
import { privacyPolicy } from "@/lib/legal/privacy-policy"

export function Footer() {
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  return (
    <>
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-4 text-xs text-gray-500">
            <button
              onClick={() => setShowTerms(true)}
              className="hover:text-gray-700 transition-colors underline-offset-2 hover:underline"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setShowPrivacy(true)}
              className="hover:text-gray-700 transition-colors underline-offset-2 hover:underline"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Terms of Service Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4 flex-1">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {termsOfService}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4 flex-1">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {privacyPolicy}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}




