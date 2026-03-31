import React, { useState, useEffect } from "react";
import { C, F, FM, R, S, SH, inp, btn, tag } from "../theme.js";
import { areaMap } from "../data.js";
import { useEscapeKey } from "../hooks/useEscapeKey.js";

const CONFIDENCE_OPTS = [
  { id: "domino", label: "Domino", icon: "💪", color: "#22C55E" },
  { id: "mais_ou_menos", label: "Mais ou menos", icon: "🤔", color: "#EAB308" },
  { id: "preciso_revisar", label: "Preciso revisar", icon: "📖", color: "#EF4444" },
];

function SubtopicModal({ area, topic, semana, existing, onSave, onClose }) {
  useEscapeKey(onClose);
  const [items, setItems] = useState(existing || []);
  const [newItem, setNewItem] = useState("");
  const areaObj = areaMap[area];

  function addItem() {
    const t = newItem.trim();
    if (!t || items.includes(t)) return;
    setItems([...items, t]);
    setNewItem("");
  }

  function removeItem(idx) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function handleSave() {
    onSave(items);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in" style={{ background: C.card, borderRadius: 20, padding: 24, maxWidth: 460, width: "100%", border: `1px solid ${C.border2}`, boxShadow: SH.lg, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              Subtemas da aula
            </div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 4, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              {areaObj && <span style={tag(areaObj.color)}>{areaObj.short}</span>}
              <span>{topic}</span>
              {semana && <span style={{ color: C.purple, fontFamily: FM }}>({semana})</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ background: C.surface, borderRadius: R.md, padding: 12, marginBottom: 16, border: `1px solid ${C.border}`, fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
          Adicione os subtemas abordados nesta aula. Eles entram no sistema de revisão espaçada individualmente, permitindo foco nos pontos mais fracos.
        </div>

        {/* Existing subtopics */}
        {items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.card2, borderRadius: R.md, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, flex: 1 }}>{item}</span>
                <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 14, padding: "2px 6px", opacity: 0.5 }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Add new subtopic */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            autoFocus
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
            placeholder="Ex: Abortamento, DTG, Ectópica…"
            style={{ ...inp(), flex: 1, padding: "10px 14px", fontSize: 16 }}
          />
          <button onClick={addItem} disabled={!newItem.trim()} style={btn(C.blue, { padding: "10px 16px", fontSize: 13, opacity: newItem.trim() ? 1 : 0.4 })}>+</button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} style={btn("#34D399", { flex: 1, padding: "12px 16px", fontSize: 13 })}>
            {items.length > 0 ? `✓ Salvar ${items.length} subtema${items.length > 1 ? "s" : ""}` : "Salvar sem subtemas"}
          </button>
          <button onClick={onClose} style={btn(C.card2, { padding: "12px 16px", fontSize: 13 })}>Pular</button>
        </div>
      </div>
    </div>
  );
}

function SubtopicReviewModal({ area, parentTheme, subtopics, onSave, onClose }) {
  useEscapeKey(onClose);
  const [entries, setEntries] = useState(
    subtopics.map((s) => ({ name: s, pct: "" }))
  );
  const areaObj = areaMap[area];

  function setEntry(idx, key, val) {
    setEntries(entries.map((e, i) => i !== idx ? e : { ...e, [key]: val }));
  }

  function handleSave() {
    const valid = entries.filter((e) => e.pct !== "" && Number(e.pct) >= 0 && Number(e.pct) <= 100);
    if (valid.length === 0) return;
    onSave(valid);
  }

  const filled = entries.filter((e) => e.pct !== "" && Number(e.pct) >= 0 && Number(e.pct) <= 100).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in" style={{ background: C.card, borderRadius: 20, padding: 24, maxWidth: 520, width: "100%", border: `1px solid ${C.border2}`, boxShadow: SH.lg, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Desempenho por subtema</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 4, display: "flex", gap: 6, alignItems: "center" }}>
              {areaObj && <span style={tag(areaObj.color)}>{areaObj.short}</span>}
              <span>{parentTheme}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ background: C.surface, borderRadius: R.md, padding: 10, marginBottom: 14, border: `1px solid ${C.border}`, fontSize: 11, color: C.text3 }}>
          Coloque o % de acertos de cada subtema. Deixe em branco os que não revisou.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map((entry, i) => {
            const val = entry.pct !== "" ? Number(entry.pct) : null;
            const pctColor = val !== null ? (val >= 85 ? "#22C55E" : val >= 60 ? "#EAB308" : "#EF4444") : C.text3;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.card2, borderRadius: R.md, border: `1px solid ${val !== null ? pctColor + "40" : C.border}`, transition: "border-color .15s" }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{entry.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="number" min="0" max="100" value={entry.pct} onChange={(e) => { const v = e.target.value; if (v === "" || (Number(v) >= 0 && Number(v) <= 100)) setEntry(i, "pct", v); }} placeholder="—" style={{ ...inp(), width: 56, padding: "6px 8px", fontSize: 16, textAlign: "center", fontFamily: "SF Mono, monospace", fontWeight: 700, color: pctColor }} />
                  <span style={{ fontSize: 13, color: C.text3, fontWeight: 600 }}>%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={handleSave} disabled={filled === 0} style={btn("#34D399", { flex: 1, padding: "12px 16px", fontSize: 13, opacity: filled > 0 ? 1 : 0.4 })}>
            ✓ Salvar {filled} subtema{filled !== 1 ? "s" : ""}
          </button>
          <button onClick={onClose} style={btn(C.card2, { padding: "12px 16px", fontSize: 13 })}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export { SubtopicModal, SubtopicReviewModal, CONFIDENCE_OPTS };
