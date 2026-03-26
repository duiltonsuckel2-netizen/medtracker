import React from "react";
import { useState } from "react";
import { AREAS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { today, perc, fmtDate, perfColor, perfLabel } from "../utils.js";
import { Fld, Empty, Tooltip } from "./UI.jsx";

function Sessoes({ sessions, onAdd, onDel }) {
  const empty = { date: today(), area: "clinica", theme: "", total: "", acertos: "" };
  const [form, setForm] = useState(empty); const [show, setShow] = useState(false); const [fil, setFil] = useState("all");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function submit() { const tot = Number(form.total), ac = Number(form.acertos); if (!form.theme.trim()) return alert("Informe o tema."); if (!tot) return alert("Informe o total."); if (ac > tot) return alert("Acertos > total."); onAdd({ ...form, total: tot, acertos: ac, erros: tot - ac }); setForm(empty); setShow(false); }
  const filtered = sessions.filter((s) => fil === "all" || s.area === fil);
  const pct = Number(form.total) > 0 ? perc(Number(form.acertos), Number(form.total)) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>Registre aqui as sessões de questões após assistir uma aula nova. Cada tema entra automaticamente no sistema de revisões espaçadas.</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setShow((v) => !v)} style={btn(show ? C.card2 : C.blue)}>{show ? "— Fechar" : "+ Nova sessão"}</button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button onClick={() => setFil("all")} style={btn(fil === "all" ? C.card2 : C.surface, { padding: "8px 14px", fontSize: 12, minHeight: H.sm, borderRadius: R.sm, border: fil === "all" ? `1px solid ${C.border}` : `1px solid ${C.border}`, color: fil === "all" ? C.text : C.text3, boxShadow: fil === "all" ? SH.sm : "none", opacity: fil === "all" ? 1 : 0.7 })}>Todas</button>{AREAS.map((a) => <button key={a.id} onClick={() => setFil(a.id)} style={btn(fil === a.id ? a.color : C.surface, { padding: "8px 14px", fontSize: 12, minHeight: H.sm, borderRadius: R.sm, border: fil === a.id ? "none" : `1px solid ${C.border}`, color: fil === a.id ? "#fff" : C.text3, boxShadow: fil === a.id ? SH.sm : "none", opacity: fil === a.id ? 1 : 0.7 })}>{a.short}</button>)}</div>
      </div>
      {show && <div style={{ ...card, border: "1px solid #3B82F655", animation: "fadeInUp 0.25s ease" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, marginBottom: 16 }}>Nova sessão de aula</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 12 }}>
          <Fld label="Data"><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inp()} /></Fld>
          <Fld label="Área"><select value={form.area} onChange={(e) => set("area", e.target.value)} style={inp()}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Fld>
          <Fld label="Tema"><input type="text" value={form.theme} onChange={(e) => set("theme", e.target.value)} placeholder="Ex: Hipertensão, Sepse…" style={inp()} /></Fld>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
          <Fld label="Total"><input type="number" min="0" value={form.total} onChange={(e) => set("total", e.target.value)} style={inp()} /></Fld>
          <Fld label="✓ Acertos"><input type="number" min="0" value={form.acertos} onChange={(e) => set("acertos", e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
          <div>{pct !== null && <div style={{ background: perfColor(pct) + "22", border: `1px solid ${perfColor(pct)}44`, borderRadius: R.sm, padding: "10px 16px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: perfColor(pct), ...NUM }}>{pct}%</div><div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{perfLabel(pct)}</div></div>}</div>
        </div>
        <button onClick={submit} style={btn("#34D399")}>Registrar sessão</button>
      </div>}
      {filtered.length === 0 ? <Empty icon={fil !== "all" ? "\uD83D\uDD0D" : "\uD83D\uDCDD"} msg={fil !== "all" ? "Nenhuma sessão encontrada para esta área." : "Nenhuma sessão registrada ainda."} action={!show ? () => setShow(true) : undefined} actionLabel={!show ? "+ Registrar primeira sessão" : undefined} /> : filtered.map((s, idx) => { const a = areaMap[s.area]; const p = perc(s.acertos, s.total); return (
        <div key={s.id} style={{ ...card, display: "flex", gap: 14, alignItems: "flex-start", animation: `fadeInUp 0.3s ease ${Math.min(idx * 0.04, 0.3)}s both` }}>
          <Tooltip text={`${perfLabel(p)}: ${s.acertos}/${s.total} acertos`}><div style={{ width: 52, height: 52, borderRadius: R.sm, background: perfColor(p) + "18", border: `2px solid ${perfColor(p)}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 16, fontWeight: 700, color: perfColor(p), ...NUM }}>{p}%</span></div></Tooltip>
          <div style={{ flex: 1 }}><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{s.theme}</span><span style={tag(a?.color || "#6B7280")}>{a?.label}</span></div><div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{fmtDate(s.date)} · {s.total}q · <span style={{ color: C.green }}>✓{s.acertos}</span> <span style={{ color: C.red }}>✗{s.erros}</span></div></div>
          <button onClick={() => onDel(s.id)} style={{ background: "none", border: "none", color: C.border2, cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
        </div>
      ); })}
    </div>
  );
}

export { Sessoes };
