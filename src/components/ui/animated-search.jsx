"use client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function AnimatedSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  suggestions = [],
  className,
  intervalMs = 2200,
  ...props
}) {
  const [index, setIndex] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const timerRef = useRef(null)

  const activeSuggestion = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return ""
    return suggestions[index % suggestions.length]
  }, [index, suggestions])

  useEffect(() => {
    if (value && String(value).length > 0) return
    if (!suggestions || suggestions.length === 0) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % suggestions.length), intervalMs)
    return () => clearInterval(timerRef.current)
  }, [value, suggestions, intervalMs])

  const showOverlay = (!value || String(value).length === 0)

  return (
    <div className={cn("relative", className)}>
      <Input
        value={value}
        onChange={onChange}
        placeholder={suggestions && suggestions.length > 0 ? "" : placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn("pr-3", className)}
        {...props}
      />
      {showOverlay && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-[2] flex items-center px-3 text-foreground/55"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.7, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="text-sm md:text-xs"
            >
              {activeSuggestion || placeholder}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[1] rounded-[var(--radius-md)]",
          isFocused && !value ? "ring-2 ring-[color:var(--color-ring)]/50" : ""
        )}
      />
    </div>
  )
}

export default AnimatedSearchInput


