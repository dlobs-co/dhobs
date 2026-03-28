"use client"

import { useTheme } from "@/components/theme-provider"
import {
  Play,
  Code,
  MessageSquare,
  Key,
  Cloud,
} from "lucide-react"

const applications = [
  { name: "Jellyfin", url: "/media/", icon: Play },
  { name: "Nextcloud", url: "/cloud/", icon: Cloud },
  { name: "Code Server", url: "http://localhost:3030", icon: Code },
  { name: "Matrix", url: "/chat/", icon: MessageSquare },
  { name: "Vaultwarden", url: "/passwords/", icon: Key },
]

const bookmarks = {
  Communicate: [
    { name: "Discord", url: "discord.com" },
    { name: "Gmail", url: "gmail.com" },
    { name: "Slack", url: "slack.com" },
  ],
  Cloud: [
    { name: "Box", url: "box.com" },
    { name: "Dropbox", url: "dropbox.com" },
    { name: "Drive", url: "drive.google.com" },
  ],
  Dev: [
    { name: "GitHub", url: "github.com" },
    { name: "Devdocs", url: "devdocs.io" },
    { name: "Stack Overflow", url: "stackoverflow.com" },
  ],
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning!"
  if (hour < 18) return "Good afternoon!"
  return "Good evening!"
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase()
}

interface WelcomeSectionProps {
  onNavigate?: (section: string) => void
}

export function WelcomeSection({ onNavigate }: WelcomeSectionProps) {
  const { colorTheme } = useTheme()

  return (
    <section className="min-h-screen px-8 py-16 pl-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-16">
          <p className="text-sm font-medium tracking-wider text-foreground/50 mb-2">
            {formatDate()}
          </p>
          <h1 
            className="text-5xl md:text-6xl font-bold tracking-tight"
            style={{ color: colorTheme.foreground }}
          >
            {getGreeting()}
          </h1>
        </header>

        {/* Applications */}
        <div className="mb-16">
          <h2 
            className="text-sm font-bold tracking-wider mb-6 uppercase"
            style={{ color: colorTheme.foreground }}
          >
            Applications
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {applications.map((app, index) => {
              const Icon = app.icon
              const sectionId = app.name.toLowerCase().replace(" ", "")
              
              return (
                <button
                  key={app.name}
                  onClick={() => onNavigate?.(sectionId)}
                  className="group flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.04] active:scale-[0.98] text-left w-full border border-white/[0.03] bg-white/[0.01]"
                  style={{
                    animationDelay: `${index * 30}ms`,
                  }}
                >
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: `${colorTheme.accent}15`,
                    }}
                  >
                    <Icon 
                      className="h-5 w-5 transition-colors" 
                      strokeWidth={1.5}
                      style={{ color: colorTheme.accent }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-semibold truncate"
                      style={{ color: colorTheme.foreground }}
                    >
                      {app.name}
                    </p>
                    <p className="text-[10px] text-foreground/40 truncate uppercase tracking-widest">
                      Integrated
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bookmarks */}
        <div>
          <h2 
            className="text-sm font-bold tracking-wider mb-6 uppercase"
            style={{ color: colorTheme.foreground }}
          >
            Bookmarks
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {Object.entries(bookmarks).map(([category, links]) => (
              <div key={category}>
                <h3 
                  className="text-xs font-semibold tracking-wider mb-3 uppercase"
                  style={{ color: colorTheme.accent }}
                >
                  {category}
                </h3>
                <ul className="space-y-2">
                  {links.map((link) => {
                    const href = link.url.startsWith('http') ? link.url : `https://${link.url}`
                    return (
                      <li key={link.name}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                        >
                          {link.name}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-20">
          <div className="flex flex-col items-center gap-2 text-foreground/30">
            <span className="text-xs uppercase tracking-wider">Scroll for dashboard</span>
            <div className="w-px h-8 bg-gradient-to-b from-foreground/30 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
