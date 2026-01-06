import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { NavBar } from "@/components/NavBar"
import { Footer } from "@/components/Footer"
import { Providers } from "./providers"
import { DevToolsController } from "@/components/DevToolsController"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "microapps",
  description: "Discover and vote on micro apps for solo and small service businesses",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "microapps",
    description: "Discover and vote on micro apps for solo and small service businesses",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "microapps",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "microapps",
    description: "Discover and vote on micro apps for solo and small service businesses",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <DevToolsController />
          <NavBar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}


