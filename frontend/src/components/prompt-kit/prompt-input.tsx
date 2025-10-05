"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PromptInputContextValue {
  value: string
  onValueChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
}

const PromptInputContext = React.createContext<PromptInputContextValue | undefined>(undefined)

function usePromptInput() {
  const context = React.useContext(PromptInputContext)
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput")
  }
  return context
}

interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
}

export function PromptInput({
  value,
  onValueChange,
  isLoading,
  onSubmit,
  className,
  children,
  ...props
}: PromptInputProps) {
  return (
    <PromptInputContext.Provider value={{ value, onValueChange, isLoading, onSubmit }}>
      <div className={cn("relative", className)} {...props}>
        {children}
      </div>
    </PromptInputContext.Provider>
  )
}

export type PromptInputTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export function PromptInputTextarea({ className, ...props }: PromptInputTextareaProps) {
  const { value, onValueChange, onSubmit, isLoading } = usePromptInput()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim()) {
        onSubmit()
      }
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full resize-none rounded-lg border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      rows={1}
      {...props}
    />
  )
}

export type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>

export function PromptInputActions({ className, children, ...props }: PromptInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  )
}

interface PromptInputActionProps extends React.HTMLAttributes<HTMLDivElement> {
  tooltip?: string
}

export function PromptInputAction({ tooltip, className, children, ...props }: PromptInputActionProps) {
  return (
    <div className={cn("relative", className)} title={tooltip} {...props}>
      {children}
    </div>
  )
}
