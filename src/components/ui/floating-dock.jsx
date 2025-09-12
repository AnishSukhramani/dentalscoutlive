"use client"

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Floating Dock (Aceternity-style) with Liquid Glass skin
 * Props:
 * - items: { title: string; icon: React.ReactNode; href: string }[]
 * - desktopClassName?: string
 * - mobileClassName?: string
 */
export function FloatingDock({ items = [], desktopClassName, mobileClassName }) {
  return (
    <div className="w-full">
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </div>
  );
}

export function FloatingDockDesktop({ items = [], className }) {
  if (!items?.length) return null;
  const mouseX = useMotionValue(Infinity);
  return (
    <div className={cn("hidden md:flex w-full justify-center", className)}>
      <div
        className={cn(
          "glass px-3 py-2 rounded-[var(--radius-xl)]",
          "border border-[color:var(--hairline-color)] shadow-lg",
          "inline-flex items-end gap-1"
        )}
        onMouseMove={(e) => {
          mouseX.set(e.clientX);
        }}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {items.map((item) => (
          <a
            key={item.title}
            href={item.href ?? "#"}
            className={cn(
              "relative flex flex-col items-center justify-end",
              "px-2 py-1"
            )}
            aria-label={item.title}
            title={item.title}
          >
            <IconContainer title={item.title} mouseX={mouseX}>
              {item.icon}
            </IconContainer>
          </a>
        ))}
      </div>
    </div>
  );
}

export function FloatingDockMobile({ items = [], className }) {
  if (!items?.length) return null;
  return (
    <div className={cn("md:hidden w-full z-40", className)}>
      <div className={cn(
        "glass w-full rounded-[var(--radius-xl)]",
        "border border-[color:var(--hairline-color)] shadow-lg",
        "px-2 py-2"
      )}>
        <nav className="flex items-center justify-between">
          {items.map((item) => (
            <a
              key={item.title}
              href={item.href ?? "#"}
              className="flex items-center justify-center"
              aria-label={item.title}
              title={item.title}
            >
              <IconStatic size="sm">{item.icon}</IconStatic>
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

function IconContainer({ children, title, mouseX }) {
  const ref = useRef(null);
  const distance = useMotionValue(200);

  const scale = useTransform(distance, [0, 80], [1.8, 1], { clamp: true });
  const y = useTransform(distance, [0, 80], [-8, 0], { clamp: true });
  const springScale = useSpring(scale, { stiffness: 380, damping: 28, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 380, damping: 28, mass: 0.4 });

  function handleMouseMove(clientX) {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    distance.set(Math.abs(clientX - centerX));
  }

  // Subscribe to mouseX changes
  React.useEffect(() => {
    const unsubscribe = mouseX.on("change", (v) => handleMouseMove(v));
    return () => unsubscribe();
  }, [mouseX]);

  return (
    <motion.div ref={ref} style={{ scale: springScale, y: springY }} className="flex items-end justify-center">
      <div className={cn("h-10 w-10 flex items-center justify-center md:h-12 md:w-12")}>{children}</div>
    </motion.div>
  );
}

function IconStatic({ children, size = "md" }) {
  const dimension = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  return (
    <div className={cn("flex items-center justify-center", dimension)}>
      <div className="text-foreground opacity-90">{children}</div>
    </div>
  );
}

export default FloatingDock;


