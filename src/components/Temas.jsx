import React from "react";
import { useState } from "react";
import { AREAS, INTERVALS, INT_LABELS, areaMap } from "../data.js";
import { C, F, FM, FN, R, S, H, SH, card, inp, btn, tag, NUM } from "../theme.js";
import { today, diffDays, fmtDate, perfColor } from "../utils.js";
import { Fld, Tooltip, useDebounce } from "./UI.jsx";

function Temas({ reviews, onEdit }) {
  const [editing, setEditing] = useState(null); const [editForm, setEditForm] = useState({ intervalIndex: 0, nextDue: "" });
  const [fil, setFil] = useState("all"); const [search, setSearch] = useState("");
  const startEdit = (r) => { setEditing(r.id); setEditForm({ intervalIndex: r.intervalIndex, nextDue: r.nextDue }); };
  const confirm = () => { onEdit(editing, editForm.intervalIndex, editForm.nextDue); setEditing(null); };
  const debouncedSearch = useDebounce(search, 250);
  const filtered = reviews.filter((r) => fil === "all" || r.area === fil).filter((r) => !debouncedSearch || r.theme.toLowerCase().includes(debouncedSearch.toLowerCase())).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const chipStyle = (active, color) => ({
    padding: "7px 16px", fontSize: 12, fontFamily: F, fontWeight: active ? 700 : 500,
    minHeight: H.sm, height: H.sm, borderRadius: R.pill, cursor: "pointer",
    background: active ? (color || C.card2) : "transparent",
    border: active ? `1px solid ${color ? color + "60" : C.border2}` : `1px solid ${C.border}`,
    color: active ? (color ? "#fff" : C.text) : C.text3,
    boxShadow: active ? SH.sm : "none",
    transition: "all 0.15s",
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
      <div style={{ display: "flex", alignItems: "center", gap: S.md, padding: `${S.lg}px ${S.xl}px`, background: C.blue + "08", borderRadius: R.lg, border: `1px solid ${C.blue}18` }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>✏</span>
        <span style={{ fontSize: 12, color: C.text3, lineHeight: 1.4 }}>Use <span style={{ color: C.blue, fontWeight: 600 }}>Corrigir</span> em cada tema para ajustar a etapa e a data da próxima revisão.</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tema…" style={{ ...inp(), width: "100%", padding: "12px 16px", fontSize: 14 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setFil("all")} style={chipStyle(fil === "all")}>Todas</button>
          {AREAS.map((a) => <button key={a.id} onClick={() => setFil(a.id)} style={chipStyle(fil === a.id, a.color)}>{a.short}</button>)}
        </div>
      </div>
      {filtered.length === 0 && <div style={{ color: C.text3, fontSize: 13, padding: "40px 20px", textAlign: "center", animation: "fadeIn 0.3s ease" }}>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>{debouncedSearch ? "\uD83D\uDD0D" : "\uD83D\uDCDA"}</div>
        <div style={{ lineHeight: 1.5 }}>{debouncedSearch ? `Nenhum tema encontrado para "${debouncedSearch}"` : "Nenhum tema cadastrado ainda."}</div>
        {!debouncedSearch && <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Registre uma sessão de aula para começar a acompanhar seus temas.</div>}
      </div>}
      {filtered.map((r, idx) => { const a = areaMap[r.area]; const days = diffDays(r.nextDue, today()); const isDue = r.nextDue <= today(); const isE = editing === r.id;
        const deadlineBg = isDue ? C.red : C.text3;
        const deadlineText = isDue ? (days === 0 ? "hoje" : `${Math.abs(days)}d atrás`) : `em ${days}d`;
        const perfTip = r.lastPerf >= 85 ? "Bom: acima de 85% de acertos" : r.lastPerf >= 60 ? "Regular: entre 60-84% de acertos" : "Fraco: abaixo de 60% de acertos";
        const intervalTip = `Etapa ${r.intervalIndex + 1}/${INTERVALS.length} — revisão a cada ${INTERVALS[r.intervalIndex]} dia(s)`;
        const deadlineTip = isDue ? (days === 0 ? "Revisão pendente para hoje" : `Revisão atrasada em ${Math.abs(days)} dia(s)`) : `Faltam ${days} dia(s) para a próxima revisão`;
        return (
        <div key={r.id} style={{ ...card, borderLeft: `3px solid ${isDue ? C.red : a?.color + "50"}`, padding: `${S.xl}px`, boxShadow: SH.sm, animation: `fadeInUp 0.3s ease ${Math.min(idx * 0.04, 0.3)}s both` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: S.lg }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: S.sm }}>{r.theme}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: S.md }}>
                <span style={{ ...tag(a?.color || C.text3), fontSize: 11, padding: "3px 10px" }}>{a?.label}</span>
                <Tooltip text={intervalTip}><span style={{ fontSize: 11, color: C.text2, fontWeight: 500, padding: "3px 10px", background: C.card2, borderRadius: R.pill, border: `1px solid ${C.border}` }}>{INT_LABELS[r.intervalIndex]}</span></Tooltip>
                <Tooltip text={deadlineTip}><span style={{ fontSize: 11, fontWeight: 600, color: deadlineBg, padding: "3px 10px", background: deadlineBg + "12", borderRadius: R.pill, border: `1px solid ${deadlineBg}25` }}>{deadlineText}</span></Tooltip>
              </div>
              <div style={{ display: "flex", gap: S.lg, fontSize: 12, color: C.text3, flexWrap: "wrap", alignItems: "center" }}>
                <Tooltip text={perfTip}><span>Último <span style={{ color: perfColor(r.lastPerf), fontWeight: 700, fontFamily: FN }}>{r.lastPerf}%</span></span></Tooltip>
                <span style={{ color: C.border2 }}>·</span>
                <span>Próxima <span style={{ color: C.text2, fontWeight: 600 }}>{fmtDate(r.nextDue)}</span></span>
                <span style={{ color: C.border2 }}>·</span>
                <Tooltip text={`${r.history?.length || 0} revisão(ões) registrada(s) para este tema`}><span><span style={{ color: C.text2, fontWeight: 600, fontFamily: FN }}>{r.history?.length || 0}</span>× revisado</span></Tooltip>
              </div>
              {isE && <div style={{ marginTop: S.xl, padding: S.lg, background: C.surface, borderRadius: R.md, border: `1px solid ${C.border2}`, animation: "fadeInUp 0.2s ease" }}>
                <div style={{ fontSize: 12, color: C.blue, fontWeight: 600, marginBottom: S.md }}>Editar: "{r.theme}"</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <Fld label="Etapa concluída"><select value={editForm.intervalIndex} onChange={(e) => setEditForm((f) => ({ ...f, intervalIndex: Number(e.target.value) }))} style={inp()}>{INTERVALS.map((iv, i) => <option key={i} value={i}>{INT_LABELS[i]} — {iv} dia{iv > 1 ? "s" : ""}</option>)}</select></Fld>
                  <Fld label="Próxima revisão"><input type="date" value={editForm.nextDue} onChange={(e) => setEditForm((f) => ({ ...f, nextDue: e.target.value }))} style={inp()} /></Fld>
                </div>
                <div style={{ display: "flex", gap: 8 }}><button onClick={confirm} style={btn("#34D399")}>✓ Salvar</button><button onClick={() => setEditing(null)} style={btn(C.card2)}>Cancelar</button></div>
              </div>}
            </div>
            {!isE && <button onClick={() => startEdit(r)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: R.md, padding: "7px 14px", fontSize: 12, fontFamily: F, fontWeight: 500, color: C.text3, cursor: "pointer", flexShrink: 0, transition: "all 0.15s", whiteSpace: "nowrap" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.blue + "55"; e.currentTarget.style.color = C.blue; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text3; }}>✏ Corrigir</button>}
          </div>
        </div>
      ); })}
    </div>
  );
}

export { Temas };
