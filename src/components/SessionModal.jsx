import React from "react";
import { useState, useMemo } from "react";
import { AREAS, SEMANAS } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { today, perc, perfColor, perfLabel } from "../utils.js";
import { Fld } from "./UI.jsx";

function SessionModal({ onAdd, onClose }) {
  const empty = { date: today(), area: "", theme: "", total: "", acertos: "" };
  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function submit() { const tot = Number(form.total), ac = Number(form.acertos); if (!form.area) return alert("Selecione a área."); if (!form.theme.trim()) return alert("Informe o tema."); if (!tot) return alert("Informe o total."); if (ac > tot) return alert("Acertos > total."); onAdd({ ...form, total: tot, acertos: ac, erros: tot - ac }); }
  const pct = Number(form.total) > 0 ? perc(Number(form.acertos), Number(form.total)) : null;
  const selectedArea = AREAS.find((a) => a.id === form.area);
  const areaShort = selectedArea?.short || "";
  const semanaThemes = useMemo(() => {
    if (!areaShort) return [];
    const shortKey = areaShort === "CM" ? "CM" : areaShort === "CIR" ? "CIR" : areaShort === "GO" ? "GO" : areaShort === "PED" ? "PED" : areaShort === "PREV" ? "PREV" : "";
    return SEMANAS.flatMap((sem) => sem.aulas.filter((a) => a.area === shortKey).map((a) => ({ label: `${sem.semana} — ${a.topic}`, topic: a.topic, semana: sem.semana }))).reverse();
  }, [areaShort]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: S.xl, overflowY: "auto", animation: "backdropIn 0.2s ease" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, borderRadius: R.xl, padding: S.xxl, maxWidth: 560, width: "100%", border: `1px solid ${C.border}`, marginTop: 40, boxShadow: SH.lg, maxHeight: "85vh", overflowY: "auto", animation: "modalIn 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>+ Nova sessão de aula</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 20, padding: 4 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: C.text3, marginBottom: 16 }}>Selecione a área e o tema da aula. O tema entra automaticamente no sistema de revisões espaçadas.</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Grande área</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {AREAS.map((a) => { const active = form.area === a.id; return (
              <button key={a.id} onClick={() => { set("area", a.id); set("theme", ""); }} style={{ padding: "14px 6px", background: active ? a.color + "12" : C.surface, border: active ? `2px solid ${a.color}55` : `1px solid ${C.border}`, borderRadius: R.xl, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s", boxShadow: active ? SH.glow(a.color) : SH.sm, minHeight: 80, opacity: active ? 1 : 0.75 }}>
                <div style={{ width: 36, height: 36, borderRadius: R.sm, background: active ? a.color + "22" : C.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: active ? a.color : C.text3, fontFamily: FM }}>{a.short}</div>
                <div style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? a.color : C.text3, textAlign: "center", lineHeight: 1.2 }}>{a.label.split(" ")[0]}</div>
              </button>
            ); })}
          </div>
        </div>
        {form.area && <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Tema da aula</div>
            <input type="text" value={form.theme} onChange={(e) => set("theme", e.target.value)} placeholder="Digite ou selecione abaixo…" style={{ ...inp(), marginBottom: 10, fontSize: 14, padding: "10px 14px" }} />
            {semanaThemes.length > 0 && (
              <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, padding: 2 }}>
                {semanaThemes.map((st, i) => { const active = form.theme === st.topic; return (
                  <button key={i} onClick={() => set("theme", st.topic)} style={{ padding: "10px 14px", background: active ? (selectedArea?.color || C.blue) + "10" : C.surface, border: active ? `1px solid ${(selectedArea?.color || C.blue)}30` : `1px solid ${C.border}`, borderRadius: R.md, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s", minHeight: H.md, opacity: active ? 1 : 0.75 }}>
                    <span style={{ fontSize: 11, color: C.text3, fontFamily: FM, minWidth: 52, flexShrink: 0 }}>{st.semana}</span>
                    <span style={{ fontSize: 13, color: active ? C.text : C.text2, fontWeight: active ? 600 : 400 }}>{st.topic}</span>
                  </button>
                ); })}
              </div>
            )}
          </div>
          <Fld label="Data" style={{ marginBottom: 12 }}><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={{ ...inp(), fontSize: 14, padding: "10px 14px" }} /></Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
            <Fld label="Total de questões"><input type="number" min="0" value={form.total} onChange={(e) => set("total", e.target.value)} style={{ ...inp(), fontSize: 14, padding: "10px 14px" }} /></Fld>
            <Fld label="✓ Acertos"><input type="number" min="0" value={form.acertos} onChange={(e) => set("acertos", e.target.value)} style={{ ...inp({ borderColor: "#34D39944" }), fontSize: 14, padding: "10px 14px" }} /></Fld>
            <div>{pct !== null && <div style={{ background: perfColor(pct) + "22", border: `1px solid ${perfColor(pct)}44`, borderRadius: R.md, padding: "12px 18px", textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700, color: perfColor(pct), ...NUM }}>{pct}%</div><div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{perfLabel(pct)}</div></div>}</div>
          </div>
          <button onClick={submit} style={btn("#34D399", { width: "100%", padding: "12px", fontSize: 15 })}>Registrar sessão</button>
        </>}
      </div>
    </div>
  );
}

export { SessionModal };
