import React from "react";
import { useState } from "react";
import { AREAS, INTERVALS, INT_LABELS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, TY, perfIcon, perfIconColor } from "../theme.js";
import { today, diffDays, fmtDate, perfColor } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";

const PAGE_SIZE = 25;

function Temas({ reviews, onEdit }) {
  const [editing, setEditing] = useState(null); const [editForm, setEditForm] = useState({ intervalIndex: 0, nextDue: "" });
  const [fil, setFil] = useState("all"); const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const startEdit = (r) => { setEditing(r.id); setEditForm({ intervalIndex: r.intervalIndex, nextDue: r.nextDue }); };
  const confirm = () => { onEdit(editing, editForm.intervalIndex, editForm.nextDue); setEditing(null); };
  const filtered = reviews.filter((r) => fil === "all" || r.area === fil).filter((r) => !search || r.theme.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const chipStyle = (active, color) => ({
    padding: "7px 16px", fontSize: 12, fontFamily: F, fontWeight: active ? 700 : 500,
    minHeight: H.sm, height: H.sm, borderRadius: R.pill, cursor: "pointer",
    background: active ? (color || C.card2) : "transparent",
    border: active ? `1px solid ${color ? color + "60" : C.border2}` : `1px solid ${C.border}`,
    color: active ? (color ? "#fff" : C.text) : C.text3,
    boxShadow: active ? SH.sm : "none",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
      <div style={{ display: "flex", alignItems: "center", gap: S.md, padding: `${S.lg}px ${S.xl}px`, background: C.blue + "08", borderRadius: R.lg, border: `1px solid ${C.blue}18` }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>\u270f</span>
        <span style={{ ...TY.caption, color: C.text3, lineHeight: 1.4 }}>Use <span style={{ color: C.blue, fontWeight: 600 }}>Corrigir</span> em cada tema para ajustar a etapa e a data da pr\u00f3xima revis\u00e3o.</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Buscar tema\u2026" style={{ ...inp(), width: "100%", padding: "12px 16px", fontSize: 14 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => { setFil("all"); setVisibleCount(PAGE_SIZE); }} style={chipStyle(fil === "all")}>Todas</button>
          {AREAS.map((a) => <button key={a.id} onClick={() => { setFil(a.id); setVisibleCount(PAGE_SIZE); }} style={chipStyle(fil === a.id, a.color)}>{a.short}</button>)}
        </div>
      </div>

      {filtered.length === 0 && <Empty icon="\u{1F50D}" msg={search ? `Nenhum tema encontrado para "${search}"` : "Nenhum tema cadastrado ainda."} />}

      {visible.map((r) => { const a = areaMap[r.area]; const days = diffDays(r.nextDue, today()); const isDue = r.nextDue <= today(); const isE = editing === r.id;
        const deadlineBg = isDue ? C.red : C.text3;
        const deadlineText = isDue ? (days === 0 ? "hoje" : `${Math.abs(days)}d atr\u00e1s`) : `em ${days}d`;
        const aColor = a?.color || C.text3;
        // Card hierarchy: overdue = red border, due today = yellow, future = area color
        const cardBorderColor = isDue ? (days === 0 ? C.yellow : C.red) : aColor + "50";
        // Performance indicator
        const lastP = r.lastPerf;
        return (
        <div key={r.id} className="fade-slide-in" style={{
          ...card,
          borderLeft: `3px solid ${cardBorderColor}`,
          padding: `${S.xl}px`,
          boxShadow: isDue ? SH.glow(C.red) : SH.sm,
          opacity: isDue ? 1 : 0.95,
          transition: "all 0.2s ease",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: S.lg }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...TY.body, fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: S.sm }}>{r.theme}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: S.md }}>
                <span style={{ ...tag(aColor), fontSize: 11, padding: "3px 10px", borderLeft: `3px solid ${aColor}` }}>{a?.label}</span>
                <span style={{ fontSize: 11, color: C.text2, fontWeight: 500, padding: "3px 10px", background: C.card2, borderRadius: R.pill, border: `1px solid ${C.border}` }}>{INT_LABELS[r.intervalIndex]}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: deadlineBg, padding: "3px 10px", background: deadlineBg + "12", borderRadius: R.pill, border: `1px solid ${deadlineBg}25` }}>{deadlineText}</span>
              </div>
              <div style={{ display: "flex", gap: S.lg, ...TY.caption, fontSize: 12, color: C.text3, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: perfIconColor(lastP), fontSize: 13 }}>{perfIcon(lastP)}</span>
                  \u00daltimo <span style={{ color: perfColor(lastP), fontWeight: 700, fontFamily: FN }}>{lastP}%</span>
                </span>
                <span style={{ color: C.border2 }}>\u00b7</span>
                <span>Pr\u00f3xima <span style={{ color: C.text2, fontWeight: 600 }}>{fmtDate(r.nextDue)}</span></span>
                <span style={{ color: C.border2 }}>\u00b7</span>
                <span><span style={{ color: C.text2, fontWeight: 600, fontFamily: FN }}>{r.history?.length || 0}</span>\u00d7 revisado</span>
              </div>
              {isE && <div className="fade-slide-in" style={{ marginTop: S.xl, padding: S.lg, background: C.surface, borderRadius: R.md, border: `1px solid ${C.border2}` }}>
                <div style={{ ...TY.caption, color: C.blue, fontWeight: 600, marginBottom: S.md }}>Editar: "{r.theme}"</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: S.lg, marginBottom: S.lg }}>
                  <Fld label="Etapa conclu\u00edda"><select value={editForm.intervalIndex} onChange={(e) => setEditForm((f) => ({ ...f, intervalIndex: Number(e.target.value) }))} style={inp()}>{INTERVALS.map((iv, i) => <option key={i} value={i}>{INT_LABELS[i]} \u2014 {iv} dia{iv > 1 ? "s" : ""}</option>)}</select></Fld>
                  <Fld label="Pr\u00f3xima revis\u00e3o"><input type="date" value={editForm.nextDue} onChange={(e) => setEditForm((f) => ({ ...f, nextDue: e.target.value }))} style={inp()} /></Fld>
                </div>
                <div style={{ display: "flex", gap: 8 }}><button onClick={confirm} style={btn("#34D399")}>\u2713 Salvar</button><button onClick={() => setEditing(null)} style={btn(C.card2)}>Cancelar</button></div>
              </div>}
            </div>
            {!isE && <button onClick={() => startEdit(r)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: R.md, padding: "7px 14px", fontSize: 12, fontFamily: F, fontWeight: 500, color: C.text3, cursor: "pointer", flexShrink: 0, transition: "all 0.2s ease", whiteSpace: "nowrap" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.blue + "55"; e.currentTarget.style.color = C.blue; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text3; }}>\u270f Corrigir</button>}
          </div>
        </div>
      ); })}

      {hasMore && (
        <button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} style={{
          ...btn(C.surface, { color: C.text2, border: `1px solid ${C.border}`, width: "100%", textAlign: "center" }),
        }}>
          Carregar mais ({filtered.length - visibleCount} restantes)
        </button>
      )}
    </div>
  );
}

export { Temas };
