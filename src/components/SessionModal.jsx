import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { AREAS, SEMANAS } from "../data.js";
import { C, F, FM, R, S, H, SH, card, inp, btn, tag } from "../theme.js";
import { today } from "../utils.js";
import { Fld } from "./UI.jsx";

function useEscapeKey(onClose) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
}

function SessionModal({ onSave, onClose }) {
  useEscapeKey(onClose);
  const [area, setArea] = useState("clinica");
  const [theme, setTheme] = useState("");
  const [total, setTotal] = useState("");
  const [acertos, setAcertos] = useState("");
  const [date, setDate] = useState(today());
  const [semIdx, setSemIdx] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const themeRef = useRef(null);
  const sugRef = useRef(null);

  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

  function validate(field) {
    const e = {};
    if (field === "theme" && !theme.trim()) e.theme = "Informe o tema";
    if (field === "total" && !Number(total)) e.total = "Informe o total";
    if (field === "acertos" && Number(acertos) > Number(total)) e.acertos = "Acertos > total";
    setErrors((prev) => ({ ...prev, ...e }));
  }

  function submit() {
    const t = Number(total), a = Number(acertos);
    const e = {};
    if (!theme.trim()) e.theme = "Informe o tema.";
    if (!t) e.total = "Informe o total.";
    if (a > t) e.acertos = "Acertos > total.";
    setErrors(e);
    setTouched({ theme: true, total: true, acertos: true });
    if (Object.keys(e).length) return;
    onSave({ area, theme: theme.trim(), total: t, acertos: a, date, semIdx });
  }

  // Auto-complete: collect theme names from semanas for current area
  const areaShort = AREAS.find((a2) => a2.id === area)?.short || "";
  const semanaThemes = useMemo(() => {
    if (!areaShort) return [];
    return SEMANAS.flatMap((sem) => sem.aulas.filter((a) => a.area === areaShort).map((a) => a.topic));
  }, [areaShort]);

  const suggestions = useMemo(() => {
    const q = theme.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    return semanaThemes.filter((t) => t.toLowerCase().includes(q) && t.toLowerCase() !== q).slice(0, 8);
  }, [theme, semanaThemes]);

  useEffect(() => {
    function handleClick(e) {
      if (sugRef.current && !sugRef.current.contains(e.target) && themeRef.current && !themeRef.current.contains(e.target)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const errStyle = (field) => touched[field] && errors[field] ? { borderColor: C.red + "88", boxShadow: `0 0 0 2px ${C.red}18` } : {};

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in" style={{ background: C.card, borderRadius: 20, padding: 24, maxWidth: 420, width: "100%", border: `1px solid ${C.border2}`, boxShadow: SH.lg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Nova sessão</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Fld label="Data"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp()} /></Fld>
          <Fld label="Grande área">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 6 }}>
              {AREAS.map((a) => (
                <button key={a.id} onClick={() => setArea(a.id)} style={{ padding: "8px 6px", borderRadius: R.md, border: area === a.id ? `2px solid ${a.color}` : `1px solid ${C.border}`, background: area === a.id ? a.color + "18" : C.surface, cursor: "pointer", fontSize: 11, fontWeight: area === a.id ? 700 : 400, color: area === a.id ? a.color : C.text2, fontFamily: F, textAlign: "center", transition: "all .2s ease" }}>{a.label}</button>
              ))}
            </div>
          </Fld>
          {/* Theme with auto-complete */}
          <div style={{ position: "relative" }}>
            <Fld label="Tema" error={touched.theme && errors.theme}>
              <input ref={themeRef} type="text" value={theme} onChange={(e) => { setTheme(e.target.value); setShowSuggestions(true); if (errors.theme) setErrors((er) => ({ ...er, theme: null })); }} onFocus={() => setShowSuggestions(true)} onBlur={() => { touch("theme"); validate("theme"); }} placeholder="Ex: Pneumonia, ICC, Fraturas…" style={inp(errStyle("theme"))} />
            </Fld>
            {showSuggestions && suggestions.length > 0 && (
              <div ref={sugRef} style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, boxShadow: SH.lg, maxHeight: 160, overflowY: "auto", marginTop: 4 }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setTheme(s); setShowSuggestions(false); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", fontSize: 13, color: C.text, fontFamily: F }} onMouseEnter={(e) => e.currentTarget.style.background = C.card2} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>{s}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="Total questões" error={touched.total && errors.total}><input type="number" min="0" value={total} onChange={(e) => { setTotal(e.target.value); if (errors.total) setErrors((er) => ({ ...er, total: null })); }} onBlur={() => { touch("total"); validate("total"); }} style={inp(errStyle("total"))} /></Fld>
            <Fld label="Acertos" error={touched.acertos && errors.acertos}><input type="number" min="0" value={acertos} onChange={(e) => { setAcertos(e.target.value); if (errors.acertos) setErrors((er) => ({ ...er, acertos: null })); }} onBlur={() => { touch("acertos"); validate("acertos"); }} style={inp({ borderColor: "#34D39944", ...errStyle("acertos") })} /></Fld>
          </div>
          <Fld label="Semana do cronograma (opcional)">
            <select value={semIdx ?? ""} onChange={(e) => setSemIdx(e.target.value === "" ? null : Number(e.target.value))} style={inp({ fontSize: 12 })}>
              <option value="">Nenhuma</option>
              {SEMANAS.map((s, i) => <option key={i} value={i}>{s.semana} — {s.aulas.map((a) => a.area).join(" + ")}</option>)}
            </select>
          </Fld>
          <button onClick={submit} style={btn("#34D399", { width: "100%", marginTop: 4 })}>✓ Salvar sessão</button>
        </div>
      </div>
    </div>
  );
}
export { SessionModal };
