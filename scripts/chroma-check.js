#!/usr/bin/env node
const { readFileSync, readdirSync, statSync } = require('fs');
const { join, extname } = require('path');

const ROOT = process.cwd();
const SCAN_ROOTS = [join(ROOT, 'src'), join(ROOT, 'public')];
const ALLOWED = new Set([
  "#000", "#fff", "#ffffff", "#000000", // pure monochrome
  "#16a34a", // toggle green (ON)
  "#2563eb", // brand blue for heading
  // grayscale design tokens
  "#111", "#1a1a1a", "#2a2a2a", "#3f3f3f", "#6b6b6b", "#9a9a9a", "#c7c7c7", "#e3e3e3", "#f2f2f2",
]);
let violations = [];

const HEX = /#[0-9a-fA-F]{3,8}/g;
const RGB = /rgb\s*\(/g;
const HSL = /hsl\s*\(/g;
const OKLCH = /oklch\s*\(/g;
// Tailwind color utility usage of chroma names
const TAILWIND_NAMED = /(bg|text|border|ring)-(red|green|blue|yellow|orange|purple|pink|cyan|indigo|emerald|teal|sky|lime|rose)(-|\b)/i;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git' || entry === 'api') continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if ([".js", ".jsx", ".ts", ".tsx", ".css", ".svg", ".mjs"].includes(extname(p))) checkFile(p);
  }
}

function checkFile(path) {
  const src = readFileSync(path, 'utf8');
  const matches = [
    ...src.matchAll(HEX),
    ...src.matchAll(RGB),
    ...src.matchAll(HSL),
    ...src.matchAll(OKLCH),
  ];
  for (const m of matches) {
    const token = m[0];
    if (token.startsWith('#')) {
      if (!ALLOWED.has(token.toLowerCase())) violations.push({ path, token });
      continue;
    }
    // rgb/hsl/oklch are not allowed anywhere (monochrome enforced via tokens)
    if (token.startsWith('rgb') || token.startsWith('hsl') || token.startsWith('oklch')) violations.push({ path, token });
  }
  // flag tailwind chroma utilities only (not arbitrary words in code)
  const hasNamed = TAILWIND_NAMED.test(src);
  if (hasNamed) violations.push({ path, token: 'tailwind-named-color' });
}

for (const root of SCAN_ROOTS) walk(root);
if (violations.length) {
  console.error(`Chroma check failed: found ${violations.length} potential color uses.`);
  for (const v of violations.slice(0, 100)) console.error(` - ${v.path}: ${v.token}`);
  process.exit(1);
} else {
  console.log('Chroma check passed: monochrome-only verified.');
}


