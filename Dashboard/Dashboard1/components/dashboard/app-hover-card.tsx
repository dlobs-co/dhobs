"use client"

import { useState } from "react"
import { useTheme } from "@/components/theme-provider"
import type { HoverCard } from "@/lib/landing-data"

interface AppHoverCardProps {
  card: HoverCard
  name: string
  children: React.ReactNode
}

export function AppHoverCard({ card, name, children }: AppHoverCardProps) {
  const { colorTheme } = useTheme()
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div
          className="absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-[200px] max-w-[260px] rounded-xl border bg-black/80 backdrop-blur-xl p-3 pointer-events-none"
          style={{ borderColor: `${colorTheme.accent}30` }}
        >
          {/* Name + accent dot */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: colorTheme.accent }}
            />
            <span
              className="text-xs font-bold truncate"
              style={{ color: colorTheme.foreground }}
            >
              {name}
            </span>
          </div>

          {/* Tagline */}
          <p
            className="text-[11px] leading-relaxed mb-2"
            style={{ color: `${colorTheme.foreground}99` }}
          >
            {card.tagline}
          </p>

          {/* Divider */}
          <div className="h-px mb-2" style={{ backgroundColor: `${colorTheme.accent}20` }} />

          {/* Flow */}
          <div className="flex items-center gap-1 flex-wrap">
            {card.flow.map((step, i) => (
              <span key={step} className="flex items-center gap-1">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: colorTheme.foreground }}
                >
                  {step}
                </span>
                {i < card.flow.length - 1 && (
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: colorTheme.accent }}
                  >
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
