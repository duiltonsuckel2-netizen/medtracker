import React from "react";
import { useState } from "react";
import { AREAS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, TY, perfIcon, perfIconColor } from "../theme.js";
import { today, perc, fmtDate, perfColor, perfLabel } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";

const PAGE_SIZE = 20;

function Sessoes({ sessions, onAdd, onDel }) {
  const empty = { date: today(), area: "clinica", theme: "", total: "", acertos: "" };
  const [form, setForm] = useState(empty); const [show, setShow] = useState(false); const [fil, setFil] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function submit() { const tot = Number(form.total), ac = Number(form.acertos); if (!form.theme.trim()) return alert("Informe o tema."); if (!tot) return alert("Informe o total."); if (ac > tot) return alert("Acertos > total."); onAdd({ ...form, total: tot, acertos: ac, erros: tot - ac }); setForm(empty); setShow(false); }
  const filtered = sessions.filter((s) => fil === "all" || s.area === fil);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const pct = Number(form.total) > 0 ? perc(Number(form.acertos), Number(form.total)) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
      <div style={{ ...TY.caption, color: C.text3, fontFamily: FM }}>Registre aqui as sess\u00f5es de quest\u00f5es ap\u00f3s assistir uma aula nova. Cada tema entra automaticamente no sistema de revis\u00f5es espa\u00e7adas.</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setShow((v) => !v)} style={btn(show ? C.card2 : C.blue)}>{show ? "\u2014 Fechar" : "+ Nova sess\u00e3o"}</button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setFil("all")} style={btn(fil === "all" ? C.card2 : C.surface, { padding: "8px 14px", fontSize: 12, minHeight: H.sm, borderRadius: R.sm, border: `1px solid ${C.border}`, color: fil === "all" ? C.text : C.text3, boxShadow: fil === "all" ? SH.sm : "none", opacity: fil === "all" ? 1 : 0.7 })}>Todas</button>
          {AREAS.map((a) => <button key={a.id} onClick={() => setFil(a.id)} style={btn(fil === a.id ? a.color : C.surface, { padding: "8px 14px", fontSize: 12, minHeight: H.sm, borderRadius: R.sm, border: fil === a.id ? "none" : `1px solid ${C.border}`, color: fil === a.id ? "#fff" : C.text3, boxShadow: fil === a.id ? SH.sm : "none", opacity: fil === a.id ? 1 : 0.7 })}>{a.short}</button>)}
        </div>
      </div>

      {show && <div className="fade-slide-in" style={{ ...card, border: "1px solid #3B82F655" }}>
        <div style={{ ...TY.h3, color: C.blue, marginBottom: S.xl }}>Nova sess\u00e3o de aula</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: S.lg, marginBottom: S.lg }}>
          <Fld label="Data"><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inp()} /></Fld>
          <Fld label="\u00c1rea"><select value={form.area} onChange={(e) => set("area", e.target.value)} style={inp()}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Fld>
          <Fld label="Tema"><input type="text" value={form.theme} onChange={(e) => set("theme", e.target.value)} placeholder="Ex: Hipertens\u00e3o, Sepse\u2026" style={inp()} /></Fld>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: S.lg, alignItems: "flex-end", marginBottom: S.xl }}>
          <Fld label="Total"><input type="number" min="0" value={form.total} onChange={(e) => set("total", e.target.value)} style={inp()} /></Fld>
          <Fld label="\u2713 Acertos"><input type="number" min="0" value={form.acertos} onChange={(e) => set("acertos", e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
          <div>{pct !== null && <div style={{ background: perfColor(pct) + "22", border: `1px solid ${perfColor(pct)}44`, borderRadius: R.sm, padding: "10px 16px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: perfColor(pct), ...NUM }}>{pct}%</div><div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{perfLabel(pct)}</div></div>}</div>
        </div>
        <button onClick={submit} style={btn("#34D399")}>Registrar sess\u00e3o</button>
      </div>}

      {filtered.length === 0
        ? <Empty icon="\u{1F4DA}" msg="Nenhuma sess\u00e3o registrada ainda." action="+ Nova sess\u00e3o" onAction={() => setShow(true)} />
        : <>
          {visible.map((s) => {
            const a = areaMap[s.area]; const p = perc(s.acertos, s.total);
            const aColor = a?.color || "#6B7280";
            // Card hierarchy: border-left color based on performance
            const borderColor = p >= 85 ? C.green + "60" : p >= 60 ? C.yellow + "60" : C.red + "60";
            return (
              <div key={s.id} className="fade-slide-in" style={{
                ...card,
                display: "flex", gap: S.lg, alignItems: "flex-start",
                borderLeft: `3px solid ${borderColor}`,
                transition: "all 0.15s ease",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: R.sm,
                  background: perfColor(p) + "18", border: `2px solid ${perfColor(p)}44`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  gap: 2,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: perfColor(p), ...NUM }}>{p}%</span>
                  <span style={{ fontSize: 10, color: perfIconColor(p) }}>{perfIcon(p)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: S.xs }}>
                    <span style={{ ...TY.body, fontWeight: 600, fontSize: 15 }}>{s.theme}</span>
                    <span style={{ ...tag(aColor), borderLeft: `3px solid ${aColor}` }}>{a?.label}</span>
                  </div>
                  <div style={{ ...TY.caption, fontSize: 11, color: C.text3, fontFamily: FM }}>
                    {fmtDate(s.date)} \u00b7 {s.total}q \u00b7 <span style={{ color: C.green }}>\u2713{s.acertos}</span> <span style={{ color: C.red }}>\u2717{s.erros}</span>
                  </div>
                </div>
                <button onClick={() => onDel(s.id)} style={{ background: "none", border: "none", color: C.border2, cursor: "pointer", fontSize: 16, padding: 4, transition: "color 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.color = C.red} onMouseLeave={(e) => e.currentTarget.style.color = C.border2}>\u2715</button>
              </div>
            );
          })}
          {hasMore && (
            <button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} style={{
              ...btn(C.surface, { color: C.text2, border: `1px solid ${C.border}`, width: "100%", textAlign: "center" }),
            }}>
              Carregar mais ({filtered.length - visibleCount} restantes)
            </button>
          )}
        </>
      }
    </div>
  );
}

export { Sessoes };
