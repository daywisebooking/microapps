"use client"

import { useState } from "react"
import Link from "next/link"
import { useUser, logout } from "@/lib/auth"
import { useAuthModal } from "@/contexts/AuthModalContext"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { FullLogo, IconLogo } from "@/components/Logo"

export function NavBar() {
  const { user, isLoading } = useUser()
  const { openLoginModal } = useAuthModal()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              {/* Show full logo on mobile and up by default */}
              <span className="sm:hidden">
                <IconLogo height={32} />
              </span>
              <span className="hidden sm:flex">
                <FullLogo height={32} />
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link href="/browse" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Browse
            </Link>
            <Link href="/favorites" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Favorites
            </Link>
            {isLoading ? (
              <span className="text-sm text-gray-500">Loading...</span>
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">{(user as any).email || "User"}</span>
                {(user as any).type === "admin" && (
                  <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    Admin
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={openLoginModal}>
                Login
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#282828]"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              href="/browse"
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Browse
            </Link>
            <Link
              href="/favorites"
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Favorites
            </Link>
            {isLoading ? (
              <span className="block px-3 py-2 text-base text-gray-500">Loading...</span>
            ) : user ? (
              <>
                <div className="px-3 py-2 text-base text-gray-700">
                  {(user as any).email || "User"}
                </div>
                {(user as any).type === "admin" && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout()
                    closeMobileMenu()
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  openLoginModal()
                  closeMobileMenu()
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

