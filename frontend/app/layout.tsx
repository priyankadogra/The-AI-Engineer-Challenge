import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Engineer Challenge - LLM Chat App',
  description: 'A powerful LLM-powered chat application built with Next.js and FastAPI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
