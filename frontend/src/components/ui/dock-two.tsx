import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface DockProps {
  className?: string
  items: {
    icon: LucideIcon
    label: string
    onClick?: () => void
    isActive?: boolean
  }[]
}

interface DockIconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
  isActive?: boolean
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, className, isActive }, ref) => {
    const isStartSession = label === "Start session"
    const isEndCall = label === "End call"
    const isMicButton = label.includes("Mute") || label.includes("mute")
    const isVideoButton = label.includes("camera")
    const isCaptionsButton = label.includes("captions")
    
    // Determine if button should be red (off state for mic/video, or end call)
    const isOff = (isMicButton || isVideoButton) && !isActive
    
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative group p-3 rounded-full transition-all",
          isStartSession
            ? "bg-green-600 hover:bg-green-700 text-white"
            : isEndCall 
            ? "bg-red-600 hover:bg-red-700 text-white"
            : isOff
            ? "bg-red-600 hover:bg-red-700 text-white"
            : (isCaptionsButton && isActive)
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700",
          className
        )}
      >
        <Icon className="w-5 h-5" />
        <span className={cn(
          "absolute -top-10 left-1/2 -translate-x-1/2",
          "px-3 py-1.5 rounded-md text-xs font-medium",
          "bg-gray-900 text-white border border-white/10",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity whitespace-nowrap pointer-events-none"
        )}>
          {label}
        </span>
      </motion.button>
    )
  }
)
DockIconButton.displayName = "DockIconButton"

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center justify-center", className)}>
        <div
          className={cn(
            "flex items-center gap-2"
          )}
        >
          {items.map((item, index) => (
            <React.Fragment key={item.label}>
              <DockIconButton {...item} />
              {/* Add divider before End Call */}
              {index === 3 && (
                <div className="h-8 w-px bg-gray-300/40 mx-1" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }
)
Dock.displayName = "Dock"

export { Dock }