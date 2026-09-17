export const ACCENT_COLORS = [
  "#ff3b3b",
  "#ff8a3d",
  "#ffd23d",
  "#4ade80",
  "#38bdf8",
  "#8b5cf6",
  "#f472b6",
  "#22d3ee",
] as const;

export const CURSOR_STYLES = [
  { value: "arrow", label: "Arrow", css: "default" },
  { value: "text", label: "Beam", css: "text" },
  { value: "crosshair", label: "Crosshair", css: "crosshair" },
  { value: "pointer", label: "Pointer", css: "pointer" },
  { value: "cell", label: "Cell", css: "cell" },
] as const;

export const CARET_STYLES = [
  { value: "bar", label: "Bar" },
  { value: "block", label: "Block" },
  { value: "underline", label: "Underline" },
] as const;

export const EDITOR_FONTS = [
  { value: "sans", label: "Grotesk", css: '"Space Grotesk", system-ui, sans-serif' },
  { value: "mono", label: "Mono", css: '"JetBrains Mono", ui-monospace, monospace' },
  { value: "serif", label: "Serif", css: '"Newsreader", Georgia, serif' },
] as const;

export type CaretStyle = (typeof CARET_STYLES)[number]["value"];

export function cursorCss(value: string) {
  return CURSOR_STYLES.find((c) => c.value === value)?.css ?? "default";
}

export function fontCss(value: string) {
  return EDITOR_FONTS.find((f) => f.value === value)?.css ?? EDITOR_FONTS[0].css;
}

export function avatarUrl(seed: string, color: string) {
  const bg = color.replace("#", "");
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
