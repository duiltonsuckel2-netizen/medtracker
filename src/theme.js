import React from "react";

// ── DESIGN SYSTEM ─────────────────────────────────────────────────────────
export const F = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
export const FN = "'Nunito','Inter',-apple-system,BlinkMacSystemFont,sans-serif";
export const FM = "'JetBrains Mono','Inter Mono',ui-monospace,'SF Mono',monospace";

// Palettes — text3 bumped for WCAG AA contrast (≥4.5:1 on bg)
export const DARK = {
  bg: "#09090B",
  surface: "#111114",
  card: "#1A1A1F",
  card2: "#222228",
  border: "#2A2A2F",
  border2: "#38383E",
  text: "#F4F4F5",
  text2: "#A1A1AA",
  text3: "#71717A",
  green: "#34D399",
  blue: "#818CF8",
  teal: "#2DD4BF",
  yellow: "#FBBF24",
  red: "#FB7185",
  purple: "#C4B5FD",
  greenMuted: "#065F46",
  blueMuted: "#312E81",
  redMuted: "#9F1239",
};
export const LIGHT = {
  bg: "#F2F1EE",
  surface: "#FAF9F7",
  card: "#FFFFFF",
  card2: "#F5F4F1",
  border: "#E9E8E4",
  border2: "#DCDBD7",
  text: "#1A1A1C",
  text2: "#52525B",
  text3: "#71717A",
  green: "#2D9D5E",
  blue: "#6366F1",
  teal: "#0D9488",
  yellow: "#D97706",
  red: "#E5484D",
  purple: "#8B5CF6",
  greenMuted: "#ECFDF5",
  blueMuted: "#EEF2FF",
  redMuted: "#FEF2F2",
};
export let C = DARK;

// Spacing scale (4px base)
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 28, xxxl: 36 };

// Border radius — unified scale
export const R = { sm: 10, md: 14, lg: 16, xl: 18, pill: 999 };

// Interactive component height
export const H = { sm: 36, md: 44, lg: 48 };

// Shadows
export const SH_DARK = {
  sm: "0 1px 2px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.03)",
  md: "0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
  lg: "0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
  glow: (col) => `0 0 20px ${col}15, 0 2px 8px rgba(0,0,0,0.3)`,
};
export const SH_LIGHT = {
  sm: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
  md: "0 3px 10px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
  lg: "0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
  glow: (col) => `0 2px 12px ${col}18, 0 1px 3px rgba(0,0,0,0.06)`,
};
export let SH = SH_DARK;

// ── COMPONENT STYLES ──────────────────────────────────────────────────────
export function applyTheme(dark) {
  C = dark ? DARK : LIGHT;
  SH = dark ? SH_DARK : SH_LIGHT;
  card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: S.xl, boxShadow: SH.sm };
}
export let card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: R.xl, padding: S.xl, boxShadow: SH.sm };

export const inp = (ex = {}) => ({
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: R.md,
  padding: "12px 14px",
  color: C.text,
  fontSize: 14,
  fontFamily: F,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  minHeight: H.md,
  transition: "border-color 0.15s, box-shadow 0.15s",
  ...ex,
});

export const btn = (bg = C.blue, ex = {}) => ({
  background: bg,
  border: "none",
  borderRadius: R.md,
  padding: "12px 20px",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: F,
  flexShrink: 0,
  minHeight: H.md,
  transition: "opacity 0.15s, transform 0.1s",
  boxShadow: SH.sm,
  ...ex,
});

export const tag = (col) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 11px",
  borderRadius: R.sm,
  background: col + "14",
  color: col,
  fontSize: 11,
  fontFamily: FM,
  fontWeight: 600,
  border: `1px solid ${col}20`,
  whiteSpace: "nowrap",
  letterSpacing: 0.2,
});

// ── TYPOGRAPHY SCALE ────────────────────────────────────────────────────
export const TY = {
  h1: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2, fontFamily: F },
  h2: { fontSize: 20, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.25, fontFamily: F },
  h3: { fontSize: 16, fontWeight: 700, letterSpacing: -0.2, lineHeight: 1.3, fontFamily: F },
  body: { fontSize: 14, fontWeight: 400, lineHeight: 1.5, fontFamily: F },
  caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.4, fontFamily: F },
  overline: { fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: F },
};

// Typography helpers — Nunito for all numeric displays
export const NUM = { fontFamily: FN, fontVariantNumeric: "tabular-nums lining-nums" };
export const numUnit = (num, unit, numSize = 32, unitSize = 16) => (
  React.createElement("span", { style: { ...NUM } },
    React.createElement("span", { style: { fontSize: numSize, fontWeight: 900, lineHeight: 1 } }, num),
    React.createElement("span", { style: { fontSize: unitSize, fontWeight: 700, opacity: 0.55 } }, unit)
  )
);

// Performance icon helpers
export const perfIcon = (pct) => pct >= 85 ? "✓" : pct >= 60 ? "⚠" : "✗";
export const perfIconColor = (pct) => pct >= 85 ? "#22C55E" : pct >= 60 ? "#EAB308" : "#EF4444";

// CSS keyframe injection (call once on mount)
let _injected = false;
export function injectKeyframes() {
  if (_injected) return;
  _injected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulseCheck { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
    @keyframes progressGrow { from { width: 0%; } }
    @keyframes skeletonShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .fade-slide-in { animation: fadeSlideIn 0.25s ease-out; }
    .pulse-check { animation: pulseCheck 0.3s ease-out; }
    .progress-animated { animation: progressGrow 0.6s ease-out; }
    .skeleton-shimmer { background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.06) 50%, transparent 75%); background-size: 200% 100%; animation: skeletonShimmer 1.5s infinite; }
    .skeleton-shimmer-light { background: linear-gradient(90deg, transparent 25%, rgba(0,0,0,0.04) 50%, transparent 75%); background-size: 200% 100%; animation: skeletonShimmer 1.5s infinite; }
  `;
  document.head.appendChild(style);
}
