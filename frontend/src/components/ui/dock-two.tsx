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
  }[]
}

interface DockIconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
}

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, className }, ref) => {
    const isEndCall = label === "End call"
    const isMuted = label === "Unmute"
    const isCameraOff = label === "Turn on camera"
    
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative group p-3 rounded-full transition-all",
          isEndCall 
            ? "bg-red-600 hover:bg-red-700 text-white"
            : (isMuted || isCameraOff)
            ? "bg-red-600 hover:bg-red-700 text-white"
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
        <motion.div
          initial="initial"
          animate="animate"
          variants={floatingAnimation}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full",
            "backdrop-blur-lg border shadow-2xl",
            "bg-white/80 border-gray-200/50",
            "hover:shadow-xl transition-shadow duration-300"
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
        </motion.div>
      </div>
    )
  }
)
Dock.displayName = "Dock"

export { Dock }