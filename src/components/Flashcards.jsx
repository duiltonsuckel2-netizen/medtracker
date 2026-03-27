import React, { useState, useMemo } from "react";
import { C, F, FM, FN, R, S, SH, card as cardStyle, btn, tag, NUM } from "../theme.js";
import { today, fmtDate } from "../utils.js";
import { areaMap } from "../data.js";
import { getDueCards, deckStats, QUALITY_LABELS } from "../flashcards.js";

function Flashcards({ decks, onReview }) {
  const [mode, setMode] = useState("overview"); // overview | study | deck
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 });

  const allDue = useMemo(() => getDueCards(decks), [decks]);

  const deckDue = useMemo(() => {
    if (!activeDeckId) return allDue;
    return allDue.filter(c => c.deckId === activeDeckId);
  }, [allDue, activeDeckId]);

  const currentCard = deckDue[currentIdx] || null;

  function startStudy(deckId) {
    setActiveDeckId(deckId || null);
    setCurrentIdx(0);
    setFlipped(false);
    setSessionStats({ reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 });
    setMode("study");
  }

  function handleAnswer(qualityKey) {
    if (!currentCard) return;
    onReview(currentCard.deckId, currentCard.id, qualityKey);
    setSessionStats(s => ({ ...s, reviewed: s.reviewed + 1, [qualityKey]: s[qualityKey] + 1 }));
    setFlipped(false);
    if (currentIdx < deckDue.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      setMode("done");
    }
  }

  // ── Overview: deck list ────────────────────────────────────
  if (mode === "overview") {
    const totalDue = allDue.length;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: S.md }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Flashcards de Revisao</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Baseados nos erros das suas provas em temas ja estudados</div>
          </div>
          {totalDue > 0 && (
            <button onClick={() => startStudy(null)} style={btn(`linear-gradient(135deg, ${C.purple}, ${C.blue})`, { padding: "10px 20px", borderRadius: R.pill, fontWeight: 700, fontSize: 13, color: "#fff", border: "none" })}>
              Estudar todos ({totalDue} pendentes)
            </button>
          )}
        </div>

        {decks.length === 0 && (
          <div style={{ ...cardStyle, background: C.surface, border: `1px solid ${C.border}`, textAlign: "center", padding: "32px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{"🃏"}</div>
            <div style={{ fontSize: 14, color: C.text3, lineHeight: 1.6 }}>
              Nenhum flashcard gerado ainda.<br />
              Cadastre provas com questoes classificadas para gerar flashcards automaticamente.
            </div>
          </div>
        )}

        {/* Deck list */}
        <div style={{ display: "flex", flexDirection: "column", gap: S.md }}>
          {decks.map((deck) => {
            const stats = deckStats(deck);
            const areaInfo = areaMap[deck.area];
            return (
              <div key={deck.id} style={{ ...cardStyle, padding: "14px 18px", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s", borderLeft: `4px solid ${deck.areaColor}` }} onClick={() => { setActiveDeckId(deck.id); setMode("deck"); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: S.md, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{deck.theme}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={tag(deck.areaColor)}>{deck.areaLabel}</span>
                      <span style={{ fontSize: 10, color: C.text3 }}>Prova: {deck.examName}</span>
                      {deck.prevalencia && deck.prevalencia !== "baixa" && (
                        <span style={tag(deck.prevalencia === "muito alta" ? C.red : C.yellow)}>
                          Prev. {deck.prevalencia}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {stats.due > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.blue, fontFamily: FN }}>{stats.due}</div>
                        <div style={{ fontSize: 9, color: C.text3, fontWeight: 500 }}>PENDENTES</div>
                      </div>
                    )}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.green, fontFamily: FN }}>{stats.learned}</div>
                      <div style={{ fontSize: 9, color: C.text3, fontWeight: 500 }}>APRENDIDOS</div>
                    </div>
                    {stats.due > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); startStudy(deck.id); }} style={btn(C.blue, { padding: "8px 14px", fontSize: 11, borderRadius: R.pill })}>
                        Estudar
                      </button>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 10, height: 4, background: C.surface, borderRadius: 999, overflow: "hidden", display: "flex" }}>
                  <div style={{ height: "100%", width: `${(stats.mature / stats.total) * 100}%`, background: C.green, transition: "width 0.3s" }} />
                  <div style={{ height: "100%", width: `${((stats.learned - stats.mature) / stats.total) * 100}%`, background: C.blue, transition: "width 0.3s" }} />
                  <div style={{ height: "100%", width: `${(stats.newCards / stats.total) * 100}%`, background: C.text3 + "40", transition: "width 0.3s" }} />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: C.text3 }}>
                  <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.green, marginRight: 4, verticalAlign: "middle" }} />Maduro ({stats.mature})</span>
                  <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.blue, marginRight: 4, verticalAlign: "middle" }} />Aprendendo ({stats.learned - stats.mature})</span>
                  <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.text3 + "40", marginRight: 4, verticalAlign: "middle" }} />Novo ({stats.newCards})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Deck detail ────────────────────────────────────────────
  if (mode === "deck") {
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck) { setMode("overview"); return null; }
    const stats = deckStats(deck);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: S.xl }}>
        <div style={{ display: "flex", alignItems: "center", gap: S.md }}>
          <button onClick={() => setMode("overview")} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 14, fontFamily: F, padding: "4px 8px" }}>{"<"} Voltar</button>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{deck.theme}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <span style={tag(deck.areaColor)}>{deck.areaLabel}</span>
            <span style={{ fontSize: 11, color: C.text3 }}>Prova: {deck.examName}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: S.md }}>
            {[
              { label: "Total", value: stats.total, color: C.text },
              { label: "Pendentes", value: stats.due, color: C.blue },
              { label: "Aprendidos", value: stats.learned, color: C.green },
              { label: "Maduros", value: stats.mature, color: C.teal },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, borderRadius: R.md, padding: S.lg, textAlign: "center", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: FN }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {stats.due > 0 && (
            <button onClick={() => startStudy(deck.id)} style={btn(`linear-gradient(135deg, ${C.purple}, ${C.blue})`, { marginTop: 16, width: "100%", padding: "12px", borderRadius: R.md, fontWeight: 700, fontSize: 14, color: "#fff" })}>
              Estudar {stats.due} cards pendentes
            </button>
          )}
        </div>
        {/* Card list */}
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text2 }}>Cards do deck</div>
        <div style={{ display: "flex", flexDirection: "column", gap: S.sm }}>
          {deck.cards.map((c, i) => {
            const isDue = c.nextDue <= today();
            return (
              <div key={c.id} style={{ background: C.surface, borderRadius: R.md, padding: "10px 14px", border: `1px solid ${isDue ? C.blue + "44" : C.border}`, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600, color: C.text, flex: 1 }}>#{i + 1} {c.front.slice(0, 70)}{c.front.length > 70 ? "..." : ""}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    {c.repetitions > 0 && <span style={{ fontSize: 10, color: C.text3, fontFamily: FM }}>EF:{c.easeFactor} Int:{c.interval}d</span>}
                    <span style={{ fontSize: 10, fontWeight: 600, color: isDue ? C.blue : C.text3, fontFamily: FM }}>{isDue ? "PENDENTE" : fmtDate(c.nextDue)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Study mode: Anki-style card review ─────────────────────
  if (mode === "study") {
    if (!currentCard) { setMode("done"); return null; }
    const remaining = deckDue.length - currentIdx;
    const progress = deckDue.length > 0 ? ((currentIdx) / deckDue.length) * 100 : 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: S.xl, maxWidth: 600, margin: "0 auto", width: "100%" }}>
        {/* Study header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setMode("overview")} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 13, fontFamily: F }}>{"< Sair"}</button>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: FM }}>{currentIdx + 1}/{deckDue.length}</div>
          <div style={{ fontSize: 10, color: C.text3 }}>{remaining} restantes</div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: C.surface, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${C.purple}, ${C.blue})`, borderRadius: 999, transition: "width 0.3s ease" }} />
        </div>

        {/* Theme label */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={tag(currentCard.areaColor)}>{currentCard.areaLabel}</span>
          <span style={{ fontSize: 11, color: C.text3 }}>{currentCard.deckTheme}</span>
        </div>

        {/* Card */}
        <div
          onClick={() => !flipped && setFlipped(true)}
          style={{
            ...cardStyle,
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            cursor: !flipped ? "pointer" : "default",
            background: flipped ? C.card : `linear-gradient(135deg, ${C.card}, ${C.surface})`,
            border: `1px solid ${flipped ? C.purple + "40" : C.border}`,
            boxShadow: flipped ? SH.glow(C.purple) : SH.md,
            transition: "all 0.25s ease",
            padding: "24px 20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {!flipped ? (
            <>
              <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 16 }}>PERGUNTA</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.6, maxWidth: 440 }}>{currentCard.front}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 20, opacity: 0.6 }}>Toque para ver a resposta</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: C.purple, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 16 }}>RESPOSTA</div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7, maxWidth: 440, whiteSpace: "pre-line" }}>{currentCard.back}</div>
            </>
          )}
        </div>

        {/* Answer buttons (only when flipped) */}
        {flipped && (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: S.sm }}>
            {Object.entries(QUALITY_LABELS).map(([key, q]) => (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                style={{
                  background: q.color + "18",
                  border: `1px solid ${q.color}44`,
                  borderRadius: R.md,
                  padding: "12px 8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = q.color + "30"; e.currentTarget.style.borderColor = q.color + "66"; }}
                onMouseLeave={e => { e.currentTarget.style.background = q.color + "18"; e.currentTarget.style.borderColor = q.color + "44"; }}
              >
                <span style={{ fontSize: 18 }}>{q.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: q.color }}>{q.label}</span>
                <span style={{ fontSize: 9, color: C.text3 }}>{q.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Session complete ───────────────────────────────────────
  if (mode === "done") {
    const total = sessionStats.reviewed;
    const goodPct = total > 0 ? Math.round(((sessionStats.good + sessionStats.easy) / total) * 100) : 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: S.xl, maxWidth: 500, margin: "0 auto", width: "100%", textAlign: "center" }}>
        <div style={{ ...cardStyle, padding: "32px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{"🎉"}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Sessao concluida!</div>
          <div style={{ fontSize: 13, color: C.text3, marginBottom: 20 }}>Voce revisou {total} flashcard{total !== 1 ? "s" : ""}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: S.sm, marginBottom: 20 }}>
            {Object.entries(QUALITY_LABELS).map(([key, q]) => (
              <div key={key} style={{ background: q.color + "12", borderRadius: R.md, padding: S.lg }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: q.color, fontFamily: FN }}>{sessionStats[key]}</div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{q.label}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 6, background: C.surface, borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${goodPct}%`, background: `linear-gradient(90deg, ${C.green}, ${C.teal})`, borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 12, color: C.text3 }}>{goodPct}% de acerto (Bom + Facil)</div>
        </div>

        <button onClick={() => { setMode("overview"); setCurrentIdx(0); }} style={btn(C.purple, { padding: "12px 24px", fontSize: 14, fontWeight: 700, borderRadius: R.md, width: "100%" })}>
          Voltar aos decks
        </button>
      </div>
    );
  }

  return null;
}

// ── Compact widget for Dashboard alerts page ─────────────────
function FlashcardWidget({ decks, onNavigate }) {
  const allDue = useMemo(() => getDueCards(decks), [decks]);
  const totalDecks = decks.length;
  const totalCards = decks.reduce((s, d) => s + d.cards.length, 0);
  const totalDue = allDue.length;
  const totalMature = decks.reduce((s, d) => s + deckStats(d).mature, 0);

  if (totalDecks === 0) return null;

  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${C.purple}`, padding: "14px 18px", cursor: "pointer", transition: "box-shadow 0.15s" }} onClick={onNavigate} onMouseEnter={e => { e.currentTarget.style.boxShadow = SH.glow(C.purple); }} onMouseLeave={e => { e.currentTarget.style.boxShadow = SH.md; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: S.md }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{"🃏"}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Flashcards de Revisao</span>
          </div>
          <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
            {totalDue > 0
              ? `${totalDue} card${totalDue !== 1 ? "s" : ""} pendente${totalDue !== 1 ? "s" : ""} para revisao`
              : "Todos os cards em dia!"
            }
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: totalDue > 0 ? C.blue : C.green, fontFamily: FN }}>{totalDue > 0 ? totalDue : totalMature}</div>
            <div style={{ fontSize: 9, color: C.text3, fontWeight: 500 }}>{totalDue > 0 ? "PENDENTES" : "MADUROS"}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text2, fontFamily: FN }}>{totalDecks}</div>
            <div style={{ fontSize: 9, color: C.text3, fontWeight: 500 }}>DECKS</div>
          </div>
        </div>
      </div>
      {totalDue > 0 && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {decks.filter(d => deckStats(d).due > 0).slice(0, 3).map(d => (
            <span key={d.id} style={{ ...tag(d.areaColor), fontSize: 9 }}>{d.theme.slice(0, 30)}</span>
          ))}
          {decks.filter(d => deckStats(d).due > 0).length > 3 && (
            <span style={{ fontSize: 10, color: C.text3 }}>+{decks.filter(d => deckStats(d).due > 0).length - 3} mais</span>
          )}
        </div>
      )}
    </div>
  );
}

export { Flashcards, FlashcardWidget };
