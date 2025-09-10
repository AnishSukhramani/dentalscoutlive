import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    (<input
      type={type}
      data-slot="input"
      className={cn(
        "glass glass--thin bg-transparent text-foreground placeholder:text-foreground/55 border border-[color:var(--hairline-color)] outline-none flex h-10 w-full min-w-0 rounded-[var(--radius-md)] px-3 py-2 text-base transition-all md:text-sm",
        "focus-visible:outline-2 focus-visible:outline-[color:color-mix(in oklab,var(--text-color) 60%,transparent)]",
        "aria-invalid:outline-2 aria-invalid:outline-[color:color-mix(in oklab,var(--text-color) 40%,transparent)]",
        className
      )}
      {...props} />)
  );
}

export { Input }
