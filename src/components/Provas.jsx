import React from "react";
import { useState } from "react";
import { AREAS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM, numUnit } from "../theme.js";
import { today, perc, fmtDate, perfColor, perfLabel, uid } from "../utils.js";
import { buildDefaultQDetails, defaultAreaForQuestion } from "../utils.js";
import { Fld, Empty } from "./UI.jsx";

function ExamForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ title: "", date: today(), total: "120", acertos: "", erros: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    if (!form.title.trim()) return alert("Informe o título da prova.");
    const total = Number(form.total) || 120;
    const acertos = Number(form.acertos) || 0;
    const erros = Number(form.erros) || 0;
    onAdd({
      title: form.title.trim(),
      date: form.date,
      total,
      acertos,
      erros,
      answered: acertos + erros,
      qDetails: {},
    });
    onClose();
  }

  return (
    <div style={{ ...card, border: `1px solid ${C.purple}35` }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.purple, marginBottom: 16 }}>Nova prova</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
        <Fld label="Título"><input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Unicamp 2024" style={inp()} /></Fld>
        <Fld label="Data"><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inp()} /></Fld>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Fld label="Total de questões"><input type="number" min="1" value={form.total} onChange={(e) => set("total", e.target.value)} style={inp()} /></Fld>
        <Fld label="Acertos"><input type="number" min="0" value={form.acertos} onChange={(e) => set("acertos", e.target.value)} style={inp({ borderColor: "#34D39944" })} /></Fld>
        <Fld label="Erros"><input type="number" min="0" value={form.erros} onChange={(e) => set("erros", e.target.value)} style={inp({ borderColor: "#FB718544" })} /></Fld>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={submit} style={btn(C.purple)}>Registrar prova</button>
        <button onClick={onClose} style={btn(C.card2)}>Cancelar</button>
      </div>
    </div>
  );
}

function ExamCard({ exam, onDel, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ acertos: exam.acertos || 0, erros: exam.erros || 0 });
  const total = exam.total || 120;
  const answered = (exam.acertos || 0) + (exam.erros || 0);
  const pct = answered > 0 ? perc(exam.acertos || 0, answered) : null;

  function save() {
    const ac = Number(form.acertos) || 0;
    const er = Number(form.erros) || 0;
    onUpdate(exam.id, { acertos: ac, erros: er, answered: ac + er });
    setEditing(false);
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: S.lg }}>
        {pct !== null && (
          <div style={{ width: 56, height: 56, borderRadius: R.sm, background: perfColor(pct) + "18", border: `2px solid ${perfColor(pct)}44`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: perfColor(pct), ...NUM }}>{pct}%</span>
            <span style={{ fontSize: 9, color: C.text3, fontFamily: FM }}>{perfLabel(pct)}</span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{exam.title}</div>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: FM, marginBottom: S.md }}>
            {fmtDate(exam.date)} · {total}q · {answered > 0 ? (<><span style={{ color: C.green }}>✓{exam.acertos}</span> <span style={{ color: C.red }}>✗{exam.erros}</span></>) : "Não respondida"}
          </div>
          {editing && (
            <div style={{ padding: S.md, background: C.surface, borderRadius: R.md, border: `1px solid ${C.border2}`, marginTop: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <Fld label="Acertos"><input type="number" min="0" value={form.acertos} onChange={(e) => setForm((f) => ({ ...f, acertos: e.target.value }))} style={inp()} /></Fld>
                <Fld label="Erros"><input type="number" min="0" value={form.erros} onChange={(e) => setForm((f) => ({ ...f, erros: e.target.value }))} style={inp()} /></Fld>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={save} style={btn("#34D399", { fontSize: 12 })}>Salvar</button>
                <button onClick={() => setEditing(false)} style={btn(C.card2, { fontSize: 12 })}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {!editing && <button onClick={() => setEditing(true)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: R.md, padding: "6px 12px", fontSize: 12, color: C.text3, cursor: "pointer" }}>✏</button>}
          <button onClick={() => onDel(exam.id)} style={{ background: "none", border: "none", color: C.border2, cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
        </div>
      </div>
    </div>
  );
}

function Provas({ exams, revLogs, sessions, onAdd, onDel, onUpdate }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>
        Registre provas e simulados para acompanhar sua evolução geral.
      </div>

      <div>
        {showForm ? (
          <ExamForm onAdd={onAdd} onClose={() => setShowForm(false)} />
        ) : (
          <button onClick={() => setShowForm(true)} style={btn(C.purple)}>+ Nova prova</button>
        )}
      </div>

      {exams.length === 0 ? (
        <Empty msg="Nenhuma prova registrada ainda." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {exams.map((e) => <ExamCard key={e.id} exam={e} onDel={onDel} onUpdate={onUpdate} />)}
        </div>
      )}
    </div>
  );
}

export { Provas };
