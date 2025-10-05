"use client"

import { useTextStream } from "@/components/prompt-kit/response-stream"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

interface FadingTextStreamProps {
  text: string
  speed?: number
  className?: string
  /** Number of text lines visible in the virtual viewport */
  lines?: number
  /** Line height in em used to compute reserved height; keep in sync with content */
  lineHeightEm?: number
  /** Show gradient fades at top and bottom */
  showGradients?: boolean
}

export function FadingTextStream({ text, speed = 100, className, lines = 3, lineHeightEm = 1.5, showGradients = true }: FadingTextStreamProps) {
  const { segments } = useTextStream({
    textStream: text,
    speed,
  })
  
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom as text appears with smooth scrolling
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [segments])

  // Reserve a fixed height so parent layout doesn't shift when content appears
  const reservedHeight = `calc(${lineHeightEm}em * ${lines} + 1rem)`

  const fadeStyle = `
    @keyframes fadeIn {
      from { opacity: 0; filter: blur(2px); }
      to { opacity: 1; filter: blur(0px); }
    }
    
    .custom-fade-segment {
      display: inline-block;
      opacity: 0;
      animation: fadeIn 1000ms ease-out forwards;
    }

    .custom-fade-segment-space {
      white-space: pre;
    }
  `

  return (
    <div className={cn("w-full relative", className)}>
      <style>{fadeStyle}</style>

      {/* Virtual container with fixed height (e.g., 3 lines) */}
      <div className="relative rounded-md overflow-hidden">
        {/* Top fade gradient */}
        {showGradients && (
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/80 to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Scrollable content container */}
        <div 
          ref={containerRef}
          className="overflow-hidden text-sm py-2 transition-all duration-300 ease-out"
          style={{ 
            height: reservedHeight,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth'
          }}
        >
          <style>{`
            .scrollable-content::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="relative px-4 scrollable-content" style={{ lineHeight: `${lineHeightEm}em` }}>
            {segments.map((segment, idx) => {
              const isWhitespace = /^\s+$/.test(segment.text)

              return (
                <span
                  key={`${segment.text}-${idx}`}
                  className={cn(
                    "custom-fade-segment",
                    isWhitespace && "custom-fade-segment-space"
                  )}
                  style={{
                    animationDelay: `${idx * 2}ms`,
                  }}
                >
                  {segment.text}
                </span>
              )
            })}
          </div>
        </div>
        
        {/* Bottom fade gradient */}
        {showGradients && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent z-10 pointer-events-none" />
        )}
      </div>
    </div>
  )
}

