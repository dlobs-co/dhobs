"use client"

import { KiwixSection } from "@/components/dashboard/kiwix-section"
import { useTheme } from "@/components/theme-provider"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function KiwixPage() {
  const { colorTheme } = useTheme()

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: colorTheme.background }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
        style={{ backgroundColor: colorTheme.card, borderColor: colorTheme.border }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
          style={{ color: colorTheme.accent }}
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="h-4 w-px" style={{ backgroundColor: colorTheme.border }} />
        <span className="text-sm font-semibold" style={{ color: colorTheme.foreground }}>
          Kiwix Offline Library
        </span>
      </div>

      {/* KiwixSection takes the rest */}
      <div className="flex-1 min-h-0">
        <KiwixSection />
      </div>
    </div>
  )
}
