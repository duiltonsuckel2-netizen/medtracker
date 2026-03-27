import React from "react";
import { useState, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";
import { AREAS, INTERVALS, INT_LABELS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { today, diffDays, fmtDate, perc, perfColor } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";
import { SubtopicModal, SubtopicReviewModal, CONFIDENCE_OPTS } from "./SubtopicModal.jsx";

function Revisoes({ due, upcoming, revLogs, reviews, sessions, subtopics, onMark, onQuick, onEditLog, onDelLog, onSubtopicReview, onSaveSubtopics }) {
  const [subTab, setSubTab] = useState("proximas");
  const themesByArea = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = [...new Set([...reviews.filter((r) => r.area === a.id).map((r) => r.theme), ...revLogs.filter((r) => r.area === a.id).map((r) => r.theme)])].sort(); }); return o; }, [reviews, revLogs]);
  const emptyQ = { area: "clinica", theme: "", freeTheme: false, total: "", acertos: "" };
  const [qForm, setQForm] = useState(emptyQ); const [showQ, setShowQ] = useState(false); const [marking, setMarking] = useState(null);
  const [subtemaModal, setSubtemaModal] = useState(null);
  const [subtemaImg, setSubtemaImg] = useState(null);
  const [subtemaStatus, setSubtemaStatus] = useState("idle");
  const [subtemaResult, setSubtemaResult] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [stReviewModal, setStReviewModal] = useState(null);
  const [stRegisterModal, setStRegisterModal] = useState(null);
  const [evoArea, setEvoArea] = useState("all");
  const [evoSearch, setEvoSearch] = useState("");
  const [evoFocused, setEvoFocused] = useState(false);
  const setQ = (k, v) => setQForm((f) => ({ ...f, [k]: v }));
  const themeProgress = useMemo(() => {
    const byTheme = {};
    [...revLogs, ...sessions.map((s) => ({ ...s, pct: perc(s.acertos, s.total) }))].forEach((l) => {
      const k = `${l.area}__${l.theme}`;
      if (!byTheme[k]) byTheme[k] = { area: l.area, theme: l.theme, sessions: [] };
      byTheme[k].sessions.push({ date: l.date, pct: l.pct, total: l.total || 0 });
    });
    return Object.values(byTheme)
      .filter((t) => t.sessions.length >= 2)
      .map((t) => {
        const sorted = [...t.sessions].sort((a, b) => a.date.localeCompare(b.date));
        const first = sorted[0].pct; const last = sorted[sorted.length - 1].pct;
        const trend = last - first;
        const avg = Math.round(sorted.reduce((s, x) => s + x.pct, 0) / sorted.length);
        return { ...t, sorted, first, last, trend, avg, n: sorted.length };
      })
      .sort((a, b) => b.n - a.n);
  }, [revLogs, sessions]);
  function submitQ() { const tot = Number(qForm.total), ac = Number(qForm.acertos); const th = qForm.freeTheme ? qForm.theme : (qForm.theme || ""); if (!th.trim()) return alert("Informe o tema."); if (!tot) return alert("Informe o total."); if (ac > tot) return alert("Acertos > total."); onQuick(qForm.area, th, tot, ac); setQForm(emptyQ); setShowQ(false); }
  function submitMark() { const tot = Number(marking.total), ac = Number(marking.acertos); if (!tot) return alert("Informe o total."); if (ac > tot) return alert("Acertos > total."); onMark(marking.id, ac, tot); setMarking(null); }
  const qPct = Number(qForm.total) > 0 ? perc(Number(qForm.acertos), Number(qForm.total)) : null;
  const mPct = marking && Number(marking.total) > 0 ? perc(Number(marking.acertos), Number(marking.total)) : null;
  async function analyzeSubtemaImg(file) {
    setSubtemaStatus("error");
    setSubtemaResult({ analise: "Análise automática indisponível neste ambiente. Identifique seus subtemas fracos manualmente pela plataforma de questões." });
  }
  function getSubtopicsForReview(r) {
    if (!subtopics) return [];
    // Try exact match first: area__theme
    for (const [key, items] of Object.entries(subtopics)) {
      if (!items || items.length === 0) continue;
      const [kArea] = key.split("__");
      if (kArea !== r.area) continue;
      const kTopic = key.slice(kArea.length + 2);
      // Match if review theme contains the topic or vice versa
      if (r.theme.toLowerCase().includes(kTopic.toLowerCase()) || kTopic.toLowerCase().includes(r.theme.toLowerCase().replace(/\s*\(sem\.\s*\d+\)\s*/i, "").trim())) return items;
    }
    return [];
  }
  function handleSubtopicReviewSave(entries) {
    if (!stReviewModal || !onSubtopicReview) return;
    entries.forEach((e) => {
      onSubtopicReview(stReviewModal.area, stReviewModal.theme, e.name, Number(e.total), Number(e.acertos), e.confidence || null);
    });
    setStReviewModal(null);
  }
  const SUB_TABS = [
    { id: "proximas", label: `Próximas${due.length ? ` (${due.length})` : ""}` },
    { id: "evolucao", label: "Evolução" },
    { id: "passadas", label: "Passadas" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 4, background: C.card, borderRadius: R.pill, padding: 4, overflowX: "auto", scrollbarWidth: "none", border: `1px solid ${C.border}`, boxShadow: SH.sm }}>
        {SUB_TABS.map((t) => { const active = subTab === t.id; return (<button key={t.id} onClick={() => setSubTab(t.id)} style={{ padding: "10px 18px", flex: 1, background: active ? C.purple + "20" : "transparent", border: active ? `1px solid ${C.purple}35` : "1px solid transparent", borderRadius: R.pill, cursor: "pointer", color: active ? C.purple : C.text3, fontSize: 13, fontFamily: F, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", minHeight: H.sm, height: H.sm, boxShadow: active ? SH.glow(C.purple) : "none", transition: "all 0.15s ease", opacity: active ? 1 : 0.55, textAlign: "center" }}>{t.label}</button>); })}
      </div>
      {subtemaModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
          <div style={{ background: C.card, borderRadius: 20, padding: 24, maxWidth: 480, width: "100%", border: `1px solid ${C.border2}`, marginTop: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>📊 Análise de subtemas</div>
                <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>{subtemaModal.theme}</div>
              </div>
              <button onClick={() => { setSubtemaModal(null); setSubtemaResult(null); setSubtemaStatus("idle"); }} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ background: C.bg, borderRadius: R.md, padding: 14, marginBottom: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.text3, marginBottom: 8 }}>Mande o print da sua plataforma mostrando o % de acertos por subtema. A IA vai identificar seu pior e melhor subtema e dar uma orientação.</div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.card2, borderRadius: R.sm, cursor: "pointer", border: `1px dashed ${C.border2}` }}>
                <span style={{ fontSize: 20 }}>📷</span>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>Enviar print</div><div style={{ fontSize: 11, color: C.text3 }}>JPG, PNG ou screenshot</div></div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSubtemaImg(URL.createObjectURL(f)); analyzeSubtemaImg(f); } }} />
              </label>
            </div>
            {subtemaImg && <img src={subtemaImg} alt="print" style={{ width: "100%", borderRadius: R.sm, marginBottom: 12, maxHeight: 200, objectFit: "contain", background: C.bg }} />}
            {subtemaStatus === "analyzing" && <div style={{ padding: "12px 14px", background: C.blue + "18", borderRadius: R.sm, fontSize: 12, color: C.blue, fontFamily: FM }}>⏳ IA analisando…</div>}
            {subtemaResult && subtemaStatus === "done" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: C.green + "14", border: `1px solid ${C.green}33`, borderRadius: R.sm, padding: 12 }}>
                    <div style={{ fontSize: 10, color: C.green, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>🏆 Melhor</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{subtemaResult.melhor?.nome || "—"}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.green, ...NUM }}>{subtemaResult.melhor?.pct ?? "-"}%</div>
                  </div>
                  <div style={{ background: "#EF444414", border: "1px solid #EF444433", borderRadius: R.sm, padding: 12 }}>
                    <div style={{ fontSize: 10, color: "#EF4444", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>⚠️ Pior</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{subtemaResult.pior?.nome || "—"}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#EF4444", ...NUM }}>{subtemaResult.pior?.pct ?? "-"}%</div>
                  </div>
                </div>
                {subtemaResult.subtemas?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[...subtemaResult.subtemas].sort((a, b) => b.pct - a.pct).map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, flex: 1, color: C.text2 }}>{s.nome}</span>
                        <div style={{ width: 100, height: 6, background: C.border, borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${s.pct}%`, background: perfColor(s.pct), borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 11, color: perfColor(s.pct), ...NUM, minWidth: 34, textAlign: "right" }}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {subtemaResult.analise && (
                  <div style={{ background: C.blue + "18", border: `1px solid ${C.blue}33`, borderRadius: R.sm, padding: 12, fontSize: 12, color: C.text2, lineHeight: 1.5 }}>💡 {subtemaResult.analise}</div>
                )}
              </div>
            )}
            {subtemaStatus === "error" && <div style={{ padding: 12, background: C.red + "18", borderRadius: R.sm, fontSize: 12, color: C.red }}>{subtemaResult?.analise}</div>}
          </div>
        </div>
      )}
      {stReviewModal && <SubtopicReviewModal area={stReviewModal.area} parentTheme={stReviewModal.theme} subtopics={stReviewModal.items} onSave={handleSubtopicReviewSave} onClose={() => setStReviewModal(null)} />}
      {stRegisterModal && <SubtopicModal area={stRegisterModal.area} topic={stRegisterModal.theme} existing={getSubtopicsForReview({ area: stRegisterModal.area, theme: stRegisterModal.theme })} onSave={(items) => { if (onSaveSubtopics) onSaveSubtopics(stRegisterModal.area, stRegisterModal.theme, items); setStRegisterModal(null); }} onClose={() => setStRegisterModal(null)} />}
      {subTab === "proximas" && <>
      <div style={{ ...card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showQ ? 16 : 0 }}>
          <div><div style={{ fontSize: 15, fontWeight: 600 }}>Registrar revisão</div><div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>Área + tema + acertos</div></div>
          <button onClick={() => setShowQ((v) => !v)} style={btn(showQ ? C.card2 : C.blue, { padding: "8px 14px" })}>{showQ ? "— Fechar" : "+ Registrar"}</button>
        </div>
        {showQ && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="Grande área"><select value={qForm.area} onChange={(e) => setQ("area", e.target.value)} style={inp()}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Fld>
            <Fld label={`Tema ${qForm.freeTheme ? "(livre)" : "(lista)"}`}><div style={{ display: "flex", gap: 6 }}>{!qForm.freeTheme ? <select value={qForm.theme} onChange={(e) => setQ("theme", e.target.value)} style={{ ...inp(), flex: 1 }}><option value="">Selecione…</option>{(themesByArea[qForm.area] || []).map((t) => <option key={t} value={t}>{t}</option>)}</select> : <input type="text" value={qForm.theme} onChange={(e) => setQ("theme", e.target.value)} placeholder="Digite o tema…" style={{ ...inp(), flex: 1 }} />}<button onClick={() => setQ("freeTheme", !qForm.freeTheme)} style={btn(C.card2, { padding: "8px 10px", fontSize: 12 })}>{qForm.freeTheme ? "📋" : "✏️"}</button></div></Fld>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
            <Fld label="Total"><input type="number" min="0" value={qForm.total} onChange={(e) => setQ("total", e.target.value)} style={inp()} /></Fld>
            <Fld label="✓ Acertos"><input type="number" min="0" value={qForm.acertos} onChange={(e) => setQ("acertos", e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{qPct !== null && <div style={{ textAlign: "center", fontSize: 16, fontWeight: 700, color: perfColor(qPct), ...NUM }}>{qPct}%</div>}<button onClick={submitQ} style={btn("#34D399", { padding: "9px 14px" })}>Salvar</button></div>
          </div>
        </div>}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><div style={{ fontSize: 15, fontWeight: 700, color: C.red }}>Revisões vencidas</div>{due.length > 0 && <span style={tag(C.red)}>{due.length}</span>}</div>
        {due.length === 0 ? <Empty msg="Nenhuma revisão vencida. Ótimo!" green /> : due.map((r) => {
          const a = areaMap[r.area]; const days = diffDays(r.nextDue, today()); const isM = marking?.id === r.id;
          return (
            <div key={r.id} style={{ ...card, borderLeft: `3px solid ${C.red}`, marginBottom: S.sm, boxShadow: SH.sm }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{r.theme}</span>
                    <span style={tag(a?.color || "#6B7280")}>{a?.label}</span>
                    <span style={tag(C.red)}>{days === 0 ? "hoje" : `${Math.abs(days)}d atraso`}</span>
                    <span style={tag(C.text3)}>{INT_LABELS[r.intervalIndex]}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>Último: <span style={{ color: perfColor(r.lastPerf) }}>{r.lastPerf}%</span> em {fmtDate(r.lastStudied)} · {r.history?.length || 0}× revisado</div>
                  {r.subtemaNote && (
                    <div style={{ marginTop: 6, padding: "5px 10px", background: C.bg, borderRadius: R.sm, fontSize: 11, color: C.text3, border: `1px solid ${C.border}` }}>
                      ⚠️ Pior subtema anterior: <span style={{ color: "#EF4444", fontWeight: 600 }}>{r.subtemaNote.pior?.nome}</span> ({r.subtemaNote.pior?.pct}%)
                    </div>
                  )}
                  {isM && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, alignItems: "flex-end", marginTop: 10 }}>
                    <Fld label="Total"><input type="number" min="0" value={marking.total} onChange={(e) => setMarking((m) => ({ ...m, total: e.target.value }))} style={inp()} autoFocus /></Fld>
                    <Fld label="✓ Acertos"><input type="number" min="0" value={marking.acertos} onChange={(e) => setMarking((m) => ({ ...m, acertos: e.target.value }))} style={inp({ borderColor: "#34D39944" })} /></Fld>
                    {mPct !== null && <div style={{ textAlign: "center", paddingBottom: 2, fontSize: 16, fontWeight: 700, color: perfColor(mPct), ...NUM }}>{mPct}%</div>}
                    <div style={{ display: "flex", gap: 6, paddingBottom: 2 }}><button onClick={submitMark} style={btn("#34D399", { padding: "9px 12px" })}>✓</button><button onClick={() => setMarking(null)} style={btn(C.card2, { padding: "9px 10px" })}>✕</button></div>
                  </div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {!isM && <button onClick={() => setMarking({ id: r.id, total: "", acertos: "" })} style={btn("#3B82F6", { padding: "8px 14px" })}>Registrar</button>}
                  {(() => { const st = getSubtopicsForReview(r); return st.length > 0
                    ? <button onClick={() => setStReviewModal({ area: r.area, theme: r.theme, items: st })} style={btn(C.purple + "20", { padding: "6px 10px", fontSize: 11, color: C.purple, border: `1px solid ${C.purple}35` })}>📋 Detalhar subtemas ({st.length})</button>
                    : <button onClick={() => setStRegisterModal({ area: r.area, theme: r.theme })} style={btn(C.card2, { padding: "6px 10px", fontSize: 11 })}>📋 Adicionar subtemas</button>;
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {(() => {
        // Group upcoming reviews by timeframe
        const groups = [];
        const thisWeek = [], nextWeek = [], later = [];
        upcoming.forEach((r) => {
          const days = diffDays(r.nextDue, today());
          if (days <= 7) thisWeek.push(r);
          else if (days <= 14) nextWeek.push(r);
          else later.push(r);
        });
        if (thisWeek.length) groups.push({ label: "Esta semana", items: thisWeek, accent: C.blue });
        if (nextWeek.length) groups.push({ label: "Próxima semana", items: nextWeek, accent: C.purple });
        if (later.length) groups.push({ label: "Mais adiante", items: later, accent: C.text3 });

        if (upcoming.length === 0) return <Empty icon="📅" msg="Nenhuma revisão futura agendada." />;

        return groups.map((g) => (
          <div key={g.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 16, borderRadius: 2, background: g.accent }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: g.accent }}>{g.label}</span>
              <span style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>({g.items.length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {g.items.map((r) => {
                const a = areaMap[r.area]; const days = diffDays(r.nextDue, today());
                const aColor = a?.color || "#6B7280";
                const urgency = days <= 2 ? 1 : days <= 5 ? 0.6 : 0.35;
                return (
                  <div key={r.id} style={{ ...card, padding: `${S.lg}px`, borderRadius: R.lg, borderLeft: `3px solid ${aColor}`, display: "flex", alignItems: "center", gap: S.lg }}>
                    {/* Days countdown */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 44, padding: "6px 0" }}>
                      <span style={{ fontSize: 22, fontWeight: 800, fontFamily: FN, color: days <= 3 ? C.yellow : C.text, lineHeight: 1 }}>{days}</span>
                      <span style={{ fontSize: 10, color: C.text3, fontWeight: 500 }}>dias</span>
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>{r.theme}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ ...tag(aColor), borderLeft: `2px solid ${aColor}` }}>{a?.short}</span>
                        <span style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{INT_LABELS[r.intervalIndex]}</span>
                        <span style={{ fontSize: 10, color: C.text3 }}>{fmtDate(r.nextDue)}</span>
                      </div>
                    </div>
                    {/* Performance indicator + subtemas */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: perfColor(r.lastPerf) + "18", border: `2px solid ${perfColor(r.lastPerf)}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: perfColor(r.lastPerf), fontFamily: FN }}>{r.lastPerf}%</span>
                      </div>
                      {(() => { const st = getSubtopicsForReview(r); return st.length > 0
                        ? <button onClick={() => setStReviewModal({ area: r.area, theme: r.theme, items: st })} style={{ background: C.purple + "14", border: `1px solid ${C.purple}30`, borderRadius: R.md, cursor: "pointer", fontSize: 10, color: C.purple, height: 32, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 600, fontFamily: FM, gap: 3 }} title="Detalhar subtemas">📋 {st.length}</button>
                        : <button onClick={() => setStRegisterModal({ area: r.area, theme: r.theme })} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, cursor: "pointer", fontSize: 10, color: C.text3, height: 32, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FM, gap: 3 }} title="Adicionar subtemas">📋 sub</button>;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ));
      })()}
      <div style={{ ...card, background: C.surface, border: `1px solid ${C.blue}30` }}><div style={{ fontSize: 13, fontWeight: 600, color: C.blue, marginBottom: S.sm }}>Intervalos</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>{INTERVALS.map((iv, i) => <div key={i} style={{ background: C.card2, borderRadius: R.sm, padding: "5px 12px", fontSize: 11, color: C.text2, fontFamily: FM, fontWeight: 500 }}>{INT_LABELS[i]}</div>)}</div><div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>≥85% → avança · 75–84% → mantém · &lt;75% → volta um</div></div>
      </>}
      {subTab === "evolucao" && (() => {
        const evoFiltered = themeProgress.filter((t) => (evoArea === "all" || t.area === evoArea) && (!evoSearch || t.theme.toLowerCase().includes(evoSearch.toLowerCase())));
        const evoSuggestions = evoSearch.length >= 1 && evoFocused ? [...new Set(themeProgress.map((t) => t.theme))].filter((th) => th.toLowerCase().includes(evoSearch.toLowerCase())).slice(0, 6) : [];
        const evoChip = (active, color) => ({ padding: "7px 16px", fontSize: 12, fontFamily: F, fontWeight: active ? 700 : 500, minHeight: H.sm, height: H.sm, borderRadius: R.pill, cursor: "pointer", background: active ? (color || C.card2) : "transparent", border: active ? `1px solid ${color ? color + "60" : C.border2}` : `1px solid ${C.border}`, color: active ? (color ? "#fff" : C.text) : C.text3, boxShadow: active ? SH.sm : "none", transition: "all 0.15s" });
        return <>
        <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>Evolução de cada tema ao longo das revisões. Verde = melhorando, vermelho = caindo.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.text3, pointerEvents: "none" }}>🔍</div>
            <input value={evoSearch} onChange={(e) => setEvoSearch(e.target.value)} onFocus={() => setEvoFocused(true)} onBlur={() => setTimeout(() => setEvoFocused(false), 150)} placeholder="Buscar tema…" style={{ ...inp(), width: "100%", padding: "12px 16px 12px 38px", fontSize: 14 }} />
            {evoSuggestions.length > 0 && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, marginTop: 4, boxShadow: SH.lg, overflow: "hidden" }}>
              {evoSuggestions.map((s) => <div key={s} onMouseDown={() => { setEvoSearch(s); setEvoFocused(false); }} style={{ padding: "10px 16px", fontSize: 13, color: C.text, cursor: "pointer", borderBottom: `1px solid ${C.border}` }} onMouseEnter={(e) => e.currentTarget.style.background = C.card2} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{s}</div>)}
            </div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => setEvoArea("all")} style={evoChip(evoArea === "all")}>Todas</button>
            {AREAS.map((a) => <button key={a.id} onClick={() => setEvoArea(a.id)} style={evoChip(evoArea === a.id, a.color)}>{a.short}</button>)}
          </div>
        </div>
        {evoFiltered.length === 0 && <Empty msg={themeProgress.length === 0 ? "Faça ao menos 2 sessões do mesmo tema para ver a evolução." : "Nenhum tema encontrado com esses filtros."} />}
        {evoFiltered.map((t, i) => {
          const a = areaMap[t.area];
          const trendColor = t.trend >= 10 ? C.green : t.trend >= -5 ? C.yellow : C.red;
          const chartData = t.sorted.map((s, si) => ({ n: si + 1, pct: s.pct, date: fmtDate(s.date) }));
          return (
            <div key={i} style={{ ...card, padding: `${S.xl}px` }}>
              <div style={{ marginBottom: S.lg }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: S.xs }}>{t.theme}</div>
                <div style={{ fontSize: 12, color: C.text3 }}><span style={{ color: a?.color, fontWeight: 600 }}>{a?.label}</span> <span style={{ color: C.border2 }}>·</span> {t.n} sessões</div>
              </div>
              <div style={{ display: "flex", gap: S.lg, alignItems: "center", marginBottom: S.xl }}>
                <div><div style={{ fontSize: 10, color: C.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>início</div><div style={{ fontSize: 18, fontWeight: 800, color: perfColor(t.first), fontFamily: FN, lineHeight: 1 }}>{t.first}%</div></div>
                <span style={{ fontSize: 14, color: C.border2 }}>→</span>
                <div><div style={{ fontSize: 10, color: C.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>última</div><div style={{ fontSize: 18, fontWeight: 800, color: perfColor(t.sorted[t.sorted.length - 2]?.pct ?? t.first), fontFamily: FN, lineHeight: 1 }}>{t.sorted.length >= 2 ? t.sorted[t.sorted.length - 2].pct : t.first}%</div></div>
                <span style={{ fontSize: 14, color: C.border2 }}>→</span>
                <div><div style={{ fontSize: 10, color: C.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>atual</div><div style={{ fontSize: 18, fontWeight: 800, color: perfColor(t.last), fontFamily: FN, lineHeight: 1 }}>{t.last}%</div></div>
                <div style={{ marginLeft: "auto", fontSize: 11, color: trendColor, fontWeight: 700, fontFamily: FN, padding: "4px 10px", borderRadius: R.pill, background: trendColor + "14" }}>{t.trend >= 0 ? "+" : ""}{t.trend}pp</div>
              </div>
              <ResponsiveContainer width="100%" height={64}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <Line type="monotone" dataKey="pct" stroke={a?.color || C.blue} strokeWidth={1.5} dot={{ fill: a?.color || C.blue, r: 2.5, strokeWidth: 0 }} />
                  <ReferenceLine y={85} stroke={C.text3} strokeDasharray="4 4" strokeWidth={0.5} strokeOpacity={0.5} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R.sm, padding: "6px 10px", fontSize: 11, fontFamily: FN }}>{payload[0].payload.date}: <span style={{ fontWeight: 700 }}>{payload[0].value}%</span></div> : null} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </>;
      })()}
      {subTab === "passadas" && <>
      {revLogs.length === 0 ? <Empty msg="Nenhuma revisão registrada ainda." /> : <div style={card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Histórico de revisões</div>{revLogs.slice(0, 50).map((l) => { const a = areaMap[l.area]; const isEd = editingLog?.id === l.id; return (
        <div key={l.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: perfColor(l.pct), ...NUM, minWidth: 38 }}>{l.pct}%</span>
            <span style={tag(a?.color || "#6B7280")}>{a?.short}</span>
            <span style={{ fontSize: 12, color: C.text2, flex: 1 }}>{l.theme || "—"}</span>
            {l.isSubtopic && <span style={{ fontSize: 10, color: C.purple, fontFamily: FM }}>subtema</span>}
            {l.confidence && <span style={{ fontSize: 12 }} title={CONFIDENCE_OPTS.find((c) => c.id === l.confidence)?.label}>{CONFIDENCE_OPTS.find((c) => c.id === l.confidence)?.icon}</span>}
            {l.subtemas && !l.isSubtopic && <span style={{ fontSize: 10, color: C.purple, fontFamily: FM }}>+subtemas</span>}
            <span style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{fmtDate(l.date)} · {l.total}q</span>
            <button onClick={() => { if (isEd) { setEditingLog(null); } else { setEditingLog({ id: l.id, area: l.area, theme: l.theme, total: l.total, acertos: l.acertos, subtemas: l.subtemas || "" }); } }} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 11, padding: "2px 4px" }}>{isEd ? "▲" : "✏"}</button>
            <button onClick={() => { if (confirm("Remover esta revisão?")) onDelLog(l.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.border2, fontSize: 12, padding: "2px 4px" }}>✕</button>
          </div>
          {l.subtemas && !isEd && <div style={{ marginTop: 4, marginLeft: 48, fontSize: 11, color: C.text3, background: C.surface, padding: "4px 10px", borderRadius: R.sm, border: `1px solid ${C.border}` }}>📋 {l.subtemas}</div>}
          {isEd && <div style={{ marginTop: 8, marginLeft: 48, display: "flex", flexDirection: "column", gap: 8, padding: 12, background: C.surface, borderRadius: R.md, border: `1px solid ${C.border2}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              <Fld label="Área"><select value={editingLog.area} onChange={(e) => setEditingLog((f) => ({ ...f, area: e.target.value }))} style={inp({ padding: "6px 8px", fontSize: 12 })}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.short}</option>)}</select></Fld>
              <Fld label="Tema"><input value={editingLog.theme} onChange={(e) => setEditingLog((f) => ({ ...f, theme: e.target.value }))} style={inp({ padding: "6px 8px", fontSize: 12 })} /></Fld>
              <Fld label="Total"><input type="number" value={editingLog.total} onChange={(e) => setEditingLog((f) => ({ ...f, total: Number(e.target.value) }))} style={inp({ padding: "6px 8px", fontSize: 12 })} /></Fld>
              <Fld label="Acertos"><input type="number" value={editingLog.acertos} onChange={(e) => setEditingLog((f) => ({ ...f, acertos: Number(e.target.value) }))} style={inp({ padding: "6px 8px", fontSize: 12 })} /></Fld>
            </div>
            <Fld label="Subtemas (anotações livres)"><input value={editingLog.subtemas} onChange={(e) => setEditingLog((f) => ({ ...f, subtemas: e.target.value }))} placeholder="Ex: Pior em farmacologia, bom em diagnóstico…" style={inp({ padding: "6px 8px", fontSize: 12 })} /></Fld>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { onEditLog(editingLog.id, editingLog); setEditingLog(null); }} style={btn("#34D399", { padding: "6px 14px", fontSize: 12 })}>✓ Salvar</button>
              <button onClick={() => setEditingLog(null)} style={btn(C.card2, { padding: "6px 14px", fontSize: 12 })}>Cancelar</button>
            </div>
          </div>}
        </div>
      ); })}</div>}
      </>}
    </div>
  );
}

export { Revisoes };
