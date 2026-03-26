import React from "react";
import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { AREAS, BENCHMARKS, areaMap } from "../data.js";
import { C, DARK, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, numUnit } from "../theme.js";
import { today, addDays, diffDays, fmtDate, perc, perfColor, syncWithNotion, weekDates } from "../utils.js";
import { loadKey, saveKey } from "../storage.js";
import { Fld, ChartTip } from "./UI.jsx";

function Dashboard({ revLogs, sessions, exams, reviews, dueCount, onNotionSync, onNewSession, onAlerts, forceTab }) {
  const [activeTab, setActiveTab] = useState(forceTab || "overview");
  const [notionToken, setNotionToken] = useState("");
  const [notionDbId, setNotionDbId] = useState("");
  const [notionStatus, setNotionStatus] = useState("idle");
  const [notionMsg, setNotionMsg] = useState("");
  const [exportStatus, setExportStatus] = useState("idle");
  const [agendaWeek] = useState(() => loadKey("rp_agenda_v7", null));
  const [agendaHistory] = useState(() => loadKey("rp_agenda_history", []));
  const [streakStart, setStreakStart] = useState(() => loadKey("rp_streak_start", "2026-02-02"));
  const [showStreakReset, setShowStreakReset] = useState(false);
  const [storedMaxStreak, setStoredMaxStreak] = useState(() => loadKey("rp_max_streak", 0));
  const agendaActivity = useMemo(() => {
    const activity = {};
    function processWeek(days, satKey) {
      if (!days || !satKey) return;
      const dates = weekDates(satKey);
      for (const day of days) {
        if (!day?.id || !dates[day.id]) continue;
        const total = day.items?.length || 0;
        const done = (day.items || []).filter((i) => i.done).length;
        if (total > 0) activity[dates[day.id]] = { done, total, pct: Math.round((done / total) * 100) };
      }
    }
    const weekDays = agendaWeek?.days || (Array.isArray(agendaWeek) ? agendaWeek : null);
    const weekKey = agendaWeek?._weekKey;
    if (weekDays && weekKey) processWeek(weekDays, weekKey);
    (agendaHistory || []).forEach((entry) => { if (entry.days && entry.savedAt) processWeek(entry.days, entry.savedAt); });
    return activity;
  }, [agendaWeek, agendaHistory]);
  const revEvo = useMemo(() => {
    if (!revLogs.length) return [];
    const byW = {};
    [...revLogs].sort((a, b) => a.date.localeCompare(b.date)).forEach((r) => {
      const d = new Date(r.date + "T12:00:00"); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const wk = mon.toISOString().slice(0, 10);
      if (!byW[wk]) byW[wk] = {}; if (!byW[wk][r.area]) byW[wk][r.area] = { sum: 0, n: 0 }; byW[wk][r.area].sum += r.pct; byW[wk][r.area].n += 1;
    });
    return Object.entries(byW).map(([wk, areas]) => ({ name: fmtDate(wk), ...Object.fromEntries(AREAS.map((a) => [a.short, areas[a.id] ? Math.round(areas[a.id].sum / areas[a.id].n) : undefined])) }));
  }, [revLogs]);
  const revAreaAvg = useMemo(() => { const o = {}; AREAS.forEach((a) => { const v = revLogs.filter((r) => r.area === a.id).map((r) => r.pct); o[a.id] = v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null; }); return o; }, [revLogs]);
  const totalQ = revLogs.reduce((s, x) => s + (x.total || 0), 0) + sessions.reduce((s, x) => s + (x.total || 0), 0);
  const barData = AREAS.map((a) => ({ area: a.short, "% questões": revAreaAvg[a.id] ?? 0 }));
  const START_DATE = "2026-02-02";
  const allStudyDates = useMemo(() => {
    const s = new Set([...revLogs.map((l) => l.date), ...sessions.map((s) => s.date || s.createdAt || "")].filter((d) => d && d >= START_DATE));
    return s;
  }, [revLogs, sessions]);
  const diasEstudados = Math.max(0, streakStart ? diffDays(today(), streakStart) + 1 : 0);
  const totalRevisoes = revLogs.length;
  const streak = diasEstudados;
  const maxStreak = Math.max(streak, storedMaxStreak);
  function resetStreak() {
    if (streak > storedMaxStreak) { setStoredMaxStreak(streak); saveKey("rp_max_streak", streak); }
    const newStart = addDays(today(), 1);
    setStreakStart(newStart);
    saveKey("rp_streak_start", newStart);
    setShowStreakReset(false);
  }
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
  const alerts = useMemo(() => {
    const res = [];
    themeProgress.forEach((t) => {
      const badSessions = t.sorted.filter((s) => s.pct < 70).length;
      if (badSessions >= 2 && t.last < 75) {
        res.push({ type: "danger", icon: "🔴", title: `Ponto cego: ${t.theme}`, msg: `${badSessions} sessões abaixo de 70% · última: ${t.last}%`, area: t.area });
      }
    });
    reviews.filter((r) => diffDays(today(), r.nextDue) > 7).forEach((r) => {
      res.push({ type: "warning", icon: "🟡", title: `Atrasado ${diffDays(today(), r.nextDue)}d: ${r.theme}`, msg: `Última: ${r.lastPerf}% em ${fmtDate(r.lastStudied)}`, area: r.area });
    });
    themeProgress.filter((t) => t.last < t.avg - 10 && t.n >= 3).forEach((t) => {
      res.push({ type: "info", icon: "📉", title: `Queda em: ${t.theme}`, msg: `Média ${t.avg}% → última ${t.last}%`, area: t.area });
    });
    const studiedThemes = new Set(reviews.map((r) => r.theme.toLowerCase().trim()));
    const examAlertsSeen = new Set();
    exams.forEach((ex) => {
      if (!ex.qDetails || !ex.cats) return;
      [...(ex.cats.errou_viu || []), ...(ex.cats.errou_nao || [])].forEach((n) => {
        const q = ex.qDetails[n];
        if (!q || !q.theme || !q.prev) return;
        if (q.prev !== "muito alta" && q.prev !== "alta") return;
        const tLow = q.theme.toLowerCase().trim();
        if (!studiedThemes.has(tLow)) return;
        const key = `${q.area}__${tLow}`;
        if (examAlertsSeen.has(key)) return;
        examAlertsSeen.add(key);
        const erType = ex.cats.errou_viu?.includes(n) ? "já vi" : "nunca vi";
        res.push({ type: "danger", icon: "🎯", title: `Erro em prova: ${q.theme}`, msg: `Prevalência ${q.prev} · ${ex.name} · errei (${erType})`, area: q.area });
      });
    });
    return res;
  }, [themeProgress, reviews, exams]);
  const heatmapData = useMemo(() => {
    const days = [];
    const t = today();
    const firstOfMonth = t.slice(0, 8) + "01";
    const lastDay = new Date(Number(t.slice(0, 4)), Number(t.slice(5, 7)), 0).getDate();
    for (let i = 0; i < lastDay; i++) {
      const d = addDays(firstOfMonth, i);
      const agenda = agendaActivity[d];
      const pct = agenda ? agenda.pct : 0;
      const intensity = pct === 0 ? 0 : pct === 100 ? 4 : pct >= 85 ? 3 : pct >= 50 ? 2 : 1;
      days.push({ date: d, day: i + 1, intensity, pct, done: agenda?.done || 0, total: agenda?.total || 0 });
    }
    return days;
  }, [agendaActivity]);
  function exportReport() {
    setExportStatus("loading");
    try {
      const areaRows = AREAS.map((a) => `<tr><td style="color:${a.color};font-weight:600">${a.label}</td><td>${revAreaAvg[a.id] ?? 0}%</td><td>${(revAreaAvg[a.id] ?? 0) >= 85 ? "✓ Acima" : "⚠ Abaixo"}</td></tr>`).join("");
      const alertRows = alerts.map((a) => `<tr><td>${a.icon}</td><td>${a.title}</td><td style="color:#888">${a.msg}</td></tr>`).join("") || "<tr><td colspan=3 style='color:#22C55E'>Nenhum alerta</td></tr>";
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>MedTracker - Relatório</title></head><body style="background:#0A0A0B;color:#F4F4F5;font-family:system-ui,sans-serif;padding:40px;max-width:700px;margin:0 auto"><h1 style="color:#6366F1">⚕ MedTracker — Relatório de Estudo</h1><p style="color:#888">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0"><div style="background:#17171A;border-radius:12px;padding:16px;text-align:center"><div style="color:#888;font-size:11px">DIAS ESTUDADOS</div><div style="font-size:28px;font-weight:800;color:#60A5FA">${diasEstudados}</div></div><div style="background:#17171A;border-radius:12px;padding:16px;text-align:center"><div style="color:#888;font-size:11px">STREAK</div><div style="font-size:28px;font-weight:800;color:#F59E0B">${streak}d 🔥</div></div><div style="background:#17171A;border-radius:12px;padding:16px;text-align:center"><div style="color:#888;font-size:11px">QUESTÕES</div><div style="font-size:28px;font-weight:800;color:#2DD4BF">${totalQ}</div></div></div><h2 style="color:#A78BFA;margin-top:30px">Desempenho por Área (meta: 85%)</h2><table style="width:100%;border-collapse:collapse"><tr style="color:#888;font-size:12px"><th style="text-align:left;padding:8px">Área</th><th>Média</th><th>Status</th></tr>${areaRows}</table><h2 style="color:#F59E0B;margin-top:30px">Alertas</h2><table style="width:100%;border-collapse:collapse;font-size:13px">${alertRows}</table><h2 style="color:#22C55E;margin-top:30px">Resumo</h2><ul style="color:#888;line-height:2"><li>Total revisões: ${totalRevisoes}</li><li>Provas realizadas: ${exams.length}</li><li>Temas em queda: ${themeProgress.filter((t) => t.trend < -10).map((t) => t.theme).join(", ") || "nenhum"}</li></ul></body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "relatorio-medtracker.html"; a.click();
      URL.revokeObjectURL(url);
      setExportStatus("done");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch (e) { setExportStatus("error"); }
  }
  async function doNotionSync() {
    if (!notionToken.trim() || !notionDbId.trim()) return alert("Preencha token e database ID.");
    setNotionStatus("loading"); setNotionMsg("Conectando ao Notion via IA…");
    try {
      const result = await syncWithNotion(notionToken, notionDbId);
      if (result.reviews?.length > 0) { onNotionSync(result.reviews); setNotionStatus("done"); setNotionMsg(`✓ ${result.reviews.length} revisões sincronizadas do Notion!`); }
      else { setNotionStatus("error"); setNotionMsg("Nenhuma revisão encontrada. Verifique o token e database ID."); }
    } catch (e) { setNotionStatus("error"); setNotionMsg("Erro: " + e.message); }
  }
  const DASH_TABS = [
    { id: "overview", label: "Visão geral" },
    { id: "heatmap", label: "Heatmap" },
    { id: "notion", label: "🔗 Notion" },
  ];
  const heatColors = C === DARK ? [C.card, "#252547", "#4338CA", "#6366F1", "#818CF8"] : [C.card2, "#C7D2FE", "#A5B4FC", "#818CF8", "#6366F1"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
      {!forceTab && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: S.md }}>
        {[
          { label: "Dias estudados", value: diasEstudados, accent: C.blue, sub: "desde 02/02" },
          { label: "Revisões", value: totalRevisoes, accent: C.purple },
          { label: "Questões", value: totalQ.toLocaleString("pt-BR"), accent: C.teal },
          { label: "Provas", value: exams.length, accent: C.yellow },
        ].map((s) => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${s.accent}25`, borderRadius: R.xl, padding: `${S.lg}px ${S.xl}px`, boxShadow: SH.glow(s.accent) }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: S.sm }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.accent, fontFamily: FN, lineHeight: 1 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 10, color: C.text3, marginTop: S.xs, fontWeight: 400, opacity: 0.6 }}>{s.sub}</div>}
          </div>
        ))}
        <button onClick={onNewSession} style={{ background: `linear-gradient(135deg, ${C.blue}50, ${C.purple}60)`, border: `1px solid ${C.purple}40`, borderRadius: R.xl, padding: `${S.lg}px ${S.xl}px`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: S.xs, boxShadow: SH.glow(C.purple), transition: "all 0.15s ease" }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = SH.glow(C.blue); }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = SH.glow(C.purple); }}>
          <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Registrar</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FN, lineHeight: 1 }}>+ Sessão</div>
        </button>
        <button onClick={onAlerts} style={{ background: `linear-gradient(135deg, ${C.red}45, ${C.purple}50)`, border: `1px solid ${C.red}35`, borderRadius: R.xl, padding: `${S.lg}px ${S.xl}px`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: S.xs, boxShadow: SH.glow(C.red), transition: "all 0.15s ease" }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = SH.glow(C.purple); }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = SH.glow(C.red); }}>
          <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Alertas</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FN, lineHeight: 1 }}>{alerts.length > 0 ? `${alerts.length} temas` : "✓ OK"}</div>
        </button>
      </div>
      <div style={{ display: "flex", gap: 4, background: C.surface, borderRadius: R.pill, padding: 4, overflowX: "auto", scrollbarWidth: "none", border: `1px solid ${C.border}` }}>
        {DASH_TABS.map((t) => { const active = activeTab === t.id; return (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "10px 16px", flex: 1, background: active ? C.purple + "20" : "transparent", border: active ? `1px solid ${C.purple}35` : "1px solid transparent", borderRadius: R.pill, cursor: "pointer", color: active ? C.purple : C.text3, fontSize: 13, fontFamily: F, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", minHeight: H.sm, boxShadow: active ? SH.glow(C.purple) : "none", textAlign: "center", transition: "all 0.15s ease", opacity: active ? 1 : 0.55 }}>{t.label}</button>
        ); })}
      </div>
      </>}
      {activeTab === "overview" && <>
        <div style={card}><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Desempenho por área</div><div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>Média das sessões vs. meta 85%</div><ResponsiveContainer width="100%" height={220}><BarChart data={barData} barCategoryGap="32%"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.9} /><stop offset="100%" stopColor={C.blue} stopOpacity={0.4} /></linearGradient></defs><CartesianGrid strokeDasharray="3 6" stroke={C.border} strokeOpacity={0.5} vertical={false} /><XAxis dataKey="area" tick={{ fill: C.text2, fontSize: 12, fontFamily: F }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: C.text2, fontSize: 11, fontFamily: FM, fontVariantNumeric: "tabular-nums" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={36} /><Tooltip content={<ChartTip />} cursor={{ fill: C.border + "40" }} /><ReferenceLine y={85} stroke={C.text3} strokeDasharray="6 4" strokeWidth={1} label={{ value: "meta 85%", position: "right", fill: C.text3, fontSize: 10, fontFamily: F }} /><Bar dataKey="% questões" fill="url(#bg)" radius={[8, 8, 4, 4]} maxBarSize={48} /></BarChart></ResponsiveContainer></div>
        <div style={card}><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Evolução semanal</div><div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>% médio por semana por área</div><ResponsiveContainer width="100%" height={220}><LineChart data={revEvo}><CartesianGrid strokeDasharray="3 6" stroke={C.border} strokeOpacity={0.5} vertical={false} /><XAxis dataKey="name" tick={{ fill: C.text2, fontSize: 11, fontFamily: F }} axisLine={false} tickLine={false} /><YAxis domain={[40, 100]} tick={{ fill: C.text2, fontSize: 11, fontFamily: FM, fontVariantNumeric: "tabular-nums" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={36} /><Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontFamily: F, paddingTop: 12 }} formatter={(value) => <span style={{ color: C.text2, fontWeight: 400, marginLeft: 2, marginRight: 8 }}>{value}</span>} /><ReferenceLine y={85} stroke={C.text3} strokeDasharray="6 4" strokeWidth={1} label={{ value: "meta 85%", position: "right", fill: C.text3, fontSize: 10, fontFamily: F }} />{AREAS.map((a) => <Line key={a.id} type="monotone" dataKey={a.short} stroke={a.color} strokeWidth={2} dot={false} connectNulls />)}</LineChart></ResponsiveContainer></div>
        <div style={card}><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Por área</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>{AREAS.map((a) => { const avg = revAreaAvg[a.id] ?? 0; const logs = revLogs.filter((r) => r.area === a.id); const tQ = logs.reduce((s, r) => s + (r.total || 0), 0); const th = [...new Set(logs.map((r) => r.theme))].length; const diff = avg - BENCHMARKS[a.id]; return (<div key={a.id} style={{ background: C.surface, borderRadius: R.lg, padding: `${S.lg}px ${S.xl}px`, border: `1px solid ${a.color}18`, boxShadow: SH.sm }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: S.sm }}><span style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</span><span style={{ fontSize: 22, fontWeight: 900, color: C.text, fontFamily: FN, lineHeight: 1 }}>{avg}<span style={{ fontSize: 12, fontWeight: 600, color: C.text3 }}>%</span></span></div><div style={{ height: 4, background: C.card, borderRadius: 999, overflow: "hidden", marginBottom: S.sm }}><div style={{ height: "100%", width: `${avg}%`, background: a.color, borderRadius: 999, opacity: 0.75 }} /></div><div style={{ display: "flex", gap: S.md, fontSize: 11, color: C.text3, fontWeight: 400, flexWrap: "wrap" }}><span>meta <span style={{ ...NUM, fontSize: 11 }}>85%</span> <span style={{ color: diff >= 0 ? C.green : C.red, fontWeight: 600, ...NUM }}>{diff >= 0 ? `+${diff}` : diff}<span style={{ fontWeight: 400, opacity: 0.6 }}>pp</span></span></span><span><span style={NUM}>{tQ.toLocaleString("pt-BR")}</span>q · <span style={NUM}>{th}</span> temas</span></div></div>); })}</div></div>
        <div style={{ ...card, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: S.lg }}><div><div style={{ fontSize: 14, fontWeight: 600 }}>📄 Relatório de estudo</div><div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>A IA gera um relatório HTML completo com análise e recomendações</div></div><button onClick={exportReport} disabled={exportStatus === "loading"} style={btn(exportStatus === "done" ? C.green : C.blue, { padding: "9px 20px" })}>{exportStatus === "loading" ? "⏳ Gerando…" : exportStatus === "done" ? "✓ Baixado!" : "Exportar relatório"}</button></div>
      </>}
      {activeTab === "alerts" && <><div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>Pontos de atenção detectados automaticamente com base no seu desempenho.</div>{alerts.length === 0 && <div style={{ ...card, background: C.green + "10", border: `1px solid ${C.green}33` }}><div style={{ fontSize: 14, fontWeight: 600, color: C.green }}>✓ Nenhum alerta</div><div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>Seu desempenho está consistente. Continue assim!</div></div>}{alerts.map((a, i) => { const area = areaMap[a.area]; const borderColor = a.type === "danger" ? C.red : a.type === "warning" ? C.yellow : C.blue; return (<div key={i} style={{ ...card, borderLeft: `4px solid ${borderColor}`, padding: "14px 18px" }}><div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.title}</div><div style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>{a.msg}</div>{area && <span style={{ ...tag(area.color), marginTop: 6, display: "inline-flex" }}>{area.label}</span>}</div></div></div>); })}{alerts.length > 0 && (<div style={{ ...card, background: C.surface, border: `1px solid ${C.border2}` }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💡 O que fazer</div><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{alerts.filter((a) => a.type === "danger").length > 0 && <div style={{ fontSize: 12, color: C.text2 }}>🔴 <b>Pontos cegos:</b> refaça questões desses temas e identifique os subtópicos mais cobrados. Considere revisão manual.</div>}{alerts.filter((a) => a.type === "warning").length > 0 && <div style={{ fontSize: 12, color: C.text2 }}>🟡 <b>Revisões atrasadas:</b> priorize-as hoje antes de adicionar sessões novas.</div>}{alerts.filter((a) => a.type === "info").length > 0 && <div style={{ fontSize: 12, color: C.text2 }}>📉 <b>Em queda:</b> revise a teoria desses temas — pode ser que o desempenho alto inicial tenha sido sorte.</div>}</div></div>)}</>}
      {activeTab === "heatmap" && <><div style={card}><div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Heatmap de estudo</div><div style={{ fontSize: 12, color: C.text3, marginBottom: 16 }}>{new Date(today() + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} — completude da agenda por dia</div><div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>{heatmapData.map((d, i) => (<div key={i} title={`${fmtDate(d.date)}: ${d.total > 0 ? `${d.done}/${d.total} (${d.pct}%)` : "sem itens"}`} style={{ aspectRatio: "1", borderRadius: 6, background: heatColors[Math.min(d.intensity, 4)], cursor: "default", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: d.intensity >= 3 ? "#fff" : C.text3, fontFamily: FN }}>{d.day}</div>))}</div><div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}><span style={{ fontSize: 10, color: C.text3 }}>menos</span>{heatColors.map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: `1px solid ${C.border}` }} />)}<span style={{ fontSize: 10, color: C.text3 }}>mais</span></div><div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>{[{ label: "Dias estudados", value: diasEstudados, sub: "desde 02/02" },{ label: "Melhor streak", value: `${maxStreak}d`, sub: "recorde" }].map((s) => (<div key={s.label} style={{ background: C.surface, borderRadius: R.md, padding: S.lg, border: `1px solid ${C.border}`, boxShadow: SH.sm }}><div style={{ fontSize: 10, color: C.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, ...NUM, lineHeight: 1 }}>{s.value}</div><div style={{ fontSize: 10, color: C.text3, fontWeight: 400, marginTop: 3 }}>{s.sub}</div></div>))}<div style={{ background: C.surface, borderRadius: R.md, padding: S.lg, border: `1px solid ${C.yellow}30`, boxShadow: SH.sm, cursor: "pointer", position: "relative" }} onClick={() => setShowStreakReset((v) => !v)}><div style={{ fontSize: 10, color: C.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Streak atual</div><div style={{ fontSize: 22, fontWeight: 800, color: C.yellow, ...NUM, lineHeight: 1 }}>{streak}d 🔥</div><div style={{ fontSize: 10, color: C.text3, fontWeight: 400, marginTop: 3 }}>consecutivos</div>{showStreakReset && <div className="fade-in" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, marginTop: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, boxShadow: SH.lg, overflow: "hidden" }}><button onClick={(e) => { e.stopPropagation(); resetStreak(); }} style={{ width: "100%", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", color: C.red, fontSize: 13, fontWeight: 600, fontFamily: F, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={(e) => e.currentTarget.style.background = C.red + "12"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>🔄 Zerar streak</button></div>}</div></div></div></>}
      {activeTab === "notion" && <><div style={{ ...card, border: `1px solid ${C.blue}44` }}><div style={{ fontSize: 15, fontWeight: 700, color: C.blue, marginBottom: 4 }}>🔗 Sincronizar com Notion</div><div style={{ fontSize: 12, color: C.text3, marginBottom: 16, lineHeight: 1.6 }}>A integração usa a IA do Claude como intermediária — ela recebe seu token temporariamente, consulta a API do Notion, e retorna os dados das revisões formatados. O token não é armazenado em nenhum lugar.<br /><b style={{ color: C.text }}>1.</b> Token de integração (Settings → Connections → Create integration)<br /><b style={{ color: C.text }}>2.</b> Database ID (da URL da sua página MED, ex: notion.so/<b style={{ color: C.yellow }}>3098883c3e738...</b>)</div><div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}><Fld label="Notion Integration Token"><input type="password" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} placeholder="secret_xxx..." style={inp({ borderColor: C.blue + "44" })} /></Fld><Fld label="Database ID"><input type="text" value={notionDbId} onChange={(e) => setNotionDbId(e.target.value)} placeholder="3098883c3e73819d85c4..." style={inp({ borderColor: C.blue + "44" })} /></Fld></div><button onClick={doNotionSync} disabled={notionStatus === "loading"} style={btn(C.blue, { width: "100%" })}>{notionStatus === "loading" ? "⏳ Sincronizando…" : "🔗 Sincronizar revisões"}</button>{notionMsg && (<div style={{ marginTop: 10, padding: "10px 14px", borderRadius: R.sm, background: notionStatus === "error" ? C.red + "18" : C.green + "18", border: `1px solid ${notionStatus === "error" ? C.red : C.green}44`, fontSize: 12, color: notionStatus === "error" ? C.red : C.green, fontFamily: FM }}>{notionMsg}</div>)}<div style={{ marginTop: 14, padding: 12, background: C.bg, borderRadius: R.sm, border: `1px solid ${C.border}` }}><div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Como funciona</div><div style={{ fontSize: 11, color: C.text3, lineHeight: 1.7 }}>A integração usa a IA do Claude como intermediária — ela recebe seu token temporariamente, consulta a API do Notion, e retorna os dados das revisões formatados. O token não é armazenado em nenhum lugar.<br /><span style={{ color: C.yellow }}>⚠ Para funcionar, você deve compartilhar o database MED com sua integração no Notion.</span></div></div></div></>}
    </div>
  );
}

export { Dashboard };
