import React from "react";
import { useState } from "react";
import { AREAS, INTERVALS, INT_LABELS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { today, diffDays, fmtDate, perc, perfColor, perfLabel } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";

function RevCard({ r, onMark }) {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState("");
  const [acertos, setAcertos] = useState("");
  const a = areaMap[r.area];
  const days = diffDays(r.nextDue, today());
  const isDue = r.nextDue <= today();
  const deadlineText = isDue ? (days === 0 ? "hoje" : `${Math.abs(days)}d atrás`) : `em ${days}d`;
  const pct = Number(total) > 0 ? perc(Number(acertos), Number(total)) : null;

  function submit() {
    const t = Number(total), ac = Number(acertos);
    if (!t || t <= 0) return alert("Informe o total.");
    if (ac > t) return alert("Acertos > total.");
    onMark(r.id, ac, t);
    setOpen(false); setTotal(""); setAcertos("");
  }

  return (
    <div style={{ ...card, borderTop: `2px solid ${isDue ? C.red + "60" : a?.color + "35"}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: S.lg }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: S.sm }}>{r.theme}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: S.md }}>
            <span style={{ ...tag(a?.color || C.text3), fontSize: 11, padding: "3px 10px" }}>{a?.label}</span>
            <span style={{ fontSize: 11, color: C.text2, fontWeight: 500, padding: "3px 10px", background: C.card2, borderRadius: R.pill, border: `1px solid ${C.border}` }}>{INT_LABELS[r.intervalIndex]}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: isDue ? C.red : C.text3, padding: "3px 10px", background: (isDue ? C.red : C.text3) + "12", borderRadius: R.pill, border: `1px solid ${(isDue ? C.red : C.text3)}25` }}>{deadlineText}</span>
          </div>
          <div style={{ display: "flex", gap: S.lg, fontSize: 12, color: C.text3, flexWrap: "wrap" }}>
            <span>Último <span style={{ color: perfColor(r.lastPerf), fontWeight: 700, fontFamily: FN }}>{r.lastPerf}%</span></span>
            <span style={{ color: C.border2 }}>·</span>
            <span>{fmtDate(r.nextDue)}</span>
          </div>
          {open && (
            <div style={{ marginTop: S.lg, padding: S.lg, background: C.surface, borderRadius: R.md, border: `1px solid ${C.border2}` }}>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: S.md }}>Registrar revisão</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
                <Fld label="Total"><input type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} style={inp()} /></Fld>
                <Fld label="Acertos"><input type="number" min="0" value={acertos} onChange={(e) => setAcertos(e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
                <div>{pct !== null && <div style={{ background: perfColor(pct) + "22", border: `1px solid ${perfColor(pct)}44`, borderRadius: R.sm, padding: "8px 12px", textAlign: "center" }}><span style={{ fontSize: 18, fontWeight: 700, color: perfColor(pct), ...NUM }}>{pct}%</span></div>}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submit} style={btn("#34D399")}>Concluir</button>
                <button onClick={() => setOpen(false)} style={btn(C.card2)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
        {!open && <button onClick={() => setOpen(true)} style={btn(isDue ? C.green : C.card2, { fontSize: 12, padding: "8px 16px", minHeight: H.sm })}>{isDue ? "Revisar" : "Antecipar"}</button>}
      </div>
    </div>
  );
}

function QuickLog({ onQuick }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ area: "clinica", theme: "", total: "", acertos: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const pct = Number(form.total) > 0 ? perc(Number(form.acertos), Number(form.total)) : null;

  function submit() {
    const t = Number(form.total), ac = Number(form.acertos);
    if (!form.theme.trim()) return alert("Informe o tema.");
    if (!t || t <= 0) return alert("Informe o total.");
    if (ac > t) return alert("Acertos > total.");
    onQuick(form.area, form.theme, t, ac);
    setForm({ area: "clinica", theme: "", total: "", acertos: "" });
    setOpen(false);
  }

  if (!open) return <button onClick={() => setOpen(true)} style={btn(C.purple, { fontSize: 12 })}>+ Revisão avulsa</button>;

  return (
    <div style={{ ...card, border: `1px solid ${C.purple}35` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 14 }}>Revisão avulsa</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
        <Fld label="Área"><select value={form.area} onChange={(e) => set("area", e.target.value)} style={inp()}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Fld>
        <Fld label="Tema"><input type="text" value={form.theme} onChange={(e) => set("theme", e.target.value)} placeholder="Ex: Insuficiência Cardíaca" style={inp()} /></Fld>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end", marginBottom: 14 }}>
        <Fld label="Total"><input type="number" min="1" value={form.total} onChange={(e) => set("total", e.target.value)} style={inp()} /></Fld>
        <Fld label="Acertos"><input type="number" min="0" value={form.acertos} onChange={(e) => set("acertos", e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
        <div>{pct !== null && <div style={{ background: perfColor(pct) + "22", border: `1px solid ${perfColor(pct)}44`, borderRadius: R.sm, padding: "8px 12px", textAlign: "center" }}><span style={{ fontSize: 18, fontWeight: 700, color: perfColor(pct), ...NUM }}>{pct}%</span></div>}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={submit} style={btn("#34D399")}>Registrar</button>
        <button onClick={() => setOpen(false)} style={btn(C.card2)}>Cancelar</button>
      </div>
    </div>
  );
}

function LogList({ revLogs, onEditLog, onDelLog }) {
  const [show, setShow] = useState(false);
  const recent = revLogs.slice(0, 20);
  if (!recent.length) return null;

  return (
    <div style={card}>
      <button onClick={() => setShow((v) => !v)} style={{ background: "none", border: "none", color: C.text2, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: F, padding: 0 }}>
        {show ? "▾" : "▸"} Histórico ({revLogs.length})
      </button>
      {show && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {recent.map((l) => {
            const a = areaMap[l.area];
            return (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: C.text3, fontFamily: FM, minWidth: 44 }}>{fmtDate(l.date)}</span>
                <span style={{ ...tag(a?.color || C.text3), fontSize: 10, padding: "2px 8px" }}>{a?.short}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{l.theme}</span>
                <span style={{ color: perfColor(l.pct), fontWeight: 700, fontFamily: FN }}>{l.pct}%</span>
                <button onClick={() => onDelLog(l.id)} style={{ background: "none", border: "none", color: C.border2, cursor: "pointer", fontSize: 13, padding: 2 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Revisoes({ due, upcoming, revLogs, reviews, sessions, onMark, onQuick, onEditLog, onDelLog }) {
  const [fil, setFil] = useState("all");
  const filteredDue = due.filter((r) => fil === "all" || r.area === fil);
  const filteredUp = upcoming.filter((r) => fil === "all" || r.area === fil);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>
        Revisões espaçadas baseadas no seu desempenho. Temas vencem conforme o intervalo calculado.
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <QuickLog onQuick={onQuick} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setFil("all")} style={btn(fil === "all" ? C.card2 : C.surface, { padding: "8px 14px", fontSize: 12, minHeight: H.sm, borderRadius: R.sm, border: `1px solid ${C.border}`, color: fil === "all" ? C.text : C.text3, boxShadow: fil === "all" ? SH.sm : "none" })}>Todas</button>
          {AREAS.map((a) => <button key={a.id} onClick={() => setFil(a.id)} style={btn(fil === a.id ? a.color : C.surface, { padding: "8px 14px", fontSize: 12, minHeight: H.sm, borderRadius: R.sm, border: fil === a.id ? "none" : `1px solid ${C.border}`, color: fil === a.id ? "#fff" : C.text3, boxShadow: fil === a.id ? SH.sm : "none" })}>{a.short}</button>)}
        </div>
      </div>

      {/* Due reviews */}
      {filteredDue.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.red, marginBottom: 12 }}>Pendentes ({filteredDue.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredDue.map((r) => <RevCard key={r.id} r={r} onMark={onMark} />)}
          </div>
        </div>
      )}

      {filteredDue.length === 0 && <Empty msg="Nenhuma revisão pendente. Tudo em dia!" green />}

      {/* Upcoming */}
      {filteredUp.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text2, marginBottom: 12 }}>Próximas ({filteredUp.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredUp.map((r) => <RevCard key={r.id} r={r} onMark={onMark} />)}
          </div>
        </div>
      )}

      <LogList revLogs={revLogs} onEditLog={onEditLog} onDelLog={onDelLog} />
    </div>
  );
}

export { Revisoes };
