"use client"

import { useTextStream } from "@/components/prompt-kit/response-stream"
import { cn } from "@/lib/utils"

interface FadingTextStreamProps {
  text: string
  speed?: number
  className?: string
}

export function FadingTextStream({ text, speed = 100, className }: FadingTextStreamProps) {
  const { segments } = useTextStream({
    textStream: text,
    mode: "fade",
    speed,
  })

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
    <div className={cn("w-full", className)}>
      <style>{fadeStyle}</style>

      <div className="rounded-md text-sm">
        <div className="relative">
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
    </div>
  )
}

