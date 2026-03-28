import React from "react";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { AREAS, BENCHMARKS, CATS, areaMap, EXAM_THEMES_DB, KNOWN_PDFS } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { today, fmtDate, perc, uid, perfColor, perfLabel, catColor, mapThemeToSchedule, searchKnownPdf, defaultAreaForQuestion, buildDefaultQDetails } from "../utils.js";
import { Fld, Empty, ChartTip } from "./UI.jsx";

function Provas({ exams, revLogs, sessions, onAdd, onDel, onUpdate }) {
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
        det[num] = { area: d.a, theme: d.t, schedule: mapThemeToSchedule(d.t) };
        enriched.push({ n: num, theme: d.t, area: d.a, schedule: det[num].schedule });
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
        <button onClick={() => setStep(1)} style={{ ...btn(C.blue), padding: "12px 24px", fontSize: 14, fontWeight: 600, width: "100%", borderRadius: R.lg, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>📝 Registrar prova</button>
        {exams.length >= 2 && <ExamComparison exams={exams} sortMode={sortMode} setSortMode={setSortMode} />}
        {exams.length === 0 ? <Empty icon="📋" msg="Nenhuma prova registrada ainda. Registre sua primeira prova para acompanhar seu desempenho." /> : exams.map((exam) => <ExamCard key={exam.id} exam={exam} allLogs={allLogs} isOpen={detail === exam.id} onToggle={() => setDetail(detail === exam.id ? null : exam.id)} onDel={onDel} onUpdate={onUpdate} knownThemes={knownThemes} />)}
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
      {step === 2 && <div style={{ ...card, border: "1px solid #3B82F655", display: "flex", flexDirection: "column", gap: 16 }}>
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
          <button onClick={() => needArea.length > 0 ? setStep(3) : buildExam()} style={btn("#34D399")}>
            {needArea.length > 0 ? `Próximo → indicar áreas (${needArea.length} erradas)` : "✓ Salvar prova"}
          </button>
        )}
      </div>}
      {step === 3 && <div style={{ ...card, border: "1px solid #3B82F655", display: "flex", flexDirection: "column", gap: 16 }}>
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
                {d.schedule && (<div style={{ marginTop: 8, padding: "6px 10px", background: C.blue + "10", borderRadius: R.sm, border: `1px solid ${C.blue}22`, fontSize: 11, color: C.blue, fontFamily: FM }}>📅 Cronograma MED: <b>{d.schedule.semana}</b> — {d.schedule.topics[0]}</div>)}
              </div>
            );
          })}
        </div>
        <button onClick={() => { if (!allAreasFilled) return alert("Preencha a área de todas as questões erradas."); buildExam(); }} style={btn("#34D399")}>✓ Salvar prova</button>
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

function ExamCard({ exam, allLogs, isOpen, onToggle, onDel, onUpdate, knownThemes }) {
  const [editMode, setEditMode] = useState(false);
  const [editDetails, setEditDetails] = useState({});
  const [filterArea, setFilterArea] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const cats = exam.cats || {};
  const s = cats.soube?.length || 0; const c = cats.chutou?.length || 0; const ev = cats.errou_viu?.length || 0; const en = cats.errou_nao?.length || 0;
  const total = exam.total || (s + c + ev + en); const acertos = exam.acertos || (s + c); const geral = perc(acertos, total);
  const areaStats = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = { soube: 0, chutou: 0, errou_viu: 0, errou_nao: 0, total: 0 }; }); if (exam.areaResults) { Object.entries(exam.areaResults).forEach(([aId, r]) => { if (o[aId]) o[aId] = { ...r }; }); } else if (exam.qDetails) { Object.entries(exam.qDetails).forEach(([n, d]) => { if (!d?.area) return; const nn = Number(n); const bk = cats.soube?.includes(nn) ? "soube" : cats.chutou?.includes(nn) ? "chutou" : cats.errou_viu?.includes(nn) ? "errou_viu" : "errou_nao"; o[d.area][bk]++; o[d.area].total++; }); } return o; }, [exam, cats]);
  const evByArea = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = []; }); (cats.errou_viu || []).forEach((n) => { const d = exam.qDetails?.[n]; if (!d?.area) return; o[d.area].push({ n, theme: d.theme || "—", schedule: mapThemeToSchedule(d.theme) }); }); return o; }, [exam, cats]);
  const enByArea = useMemo(() => { const o = {}; AREAS.forEach((a) => { o[a.id] = []; }); (cats.errou_nao || []).forEach((n) => { const d = exam.qDetails?.[n]; if (!d?.area) return; o[d.area].push({ n, theme: d.theme || "—", schedule: mapThemeToSchedule(d.theme) }); }); return o; }, [exam, cats]);
  const PMAP = { "muito alta": [21,28,33,34,38,41,44,51,55,59,60,68,81,85,90,98,100,102,103,105,106,108,111], "alta": [3,4,16,27,29,46,52,66,79,87,107,109,115,120], "média": [12,36,67,74,80,84,94,95,118,119], "baixa": [15,32] };
  const NMAP = {}; Object.entries(PMAP).forEach(([cat, nums]) => nums.forEach((n) => { NMAP[n] = cat; }));
  const PSTYLE = { "muito alta": { color: C.green, label: "Muito alta" }, "alta": { color: "#60A5FA", label: "Alta" }, "média": { color: "#FBBF24", label: "Média" }, "baixa": { color: C.text3, label: "Baixa" } };
  const PORD = { "muito alta": 0, "alta": 1, "média": 2, "baixa": 3 };
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", padding: "4px 0" }} onClick={onToggle}>
        <div style={{ width: 72, height: 72, borderRadius: R.xl, background: perfColor(geral) + "15", border: `2px solid ${perfColor(geral)}40`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: SH.glow(perfColor(geral)) }}><span style={{ fontSize: 22, fontWeight: 800, color: perfColor(geral), ...NUM, lineHeight: 1 }}>{geral}%</span><span style={{ fontSize: 10, color: C.text3, ...NUM, marginTop: 2 }}>{acertos}/{total}</span></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.3, marginBottom: 4 }}>{exam.name}</div>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: FM, marginBottom: 8 }}>{fmtDate(exam.date)} · {total} questões</div>
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
        {ev>0&&(()=>{const catEV=CATS.find(c=>c.id==="errou_viu");return(<div style={{background:C.surface,border:`1px solid ${catEV.color}30`,borderRadius:R.lg,padding:S.lg}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={{width:10,height:10,borderRadius:"50%",background:catEV.color,flexShrink:0}}/><span style={{fontSize:13,fontWeight:600,color:catEV.color}}>Errei mas já estudei — revisar com urgência ({ev})</span></div><div style={{display:"flex",flexDirection:"column",gap:10}}>{AREAS.map((a)=>{const qs=evByArea[a.id];if(!qs.length)return null;return(<div key={a.id}><div style={{fontSize:11,fontWeight:600,color:a.color,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>{a.label}</div><div style={{display:"flex",flexDirection:"column",gap:4}}>{qs.map((q)=>(<div key={q.n} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px",background:catEV.color+"0D",borderRadius:8}}><span style={{fontSize:10,fontWeight:700,color:catEV.color,fontFamily:FM,minWidth:24}}>Q{q.n}</span><div style={{width:7,height:7,borderRadius:"50%",background:catEV.color,flexShrink:0}}/><span style={{fontSize:12,flex:1}}>{q.theme}</span>{q.schedule&&<span style={{fontSize:10,color:C.blue,fontFamily:FM,background:C.blue+"14",padding:"1px 6px",borderRadius:4,flexShrink:0}}>📅 {q.schedule.semana}</span>}</div>))}</div></div>);})}</div></div>);})()}
        {en>0&&(()=>{const catEN=CATS.find(c=>c.id==="errou_nao");return(<div style={{background:C.surface,border:`1px solid ${catEN.color}30`,borderRadius:R.lg,padding:S.lg}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><div style={{width:10,height:10,borderRadius:"50%",background:catEN.color,flexShrink:0}}/><span style={{fontSize:13,fontWeight:600,color:catEN.color}}>Nunca estudei — {en} gaps a cobrir</span></div><div style={{fontSize:11,color:C.text3,fontFamily:FM,marginBottom:12}}>Prevalência: Unicamp · USP-SP · UNIFESP · SUS-SP · IAMSPE · ISCMSP</div><div style={{display:"flex",flexDirection:"column",gap:14}}>{AREAS.map((a)=>{const qs=enByArea[a.id];if(!qs.length)return null;const sorted=[...qs.map((q)=>({...q,p:NMAP[q.n]||"baixa"}))].sort((x,y)=>(PORD[x.p]??3)-(PORD[y.p]??3));return(<div key={a.id}><div style={{fontSize:11,fontWeight:600,color:a.color,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>{a.label}</div><div style={{display:"flex",flexDirection:"column",gap:3}}>{sorted.map((q)=>{const st2=PSTYLE[q.p]||PSTYLE["baixa"];return(<div key={q.n} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 10px",background:st2.color+"10",borderRadius:8}}><div style={{width:7,height:7,borderRadius:"50%",background:catEN.color,flexShrink:0}}/><span style={{fontSize:10,fontWeight:700,color:st2.color,fontFamily:FM,minWidth:64,flexShrink:0}}>{st2.label}</span><span style={{fontSize:12,flex:1}}>{q.theme}</span>{q.schedule&&<span style={{fontSize:10,color:C.blue,fontFamily:FM,background:C.blue+"14",padding:"1px 6px",borderRadius:4,flexShrink:0}}>📅 {q.schedule.semana}</span>}</div>);})}</div></div>);})}</div></div>);})()}
      </div>}
    </div>
  );
}

export { Provas };
