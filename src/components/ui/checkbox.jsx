"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}) {
  return (
    (<CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "size-4 shrink-0 rounded-[4px] border border-[color:var(--hairline-color)] bg-transparent text-foreground transition-all outline-none focus-visible:outline-2 focus-visible:outline-[color:color-mix(in oklab,var(--text-color) 60%,transparent)] data-[state=checked]:bg-foreground data-[state=checked]:text-[color:var(--surface-canvas)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none">
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>)
  );
}

export { Checkbox }
