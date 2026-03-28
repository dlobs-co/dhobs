"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTheme, colorThemes, type ColorTheme } from "@/components/theme-provider"
import {
  LayoutGrid,
  Settings,
  Palette,
  X,
  TerminalSquare,
  Activity,
  type LucideIcon,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type OpenApp } from "@/app/page"

interface SidebarProps {
  className?: string
  activeSection?: string
  onNavigate?: (section: string) => void
  terminalOpen?: boolean
  onToggleTerminal?: () => void
  openApps?: OpenApp[]
}

export function Sidebar({ 
  className, 
  activeSection = "home", 
  onNavigate, 
  terminalOpen, 
  onToggleTerminal,
  openApps = [] 
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const { colorTheme, setColorTheme } = useTheme()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-4 top-1/2 z-50 flex -translate-y-1/2 flex-col",
          "rounded-2xl border border-white/[0.08] bg-black/40 py-3",
          "backdrop-blur-2xl shadow-2xl shadow-black/20",
          className
        )}
      >
        {/* Logo - NO DOT HERE */}
        <div className="flex justify-center px-3 pb-3">
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm transition-transform active:scale-95"
            style={{ 
              backgroundColor: colorTheme.accent,
              color: colorTheme.accentForeground 
            }}
          >
            S
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-white/[0.06]" />

        {/* Main Navigation (Home & Metrics) */}
        <nav className="flex flex-col items-center gap-1 px-2 py-3">
          <NavButton 
            icon={LayoutGrid}
            label="Home"
            active={activeSection === "home" || activeSection === "dashboard"}
            onClick={() => onNavigate?.("home")}
            accentColor={colorTheme.accent}
            isApp={false} 
          />
          <NavButton 
            icon={Activity}
            label="Metrics"
            active={activeSection === "metrics"}
            onClick={() => onNavigate?.("metrics")}
            accentColor={colorTheme.accent}
            isApp={false}
          />
        </nav>

        {/* Dynamic Dock (Open Apps) */}
        {openApps.length > 0 && (
          <>
            <div className="mx-3 h-px bg-white/[0.06] mb-2" />
            <nav className="flex flex-1 flex-col items-center gap-1 px-2 pb-3">
              {openApps.map((app) => (
                <NavButton 
                  key={app.id}
                  icon={app.icon}
                  label={app.label}
                  active={activeSection === app.id}
                  onClick={() => onNavigate?.(app.id)}
                  accentColor={colorTheme.accent}
                  isApp={true}
                  isMinimized={app.isMinimized}
                />
              ))}
            </nav>
          </>
        )}

        {/* Divider */}
        <div className="mx-3 h-px bg-white/[0.06]" />

        {/* Terminal + Settings */}
        <div className="flex flex-col items-center gap-1 px-2 pt-3 pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleTerminal}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  terminalOpen
                    ? "text-white shadow-lg"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                )}
                style={terminalOpen ? {
                  backgroundColor: colorTheme.accent,
                  color: colorTheme.accentForeground,
                } : undefined}
              >
                <TerminalSquare className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              <p>Terminal</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  showSettings 
                    ? "bg-white/10 text-white" 
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                )}
              >
                <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Settings Popup */}
        {showSettings && (
          <div 
            className={cn(
              "absolute left-full top-1/2 ml-3 -translate-y-1/2",
              "rounded-2xl border border-white/[0.08] bg-black/60 p-3",
              "backdrop-blur-2xl shadow-2xl shadow-black/40",
              "animate-in slide-in-from-left-2 fade-in duration-200"
            )}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Settings</span>
              <button onClick={() => setShowSettings(false)} className="ml-auto text-white/40 hover:text-white/80 transition-colors"><X className="h-3.5 w-3.5" /></button>
            </div>
            <button onClick={() => setShowThemes(!showThemes)} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
              <Palette className="h-4 w-4" />
              <span className="text-sm">Color themes</span>
            </button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}

function NavButton({ 
  icon: Icon, 
  label, 
  active, 
  onClick,
  accentColor,
  isApp,
  isMinimized
}: { 
  icon: LucideIcon | React.ElementType
  label: string
  active?: boolean
  onClick?: () => void
  accentColor: string
  isApp?: boolean
  isMinimized?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={onClick} className="relative group outline-none">
          <div
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
              active
                ? "text-white shadow-lg"
                : "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
              isMinimized && !active && "opacity-30 grayscale"
            )}
            style={active ? { 
              backgroundColor: accentColor,
              color: '#0a0a0a'
            } : undefined}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </div>
          
          {/* Active Dot - Only for running Apps, not for core navigation */}
          {isApp && (
            <div 
              className={cn(
                "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white transition-all duration-500",
                active ? "opacity-100 scale-100" : "opacity-0 scale-0 group-hover:opacity-40 group-hover:scale-100"
              )}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
