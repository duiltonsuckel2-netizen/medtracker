import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AREAS, SEMANAS } from "../data.js";
import { C, F, FM, R, S, H, SH, card, inp, btn, tag } from "../theme.js";
import { today } from "../utils.js";
import { Fld } from "./UI.jsx";
import { useEscapeKey } from "../hooks/useEscapeKey.js";

function SessionModal({ onSave, onClose, subtopics: subtopicDict, revLogs, reviews }) {
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
  const [subtopics, setSubtopics] = useState([]);
  const [newSub, setNewSub] = useState("");
  const [showSubtopics, setShowSubtopics] = useState(false);
  const [subSugFocused, setSubSugFocused] = useState(false);
  const themeRef = useRef(null);
  const sugRef = useRef(null);

  // Collect all known subtopic names for autocomplete
  const allSubNames = useMemo(() => {
    const names = new Set();
    if (subtopicDict) Object.values(subtopicDict).forEach(items => items.forEach(n => names.add(n)));
    (reviews || []).forEach(r => { if (r.isSubtopic && r.theme) names.add(r.theme); });
    (revLogs || []).forEach(l => { if (l.subtopicScores) l.subtopicScores.forEach(s => names.add(s.name)); });
    return [...names].sort();
  }, [subtopicDict, reviews, revLogs]);

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
    // Auto-append (Sem. XX) if a week is selected and not already in the theme
    let finalTheme = theme.trim();
    if (semIdx != null && !/\(Sem\.\s*\d+\)/i.test(finalTheme)) {
      finalTheme += ` (${SEMANAS[semIdx].semana})`;
    }
    const subtopicScores = subtopics.filter((s) => s.name.trim() && s.pct !== "").map((s) => ({ name: s.name.trim(), pct: Number(s.pct) }));
    onSave({ area, theme: finalTheme, total: t, acertos: a, date, semIdx, subtopicScores: subtopicScores.length > 0 ? subtopicScores : undefined });
  }

  function addSubtopic() {
    const n = newSub.trim();
    if (!n || subtopics.some((s) => s.name.toLowerCase() === n.toLowerCase())) return;
    setSubtopics([...subtopics, { name: n, pct: "" }]);
    setNewSub("");
  }

  function removeSubtopic(idx) {
    setSubtopics(subtopics.filter((_, i) => i !== idx));
  }

  function setSubPct(idx, val) {
    if (val !== "" && (Number(val) < 0 || Number(val) > 100)) return;
    setSubtopics(subtopics.map((s, i) => i !== idx ? s : { ...s, pct: val }));
  }

  // Auto-complete: collect theme names from semanas for current area
  const areaShort = AREAS.find((a2) => a2.id === area)?.short || "";

  // All aulas from selected week (both topics, any area)
  const weekAulas = useMemo(() => {
    if (semIdx == null) return [];
    return SEMANAS[semIdx].aulas.map((a) => ({ topic: a.topic, area: a.area }));
  }, [semIdx]);

  // Topics filtered by area (for autocomplete fallback)
  const weekTopics = useMemo(() => {
    return weekAulas.filter((a) => a.area === areaShort).map((a) => a.topic);
  }, [weekAulas, areaShort]);

  const semanaThemes = useMemo(() => {
    if (!areaShort) return [];
    if (semIdx != null) return weekTopics;
    return SEMANAS.flatMap((sem) => sem.aulas.filter((a) => a.area === areaShort).map((a) => a.topic));
  }, [areaShort, semIdx, weekTopics]);

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
          <Fld label="Semana do cronograma (opcional)">
            <select value={semIdx ?? ""} onChange={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); setSemIdx(v); setTheme(""); }} style={inp({ fontSize: 12 })}>
              <option value="">Nenhuma — tema livre</option>
              {SEMANAS.map((s, i) => <option key={i} value={i}>{s.semana} — {s.aulas.map((a) => a.area).join(" + ")}</option>)}
            </select>
          </Fld>
          {/* When a week is selected, show both aulas as quick-select chips */}
          {semIdx != null && weekAulas.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>Aulas da {SEMANAS[semIdx].semana}:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {weekAulas.map((aula, i) => {
                  const sel = theme === aula.topic;
                  const aulaAreaObj = AREAS.find((a2) => a2.short === aula.area);
                  const ac = aulaAreaObj?.color || C.accent;
                  return (
                    <button key={i} onClick={() => { setTheme(aula.topic); if (aulaAreaObj) setArea(aulaAreaObj.id); if (errors.theme) setErrors((er) => ({ ...er, theme: null })); }} style={{ padding: "10px 14px", borderRadius: R.md, border: sel ? `2px solid ${ac}` : `1px solid ${C.border}`, background: sel ? ac + "18" : C.surface, cursor: "pointer", fontSize: 13, fontWeight: sel ? 700 : 400, color: sel ? ac : C.text, fontFamily: F, transition: "all .15s ease", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ ...tag(ac), fontSize: 10, padding: "3px 8px", flexShrink: 0 }}>{aula.area}</span>
                      <span>{aula.topic}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Theme with auto-complete */}
          <div style={{ position: "relative" }}>
            <Fld label={semIdx != null ? "Tema (ou digite outro)" : "Tema"} error={touched.theme && errors.theme}>
              <input ref={themeRef} type="text" value={theme} onChange={(e) => { setTheme(e.target.value); setShowSuggestions(true); if (errors.theme) setErrors((er) => ({ ...er, theme: null })); }} onFocus={() => setShowSuggestions(true)} onBlur={() => { touch("theme"); validate("theme"); }} placeholder={semIdx != null ? "Selecione acima ou digite…" : "Ex: Pneumonia, ICC, Fraturas…"} style={inp(errStyle("theme"))} />
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
          {/* Subtopics section */}
          <div>
            <button onClick={() => setShowSubtopics(!showSubtopics)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: R.md, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: C.text2, fontFamily: F, width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{subtopics.length > 0 ? `${subtopics.length} subtema${subtopics.length > 1 ? "s" : ""}` : "Adicionar subtemas (opcional)"}</span>
              <span style={{ fontSize: 10, transform: showSubtopics ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>▼</span>
            </button>
            {showSubtopics && (
              <div style={{ marginTop: 8, padding: 12, background: C.surface, borderRadius: R.md, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.text3, marginBottom: 8, lineHeight: 1.4 }}>
                  Subtemas entram no sistema de revisão espaçada individualmente.
                </div>
                {subtopics.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {subtopics.map((s, i) => {
                      const val = s.pct !== "" ? Number(s.pct) : null;
                      const pctColor = val !== null ? (val >= 85 ? "#22C55E" : val >= 60 ? "#EAB308" : "#EF4444") : C.text3;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.card2, borderRadius: R.md, border: `1px solid ${val !== null ? pctColor + "40" : C.border}` }}>
                          <span style={{ fontSize: 12, flex: 1 }}>{s.name}</span>
                          <input type="number" min="0" max="100" value={s.pct} onChange={(e) => setSubPct(i, e.target.value)} placeholder="%" style={{ ...inp(), width: 52, padding: "4px 6px", fontSize: 13, textAlign: "center", fontWeight: 700, color: pctColor }} />
                          <span style={{ fontSize: 11, color: C.text3 }}>%</span>
                          <button onClick={() => removeSubtopic(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 13, padding: "2px 4px", opacity: 0.5 }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(() => {
                  const q = newSub.toLowerCase().trim();
                  const currentNames = subtopics.map(s => s.name.toLowerCase());
                  const subSuggestions = q.length >= 2 ? allSubNames.filter(n => n.toLowerCase().includes(q) && !currentNames.includes(n.toLowerCase())).slice(0, 6) : [];
                  return (
                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={newSub} onChange={(e) => setNewSub(e.target.value)} onFocus={() => setSubSugFocused(true)} onBlur={() => setTimeout(() => setSubSugFocused(false), 150)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtopic(); } }} placeholder="Ex: Pneumonia viral, Asma…" style={{ ...inp(), flex: 1, padding: "8px 12px", fontSize: 12 }} />
                      <button onClick={addSubtopic} disabled={!newSub.trim()} style={btn(C.blue, { padding: "8px 12px", fontSize: 12, opacity: newSub.trim() ? 1 : 0.4 })}>+</button>
                    </div>
                    {subSugFocused && subSuggestions.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 40, zIndex: 50, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, marginTop: 2, boxShadow: SH.lg, overflow: "hidden", maxHeight: 180, overflowY: "auto" }}>
                        {subSuggestions.map((s, si) => (
                          <div key={si} onMouseDown={(e) => { e.preventDefault(); setSubtopics(prev => [...prev, { name: s, pct: "" }]); setNewSub(""); }}
                            style={{ padding: "8px 12px", fontSize: 12, cursor: "pointer", borderBottom: si < subSuggestions.length - 1 ? `1px solid ${C.border}` : "none", color: C.text2 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = C.surface}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            )}
          </div>
          <button onClick={submit} style={btn("#34D399", { width: "100%", marginTop: 4 })}>✓ Salvar sessão</button>
        </div>
      </div>
    </div>
  );
}
export { SessionModal };
