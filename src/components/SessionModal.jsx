import React, { useState } from "react";
import { AREAS, SEMANAS } from "../data.js";
import { C, F, FM, R, S, H, SH, card, inp, btn, tag } from "../theme.js";
import { today } from "../utils.js";
import { Fld } from "./UI.jsx";

function SessionModal({ onSave, onClose }) {
  const [area, setArea] = useState("clinica");
  const [theme, setTheme] = useState("");
  const [total, setTotal] = useState("");
  const [acertos, setAcertos] = useState("");
  const [date, setDate] = useState(today());
  const [semIdx, setSemIdx] = useState(null);
  function submit() {
    const t = Number(total), a = Number(acertos);
    if (!theme.trim()) return alert("Informe o tema.");
    if (!t) return alert("Informe o total.");
    if (a > t) return alert("Acertos > total.");
    onSave({ area, theme: theme.trim(), total: t, acertos: a, date, semIdx });
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 20, padding: 24, maxWidth: 420, width: "100%", border: `1px solid ${C.border2}`, boxShadow: SH.lg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Nova sessão</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Fld label="Data"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp()} /></Fld>
          <Fld label="Grande área">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 6 }}>
              {AREAS.map((a) => (
                <button key={a.id} onClick={() => setArea(a.id)} style={{ padding: "8px 6px", borderRadius: R.md, border: area === a.id ? `2px solid ${a.color}` : `1px solid ${C.border}`, background: area === a.id ? a.color + "18" : C.surface, cursor: "pointer", fontSize: 11, fontWeight: area === a.id ? 700 : 400, color: area === a.id ? a.color : C.text2, fontFamily: F, textAlign: "center" }}>{a.label}</button>
              ))}
            </div>
          </Fld>
          <Fld label="Tema"><input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex: Pneumonia, ICC, Fraturas…" style={inp()} /></Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="Total questões"><input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} style={inp()} /></Fld>
            <Fld label="Acertos"><input type="number" min="0" value={acertos} onChange={(e) => setAcertos(e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
          </div>
          <Fld label="Semana do cronograma (opcional)">
            <div style={{ maxHeight: 120, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 4 }}>
              {SEMANAS.map((s, i) => (
                <button key={i} onClick={() => setSemIdx(semIdx === i ? null : i)} style={{ padding: "4px 10px", borderRadius: R.pill, border: semIdx === i ? `1px solid ${C.purple}` : `1px solid ${C.border}`, background: semIdx === i ? C.purple + "20" : "transparent", cursor: "pointer", fontSize: 10, color: semIdx === i ? C.purple : C.text3, fontFamily: FM }}>{s.semana}</button>
              ))}
            </div>
          </Fld>
          <button onClick={submit} style={btn("#34D399", { width: "100%", marginTop: 4 })}>✓ Salvar sessão</button>
        </div>
      </div>
    </div>
  );
}
export { SessionModal };
