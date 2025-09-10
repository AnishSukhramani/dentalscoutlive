"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({
  className,
  ...props
}) {
  return (
    (<div data-slot="table-container" className="relative w-full overflow-x-auto glass glass--thick rounded-[var(--radius-xl)] border border-[color:var(--hairline-color)]">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props} />
    </div>)
  );
}

function TableHeader({
  className,
  ...props
}) {
  return (
    (<thead
      data-slot="table-header"
      className={cn("sticky top-0 z-10 bg-background/80 backdrop-blur-[var(--glass-blur-thick)] [&_tr]:border-b hairline-true", className)}
      {...props} />)
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    (<tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props} />)
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    (<tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props} />)
  );
}

function TableRow({
  className,
  ...props
}) {
  return (
    (<tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-foreground/4 odd:bg-foreground/2",
        className
      )}
      {...props} />)
  );
}

function TableHead({
  className,
  ...props
}) {
  return (
    (<th
      data-slot="table-head"
      className={cn(
        "text-foreground h-11 px-3 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />)
  );
}

function TableCell({
  className,
  ...props
}) {
  return (
    (<td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />)
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    (<caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props} />)
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
