"use client"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { X, Minus, Square } from "lucide-react"

interface WindowWrapperProps {
  children: React.ReactNode
  title: string
  onClose: () => void
  onMinimize: () => void
  isActive?: boolean
  onClick?: () => void
}

export function WindowWrapper({ 
  children, 
  title, 
  onClose, 
  onMinimize, 
  isActive,
  onClick
}: WindowWrapperProps) {
  const { colorTheme } = useTheme()

  return (
    <div 
      onClick={onClick}
      className={cn(
        "absolute inset-0 flex flex-col pl-20 pt-4 pb-4 pr-4 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
        isActive ? "z-20 opacity-100 scale-100 translate-y-0" : "z-10 opacity-0 scale-[0.98] translate-y-4 pointer-events-none"
      )}
    >
      <div 
        className={cn(
          "flex-1 w-full rounded-2xl border overflow-hidden flex flex-col shadow-2xl transition-shadow duration-500",
          "bg-black/40 backdrop-blur-3xl",
          isActive ? "border-white/10 shadow-black/60" : "border-white/5 shadow-transparent"
        )}
      >
        {/* Window Header */}
        <div className="h-11 flex items-center justify-between px-5 bg-white/[0.02] border-b border-white/[0.04] select-none">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onMinimize(); }}
              className="p-2 rounded-lg text-white/20 hover:text-white/80 hover:bg-white/5 transition-all active:scale-90"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
              title="Close"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-black/10">
          {children}
        </div>
      </div>
    </div>
  )
}
