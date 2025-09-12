import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-0",
  {
    variants: {
      variant: {
        glass: "glass border-0 text-foreground",
        tonal: "bg-foreground/10 text-foreground hover:bg-foreground/14 active:bg-foreground/8",
        outline: "border border-[color:var(--hairline-color)] bg-transparent text-foreground hover:bg-foreground/6",
        ghost: "hover:bg-foreground/6 text-foreground",
        link: "underline underline-offset-4 text-foreground hover:opacity-80",
        // aliases for compatibility
        default: "bg-foreground/10 text-foreground hover:bg-foreground/14 active:bg-foreground/8",
        secondary: "bg-foreground/6 text-foreground hover:bg-foreground/10",
        destructive: "border-0 text-black bg-[rgba(220,38,38,0.15)] hover:bg-[rgba(220,38,38,0.25)] active:bg-[rgba(220,38,38,0.1)] backdrop-blur-[12px]",
      },
      size: {
        sm: "h-8 px-3 has-[>svg]:px-2.5",
        md: "h-10 px-4 has-[>svg]:px-3",
        lg: "h-12 px-5 has-[>svg]:px-4",
        icon: "size-10",
      },
      shape: {
        rounded: "rounded-[var(--radius-md)]",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "tonal",
      size: "md",
      shape: "rounded",
    },
  }
)

function Button({
  className,
  variant,
  size,
  shape,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    (<Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props} />)
  );
}

export { Button, buttonVariants }
