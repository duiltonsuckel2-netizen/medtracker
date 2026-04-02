import React from "react";
import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { AREAS, BENCHMARKS, CATS, areaMap, EXAM_THEMES_DB, KNOWN_PDFS, UFCSPA_2026_ANALYSIS, EXAM_ANALYSES, generateExamAnalysis, computeGlobalPrevalence, _themesMatch } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { today, fmtDate, perc, uid, perfColor, perfLabel, catColor, mapThemeToSchedule, mapThemeToStudy, searchKnownPdf, defaultAreaForQuestion, buildDefaultQDetails } from "../utils.js";
import { Fld, Empty, ChartTip } from "./UI.jsx";

function Provas({ exams, revLogs, sessions, subtopics: userSubtopics, onAdd, onDel, onUpdate }) {
  const [step, setStep] = useState(0);
  const [detail, setDetail] = useState(null);
  const [examMeta, setExamMeta] = useState({ date: today(), name: "", total: 120 });
  const [qMap, setQMap] = useState({});
  const [qDetails, setQDetails] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pdfStatus, setPdfStatus] = useState("idle");
  const [pdfMsg, setPdfMsg] = useState("");
  const [sortMode, setSortMode] = useState("best");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [expandedBlock, setExpandedBlock] = useState(0);
  const [panoramaView, setPanoramaView] = useState(false);
  const allLogs = useMemo(() => [...revLogs, ...sessions.map((s) => ({ ...s, pct: perc(s.acertos, s.total) }))], [revLogs, sessions]);
  const knownThemes = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = [...new Set(allLogs.filter((l) => l.area === a.id).map((l) => l.theme))].sort(); }); return o; }, [allLogs]);
  const reset = () => { setStep(0); setExamMeta({ date: today(), name: "", total: 120 }); setQMap({}); setQDetails({}); setSearchQuery(""); setSearchResults([]); setPdfStatus("idle"); setPdfMsg(""); setAiAnalysis(null); };
  const total = Number(examMeta.total) || 0;
  const questions = Array.from({ length: total }, (_, i) => i + 1);
  const classified = Object.keys(qMap).length;
  const acertos = Object.values(qMap).filter((v) => v === "soube" || v === "chutou").length;
  const pctGeral = classified > 0 ? perc(acertos, classified) : null;
  function cycleQ(n) { setQMap((m) => { const cur = m[n] || null; const idx = CATS.map(c=>c.id).indexOf(cur); const cycle = [null, ...CATS.map(c=>c.id)]; const ci = cycle.indexOf(cur); const next = cycle[(ci + 1) % cycle.length]; if (next === null) { const { [n]: _, ...rest } = m; return rest; } return { ...m, [n]: next }; }); }
  const needArea = questions.filter((n) => qMap[n] === "errou_viu" || qMap[n] === "errou_nao");
  const allAreasFilled = needArea.every((n) => qDetails[n]?.area);
  function handleSearch(q) { setSearchQuery(q); setSearchResults(searchKnownPdf(q)); }
  function selectKnownPdf(r) { setExamMeta((m) => ({ ...m, name: r.name, total: r.total })); setSearchQuery(r.name); setPdfStatus("idle"); setPdfMsg(""); }
  function analyzeByName() {
    const nome = examMeta.name.trim();
    const qtotal = Number(examMeta.total) || 100;
    if (!nome) return alert("Selecione ou preencha o nome da prova.");
    const searchKey = nome.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    let dbKey = Object.keys(EXAM_THEMES_DB).find((k) => {
      const kn = k.toLowerCase();
      return searchKey.includes(kn) || kn.includes(searchKey) || searchKey.split(" ").every((w) => kn.includes(w));
    });
    if (dbKey && EXAM_THEMES_DB[dbKey]) {
      const dbThemes = EXAM_THEMES_DB[dbKey];
      const det = {};
      const enriched = [];
      Object.entries(dbThemes).forEach(([n, d]) => {
        const num = Number(n);
        const studyMatch = mapThemeToStudy(d.t, d.a, userSubtopics);
        det[num] = { area: d.a, theme: d.t, prev: d.prev || null, schedule: studyMatch, matchedSubtopic: studyMatch?.matchedSubtopic || null };
        enriched.push({ n: num, theme: d.t, area: d.a, schedule: studyMatch, matchedSubtopic: studyMatch?.matchedSubtopic || null });
      });
      setQDetails(det); setAiAnalysis(enriched); setPdfStatus("done");
      setPdfMsg("✓ " + Object.keys(dbThemes).length + " temas carregados do banco"); setStep(2);
    } else {
      const det = buildDefaultQDetails(qtotal); setQDetails(det); setAiAnalysis(null); setPdfStatus("done");
      setPdfMsg("⚠ Prova não encontrada no banco. Áreas pré-mapeadas por bloco. Temas em branco."); setStep(2);
    }
  }
  function handleUpload() { const nome = examMeta.name.trim(); if (!nome) return alert("Selecione ou preencha o nome da prova primeiro."); analyzeByName(); }
  function buildExam() {
    const cats = { soube: [], chutou: [], errou_viu: [], errou_nao: [] };
    Object.entries(qMap).forEach(([n, cat]) => cats[cat]?.push(Number(n)));
    const total2 = Object.keys(qMap).length;
    const acertos2 = cats.soube.length + cats.chutou.length;
    const ar = {}; AREAS.forEach((a) => { ar[a.id] = { soube: 0, chutou: 0, errou_viu: 0, errou_nao: 0, total: 0 }; });
    [...cats.errou_viu, ...cats.errou_nao].forEach((n) => { const d = qDetails[n]; if (!d?.area) return; const c = cats.errou_viu.includes(n) ? "errou_viu" : "errou_nao"; ar[d.area][c]++; ar[d.area].total++; });
    cats.soube.forEach((n) => { const d = qDetails[n]; if (d?.area) { ar[d.area].soube++; ar[d.area].total++; } });
    cats.chutou.forEach((n) => { const d = qDetails[n]; if (d?.area) { ar[d.area].chutou++; ar[d.area].total++; } });
    onAdd({ date: examMeta.date, name: examMeta.name, total: total2, acertos: acertos2, cats, qDetails, areaResults: ar, aiAnalysis });
    reset();
  }
  const isLoading = pdfStatus === "loading" || pdfStatus === "analyzing";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {step === 0 && <>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setStep(1)} style={{ ...btn(C.blue), padding: "12px 24px", fontSize: 14, fontWeight: 600, flex: 1, borderRadius: R.lg, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>📝 Registrar prova</button>
          {exams.length >= 2 && <button onClick={() => setPanoramaView(!panoramaView)} style={{ ...btn(panoramaView ? C.purple : C.card2), padding: "12px 18px", fontSize: 13, fontWeight: 600, borderRadius: R.lg, display: "flex", alignItems: "center", gap: 6, border: panoramaView ? "none" : `1px solid ${C.border}`, color: panoramaView ? "#fff" : C.purple }}>{panoramaView ? "← Provas" : "📊 Panorama Geral"}</button>}
        </div>
        {panoramaView ? <PanoramaGeral exams={exams} /> : <>
          <div style={{ background: C.surface, borderRadius: R.lg, padding: "10px 14px", border: `1px solid ${C.border}`, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5 }}>Prevalência:</span>
            {[{l:"Muito alta",c:C.green,d:"75%+ das provas"},{l:"Alta",c:"#60A5FA",d:"50%+"},{l:"Média",c:"#FBBF24",d:"25%+"},{l:"Baixa",c:C.text3,d:"raro/inédito"}].map((p,i)=>(
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.c }} />
                <span style={{ fontSize: 9, color: p.c, fontWeight: 600 }}>{p.l}</span>
                <span style={{ fontSize: 8, color: C.text3, fontFamily: FM }}>({p.d})</span>
              </div>
            ))}
            <span style={{ fontSize: 8, color: C.text3, fontFamily: FM, marginLeft: "auto" }}>Base: {Object.keys(EXAM_THEMES_DB).length} provas · Diagnóstico conta apenas "soube"</span>
          </div>
          {exams.length >= 2 && <ExamComparison exams={exams} sortMode={sortMode} setSortMode={setSortMode} />}
          {exams.length === 0 ? <Empty icon="📋" msg="Nenhuma prova registrada ainda. Registre sua primeira prova para acompanhar seu desempenho." /> : exams.map((exam) => <ExamCard key={exam.id} exam={exam} allLogs={allLogs} isOpen={detail === exam.id} onToggle={() => setDetail(detail === exam.id ? null : exam.id)} onDel={onDel} onUpdate={onUpdate} knownThemes={knownThemes} userSubtopics={userSubtopics} />)}
        </>}
      </>}
      {step === 1 && <div style={{ ...card, border: `1px solid ${C.blue}40`, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.blue, letterSpacing: -0.3 }}>📝 Nova prova</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Preencha os dados e classifique as questões</div>
          </div>
          <button onClick={reset} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: C.text3, fontFamily: F }}>✕ Cancelar</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12 }}>
          <Fld label="Data"><input type="date" value={examMeta.date} onChange={(e) => setExamMeta((m) => ({ ...m, date: e.target.value }))} style={inp()} /></Fld>
          <Fld label="Nome da prova"><input type="text" value={examMeta.name} onChange={(e) => setExamMeta((m) => ({ ...m, name: e.target.value }))} placeholder="Ex: UFCSPA 2023, IAMSPE 2024…" style={inp()} /></Fld>
          <Fld label="Nº questões"><input type="number" min="1" max="200" value={examMeta.total} onChange={(e) => setExamMeta((m) => ({ ...m, total: e.target.value }))} style={inp()} /></Fld>
        </div>
        <div style={{ background: C.bg, borderRadius: R.md, padding: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Banco de provas</div>
          <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onFocus={() => setSearchResults(KNOWN_PDFS)} placeholder="Filtrar… (UFCSPA, UNICAMP, IAMSPE…)" style={inp({ fontSize: 12, padding: "8px 12px" })} disabled={isLoading} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
            {(searchResults.length > 0 ? searchResults : KNOWN_PDFS).map((r, i) => (
              <button key={i} onClick={() => selectKnownPdf(r)} disabled={isLoading} style={{ background: examMeta.name === r.name ? C.blue + "22" : C.card2, border: `1px solid ${examMeta.name === r.name ? C.blue : C.border}`, borderRadius: R.sm, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                <span style={{ fontSize: 11 }}>📄</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: examMeta.name === r.name ? C.blue : C.text }}>{r.name}</div><div style={{ fontSize: 10, color: C.text3 }}>{r.total} questões</div></div>
                {examMeta.name === r.name && <span style={{ fontSize: 10, color: C.blue, fontWeight: 700 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        {pdfStatus !== "idle" && <div style={{ padding: "10px 14px", borderRadius: R.sm, background: pdfStatus === "error" ? C.red + "18" : pdfStatus === "done" ? C.green + "18" : C.blue + "18", border: `1px solid ${pdfStatus === "error" ? C.red : pdfStatus === "done" ? C.green : C.blue}44`, fontSize: 12, color: pdfStatus === "error" ? C.red : pdfStatus === "done" ? C.green : C.blue, fontFamily: FM }}>{isLoading && "⏳ "}{pdfMsg}</div>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => { if (!examMeta.name.trim()) return alert("Preencha o nome."); analyzeByName(); }} style={btn(C.blue, { padding: "10px 18px" })} disabled={isLoading}>🧠 Analisar pelo nome</button>
          <button onClick={() => { if (!examMeta.name.trim()) return alert("Preencha o nome."); if (!Number(examMeta.total)) return alert("Preencha o nº."); setPdfStatus("idle"); setPdfMsg(""); setStep(2); }} style={btn(C.card2)} disabled={isLoading}>Sem análise →</button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {CATS.map((cat) => <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color }} /><span style={{ fontSize: 11, color: C.text2 }}>{cat.label}</span></div>)}
        </div>
      </div>}
      {step === 2 && <div style={{ ...card, border: `1px solid ${C.blue}55`, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>{examMeta.name}</div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FM, marginTop: 2 }}>Clique para classificar · clique novamente para mudar{aiAnalysis && <span style={{ color: C.green, marginLeft: 8 }}>✓ IA identificou {aiAnalysis.length} temas</span>}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {pctGeral !== null && <div style={{ fontSize: 20, fontWeight: 700, color: perfColor(pctGeral), ...NUM }}>{pctGeral}%</div>}
            <span style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>{classified}/{total} classificadas</span>
            <button onClick={() => setStep(1)} style={btn(C.card2, { padding: "6px 12px", fontSize: 12 })}>← Voltar</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATS.map((cat) => (<div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: cat.color + "18", border: `1px solid ${cat.color}33` }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} /><span style={{ fontSize: 12, color: cat.color, fontWeight: 600 }}>{cat.label}</span><span style={{ fontSize: 12, color: cat.color, fontWeight: 700, fontFamily: FM }}>{Object.values(qMap).filter((v) => v === cat.id).length}</span></div>))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: Math.ceil(total / 20) }, (_, bi) => {
            const blockStart = bi * 20 + 1;
            const blockEnd = Math.min((bi + 1) * 20, total);
            const blockQs = questions.filter((n) => n >= blockStart && n <= blockEnd);
            const blockDone = blockQs.filter((n) => qMap[n]).length;
            const isOpen = expandedBlock === bi;
            return (
              <div key={bi} style={{ border: `1px solid ${C.border}`, borderRadius: R.md, overflow: "hidden" }}>
                <button onClick={() => setExpandedBlock(isOpen ? -1 : bi)} style={{ width: "100%", padding: "10px 14px", background: isOpen ? C.card2 : C.surface, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: C.text, fontFamily: FM, fontSize: 12, fontWeight: 600 }}>
                  <span>{isOpen ? "▼" : "▶"}</span>
                  <span>Questões {blockStart}–{blockEnd}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: blockDone === blockQs.length && blockDone > 0 ? C.green : C.text3 }}>{blockDone}/{blockQs.length}</span>
                </button>
                {isOpen && <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "8px", maxHeight: 400, overflowY: "auto" }}>
                  {blockQs.map((n) => {
                    const cat = qMap[n] || null;
                    const aiQ = aiAnalysis?.find((q) => q.n === n);
                    const themeTxt = aiQ?.theme || qDetails[n]?.theme || "";
                    return (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: cat ? catColor(cat) + "0C" : C.surface, borderRadius: R.md, border: `1px solid ${cat ? catColor(cat) + "30" : C.border}`, transition: "background 0.1s" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: cat ? catColor(cat) : C.text3, fontFamily: FM, minWidth: 28, textAlign: "center" }}>{n}</span>
                        <div style={{ display: "flex", gap: 5 }}>
                          {CATS.map((c) => { const isActive = cat === c.id; return (
                            <button key={c.id} onClick={() => setQMap((m) => { if (isActive) { const { [n]: _, ...rest } = m; return rest; } return { ...m, [n]: c.id }; })} title={c.label} style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${isActive ? c.color : c.color + "40"}`, background: isActive ? c.color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, transition: "all 0.1s" }}>
                              {isActive && <span style={{ color: "#000", fontSize: 10, fontWeight: 800 }}>✓</span>}
                            </button>
                          ); })}
                        </div>
                        {themeTxt && <span style={{ fontSize: 10, color: C.text3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{themeTxt}</span>}
                      </div>
                    );
                  })}
                </div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => { const m = {}; questions.forEach((n) => { if (!qMap[n]) m[n] = "soube"; }); setQMap((q) => ({ ...q, ...m })); }} style={btn(C.card2, { padding: "7px 14px", fontSize: 12 })}>✓ Marcar restantes como Soube</button>
          <button onClick={() => setQMap({})} style={{ ...btn(C.card2, { padding: "7px 14px", fontSize: 12 }), color: C.red }}>Limpar tudo</button>
        </div>
        {aiAnalysis && aiAnalysis.length > 0 && (
          <div style={{ background: C.bg, borderRadius: R.md, padding: 12, border: `1px solid ${C.border}`, maxHeight: 180, overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Temas identificados pela IA</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {aiAnalysis.slice(0, 30).map((q) => { const a = areaMap[q.area]; return (
                <div key={q.n} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: a?.color + "14", border: `1px solid ${a?.color || C.border}22`, fontSize: 10, fontFamily: FM }}>
                  <span style={{ color: a?.color, fontWeight: 700 }}>{q.n}</span>
                  <span style={{ color: C.text2 }}>{q.theme}</span>
                  {q.schedule && <span style={{ color: C.text3 }}>· {q.schedule.semana}</span>}
                </div>
              ); })}
              {aiAnalysis.length > 30 && <span style={{ fontSize: 10, color: C.text3, padding: "2px 8px" }}>+{aiAnalysis.length - 30} mais…</span>}
            </div>
          </div>
        )}
        {classified > 0 && (
          <button onClick={() => needArea.length > 0 ? setStep(3) : buildExam()} style={btn(C.green)}>
            {needArea.length > 0 ? `Próximo → indicar áreas (${needArea.length} erradas)` : "✓ Salvar prova"}
          </button>
        )}
      </div>}
      {step === 3 && <div style={{ ...card, border: `1px solid ${C.blue}55`, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>Áreas das questões erradas</div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{needArea.length} questões · {aiAnalysis ? "IA já preencheu área e tema — confira" : "preencha manualmente"}</div>
          </div>
          <button onClick={() => setStep(2)} style={btn(C.card2, { padding: "6px 12px", fontSize: 12 })}>← Voltar</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
          {needArea.map((n) => {
            const cat = CATS.find((c) => c.id === qMap[n]);
            const d = qDetails[n] || {};
            return (
              <div key={n} style={{ background: C.bg, borderRadius: R.md, padding: 12, border: `1px solid ${cat?.color || C.border}44` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat?.color, flexShrink: 0 }} />
                  <div style={{ width: 30, height: 30, borderRadius: R.sm, background: cat?.color + "22", border: `2px solid ${cat?.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cat?.color, fontFamily: FM }}>{n}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cat?.color }}>{cat?.label}</span>
                  {d.schedule && <span style={{ fontSize: 10, color: C.blue, fontFamily: FM, background: C.blue + "14", padding: "1px 6px", borderRadius: 4 }}>📅 {d.schedule.semana}</span>}
                  {!d.area && <span style={{ fontSize: 10, color: C.red, fontFamily: FM, marginLeft: "auto" }}>⚠ obrigatório</span>}
                  {d.area && <span style={{ fontSize: 10, color: C.green, fontFamily: FM, marginLeft: "auto" }}>✓ preenchido</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Fld label="Área"><select value={d.area || ""} onChange={(e) => { const sel = e.target.value; setQDetails((dd) => ({ ...dd, [n]: { ...(dd[n] || {}), area: sel, schedule: mapThemeToSchedule(dd[n]?.theme || "") } })); }} style={inp({ borderColor: !d.area ? "#F87171" : C.green + "66" })}><option value="">Selecione…</option>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Fld>
                  <Fld label="Tema"><input type="text" value={d.theme || ""} onChange={(e) => { const t = e.target.value; setQDetails((dd) => ({ ...dd, [n]: { ...(dd[n] || {}), theme: t, schedule: mapThemeToSchedule(t) } })); }} placeholder="tema…" style={inp({ borderColor: d.theme ? C.green + "44" : C.border2 })} /></Fld>
                </div>
                {d.schedule && (<div style={{ marginTop: 8, padding: "6px 10px", background: C.blue + "10", borderRadius: R.sm, border: `1px solid ${C.blue}22`, fontSize: 11, color: C.blue, fontFamily: FM }}>📅 Cronograma MED: <b>{d.schedule.semana}</b> — {d.schedule.topics?.[0] || ""}{d.matchedSubtopic && <span style={{ color: C.purple, marginLeft: 6 }}>📋 {d.matchedSubtopic}</span>}</div>)}
              </div>
            );
          })}
        </div>
        <button onClick={() => { if (!allAreasFilled) return alert("Preencha a área de todas as questões erradas."); buildExam(); }} style={btn(C.green)}>✓ Salvar prova</button>
      </div>}
    </div>
  );
}

function PanoramaGeral({ exams }) {
  const AC = { clinica: "#FACC15", cirurgia: "#FB923C", preventiva: "#2DD4BF", go: "#F472B6", ped: "#60A5FA" };
  const AL = { clinica: "Clínica", cirurgia: "Cirurgia", go: "GO", ped: "Pediatria", preventiva: "Preventiva" };

  // ── 1. Quick summary data ──
  const summary = useMemo(() => {
    if (!exams.length) return null;
    const sorted = [...exams].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const pcts = sorted.map(e => perc(e.acertos || 0, e.total || 1));
    const avg = Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
    const bestIdx = pcts.indexOf(Math.max(...pcts));
    const worstIdx = pcts.indexOf(Math.min(...pcts));
    // Area aggregation
    const areaAcc = {};
    AREAS.forEach(a => { areaAcc[a.id] = { acertos: 0, total: 0 }; });
    exams.forEach(e => {
      if (!e.areaResults) return;
      Object.entries(e.areaResults).forEach(([aId, r]) => {
        if (!areaAcc[aId]) return;
        areaAcc[aId].acertos += (r.soube || 0) + (r.chutou || 0);
        areaAcc[aId].total += r.total || 0;
      });
    });
    let strongest = null, weakest = null, sMax = -1, wMin = 101;
    Object.entries(areaAcc).forEach(([aId, r]) => {
      if (r.total < 3) return;
      const p = perc(r.acertos, r.total);
      if (p > sMax) { sMax = p; strongest = aId; }
      if (p < wMin) { wMin = p; weakest = aId; }
    });
    return { total: exams.length, avg, best: sorted[bestIdx], worst: sorted[worstIdx], bestPct: pcts[bestIdx], worstPct: pcts[worstIdx], strongest, weakest, sMax, wMin, areaAcc };
  }, [exams]);

  // ── 2. Evolution chart data ──
  const evoData = useMemo(() => {
    return [...exams].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((e, i) => ({
      name: (e.name || "").replace(/\s*\d{4}/, "").slice(0, 12),
      fullName: e.name,
      pct: perc(e.acertos || 0, e.total || 1),
      date: e.date,
      idx: i + 1
    }));
  }, [exams]);

  // ── 3. Area performance cards ──
  const areaPerf = useMemo(() => {
    return AREAS.map(a => {
      const perExam = [];
      exams.forEach(e => {
        if (!e.areaResults?.[a.id]) return;
        const r = e.areaResults[a.id];
        if (!r.total) return;
        const ac = (r.soube || 0) + (r.chutou || 0);
        perExam.push({ pct: perc(ac, r.total), date: e.date });
      });
      perExam.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      const avg = perExam.length > 0 ? Math.round(perExam.reduce((s, p) => s + p.pct, 0) / perExam.length) : 0;
      // Trend: compare last 2 vs first 2
      let trend = 0;
      if (perExam.length >= 3) {
        const last2 = perExam.slice(-2).reduce((s, p) => s + p.pct, 0) / 2;
        const first2 = perExam.slice(0, 2).reduce((s, p) => s + p.pct, 0) / 2;
        trend = Math.round(last2 - first2);
      }
      return { ...a, avg, perExam, trend, count: perExam.length };
    }).filter(a => a.count > 0);
  }, [exams]);

  // ── 4. Error patterns ──
  const errorPatterns = useMemo(() => {
    const themeErrors = {};
    let totalErros = 0, totalChutou = 0, totalSoube = 0, totalEV = 0, totalEN = 0;
    exams.forEach(e => {
      const cats = e.cats || {};
      totalSoube += (cats.soube?.length || 0);
      totalChutou += (cats.chutou?.length || 0);
      totalEV += (cats.errou_viu?.length || 0);
      totalEN += (cats.errou_nao?.length || 0);
      [...(cats.errou_viu || []), ...(cats.errou_nao || [])].forEach(n => {
        const d = e.qDetails?.[n];
        if (!d?.theme) return;
        const key = (d.theme || "").toLowerCase().trim();
        if (!themeErrors[key]) themeErrors[key] = { theme: d.theme, area: d.area, count: 0, exams: new Set() };
        themeErrors[key].count++;
        themeErrors[key].exams.add(e.id);
      });
    });
    totalErros = totalEV + totalEN;
    const topThemes = Object.values(themeErrors).sort((a, b) => b.count - a.count).slice(0, 10);
    const guessRate = (totalSoube + totalChutou) > 0 ? Math.round(totalChutou / (totalSoube + totalChutou) * 100) : 0;
    return { topThemes, totalErros, totalEV, totalEN, totalChutou, totalSoube, guessRate };
  }, [exams]);

  // ── 5. Recurring gaps (10+ exam banks + 2+ user errors) ──
  const recurringGaps = useMemo(() => {
    // First: count user errors per theme
    const userErrors = {};
    exams.forEach(e => {
      const cats = e.cats || {};
      [...(cats.errou_viu || []), ...(cats.errou_nao || [])].forEach(n => {
        const d = e.qDetails?.[n];
        if (!d?.theme) return;
        const key = (d.theme || "").toLowerCase().trim();
        if (!userErrors[key]) userErrors[key] = { theme: d.theme, area: d.area, count: 0 };
        userErrors[key].count++;
      });
    });
    // Filter: user erred 2+ times
    const candidates = Object.values(userErrors).filter(u => u.count >= 2);
    if (!candidates.length) return [];
    // Count how many exam banks each theme appears in
    const allDBKeys = Object.keys(EXAM_THEMES_DB);
    return candidates.map(c => {
      let bankCount = 0;
      for (const dbKey of allDBKeys) {
        const dbData = EXAM_THEMES_DB[dbKey];
        for (const q of Object.values(dbData)) {
          if (_themesMatch(c.theme, q.t)) { bankCount++; break; }
        }
      }
      return { ...c, bankCount };
    }).filter(g => g.bankCount >= 10).sort((a, b) => b.bankCount - a.bankCount || b.count - a.count);
  }, [exams]);

  if (!summary) return <Empty icon="📊" msg="Registre pelo menos 2 provas para ver o Panorama Geral." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── RESUMO RÁPIDO ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: C.purple }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>Resumo Geral</span>
          <span style={{ fontSize: 11, color: C.text3, fontFamily: FM, marginLeft: "auto" }}>{summary.total} provas</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <div style={{ background: C.surface, borderRadius: R.md, padding: "12px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Média geral</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: perfColor(summary.avg), ...NUM }}>{summary.avg}%</div>
          </div>
          <div style={{ background: C.surface, borderRadius: R.md, padding: "12px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Melhor prova</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: perfColor(summary.bestPct), ...NUM }}>{summary.bestPct}%</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary.best?.name}</div>
          </div>
          <div style={{ background: C.surface, borderRadius: R.md, padding: "12px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Pior prova</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: perfColor(summary.worstPct), ...NUM }}>{summary.worstPct}%</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary.worst?.name}</div>
          </div>
          {summary.strongest && <div style={{ background: C.surface, borderRadius: R.md, padding: "12px 14px", border: `1px solid ${AC[summary.strongest]}30` }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Mais forte</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: AC[summary.strongest] }}>{AL[summary.strongest]}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: perfColor(summary.sMax), ...NUM }}>{summary.sMax}%</div>
          </div>}
          {summary.weakest && <div style={{ background: C.surface, borderRadius: R.md, padding: "12px 14px", border: `1px solid ${AC[summary.weakest]}30` }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Mais fraca</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: AC[summary.weakest] }}>{AL[summary.weakest]}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: perfColor(summary.wMin), ...NUM }}>{summary.wMin}%</div>
          </div>}
        </div>
      </div>

      {/* ── EVOLUÇÃO ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: C.blue }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>Evolução nas provas</span>
        </div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evoData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fill: C.text3, fontSize: 10, fontFamily: FM }} axisLine={{ stroke: C.border }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fill: C.text3, fontSize: 11, fontFamily: FM }} tickFormatter={v => v + "%"} axisLine={{ stroke: C.border }} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, padding: "10px 14px", boxShadow: SH.lg }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{d.fullName}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: perfColor(d.pct), fontFamily: FN }}>{d.pct}%</div>
                    {d.date && <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{fmtDate(d.date)}</div>}
                  </div>
                );
              }} />
              <ReferenceLine y={summary.avg} stroke={C.purple} strokeDasharray="4 4" label={{ value: `Média ${summary.avg}%`, fill: C.purple, fontSize: 10, fontFamily: FM, position: "top" }} />
              <Line type="monotone" dataKey="pct" stroke={C.blue} strokeWidth={2.5} dot={{ fill: C.blue, r: 4, strokeWidth: 2, stroke: C.card }} activeDot={{ r: 6, fill: C.blue, stroke: C.card, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── DESEMPENHO POR ÁREA ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: C.teal }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>Desempenho por área</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {areaPerf.map(a => (
            <div key={a.id} style={{ background: C.surface, borderRadius: R.md, padding: "14px", border: `1px solid ${a.color}30`, borderLeft: `3px solid ${a.color}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.short}</span>
                {a.trend !== 0 && <span style={{ fontSize: 10, fontWeight: 600, color: a.trend > 0 ? C.green : C.red, fontFamily: FM, padding: "1px 6px", borderRadius: R.pill, background: (a.trend > 0 ? C.green : C.red) + "14" }}>{a.trend > 0 ? "+" : ""}{a.trend}pp</span>}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: perfColor(a.avg), ...NUM, marginBottom: 4 }}>{a.avg}%</div>
              <div style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{a.count} provas · {a.label}</div>
              {a.perExam.length >= 2 && <div style={{ display: "flex", gap: 2, alignItems: "end", marginTop: 8, height: 24 }}>
                {a.perExam.map((p, i) => (
                  <div key={i} style={{ flex: 1, height: `${Math.max(4, p.pct * 0.24)}px`, background: perfColor(p.pct), borderRadius: 2, opacity: 0.7, minWidth: 3, maxWidth: 12 }} title={`${p.pct}%`} />
                ))}
              </div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── PADRÕES DE ERRO ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: C.red }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>Padrões de erro</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          {[
            { label: "Errei (já vi)", count: errorPatterns.totalEV, color: "#EF4444" },
            { label: "Errei (nunca vi)", count: errorPatterns.totalEN, color: "#F97316" },
            { label: "Chutei certo", count: errorPatterns.totalChutou, color: "#F59E0B" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: R.pill, background: s.color + "14", border: `1px solid ${s.color}30` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: FM }}>{s.count}</span>
              <span style={{ fontSize: 11, color: C.text2 }}>{s.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: R.pill, background: C.yellow + "14", border: `1px solid ${C.yellow}30` }}>
            <span style={{ fontSize: 11, color: C.yellow, fontWeight: 600 }}>Taxa de chute: <span style={{ fontFamily: FM, fontWeight: 800 }}>{errorPatterns.guessRate}%</span></span>
          </div>
        </div>
        {errorPatterns.topThemes.length > 0 && <>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Top temas errados</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {errorPatterns.topThemes.map((t, i) => {
              const a = areaMap[t.area];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.surface, borderRadius: R.md, borderLeft: `3px solid ${a?.color || C.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.red, fontFamily: FM, minWidth: 22 }}>{t.count}x</span>
                  <span style={{ flex: 1, fontSize: 12, color: C.text, lineHeight: 1.3 }}>{t.theme}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: a?.color || C.text3, fontFamily: FM, padding: "2px 8px", borderRadius: R.pill, background: (a?.color || C.text3) + "14" }}>{a?.short || "?"}</span>
                  <span style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>{t.exams.size} prova{t.exams.size > 1 ? "s" : ""}</span>
                </div>
              );
            })}
          </div>
        </>}
      </div>

      {/* ── GAPS RECORRENTES ── */}
      {recurringGaps.length > 0 && <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: C.yellow }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>Gaps recorrentes</span>
        </div>
        <div style={{ fontSize: 11, color: C.text3, fontFamily: FM, marginBottom: 14 }}>Temas presentes em 10+ provas do banco e que você errou 2+ vezes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {recurringGaps.map((g, i) => {
            const a = areaMap[g.area];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `linear-gradient(135deg, ${C.yellow}08, ${C.red}06)`, borderRadius: R.md, border: `1px solid ${C.yellow}30` }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.red, fontFamily: FM }}>{g.count}x</span>
                  <span style={{ fontSize: 8, color: C.text3 }}>erros</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{g.theme}</div>
                  <div style={{ fontSize: 10, color: C.text3, fontFamily: FM, marginTop: 2 }}>Em {g.bankCount} provas do banco</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: a?.color || C.text3, fontFamily: FM, padding: "3px 10px", borderRadius: R.pill, background: (a?.color || C.text3) + "18", border: `1px solid ${a?.color || C.text3}30` }}>{a?.short || "?"}</span>
              </div>
            );
          })}
        </div>
      </div>}
    </div>
  );
}

function ExamComparison({ exams, sortMode, setSortMode }) {
  const data = useMemo(() => {
    const items = exams.map((e) => {
      const s = e.cats?.soube?.length || 0;
      const c = e.cats?.chutou?.length || 0;
      const total = e.total || 1;
      const acertos = e.acertos || (s + c);
      const pct = perc(acertos, total);
      return { name: e.name, pct, acertos, total, date: e.date };
    });
    if (sortMode === "best") items.sort((a, b) => b.pct - a.pct);
    else if (sortMode === "worst") items.sort((a, b) => a.pct - b.pct);
    else items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return items;
  }, [exams, sortMode]);
  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.pct, 0) / data.length) : 0;
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: C.purple }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>Comparativo de desempenho</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ id: "best", label: "Melhor" }, { id: "worst", label: "Pior" }, { id: "recent", label: "Recente" }].map((s) => (
            <button key={s.id} onClick={() => setSortMode(s.id)} style={{ background: sortMode === s.id ? C.purple + "22" : C.surface, border: `1px solid ${sortMode === s.id ? C.purple : C.border}`, borderRadius: R.pill, padding: "4px 12px", cursor: "pointer", fontSize: 11, fontWeight: sortMode === s.id ? 700 : 500, color: sortMode === s.id ? C.purple : C.text3, fontFamily: F, transition: "all 0.15s" }}>{s.label}</button>
          ))}
        </div>
      </div>
      <div style={{ width: "100%", height: Math.max(200, data.length * 44 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 8, bottom: 4 }} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: C.text3, fontSize: 11, fontFamily: FM }} tickFormatter={(v) => v + "%"} axisLine={{ stroke: C.border }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fill: C.text2, fontSize: 11, fontFamily: F }} axisLine={false} tickLine={false} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, padding: "10px 14px", boxShadow: SH.lg }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: perfColor(d.pct), fontFamily: FN }}>{d.pct}%</div>
                  <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{d.acertos}/{d.total} acertos</div>
                  {d.date && <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{fmtDate(d.date)}</div>}
                </div>
              );
            }} />
            <ReferenceLine x={avg} stroke={C.purple} strokeDasharray="4 4" label={{ value: `Média ${avg}%`, fill: C.purple, fontSize: 10, fontFamily: FM, position: "top" }} />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
              {data.map((d, i) => <Cell key={i} fill={perfColor(d.pct)} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 14, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: F }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5 }}>#</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5 }}>Prova</th>
              <th style={{ textAlign: "center", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5 }}>Acertos</th>
              <th style={{ textAlign: "center", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5 }}>Taxa</th>
              <th style={{ textAlign: "center", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5 }}>vs Média</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const diff = d.pct - avg;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.surface }}>
                  <td style={{ padding: "8px 10px", fontWeight: 700, color: C.text3, fontFamily: FM }}>{i + 1}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 600, color: C.text }}>{d.name}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: FN, color: C.text2 }}>{d.acertos}/{d.total}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: perfColor(d.pct), fontFamily: FN }}>{d.pct}%</span>
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: FN, color: diff >= 0 ? C.green : C.red, padding: "2px 8px", borderRadius: R.pill, background: diff >= 0 ? C.green + "14" : C.red + "14" }}>{diff >= 0 ? "+" : ""}{diff}pp</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalysisSection({ analysis, exam, globalPrev }) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [expandedArea, setExpandedArea] = useState(null);
  const [showAllRecurring, setShowAllRecurring] = useState(false);
  const PSTYLE = { "muito alta": { color: C.green, label: "Muito alta" }, "alta": { color: "#60A5FA", label: "Alta" }, "média": { color: "#FBBF24", label: "Média" }, "baixa": { color: C.text3, label: "Baixa" } };
  const PORD = { "muito alta": 0, "alta": 1, "média": 2, "baixa": 3 };
  const AC = { clinica: "#60A5FA", cirurgia: "#F87171", go: "#F472B6", ped: "#2DD4BF", preventiva: "#A78BFA" };
  const AL = { clinica: "Clínica", cirurgia: "Cirurgia", go: "GO", ped: "Pediatria", preventiva: "Preventiva" };
  const AREA_IDS = ["clinica", "cirurgia", "go", "ped", "preventiva"];

  const dist = analysis.distribuicao || {};
  const totalQ = Object.values(dist).reduce((a, b) => a + b, 0);
  const totalDB = Object.keys(EXAM_THEMES_DB).length;
  const cats = exam.cats || {};

  // Per-area question data
  const areaData = useMemo(() => {
    const out = {};
    for (const aId of AREA_IDS) { out[aId] = { qs: [], acertos: 0, erros: 0, fortes: [], fracos: [], prioridades: [] }; }
    if (!exam.qDetails) return out;
    Object.entries(exam.qDetails).forEach(([n, d]) => {
      if (!d?.area || !out[d.area]) return;
      const nn = Number(n);
      const cat = cats.soube?.includes(nn) ? "soube" : cats.chutou?.includes(nn) ? "chutou" : cats.errou_viu?.includes(nn) ? "errou_viu" : cats.errou_nao?.includes(nn) ? "errou_nao" : null;
      const gp = globalPrev[nn] || "baixa";
      const acertou = cat === "soube" || cat === "chutou";
      const q = { n: nn, theme: d.theme || "—", cat, gp, acertou };
      out[d.area].qs.push(q);
      if (acertou) out[d.area].acertos++; else out[d.area].erros++;
      // Fortes: acertou + prevalência alta/muito alta
      if (cat === "soube" && (gp === "muito alta" || gp === "alta")) out[d.area].fortes.push(q);
      // Fracos: errou + prevalência alta/muito alta — PRIORIDADE máxima
      if (!acertou && (gp === "muito alta" || gp === "alta")) out[d.area].prioridades.push(q);
      // Fracos gerais: errou qualquer
      if (!acertou) out[d.area].fracos.push(q);
    });
    for (const aId of AREA_IDS) {
      out[aId].qs.sort((a, b) => a.n - b.n);
      out[aId].prioridades.sort((a, b) => (PORD[a.gp] ?? 3) - (PORD[b.gp] ?? 3));
      out[aId].fracos.sort((a, b) => (PORD[a.gp] ?? 3) - (PORD[b.gp] ?? 3));
    }
    return out;
  }, [exam, globalPrev, cats]);

  // Coach summary per area
  const coachMsg = (ad) => {
    const total = ad.acertos + ad.erros;
    if (!total) return "";
    const pct = Math.round(ad.acertos / total * 100);
    const highPrev = ad.qs.filter(q => q.gp === "muito alta" || q.gp === "alta");
    const highPrevAcertos = highPrev.filter(q => q.cat === "soube").length;
    const highPrevPct = highPrev.length > 0 ? Math.round(highPrevAcertos / highPrev.length * 100) : 0;
    if (pct >= 80 && highPrevPct >= 60) return "Excelente domínio! Base sólida nos temas mais cobrados.";
    if (pct >= 80) return "Bom acerto geral, mas revise os temas clássicos — muitos foram no chute ou erro.";
    if (highPrevPct >= 50) return "Boa base nos temas frequentes. Foque nos gaps críticos para consolidar.";
    if (ad.prioridades.length > 3) return `Alerta: ${ad.prioridades.length} temas de alta prevalência errados. Priorize esses.`;
    if (pct >= 60) return "Desempenho mediano. Veja os gaps críticos — são temas que caem em muitas provas.";
    return "Área fraca. Concentre esforço aqui — vários temas universais de residência errados.";
  };

  const tabs = [
    { id: "resumo", label: "Visão Geral", icon: "📊" },
    { id: "coach", label: "Diagnóstico", icon: "🎯" },
    { id: "recorrentes", label: "Recorrentes", icon: "🔄" },
  ];

  return (
    <div style={{ background: `linear-gradient(135deg,${C.purple}06,${C.blue}04)`, border: `1px solid ${C.purple}25`, borderRadius: R.xl, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.purple}18,${C.blue}12)`, padding: "14px 16px", borderBottom: `1px solid ${C.purple}20` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: R.lg, background: C.purple + "22", border: `2px solid ${C.purple}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>📊</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.purple, letterSpacing: -0.3 }}>Análise Comparativa</div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: FM }}>{exam.name} · {totalDB} provas no banco</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: activeTab === t.id ? C.purple + "30" : "transparent",
              border: activeTab === t.id ? `1px solid ${C.purple}50` : `1px solid transparent`,
              borderRadius: R.pill, padding: "5px 12px", cursor: "pointer",
              color: activeTab === t.id ? C.purple : C.text3,
              fontSize: 11, fontWeight: 600, fontFamily: F, whiteSpace: "nowrap",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4
            }}>
              <span style={{ fontSize: 12 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: S.xl }}>
        {/* ── Tab: Visão Geral ── */}
        {activeTab === "resumo" && <>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, marginBottom: 16, padding: "10px 14px", background: C.card, borderRadius: R.lg, borderLeft: `3px solid ${C.purple}` }}>
            {analysis.resumo}
          </div>

          {/* Prevalence overview - how "standard" this exam is */}
          {(()=>{
            const prevC = { ma: 0, a: 0, m: 0, b: 0 };
            if (exam.qDetails) {
              Object.keys(exam.qDetails).forEach(n => {
                const gp = globalPrev[Number(n)] || "baixa";
                if (gp === "muito alta") prevC.ma++;
                else if (gp === "alta") prevC.a++;
                else if (gp === "média") prevC.m++;
                else prevC.b++;
              });
            }
            const totalP = prevC.ma + prevC.a + prevC.m + prevC.b;
            const classicPct = totalP > 0 ? Math.round((prevC.ma + prevC.a) / totalP * 100) : 0;
            // Coverage: of high-prev themes, how many did user get right (soube only)
            let highTotal = 0, highSoube = 0;
            if (exam.qDetails) {
              Object.keys(exam.qDetails).forEach(n => {
                const nn = Number(n);
                const gp = globalPrev[nn] || "baixa";
                if (gp === "muito alta" || gp === "alta") {
                  highTotal++;
                  if (cats.soube?.includes(nn)) highSoube++;
                }
              });
            }
            const covPct = highTotal > 0 ? Math.round(highSoube / highTotal * 100) : 0;
            return (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              <div style={{ background: C.card, borderRadius: R.lg, padding: "12px 14px", border: `1px solid ${C.purple}20` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Previsibilidade</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: classicPct >= 70 ? C.green : classicPct >= 50 ? "#FBBF24" : C.red, fontFamily: FN }}>{classicPct}%</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>temas clássicos</span>
                </div>
                <div style={{ height: 4, borderRadius: R.pill, background: C.surface, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${classicPct}%`, background: classicPct >= 70 ? C.green : classicPct >= 50 ? "#FBBF24" : C.red, borderRadius: R.pill }} />
                </div>
                <div style={{ fontSize: 9, color: C.text3, fontFamily: FM, marginTop: 4 }}>🔥 {prevC.ma} muito alta · 📈 {prevC.a} alta · 📊 {prevC.m} média · ✨ {prevC.b} rara</div>
              </div>
              <div style={{ background: C.card, borderRadius: R.lg, padding: "12px 14px", border: `1px solid ${C.teal}20` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Seu domínio (soube)</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: covPct >= 60 ? C.green : covPct >= 35 ? "#FBBF24" : C.red, fontFamily: FN }}>{covPct}%</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>dos clássicos</span>
                </div>
                <div style={{ height: 4, borderRadius: R.pill, background: C.surface, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${covPct}%`, background: covPct >= 60 ? C.green : covPct >= 35 ? "#FBBF24" : C.red, borderRadius: R.pill }} />
                </div>
                <div style={{ fontSize: 9, color: C.text3, fontFamily: FM, marginTop: 4 }}>Sabia {highSoube} de {highTotal} temas frequentes</div>
              </div>
            </div>);
          })()}

          {/* Key insights */}
          {analysis.destaques && analysis.destaques.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Destaques por área</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {analysis.destaques.map((d, i) => {
                const areaMatch = d.match(/^(Clínica|Cirurgia|GO|Pediatria|Preventiva)/);
                const aId = areaMatch ? Object.entries(AL).find(([_, v]) => v === areaMatch[1])?.[0] : null;
                const col = aId ? AC[aId] : C.text2;
                return (
                  <div key={i} style={{ fontSize: 11, color: C.text2, lineHeight: 1.5, padding: "8px 12px", background: C.card, borderRadius: R.md, borderLeft: `3px solid ${col}` }}>
                    {d}
                  </div>
                );
              })}
            </div>
          </>}
        </>}

        {/* ── Tab: Diagnóstico (Coach) ── */}
        {activeTab === "coach" && <>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, marginBottom: 14, padding: "10px 14px", background: C.card, borderRadius: R.lg, borderLeft: `3px solid ${C.teal}` }}>
            Análise do seu desempenho por área. Identifica pontos fortes, gaps críticos em temas de alta prevalência, e sugere onde focar seus estudos.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {AREA_IDS.map(aId => {
              const ad = areaData[aId];
              if (!ad.qs.length) return null;
              const isExp = expandedArea === aId;
              const total2 = ad.acertos + ad.erros;
              const pct = total2 > 0 ? Math.round(ad.acertos / total2 * 100) : 0;
              const highPrev = ad.qs.filter(q => q.gp === "muito alta" || q.gp === "alta");
              const highPrevAcertos = highPrev.filter(q => q.cat === "soube").length;
              const highPrevPct = highPrev.length > 0 ? Math.round(highPrevAcertos / highPrev.length * 100) : 0;
              const msg = coachMsg(ad);
              const isGood = pct >= 70;
              const hasCritical = ad.prioridades.length > 0;
              return (
                <div key={aId} style={{ background: C.card, borderRadius: R.xl, border: `1px solid ${AC[aId]}25`, overflow: "hidden" }}>
                  {/* Header */}
                  <div onClick={() => setExpandedArea(isExp ? null : aId)} style={{ cursor: "pointer", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: R.lg, background: AC[aId] + "15", border: `2px solid ${AC[aId]}35`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: perfColor(pct), fontFamily: FN, lineHeight: 1 }}>{pct}%</span>
                        <span style={{ fontSize: 8, color: C.text3, fontFamily: FM }}>{ad.acertos}/{total2}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: AC[aId] }}>{AL[aId]}</span>
                          {hasCritical && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: R.pill, background: C.red + "18", color: C.red, fontWeight: 700 }}>{ad.prioridades.length} gaps críticos</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2, lineHeight: 1.4 }}>{msg}</div>
                      </div>
                      <span style={{ color: C.text3, fontSize: 12, transition: "transform .2s", transform: isExp ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}>▼</span>
                    </div>
                    {/* Mini prevalence coverage bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 9, color: C.text3, fontFamily: FM, flexShrink: 0 }}>Cobertura alta prev.</span>
                      <div style={{ flex: 1, height: 6, borderRadius: R.pill, background: C.surface, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${highPrevPct}%`, background: highPrevPct >= 70 ? C.green : highPrevPct >= 40 ? "#FBBF24" : C.red, borderRadius: R.pill, transition: "width 0.4s" }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FM, color: highPrevPct >= 70 ? C.green : highPrevPct >= 40 ? "#FBBF24" : C.red, flexShrink: 0 }}>{highPrevAcertos}/{highPrev.length}</span>
                    </div>
                  </div>
                  {/* Expanded details */}
                  {isExp && (
                    <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* Prioridades (erros em temas frequentes) */}
                      {ad.prioridades.length > 0 && (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, background: C.red + "20", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10 }}>🚨</span></div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.5 }}>Prioridades ({ad.prioridades.length})</span>
                            <span style={{ fontSize: 9, color: C.text3, fontFamily: FM }}>temas frequentes que você errou</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {ad.prioridades.map(q => {
                              const st = PSTYLE[q.gp];
                              const isEV = cats.errou_viu?.includes(q.n);
                              return (
                                <div key={q.n} style={{ display: "flex", gap: 6, alignItems: "center", padding: "6px 10px", background: C.red + "08", borderRadius: R.md, borderLeft: `3px solid ${C.red}40` }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: FM, color: C.red, minWidth: 28 }}>Q{q.n}</span>
                                  <span style={{ fontSize: 9, fontWeight: 700, color: st.color, fontFamily: FM, padding: "1px 5px", borderRadius: R.pill, background: st.color + "18", minWidth: 50, textAlign: "center", flexShrink: 0 }}>{st.label}</span>
                                  <span style={{ fontSize: 11, flex: 1, color: C.text2, lineHeight: 1.3 }}>{q.theme}</span>
                                  {isEV && <span style={{ fontSize: 8, fontFamily: FM, color: "#F59E0B", background: "#F59E0B18", padding: "1px 5px", borderRadius: R.pill, flexShrink: 0 }}>já estudou</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Pontos fortes (acertos em temas frequentes) */}
                      {ad.fortes.length > 0 && (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, background: C.green + "20", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10 }}>💪</span></div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 0.5 }}>Pontos fortes ({ad.fortes.length})</span>
                            <span style={{ fontSize: 9, color: C.text3, fontFamily: FM }}>temas frequentes que você domina</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {ad.fortes.map(q => (
                              <div key={q.n} style={{ fontSize: 10, padding: "3px 8px", borderRadius: R.pill, background: C.green + "10", border: `1px solid ${C.green}20`, color: C.green, fontWeight: 600, display: "flex", gap: 3, alignItems: "center" }}>
                                <span style={{ fontFamily: FM, fontWeight: 800 }}>Q{q.n}</span>
                                <span>{q.theme.split("/")[0].split("-")[0].trim().slice(0, 30)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Outros erros (baixa/média prevalência) */}
                      {(()=>{
                        const others = ad.fracos.filter(q => q.gp !== "muito alta" && q.gp !== "alta");
                        if (!others.length) return null;
                        return (
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FBBF24" + "20", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10 }}>📝</span></div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#FBBF24", textTransform: "uppercase", letterSpacing: 0.5 }}>Outros erros ({others.length})</span>
                              <span style={{ fontSize: 9, color: C.text3, fontFamily: FM }}>menor prevalência — estude depois</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                              {others.map(q => (
                                <span key={q.n} style={{ fontSize: 9, padding: "2px 7px", borderRadius: R.pill, background: C.surface, color: C.text3, fontFamily: FM }}>Q{q.n} {q.theme.split("/")[0].split("-")[0].trim().slice(0, 25)}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>}

        {/* ── Tab: Recorrentes ── */}
        {activeTab === "recorrentes" && <>
          {analysis.sempreCAI && analysis.sempreCAI.length > 0 ? <>
            <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, marginBottom: 14, padding: "10px 14px", background: C.card, borderRadius: R.lg, borderLeft: `3px solid ${C.green}` }}>
              Temas que aparecem com frequência nas provas desta instituição. Estude com prioridade — alta chance de cair novamente.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(showAllRecurring ? analysis.sempreCAI : analysis.sempreCAI.slice(0, 15)).map((s, i) => {
                const freqMatch = s.freq.match(/(\d+)\/(\d+)/);
                const freqNum = freqMatch ? parseInt(freqMatch[1]) : 0;
                const freqDen = freqMatch ? parseInt(freqMatch[2]) : 1;
                const freqPct = Math.round(freqNum / freqDen * 100);
                const isAll = freqNum === freqDen;
                const dd = exam.qDetails?.[s.q];
                const aId = dd?.area;
                const col = aId ? AC[aId] : C.green;
                const gp = globalPrev[s.q];
                const gpSt = gp ? PSTYLE[gp] : null;
                return (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", background: C.card, borderRadius: R.md, borderLeft: `3px solid ${isAll ? C.green : C.blue}` }}>
                    <span style={{ fontSize: 11, fontWeight: 800, fontFamily: FM, color: col, minWidth: 28 }}>Q{s.q}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.3 }}>{s.tema}</div>
                      {aId && <span style={{ fontSize: 9, color: AC[aId], fontWeight: 600 }}>{AL[aId]}</span>}
                    </div>
                    {gpSt && <span style={{ fontSize: 8, fontFamily: FM, color: gpSt.color, background: gpSt.color + "14", padding: "2px 6px", borderRadius: R.pill, flexShrink: 0 }}>geral: {gpSt.label}</span>}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <div style={{ width: 40, height: 6, borderRadius: R.pill, background: C.surface, overflow: "hidden" }}>
                        <div style={{ width: `${freqPct}%`, height: "100%", background: isAll ? C.green : C.blue, borderRadius: R.pill }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FM, color: isAll ? C.green : C.blue, minWidth: 48, textAlign: "right" }}>{s.freq}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {analysis.sempreCAI.length > 15 && (
              <button onClick={() => setShowAllRecurring(!showAllRecurring)} style={{
                background: "transparent", border: `1px solid ${C.green}30`, borderRadius: R.pill,
                padding: "6px 14px", color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer",
                marginTop: 8, fontFamily: F, width: "100%", textAlign: "center"
              }}>
                {showAllRecurring ? "Mostrar menos" : `Ver todos (${analysis.sempreCAI.length} temas)`}
              </button>
            )}
          </> : <div style={{ fontSize: 12, color: C.text3, textAlign: "center", padding: 20 }}>Dados insuficientes para análise de recorrência (necessário 2+ provas da mesma instituição)</div>}
        </>}
      </div>
    </div>
  );
}

function ExamCard({ exam, allLogs, isOpen, onToggle, onDel, onUpdate, knownThemes, userSubtopics }) {
  const [editMode, setEditMode] = useState(false);
  const [editDetails, setEditDetails] = useState({});
  const [filterArea, setFilterArea] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [editDateVal, setEditDateVal] = useState("");
  const cats = exam.cats || {};
  const s = cats.soube?.length || 0; const c = cats.chutou?.length || 0; const ev = cats.errou_viu?.length || 0; const en = cats.errou_nao?.length || 0;
  const total = exam.total || (s + c + ev + en); const acertos = exam.acertos || (s + c); const geral = perc(acertos, total);
  const areaStats = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = { soube: 0, chutou: 0, errou_viu: 0, errou_nao: 0, total: 0 }; }); if (exam.areaResults) { Object.entries(exam.areaResults).forEach(([aId, r]) => { if (o[aId]) o[aId] = { ...r }; }); } else if (exam.qDetails) { Object.entries(exam.qDetails).forEach(([n, d]) => { if (!d?.area) return; const nn = Number(n); const bk = cats.soube?.includes(nn) ? "soube" : cats.chutou?.includes(nn) ? "chutou" : cats.errou_viu?.includes(nn) ? "errou_viu" : "errou_nao"; o[d.area][bk]++; o[d.area].total++; }); } return o; }, [exam, cats]);
  const evByArea = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = []; }); (cats.errou_viu || []).forEach((n) => { const d = exam.qDetails?.[n]; if (!d?.area) return; const study = mapThemeToStudy(d.theme, d.area, userSubtopics); o[d.area].push({ n, theme: d.theme || "—", schedule: study, matchedSubtopic: study?.matchedSubtopic || null }); }); return o; }, [exam, cats, userSubtopics]);
  const enByArea = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = []; }); (cats.errou_nao || []).forEach((n) => { const d = exam.qDetails?.[n]; if (!d?.area) return; const study = mapThemeToStudy(d.theme, d.area, userSubtopics); o[d.area].push({ n, theme: d.theme || "—", schedule: study, matchedSubtopic: study?.matchedSubtopic || null }); }); return o; }, [exam, cats, userSubtopics]);
  const PSTYLE = { "muito alta": { color: C.green, label: "Muito alta" }, "alta": { color: "#60A5FA", label: "Alta" }, "média": { color: "#FBBF24", label: "Média" }, "baixa": { color: C.text3, label: "Baixa" } };
  const PORD = { "muito alta": 0, "alta": 1, "média": 2, "baixa": 3 };
  const analysis = useMemo(() => {
    const name = exam.name || "";
    // Check pre-built analyses first (hand-crafted, higher quality)
    const key = name.toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();
    for (const [k, v] of Object.entries(EXAM_ANALYSES)) {
      if (key.includes(k.replace(/ /g," "))) return v;
    }
    // Auto-generate from EXAM_THEMES_DB cross-referencing
    return generateExamAnalysis(name);
  }, [exam.name]);
  // Global prevalence (cross-institution) for question-level badges
  const globalPrev = useMemo(() => computeGlobalPrevalence(exam.name || ""), [exam.name]);
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", padding: "4px 0" }} onClick={onToggle}>
        <div style={{ width: 72, height: 72, borderRadius: R.xl, background: perfColor(geral) + "15", border: `2px solid ${perfColor(geral)}40`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: SH.glow(perfColor(geral)) }}><span style={{ fontSize: 22, fontWeight: 800, color: perfColor(geral), ...NUM, lineHeight: 1 }}>{geral}%</span><span style={{ fontSize: 10, color: C.text3, ...NUM, marginTop: 2 }}>{acertos}/{total}</span></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.3, marginBottom: 4 }}>{exam.name}</div>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: FM, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                {editingDate ? (
                  <input type="date" value={editDateVal} onChange={(e) => setEditDateVal(e.target.value)}
                    onBlur={() => { if (editDateVal && editDateVal !== exam.date) onUpdate(exam.id, { date: editDateVal }); setEditingDate(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { if (editDateVal && editDateVal !== exam.date) onUpdate(exam.id, { date: editDateVal }); setEditingDate(false); } if (e.key === "Escape") setEditingDate(false); }}
                    autoFocus style={{ ...inp(), padding: "3px 8px", fontSize: 12, fontFamily: FM, width: 140 }} />
                ) : (
                  <span onClick={(e) => { e.stopPropagation(); setEditDateVal(exam.date || ""); setEditingDate(true); }} style={{ cursor: "pointer", borderBottom: `1px dashed ${C.text3}40` }}>{fmtDate(exam.date)}</span>
                )} · {total} questões</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {CATS.map((cat) => { const cnt = cats[cat.id]?.length || 0; if (!cnt) return null; return (<div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: R.pill, background: cat.color + "14", border: `1px solid ${cat.color}25` }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} /><span style={{ fontSize: 11, color: cat.color, fontWeight: 700, fontFamily: FN }}>{cnt}</span></div>); })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}><span style={{ color: C.text3, fontSize: 14, transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span><button onClick={(e) => { e.stopPropagation(); if (confirm("Remover esta prova? Essa ação não pode ser desfeita.")) onDel(exam.id); }} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, color: C.text3, cursor: "pointer", fontSize: 14, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button></div>
      </div>
      {isOpen && <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 16 }}>
        {(() => { const allQ = new Map(); (cats.soube||[]).forEach((n)=>allQ.set(n,"soube")); (cats.chutou||[]).forEach((n)=>allQ.set(n,"chutou")); (cats.errou_viu||[]).forEach((n)=>allQ.set(n,"errou_viu")); (cats.errou_nao||[]).forEach((n)=>allQ.set(n,"errou_nao")); if(allQ.size===0)return null; const sorted=[...allQ.keys()].sort((a,b)=>a-b); return (<div><div style={{fontSize:11,fontWeight:600,color:C.text3,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Gabarito</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{sorted.map((n)=>{const catId=allQ.get(n);const col=catColor(catId);const d=exam.qDetails?.[n];return(<div key={n} title={d?.theme||""} style={{width:34,height:34,borderRadius:R.sm,background:col+"15",border:`2px solid ${col}35`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,transition:"transform 0.1s"}}><span style={{fontSize:9,fontWeight:700,color:col,fontFamily:FM,lineHeight:1}}>{n}</span><div style={{width:6,height:6,borderRadius:"50%",background:col}}/></div>);})}</div></div>);})()}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>{if(!editMode){setEditDetails({...(exam.qDetails||{})});}setEditMode(!editMode);}} style={btn(editMode?C.card2:C.purple,{padding:"7px 14px",fontSize:12})}>{editMode?"← Fechar edição":"✏ Editar temas"}</button>{editMode&&<button onClick={()=>{const ar={};AREAS.forEach((a)=>{ar[a.id]={soube:0,chutou:0,errou_viu:0,errou_nao:0,total:0};});Object.entries(editDetails).forEach(([n,d])=>{if(!d?.area)return;const nn=Number(n);const bk=cats.soube?.includes(nn)?"soube":cats.chutou?.includes(nn)?"chutou":cats.errou_viu?.includes(nn)?"errou_viu":"errou_nao";ar[d.area][bk]++;ar[d.area].total++;});onUpdate(exam.id,{qDetails:editDetails,areaResults:ar});setEditMode(false);}} style={btn("#34D399",{padding:"7px 14px",fontSize:12})}>✓ Salvar alterações</button>}</div>
        {editMode&&(()=>{const allQ=new Map();(cats.soube||[]).forEach((n)=>allQ.set(n,"soube"));(cats.chutou||[]).forEach((n)=>allQ.set(n,"chutou"));(cats.errou_viu||[]).forEach((n)=>allQ.set(n,"errou_viu"));(cats.errou_nao||[]).forEach((n)=>allQ.set(n,"errou_nao"));const sorted=[...allQ.keys()].sort((a,b)=>a-b);const filtered=sorted.filter((n)=>{const d=editDetails[n]||{};if(filterArea!=="all"&&d.area!==filterArea)return false;if(searchQ&&!(d.theme||"").toLowerCase().includes(searchQ.toLowerCase())&&!String(n).includes(searchQ))return false;return true;});return(<div style={{background:C.surface,border:`1px solid ${C.purple}44`,borderRadius:16,padding:14,display:"flex",flexDirection:"column",gap:10}}><div style={{fontSize:13,fontWeight:600,color:C.purple}}>Editar temas e áreas ({sorted.length} questões)</div><div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}><input value={searchQ} onChange={(e)=>setSearchQ(e.target.value)} placeholder="Buscar questão ou tema…" style={{...inp(),width:200,padding:"7px 11px",fontSize:12}}/><button onClick={()=>setFilterArea("all")} style={btn(filterArea==="all"?C.card2:C.card,{padding:"6px 10px",fontSize:11})}>Todas</button>{AREAS.map((a)=><button key={a.id} onClick={()=>setFilterArea(a.id)} style={btn(filterArea===a.id?a.color:C.card,{padding:"6px 10px",fontSize:11})}>{a.short}</button>)}</div><div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:400,overflowY:"auto"}}>{filtered.map((n)=>{const catId=allQ.get(n);const col=catColor(catId);const d=editDetails[n]||{};return(<div key={n} style={{display:"flex",gap:6,alignItems:"center",padding:"6px 8px",background:C.bg,borderRadius:R.sm,border:`1px solid ${C.border}`}}><div style={{width:28,height:28,borderRadius:7,background:col+"22",border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:10,fontWeight:700,color:col,fontFamily:FM}}>{n}</span></div><select value={d.area||""} onChange={(e)=>setEditDetails((dd)=>({...dd,[n]:{...(dd[n]||{}),area:e.target.value}}))} style={{...inp(),width:90,padding:"5px 6px",fontSize:11,flexShrink:0}}><option value="">Área…</option>{AREAS.map((a)=><option key={a.id} value={a.id}>{a.short}</option>)}</select><input value={d.theme||""} onChange={(e)=>setEditDetails((dd)=>({...dd,[n]:{...(dd[n]||{}),theme:e.target.value}}))} placeholder="Tema da questão…" style={{...inp(),flex:1,padding:"5px 8px",fontSize:12}}/></div>);})}</div><div style={{fontSize:11,color:C.text3}}>Mostrando {filtered.length} de {sorted.length} questões</div></div>);})()}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:S.md}}>
          {CATS.map((cat)=>{const cnt=cats[cat.id]?.length||0;const p=total>0?perc(cnt,total):0;return(
            <div key={cat.id} style={{background:C.surface,borderRadius:R.lg,padding:`${S.lg}px`,border:`1px solid ${cat.color}30`,boxShadow:SH.sm,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:48,height:48,borderRadius:R.md,background:cat.color+"18",border:`2px solid ${cat.color}35`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:20,fontWeight:800,color:cat.color,...NUM}}>{cnt}</span>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:cat.color,marginBottom:2}}>{cat.label}</div>
                <div style={{fontSize:11,color:C.text3,fontFamily:FM}}>{p}% do total</div>
              </div>
            </div>
          );})}</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:4,height:18,borderRadius:2,background:C.blue}}/>
            Desempenho por área
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:S.lg}}>{AREAS.map((a)=>{const st=areaStats[a.id];const t2=st.total||24;const ac2=st.soube+st.chutou;const p2=perc(ac2,t2);const diff=p2-BENCHMARKS[a.id];return(
            <div key={a.id} style={{background:C.card,borderRadius:R.lg,padding:`${S.xl}px`,borderLeft:`4px solid ${a.color}`,boxShadow:SH.sm,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:700,color:a.color}}>{a.label}</span>
                <span style={{fontSize:10,fontFamily:FM,color:diff>=0?C.green:C.red,fontWeight:600,padding:"2px 8px",borderRadius:R.pill,background:diff>=0?C.green+"14":C.red+"14"}}>{diff>=0?`+${diff}pp`:`${diff}pp`}</span>
              </div>
              <div style={{fontSize:24,fontWeight:800,color:perfColor(p2),...NUM,marginBottom:4}}>{p2}%</div>
              <div style={{height:6,background:C.surface,borderRadius:R.pill,overflow:"hidden",margin:"8px 0"}}><div style={{height:"100%",width:`${p2}%`,background:perfColor(p2),borderRadius:999,transition:"width .4s cubic-bezier(.4,0,.2,1)"}}/></div>
              <div style={{fontSize:10,color:C.text3,fontFamily:FM,marginTop:6,display:"flex",gap:8,flexWrap:"wrap"}}>{CATS.map((cat)=><span key={cat.id} style={{color:cat.color,fontWeight:600}}>{cat.short}: {st[cat.id]||0}</span>)}</div>
            </div>
          );})}</div></div>
        {ev>0&&(()=>{const catEV=CATS.find(c=>c.id==="errou_viu");return(<div style={{background:`linear-gradient(135deg,${catEV.color}08,${catEV.color}03)`,border:`1px solid ${catEV.color}30`,borderRadius:R.xl,padding:S.xl,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:catEV.color+"08"}}/><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{width:36,height:36,borderRadius:R.md,background:catEV.color+"18",border:`2px solid ${catEV.color}40`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16}}>🔄</span></div><div><span style={{fontSize:14,fontWeight:700,color:catEV.color}}>Revisar com urgência</span><div style={{fontSize:11,color:C.text3,fontFamily:FM}}>{ev} questões que errei mas já estudei</div></div></div><div style={{display:"flex",flexDirection:"column",gap:12}}>{AREAS.map((a)=>{const qs=evByArea[a.id];if(!qs.length)return null;return(<div key={a.id} style={{background:C.card,borderRadius:R.lg,padding:S.lg,borderLeft:`3px solid ${a.color}`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:12,fontWeight:700,color:a.color,textTransform:"uppercase",letterSpacing:0.5}}>{a.label}</span><span style={{fontSize:10,fontFamily:FM,color:C.text3,background:C.surface,padding:"1px 6px",borderRadius:R.pill}}>{qs.length}</span></div><div style={{display:"flex",flexDirection:"column",gap:4}}>{qs.map((q)=>{const dd=exam.qDetails?.[q.n];const pv=globalPrev[q.n]||dd?.prev||(analysis?.prev?.[q.n]);const pvSt=pv&&PSTYLE[pv];return(<div key={q.n} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 10px",background:C.surface,borderRadius:R.md,transition:"transform 0.1s"}}><span style={{fontSize:11,fontWeight:800,color:catEV.color,fontFamily:FM,minWidth:28}}>Q{q.n}</span>{pvSt&&<span style={{fontSize:9,fontWeight:700,color:pvSt.color,fontFamily:FM,padding:"2px 6px",borderRadius:R.pill,background:pvSt.color+"18",border:`1px solid ${pvSt.color}30`,minWidth:52,textAlign:"center",flexShrink:0}}>{pvSt.label}</span>}<span style={{fontSize:12,flex:1,lineHeight:1.3}}>{q.theme}</span>{q.matchedSubtopic&&<span style={{fontSize:9,color:C.purple,fontFamily:FM,background:C.purple+"14",padding:"2px 8px",borderRadius:R.pill,flexShrink:0,whiteSpace:"nowrap",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis"}} title={`Subtema: ${q.matchedSubtopic}`}>📋 {q.matchedSubtopic}</span>}{q.schedule&&<span style={{fontSize:9,color:C.blue,fontFamily:FM,background:C.blue+"14",padding:"2px 8px",borderRadius:R.pill,flexShrink:0,whiteSpace:"nowrap"}}>📅 {q.schedule.semana}</span>}</div>);})}</div></div>);})}</div></div>);})()}
        {en>0&&(()=>{const catEN=CATS.find(c=>c.id==="errou_nao");const totalDB=Object.keys(EXAM_THEMES_DB).length;const prevCounts={m:0,a:0,md:0,b:0};const allEnQ=[];(cats.errou_nao||[]).forEach((n)=>{const dd=exam.qDetails?.[n];if(!dd?.area)return;const p=globalPrev[n]||dd?.prev||(analysis?.prev?.[n])||"baixa";const study2=mapThemeToStudy(dd.theme,dd.area,userSubtopics);allEnQ.push({n,area:dd.area,theme:dd.theme||"—",p,schedule:study2,matchedSubtopic:study2?.matchedSubtopic||null});if(p==="muito alta")prevCounts.m++;else if(p==="alta")prevCounts.a++;else if(p==="média")prevCounts.md++;else prevCounts.b++;});return(<div style={{background:`linear-gradient(135deg,${catEN.color}08,${catEN.color}03)`,border:`1px solid ${catEN.color}30`,borderRadius:R.xl,padding:S.xl,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:catEN.color+"08"}}/><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><div style={{width:36,height:36,borderRadius:R.md,background:catEN.color+"18",border:`2px solid ${catEN.color}40`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16}}>🎯</span></div><div><span style={{fontSize:14,fontWeight:700,color:catEN.color}}>Gaps de estudo — {en} temas</span><div style={{fontSize:11,color:C.text3,fontFamily:FM}}>Prevalência geral · {totalDB} provas analisadas</div></div></div><div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"10px 0 14px"}}>{[{label:"Muito alta",count:prevCounts.m,color:PSTYLE["muito alta"].color},{label:"Alta",count:prevCounts.a,color:PSTYLE["alta"].color},{label:"Média",count:prevCounts.md,color:PSTYLE["média"].color},{label:"Baixa",count:prevCounts.b,color:PSTYLE["baixa"].color}].filter(x=>x.count>0).map((x,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:R.pill,background:x.color+"14",border:`1px solid ${x.color}30`}}><div style={{width:8,height:8,borderRadius:"50%",background:x.color}}/><span style={{fontSize:11,fontWeight:700,color:x.color,fontFamily:FM}}>{x.count}</span><span style={{fontSize:10,color:C.text3}}>{x.label}</span></div>)}</div><div style={{display:"flex",flexDirection:"column",gap:12}}>{AREAS.map((a)=>{const qs=allEnQ.filter(q=>q.area===a.id);if(!qs.length)return null;const sorted=[...qs].sort((x,y)=>(PORD[x.p]??3)-(PORD[y.p]??3));return(<div key={a.id} style={{background:C.card,borderRadius:R.lg,padding:S.lg,borderLeft:`3px solid ${a.color}`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:12,fontWeight:700,color:a.color,textTransform:"uppercase",letterSpacing:0.5}}>{a.label}</span><span style={{fontSize:10,fontFamily:FM,color:C.text3,background:C.surface,padding:"1px 6px",borderRadius:R.pill}}>{qs.length}</span></div><div style={{display:"flex",flexDirection:"column",gap:3}}>{sorted.map((q)=>{const st2=PSTYLE[q.p]||PSTYLE["baixa"];return(<div key={q.n} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px",background:st2.color+"08",borderRadius:R.md,borderLeft:`3px solid ${st2.color}40`}}><span style={{fontSize:11,fontWeight:800,color:catEN.color,fontFamily:FM,minWidth:28}}>Q{q.n}</span><span style={{fontSize:9,fontWeight:700,color:st2.color,fontFamily:FM,padding:"2px 6px",borderRadius:R.pill,background:st2.color+"18",border:`1px solid ${st2.color}30`,minWidth:52,textAlign:"center",flexShrink:0}}>{st2.label}</span><span style={{fontSize:12,flex:1,lineHeight:1.3}}>{q.theme}</span>{q.matchedSubtopic&&<span style={{fontSize:9,color:C.purple,fontFamily:FM,background:C.purple+"14",padding:"2px 8px",borderRadius:R.pill,flexShrink:0,whiteSpace:"nowrap",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis"}} title={`Subtema: ${q.matchedSubtopic}`}>📋 {q.matchedSubtopic}</span>}{q.schedule&&<span style={{fontSize:9,color:C.blue,fontFamily:FM,background:C.blue+"14",padding:"2px 8px",borderRadius:R.pill,flexShrink:0,whiteSpace:"nowrap"}}>📅 {q.schedule.semana}</span>}</div>);})}</div></div>);})}</div></div>);})()}
        {analysis&&<AnalysisSection analysis={analysis} exam={exam} globalPrev={globalPrev} />}
      </div>}
    </div>
  );
}

export { Provas };
