"use client"

import React from "react";
import Glass from "@/components/Glass";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export default function LiquidGlassDocs() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Liquid Glass Black & White</h1>
      <p className="text-foreground/70 max-w-prose">
        Monochrome-only UI using Black/White + grayscale, frosted translucent materials with rim highlights, and San Francisco typography. All emphasis comes from opacity, blur, weight, and density.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Glass Layers</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Glass tier="thin" className="p-4">
            <div className="text-sm">Thin</div>
            <div className="text-foreground/70 text-xs">Use for inputs, controls.</div>
          </Glass>
          <Glass className="p-4">
            <div className="text-sm">Regular</div>
            <div className="text-foreground/70 text-xs">Use for cards, panels.</div>
          </Glass>
          <Glass tier="thick" className="p-4">
            <div className="text-sm">Thick</div>
            <div className="text-foreground/70 text-xs">Use for navbars, modals.</div>
          </Glass>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="glass" shape="pill" size="lg">Primary</Button>
          <Button variant="tonal">Tonal</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Toggle</h2>
        <div className="flex items-center gap-4">
          <label className="toggle">
            <input type="checkbox" className="toggle__input" defaultChecked />
            <span className="toggle__track"><span className="toggle__ball" /></span>
          </label>
          <span className="text-foreground/70 text-sm">Default Toggle</span>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Navbar</h2>
        <Glass tier="thick" className="p-4 flex items-center justify-between">
          <div className="font-semibold">Brand</div>
          <div className="flex gap-2">
            <Button variant="ghost">Docs</Button>
            <Button variant="ghost">API</Button>
            <Button variant="glass" shape="pill">Get Started</Button>
          </div>
        </Glass>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Table (Sticky Header & Zebra)</h2>
        <div className="rounded-[var(--radius-xl)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["alice@example.com","bob@example.com","carol@example.com","dan@example.com"].map((email, idx) => (
                <TableRow key={email}>
                  <TableCell>{email}</TableCell>
                  <TableCell>{["Alice","Bob","Carol","Dan"][idx]}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-foreground/10">Active</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}


