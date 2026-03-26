import React, { useState, useRef, useEffect, useCallback } from "react";
import { C, F, FM, R, S, SH, NUM } from "../theme.js";

function Lbl({ children }) {
  return (
    <span style={{
      fontSize: 10,
      color: C.text3,
      fontFamily: F,
      fontWeight: 600,
      marginBottom: 6,
      display: "block",
      textTransform: "uppercase",
      letterSpacing: 1,
    }}>
      {children}
    </span>
  );
}

function Fld({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <Lbl>{label}</Lbl>
      {children}
    </div>
  );
}

function Empty({ msg, green, icon, action, actionLabel }) {
  return (
    <div style={{
      color: green ? C.green : C.text3,
      fontSize: 13,
      padding: "40px 20px",
      textAlign: "center",
      fontStyle: green ? "normal" : "normal",
      animation: "fadeIn 0.3s ease",
    }}>
      {icon && <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>{icon}</div>}
      <div style={{ lineHeight: 1.5 }}>{msg}</div>
      {action && actionLabel && (
        <button onClick={action} style={{
          marginTop: 16,
          background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
          border: "none",
          borderRadius: R.pill,
          padding: "10px 24px",
          color: "#fff",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: F,
          boxShadow: SH.sm,
          transition: "opacity 0.15s, transform 0.1s",
        }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Skeleton({ width, height = 16, radius = 8, style }) {
  return (
    <div style={{
      width: width || "100%",
      height,
      borderRadius: radius,
      background: `linear-gradient(90deg, ${C.card2} 25%, ${C.border}40 50%, ${C.card2} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

function SkeletonCard({ lines = 3 }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: R.xl,
      padding: S.xl,
      boxShadow: SH.sm,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={44} height={44} radius={R.sm} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="35%" height={10} />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} width={`${80 - i * 15}%`} height={10} />
      ))}
    </div>
  );
}

function SkeletonList({ count = 3, lines = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.lg }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (show && triggerRef.current && tipRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tipRect = tipRef.current.getBoundingClientRect();
      const left = rect.left + rect.width / 2 - tipRect.width / 2;
      const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
      setPos({ top: rect.top - tipRect.height - 8, left: clampedLeft });
    }
  }, [show]);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ position: "relative", cursor: "help" }}
    >
      {children}
      {show && (
        <span
          ref={tipRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            background: C.card,
            color: C.text2,
            fontSize: 11,
            fontFamily: F,
            fontWeight: 500,
            padding: "8px 12px",
            borderRadius: R.sm,
            border: `1px solid ${C.border2}`,
            boxShadow: SH.lg,
            whiteSpace: "nowrap",
            zIndex: 9999,
            pointerEvents: "none",
            animation: "fadeInDown 0.15s ease",
            lineHeight: 1.4,
            maxWidth: 260,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function AnimatedCard({ children, style, delay = 0 }) {
  return (
    <div style={{
      animation: `fadeInUp 0.3s ease ${delay}s both`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: R.sm,
      padding: "8px 12px",
      boxShadow: SH.md,
    }}>
      <div style={{ fontSize: 10, color: C.text3, marginBottom: 4, fontFamily: F, fontWeight: 600, letterSpacing: 0.3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: F, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: p.color || C.blue, flexShrink: 0 }} />
          <span style={{ color: C.text3, fontWeight: 400 }}>{p.name}</span>
          <span style={{ marginLeft: "auto", ...NUM }}>{p.value ?? "-"}%</span>
        </div>
      ))}
    </div>
  );
}

function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export { Lbl, Fld, Empty, ChartTip, Skeleton, SkeletonCard, SkeletonList, Tooltip, AnimatedCard, useDebounce };
