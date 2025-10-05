"use client"

import { useEffect, useRef, useState } from "react"

export interface TextSegment {
  text: string
  index: number
}

interface UseTextStreamOptions {
  textStream: string
  speed?: number
}

export function useTextStream({
  textStream,
  speed = 100,
}: UseTextStreamOptions) {
  const [segments, setSegments] = useState<TextSegment[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    // Reset when text changes
    setSegments([])
    setIsComplete(false)
    indexRef.current = 0

    if (!textStream) return

    // Split text into words and spaces
    const words = textStream.split(/(\s+)/)

    const addNextSegment = () => {
      if (indexRef.current < words.length) {
        const currentWord = words[indexRef.current]
        setSegments((prev) => [
          ...prev,
          { text: currentWord, index: indexRef.current },
        ])
        indexRef.current++
        timeoutRef.current = setTimeout(addNextSegment, speed)
      } else {
        setIsComplete(true)
      }
    }

    addNextSegment()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [textStream, speed])

  return { segments, isComplete }
}

