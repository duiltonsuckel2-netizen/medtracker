import React from "react";
import { useState } from "react";
import { AREAS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, btn, tag, NUM, numUnit } from "../theme.js";
import { today, diffDays, fmtDate, perc, perfColor } from "../utils.js";
import { Empty } from "./UI.jsx";

function StatCard({ label, value, unit, color, sub }) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 140, textAlign: "center" }}>
      <div style={{ fontSize: 10, color: C.text3, fontFamily: FM, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ ...NUM }}>{numUnit(value, unit, 28, 14)}</div>
      {sub && <div style={{ fontSize: 11, color: color || C.text3, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function AlertsList({ reviews }) {
  const due = reviews.filter((r) => r.nextDue <= today()).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const weak = reviews.filter((r) => r.lastPerf < 60).sort((a, b) => a.lastPerf - b.lastPerf);
  if (!due.length && !weak.length) return <Empty msg="Nenhum alerta no momento." green />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {due.length > 0 && (
        <div style={{ ...card, borderTop: `2px solid ${C.red}50` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 10 }}>Revisões atrasadas ({due.length})</div>
          {due.map((r) => {
            const a = areaMap[r.area];
            const days = Math.abs(diffDays(r.nextDue, today()));
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={tag(a?.color || C.text3)}>{a?.short}</span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.theme}</span>
                <span style={{ fontSize: 11, color: C.red, fontFamily: FM }}>{days}d atrás</span>
              </div>
            );
          })}
        </div>
      )}
      {weak.length > 0 && (
        <div style={{ ...card, borderTop: `2px solid ${C.yellow}50` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.yellow, marginBottom: 10 }}>Temas fracos ({weak.length})</div>
          {weak.map((r) => {
            const a = areaMap[r.area];
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={tag(a?.color || C.text3)}>{a?.short}</span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.theme}</span>
                <span style={{ fontSize: 11, color: perfColor(r.lastPerf), fontWeight: 700, fontFamily: FN }}>{r.lastPerf}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Dashboard({ revLogs, sessions, exams, reviews, dueCount, onNotionSync, onNewSession, onAlerts, forceTab }) {
  const [activeTab, setActiveTab] = useState(forceTab || "overview");

  const totalSessions = sessions.length;
  const totalRevisions = revLogs.length;
  const totalThemes = reviews.length;

  const avgPerf = revLogs.length > 0
    ? Math.round(revLogs.reduce((s, l) => s + (l.pct || 0), 0) / revLogs.length)
    : 0;

  // Last 7 days activity
  const d7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    d7.push({ date: ds, label: fmtDate(ds), logs: revLogs.filter((l) => l.date === ds).length });
  }

  // Area breakdown
  const areaStats = AREAS.map((a) => {
    const r = reviews.filter((rv) => rv.area === a.id);
    const logs = revLogs.filter((l) => l.area === a.id);
    const avg = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.pct || 0), 0) / logs.length) : 0;
    return { ...a, count: r.length, logs: logs.length, avg };
  });

  if (activeTab === "alerts") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setActiveTab("overview")} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 14 }}>← Voltar</button>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Alertas</span>
        </div>
        <AlertsList reviews={reviews} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Temas" value={totalThemes} unit="" />
        <StatCard label="Revisões" value={totalRevisions} unit="" />
        <StatCard label="Média" value={avgPerf} unit="%" color={perfColor(avgPerf)} />
        <StatCard label="Pendentes" value={dueCount} unit="" color={dueCount > 0 ? C.red : C.green} sub={dueCount > 0 ? "revisões atrasadas" : "em dia!"} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onNewSession} style={btn(C.blue)}>+ Nova sessão</button>
        {dueCount > 0 && <button onClick={onAlerts} style={btn(C.red, { opacity: 0.9 })}>⚠ {dueCount} alerta{dueCount > 1 ? "s" : ""}</button>}
      </div>

      {/* 7-day activity */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Atividade (7 dias)</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
          {d7.map((d) => {
            const h = d.logs > 0 ? Math.max(16, (d.logs / Math.max(...d7.map((x) => x.logs), 1)) * 64) : 4;
            return (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, color: C.blue, fontFamily: FM, fontWeight: 600, opacity: d.logs > 0 ? 1 : 0 }}>{d.logs}</div>
                <div style={{ width: "100%", height: h, background: d.logs > 0 ? `linear-gradient(to top, ${C.blue}, ${C.purple})` : C.border, borderRadius: R.sm, transition: "height 0.3s" }} />
                <div style={{ fontSize: 9, color: C.text3, fontFamily: FM }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Area breakdown */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Por área</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {areaStats.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ ...tag(a.color), minWidth: 50, justifyContent: "center" }}>{a.short}</span>
              <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(a.avg, 100)}%`, height: "100%", background: a.color, borderRadius: 3, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: a.avg > 0 ? perfColor(a.avg) : C.text3, fontFamily: FN, minWidth: 36, textAlign: "right" }}>{a.avg > 0 ? `${a.avg}%` : "—"}</span>
              <span style={{ fontSize: 10, color: C.text3, fontFamily: FM, minWidth: 32 }}>{a.count}t</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notion sync */}
      <div style={{ ...card, background: C.surface, borderStyle: "dashed" }}>
        <div style={{ fontSize: 12, color: C.text3, textAlign: "center" }}>
          Sincronização com Notion indisponível neste ambiente.
        </div>
      </div>
    </div>
  );
}

export { Dashboard };
