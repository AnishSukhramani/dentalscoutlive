"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Switch({ id, checked, onCheckedChange, className, ...props }) {
  return (
    <label className={cn("toggle", className)} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__ball" />
      </span>
    </label>
  );
}

export { Switch }
