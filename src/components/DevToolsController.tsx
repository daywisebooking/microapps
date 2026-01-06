"use client"

import { useEffect } from "react"
import { useUser } from "@/lib/auth"

/**
 * DevToolsController - Controls visibility of development tools
 * 
 * This component hides both InstantDB devtools and Next.js Turbopack devtools from non-admin users.
 * In production, devtools are completely disabled.
 * In development, this component conditionally hides them based on user role.
 */
export function DevToolsController() {
  const { user, isLoading } = useUser()

  useEffect(() => {
    // Only run in development mode (production has devtools disabled at init)
    if (process.env.NODE_ENV === 'production') {
      return
    }

    // Don't hide while loading - wait until we know the user's status
    if (isLoading) {
      return
    }

    // Check if user is admin
    const isAdmin = user && (user as any).type === "admin"

    // Create or update style element to hide devtools for non-admins
    const styleId = "devtools-visibility-controller"
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

    if (!styleEl) {
      styleEl = document.createElement("style")
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }

    if (!isAdmin) {
      // Hide both Next.js Turbopack devtools and InstantDB devtools
      styleEl.textContent = `
        /* === NEXT.JS TURBOPACK DEVTOOLS === */
        nextjs-portal,
        [data-nextjs-dialog],
        [data-nextjs-dialog-overlay],
        [data-nextjs-toast],
        [id^="__nextjs"],
        #nextjs-portal,
        .__nextjs_original-stack-frame,
        button[aria-label*="Next"],
        button[aria-label*="Turbopack"],
        
        /* === INSTANTDB DEVTOOLS === */
        [class*="instant"][class*="devtool"],
        [class*="instant-devtool"],
        [data-instant-devtool],
        [id*="instant-devtool"],
        [class*="instant"][class*="modal"],
        [data-instant-modal],
        #instant-ui-root,
        [data-instant-ui],
        iframe[src*="instant"],
        div[class*="_instant"],
        button[class*="_instant"],
        [data-testid*="instant"],
        [aria-label*="Instant"],
        instant-devtools,
        instant-widget,
        
        /* Generic: Hide fixed position buttons/divs in corners */
        body > div[style*="position: fixed"][style*="bottom"],
        body > button[style*="position: fixed"][style*="bottom"],
        [style*="z-index"][style*="position: fixed"][style*="bottom"],
        [style*="border-radius: 50%"][style*="position: fixed"],
        [style*="border-radius:50%"][style*="position: fixed"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `

      // JavaScript-based hiding as fallback
      // This catches dynamically added elements
      const hideDevTools = () => {
        // Hide Next.js Turbopack devtools
        const nextjsSelectors = [
          'nextjs-portal',
          '[data-nextjs-dialog]',
          '[data-nextjs-dialog-overlay]',
          '[id^="__nextjs"]',
          '#nextjs-portal'
        ]
        
        nextjsSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector)
            elements.forEach(el => {
              const element = el as HTMLElement
              element.style.display = 'none'
              element.style.visibility = 'hidden'
              element.style.opacity = '0'
              element.style.pointerEvents = 'none'
            })
          } catch (e) {
            // Ignore errors
          }
        })

        // Find all fixed position elements in bottom corners
        const allElements = document.querySelectorAll('*')
        allElements.forEach(el => {
          const element = el as HTMLElement
          const style = window.getComputedStyle(element)
          
          // Check if it's a fixed position element
          if (style.position === 'fixed') {
            const rect = element.getBoundingClientRect()
            const isBottomLeft = rect.bottom > window.innerHeight - 200 && rect.left < 200
            const isBottomRight = rect.bottom > window.innerHeight - 200 && rect.right > window.innerWidth - 200
            
            // If it's in bottom corner and looks like a button/widget
            if ((isBottomLeft || isBottomRight) && 
                (rect.width < 100 && rect.height < 100) &&
                element.tagName !== 'FOOTER' &&
                !element.closest('nav') &&
                !element.closest('header')) {
              const text = element.textContent?.toLowerCase() || ''
              const hasDevToolIndicators = 
                text.includes('instant') ||
                text.includes('next') ||
                text.includes('turbopack') ||
                text.includes('route') ||
                element.className.toLowerCase().includes('instant') ||
                element.id.toLowerCase().includes('instant') ||
                element.id.toLowerCase().includes('nextjs') ||
                text === 'n' ||
                text === ''
              
              if (hasDevToolIndicators || text.length < 3) {
                element.style.display = 'none'
                element.style.visibility = 'hidden'
                element.style.opacity = '0'
                element.style.pointerEvents = 'none'
              }
            }
          }
        })

        // Hide InstantDB elements
        const instantSelectors = [
          '[class*="instant"]',
          '[id*="instant"]',
          '[data-instant-ui]',
          'iframe[src*="instant"]',
          '[aria-label*="Instant"]',
        ]

        instantSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector)
            elements.forEach(el => {
              const element = el as HTMLElement
              const style = window.getComputedStyle(element)
              
              if (style.position === 'fixed' || element.tagName === 'IFRAME') {
                element.style.display = 'none'
                element.style.visibility = 'hidden'
                element.style.opacity = '0'
                element.style.pointerEvents = 'none'
              }
            })
          } catch (e) {
            // Ignore errors
          }
        })
      }

      // Run immediately
      hideDevTools()

      // Set up a mutation observer to catch dynamically added elements
      const observer = new MutationObserver(() => {
        hideDevTools()
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })

      // Also check periodically for the first few seconds (catch late-loading elements)
      const timeouts = [50, 100, 200, 500, 1000, 2000, 3000, 5000].map(delay =>
        setTimeout(hideDevTools, delay)
      )

      // Keep checking periodically as long as component is mounted
      const interval = setInterval(hideDevTools, 1000)

      return () => {
        observer.disconnect()
        timeouts.forEach(clearTimeout)
        clearInterval(interval)
      }
    } else {
      // Admin user - clear any hiding styles
      styleEl.textContent = ""
    }
  }, [user, isLoading])

  // This component doesn't render anything visible
  return null
}

