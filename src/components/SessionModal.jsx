import React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { AREAS, SEMANAS } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, TY } from "../theme.js";
import { today, perc, perfColor, perfLabel } from "../utils.js";
import { Fld } from "./UI.jsx";

function SessionModal({ onAdd, onClose, existingThemes }) {
  const empty = { date: today(), area: "", theme: "", total: "", acertos: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const themeInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
  };

  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

  // Inline validation on blur
  function validate(field) {
    const e = {};
    if (field === "area" || !field) {
      if (!form.area) e.area = "Selecione uma \u00e1rea";
    }
    if (field === "theme" || !field) {
      if (!form.theme.trim()) e.theme = "Informe o tema";
    }
    if (field === "total" || !field) {
      if (!Number(form.total)) e.total = "Informe o total";
    }
    if (field === "acertos" || !field) {
      if (Number(form.acertos) > Number(form.total)) e.acertos = "Acertos > total";
    }
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  }

  function submit() {
    setTouched({ area: true, theme: true, total: true, acertos: true });
    const e = {};
    if (!form.area) e.area = "Selecione uma \u00e1rea";
    if (!form.theme.trim()) e.theme = "Informe o tema";
    const tot = Number(form.total), ac = Number(form.acertos);
    if (!tot) e.total = "Informe o total";
    if (ac > tot) e.acertos = "Acertos > total";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onAdd({ ...form, total: tot, acertos: ac, erros: tot - ac });
  }

  const pct = Number(form.total) > 0 ? perc(Number(form.acertos), Number(form.total)) : null;
  const selectedArea = AREAS.find((a) => a.id === form.area);
  const areaShort = selectedArea?.short || "";

  const semanaThemes = useMemo(() => {
    if (!areaShort) return [];
    const shortKey = areaShort === "CM" ? "CM" : areaShort === "CIR" ? "CIR" : areaShort === "GO" ? "GO" : areaShort === "PED" ? "PED" : areaShort === "PREV" ? "PREV" : "";
    return SEMANAS.flatMap((sem) => sem.aulas.filter((a) => a.area === shortKey).map((a) => ({ label: `${sem.semana} \u2014 ${a.topic}`, topic: a.topic, semana: sem.semana }))).reverse();
  }, [areaShort]);

  // Auto-complete suggestions from existing themes + semana themes
  const suggestions = useMemo(() => {
    const query = form.theme.toLowerCase().trim();
    if (!query || query.length < 2) return [];
    const all = new Set();
    // From semana themes
    semanaThemes.forEach((st) => all.add(st.topic));
    // From existing themes passed in
    (existingThemes || []).forEach((t) => all.add(t));
    return [...all].filter((t) => t.toLowerCase().includes(query) && t.toLowerCase() !== query).slice(0, 8);
  }, [form.theme, semanaThemes, existingThemes]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClick(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && themeInputRef.current && !themeInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const inputErrorStyle = (field) => touched[field] && errors[field] ? { borderColor: C.red + "88", boxShadow: `0 0 0 2px ${C.red}18` } : {};

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: S.xl, overflowY: "auto" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-slide-in" style={{ background: C.card, borderRadius: R.xl, padding: S.xxl, maxWidth: 560, width: "100%", border: `1px solid ${C.border}`, marginTop: 40, boxShadow: SH.lg, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ ...TY.h3, color: C.blue }}>+ Nova sess\u00e3o de aula</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 20, padding: 4 }}>\u2715</button>
        </div>
        <div style={{ ...TY.caption, color: C.text3, marginBottom: 16 }}>Selecione a \u00e1rea e o tema da aula. O tema entra automaticamente no sistema de revis\u00f5es espa\u00e7adas.</div>

        {/* Area selection */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...TY.overline, color: C.text3, marginBottom: 8 }}>Grande \u00e1rea</div>
          {touched.area && errors.area && <span style={{ fontSize: 11, color: C.red, fontWeight: 500, marginBottom: 6, display: "block" }}>! {errors.area}</span>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {AREAS.map((a) => { const active = form.area === a.id; return (
              <button key={a.id} onClick={() => { set("area", a.id); set("theme", ""); touch("area"); }} style={{ padding: "14px 6px", background: active ? a.color + "12" : C.surface, border: active ? `2px solid ${a.color}55` : `1px solid ${C.border}`, borderRadius: R.xl, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", boxShadow: active ? SH.glow(a.color) : SH.sm, minHeight: 80, opacity: active ? 1 : 0.75, transform: active ? "scale(1.02)" : "scale(1)" }}>
                <div style={{ width: 36, height: 36, borderRadius: R.sm, background: active ? a.color + "22" : C.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: active ? a.color : C.text3, fontFamily: FM }}>{a.short}</div>
                <div style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? a.color : C.text3, textAlign: "center", lineHeight: 1.2 }}>{a.label.split(" ")[0]}</div>
              </button>
            ); })}
          </div>
        </div>

        {form.area && <>
          {/* Theme with auto-complete */}
          <div style={{ marginBottom: 16, position: "relative" }}>
            <div style={{ ...TY.overline, color: C.text3, marginBottom: 8 }}>Tema da aula</div>
            <input
              ref={themeInputRef}
              type="text"
              value={form.theme}
              onChange={(e) => { set("theme", e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => { touch("theme"); validate("theme"); }}
              placeholder="Digite ou selecione abaixo\u2026"
              style={{ ...inp({ ...inputErrorStyle("theme") }), marginBottom: 2, fontSize: 14, padding: "10px 14px" }}
            />
            {touched.theme && errors.theme && <span style={{ fontSize: 11, color: C.red, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>! {errors.theme}</span>}

            {/* Auto-complete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef} style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md,
                boxShadow: SH.lg, maxHeight: 180, overflowY: "auto", marginTop: 4,
              }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { set("theme", s); setShowSuggestions(false); }} style={{
                    width: "100%", textAlign: "left", padding: "10px 14px",
                    background: "none", border: "none", borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: "pointer", fontSize: 13, color: C.text, fontFamily: F,
                    transition: "background 0.1s",
                  }} onMouseEnter={(e) => e.currentTarget.style.background = C.card2}
                     onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Semana theme list */}
            {semanaThemes.length > 0 && (
              <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, padding: 2, marginTop: 8 }}>
                {semanaThemes.map((st, i) => { const active = form.theme === st.topic; return (
                  <button key={i} onClick={() => set("theme", st.topic)} style={{ padding: "10px 14px", background: active ? (selectedArea?.color || C.blue) + "10" : C.surface, border: active ? `1px solid ${(selectedArea?.color || C.blue)}30` : `1px solid ${C.border}`, borderRadius: R.md, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s", minHeight: H.md, opacity: active ? 1 : 0.75 }}>
                    <span style={{ fontSize: 11, color: C.text3, fontFamily: FM, minWidth: 52, flexShrink: 0 }}>{st.semana}</span>
                    <span style={{ fontSize: 13, color: active ? C.text : C.text2, fontWeight: active ? 600 : 400 }}>{st.topic}</span>
                  </button>
                ); })}
              </div>
            )}
          </div>

          <Fld label="Data" style={{ marginBottom: 12 }}>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={{ ...inp(), fontSize: 14, padding: "10px 14px" }} />
          </Fld>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
            <Fld label="Total de quest\u00f5es" error={touched.total && errors.total}>
              <input type="number" min="0" value={form.total} onChange={(e) => set("total", e.target.value)} onBlur={() => { touch("total"); validate("total"); }} style={{ ...inp({ ...inputErrorStyle("total") }), fontSize: 14, padding: "10px 14px" }} />
            </Fld>
            <Fld label="\u2713 Acertos" error={touched.acertos && errors.acertos}>
              <input type="number" min="0" value={form.acertos} onChange={(e) => set("acertos", e.target.value)} onBlur={() => { touch("acertos"); validate("acertos"); }} style={{ ...inp({ borderColor: errors.acertos ? C.red + "88" : "#34D39944", ...(touched.acertos && errors.acertos ? { boxShadow: `0 0 0 2px ${C.red}18` } : {}) }), fontSize: 14, padding: "10px 14px" }} />
            </Fld>
            <div style={{ paddingTop: 22 }}>{pct !== null && <div style={{ background: perfColor(pct) + "22", border: `1px solid ${perfColor(pct)}44`, borderRadius: R.md, padding: "12px 18px", textAlign: "center", transition: "all 0.2s ease" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: perfColor(pct), ...NUM }}>{pct}%</div>
              <div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{perfLabel(pct)}</div>
            </div>}</div>
          </div>

          <button onClick={submit} style={btn("#34D399", { width: "100%", padding: "12px", fontSize: 15, transition: "all 0.2s ease" })}>Registrar sess\u00e3o</button>
        </>}
      </div>
    </div>
  );
}

export { SessionModal };
