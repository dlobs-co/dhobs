"use client"

import { useEffect, useRef, useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { WelcomeSection } from "@/components/dashboard/welcome-section"
import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { MediaSection } from "@/components/dashboard/media-section"
import { MatrixSection } from "@/components/dashboard/matrix-section"
import { VaultwardenSection } from "@/components/dashboard/vaultwarden-section"
import { NextcloudSection } from "@/components/dashboard/nextcloud-section"
import { KiwixSection } from "@/components/dashboard/kiwix-section"
import { StorageSection } from "@/components/dashboard/storage-section"
import { CodeServerSection } from "@/components/dashboard/codeserver-section"
import { TerminalPanel } from "@/components/dashboard/terminal-panel"
import { WindowWrapper } from "@/components/dashboard/window-wrapper"
import { useTheme } from "@/components/theme-provider"
import { Play, MessageSquare, Key, Cloud, Code, HardDrive, Book, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface OpenApp {
  id: string
  label: string
  icon: LucideIcon
  isMinimized: boolean
}

const appMeta: Record<string, { label: string, icon: LucideIcon }> = {
  media: { label: "Jellyfin", icon: Play },
  jellyfin: { label: "Jellyfin", icon: Play },
  matrix: { label: "Matrix", icon: MessageSquare },
  chat: { label: "Matrix", icon: MessageSquare },
  vaultwarden: { label: "Vaultwarden", icon: Key },
  passwords: { label: "Vaultwarden", icon: Key },
  nextcloud: { label: "Nextcloud", icon: Cloud },
  cloud: { label: "Nextcloud", icon: Cloud },
  codespace: { label: "Code Server", icon: Code },
  codeserver: { label: "Code Server", icon: Code },
  storage: { label: "Storage", icon: HardDrive },
  kiwix: { label: "Kiwix", icon: Book },
}

export default function HomePage() {
  const { colorTheme } = useTheme()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState("home")
  const [openApps, setOpenApps] = useState<OpenApp[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || currentSection !== "home") return
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      // Calculate progress based on first screen scroll
      const progress = Math.min(scrollTop / windowHeight, 1)
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [currentSection])

  const bgColor = mounted ? colorTheme.background : "#0a0a0a"
  const accentColor = mounted ? colorTheme.accent : "#d4e157"

  const handleNavigate = (section: string) => {
    if (section === "home" || section === "metrics") {
      setCurrentSection(section)
      if (section === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
      return
    }

    // Check if app is already open
    const existingApp = openApps.find(app => app.id === section)
    if (existingApp) {
      setOpenApps(openApps.map(app => 
        app.id === section ? { ...app, isMinimized: false } : app
      ))
      setCurrentSection(section)
    } else if (appMeta[section]) {
      // Open new app
      const newApp = {
        id: section,
        ...appMeta[section],
        isMinimized: false
      }
      setOpenApps([...openApps, newApp])
      setCurrentSection(section)
    }
  }

  const closeApp = (id: string) => {
    setOpenApps(prev => prev.filter(app => app.id !== id))
    if (currentSection === id) {
      setCurrentSection("home")
    }
  }

  const minimizeApp = (id: string) => {
    setOpenApps(prev => prev.map(app => 
      app.id === id ? { ...app, isMinimized: true } : app
    ))
    setCurrentSection("home")
  }

  return (
    <div 
      ref={containerRef}
      className={currentSection === "home" ? "relative min-h-[200vh]" : "relative h-screen overflow-hidden"}
      style={{ backgroundColor: bgColor }}
    >
      {/* Aurora Glow Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute rounded-full blur-[120px] opacity-30"
          style={{
            width: "60%",
            height: "60%",
            background: `radial-gradient(ellipse, ${accentColor}40, transparent 70%)`,
            left: "-15%",
            top: "-15%",
            animation: "aurora 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full blur-[120px] opacity-20"
          style={{
            width: "50%",
            height: "50%",
            background: "radial-gradient(ellipse, rgba(34, 211, 238, 0.3), transparent 70%)",
            right: "-10%",
            bottom: "10%",
            animation: "aurora 25s ease-in-out infinite",
            animationDelay: "-12s",
          }}
        />
        <div
          className="absolute rounded-full blur-[100px] opacity-15"
          style={{
            width: "40%",
            height: "40%",
            background: `radial-gradient(ellipse, ${accentColor}30, transparent 70%)`,
            left: "40%",
            bottom: "-10%",
            animation: "aurora 25s ease-in-out infinite",
            animationDelay: "-6s",
          }}
        />
      </div>

      {/* Sidebar (Dock) */}
      <Sidebar
        activeSection={currentSection}
        onNavigate={handleNavigate}
        terminalOpen={terminalOpen}
        onToggleTerminal={() => setTerminalOpen(prev => !prev)}
        openApps={openApps}
      />

      <main className="relative z-10 h-full w-full">
        {/* HOME VIEW (Static / Scrollable) */}
        <div className={cn(
          "h-full w-full transition-all duration-500",
          (currentSection === "home" || currentSection === "metrics") ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute inset-0"
        )}>
          {currentSection === "home" ? (
            <>
              <div
                style={{
                  opacity: 1 - scrollProgress * 1.5,
                  transform: `translateY(${-scrollProgress * 50}px)`,
                  transition: "opacity 0.1s ease-out, transform 0.1s ease-out",
                }}
              >
                <WelcomeSection onNavigate={handleNavigate} />
              </div>
              <div
                style={{
                  opacity: scrollProgress > 0.3 ? (scrollProgress - 0.3) / 0.7 : 0,
                  transform: `translateY(${(1 - scrollProgress) * 30}px)`,
                  transition: "opacity 0.1s ease-out, transform 0.1s ease-out",
                }}
              >
                <DashboardSection />
              </div>
            </>
          ) : (
            <DashboardSection />
          )}
        </div>

        {/* APP WINDOWS */}
        {openApps.map((app) => (
          <WindowWrapper
            key={app.id}
            title={app.label}
            isActive={currentSection === app.id}
            onClose={() => closeApp(app.id)}
            onMinimize={() => minimizeApp(app.id)}
            onClick={() => setCurrentSection(app.id)}
          >
            <div className="w-full h-full bg-black/20">
              {(app.id === "media" || app.id === "jellyfin") && <MediaSection isWindow />}
              {(app.id === "matrix" || app.id === "chat") && <MatrixSection isWindow />}
              {(app.id === "vaultwarden" || app.id === "passwords") && <VaultwardenSection isWindow />}
              {(app.id === "nextcloud" || app.id === "cloud") && <NextcloudSection isWindow />}
              {app.id === "kiwix" && <KiwixSection isWindow />}
              {app.id === "storage" && <StorageSection isWindow />}
              {(app.id === "codeserver" || app.id === "codespace") && <CodeServerSection isWindow />}
            </div>
          </WindowWrapper>
        ))}
      </main>

      {/* Terminal Panel */}
      <TerminalPanel open={terminalOpen} onClose={() => setTerminalOpen(false)} />

      {/* Global Styles for Aurora Animation */}
      <style jsx global>{`
        @keyframes aurora {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          25% {
            transform: translate(3%, 3%) rotate(1deg) scale(1.02);
          }
          50% {
            transform: translate(-2%, 5%) rotate(-0.5deg) scale(0.98);
          }
          75% {
            transform: translate(5%, -3%) rotate(1.5deg) scale(1.01);
          }
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
