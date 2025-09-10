"use client"

import React from "react";
import { cn } from "@/lib/utils";

export default function Glass({ as: Component = "div", tier = "regular", className, children, ...props }) {
  const tierClass = tier === "thin" ? "glass glass--thin" : tier === "thick" ? "glass glass--thick" : "glass";
  return (
    <Component className={cn(tierClass, className)} {...props}>
      {children}
    </Component>
  );
}


