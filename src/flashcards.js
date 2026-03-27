// ── FLASHCARD ENGINE — SM-2 Spaced Repetition Algorithm ─────────────────────
// Based on the SuperMemo SM-2 algorithm used by Anki
// Each card has: easeFactor, interval, repetitions, nextDue, lastReview

import { uid, today, addDays } from "./utils.js";
import { THEME_SUMMARIES, areaMap, SEMANAS, SEM_SAT, UNICAMP_THEMES, CATS } from "./data.js";

// ── SM-2 Algorithm ──────────────────────────────────────────────────────────
// quality: 0-5 (0=complete blackout, 5=perfect response)
// Anki mapping: Again=0, Hard=2, Good=3, Easy=5
export const QUALITY_MAP = {
  again: 0,    // Complete blackout — reset interval
  hard: 2,     // Significant difficulty — reduce interval
  good: 3,     // Correct with some effort — normal progression
  easy: 5,     // Perfect recall — boost interval
};

export const QUALITY_LABELS = {
  again: { label: "De novo", color: "#EF4444", icon: "✗", desc: "Não sabia" },
  hard:  { label: "Difícil", color: "#F59E0B", icon: "⚠", desc: "Lembrei com dificuldade" },
  good:  { label: "Bom",     color: "#22C55E", icon: "✓", desc: "Lembrei" },
  easy:  { label: "Fácil",   color: "#60A5FA", icon: "★", desc: "Sabia de cor" },
};

export function sm2(card, quality) {
  let { easeFactor, interval, repetitions } = card;
  easeFactor = easeFactor || 2.5;
  interval = interval || 0;
  repetitions = repetitions || 0;

  // SM-2 core: if quality < 3, reset
  if (quality < 3) {
    repetitions = 0;
    interval = 1; // 1 day for "again" or "hard"
    if (quality === 0) interval = 1;   // again: see in 1 day (Anki-like: 10min, but we use days)
    if (quality === 2) interval = 1;   // hard: 1 day
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (minimum 1.3)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Easy bonus
  if (quality === 5) {
    interval = Math.round(interval * 1.3);
  }

  const nextDue = addDays(today(), interval);

  return { easeFactor: Math.round(easeFactor * 100) / 100, interval, repetitions, nextDue, lastReview: today() };
}

// ── Flashcard Generation from Exam Errors ───────────────────────────────────
// Analyzes exams to find questions the user got wrong on topics they've already
// studied in the cursinho, then generates 5 flashcards per topic based on
// THEME_SUMMARIES (clinical guidelines data).

function normalizeTheme(theme) {
  return (theme || "").toLowerCase().trim()
    .replace(/\(sem\.\s*\d+\)/gi, "")
    .replace(/[—–-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getStudiedTopics() {
  const t = today();
  const topics = new Set();
  SEMANAS.forEach((sem) => {
    const satDate = SEM_SAT[sem.semana];
    if (!satDate || satDate > t) return;
    sem.aulas.forEach((a) => topics.add(a.topic.toLowerCase().trim()));
  });
  return topics;
}

function matchesCursinho(theme, cursinhoTopics) {
  const t = theme.toLowerCase().trim();
  for (const ct of cursinhoTopics) {
    if (ct.includes(t) || t.includes(ct)) return true;
    const tWords = t.split(/[\s,./()—-]+/).filter((w) => w.length > 3);
    const cWords = ct.split(/[\s,./()—-]+/).filter((w) => w.length > 3);
    let score = 0;
    for (const tw of tWords) for (const cw of cWords) {
      if (tw === cw || cw.includes(tw) || tw.includes(cw)) score++;
    }
    if (score >= 2 || (score >= 1 && tWords.length <= 2)) return true;
  }
  return false;
}

function findBestSummary(theme) {
  const t = normalizeTheme(theme);
  if (THEME_SUMMARIES[t]) return THEME_SUMMARIES[t];
  let best = null, bestScore = 0;
  for (const [key, val] of Object.entries(THEME_SUMMARIES)) {
    const kWords = key.split(/[\s,./()—-]+/).filter((w) => w.length > 3);
    const tWords = t.split(/[\s,./()—-]+/).filter((w) => w.length > 3);
    let score = 0;
    for (const tw of tWords) for (const kw of kWords) {
      if (tw === kw || kw.includes(tw) || tw.includes(kw)) score += Math.max(tw.length, kw.length);
    }
    if (score > bestScore) { bestScore = score; best = val; }
  }
  return bestScore >= 5 ? best : null;
}

// Generate 5 flashcards from a theme summary (based on guidelines/directives)
function generateCardsFromSummary(theme, area, summary) {
  const cards = [];
  const topicos = summary.topicos || [];
  const resumo = summary.resumo || "";

  // Card 1: Overview/definition from resumo
  const sentences = resumo.split(/\.\s+/).filter(s => s.length > 15);
  if (sentences.length >= 1) {
    const keyFact = sentences[0] + (sentences[0].endsWith(".") ? "" : ".");
    const detail = sentences.slice(1, 3).join(". ") + ".";
    cards.push({
      front: `O que define ${theme}? Quais os conceitos-chave?`,
      back: `${keyFact}\n\n${detail}`,
    });
  }

  // Cards 2-5: From topicos (most tested in residency)
  topicos.slice(0, 4).forEach((tp, i) => {
    // Extract the key concept from parentheses or after ":"
    const topicText = tp.t || String(tp);
    const parenMatch = topicText.match(/\(([^)]+)\)/);
    const hint = parenMatch ? parenMatch[1] : "";

    // Create question-answer pairs based on the topic
    const front = `${topicText.replace(/\([^)]*\)/, "").trim()}`;
    const back = hint
      ? `${topicText}\n\nPonto-chave: ${hint}`
      : topicText;

    cards.push({ front: `Explique: ${front}`, back });
  });

  // Fill up to 5 if needed
  while (cards.length < 5 && sentences.length > cards.length) {
    const idx = cards.length;
    if (sentences[idx]) {
      cards.push({
        front: `Qual o conceito? "${sentences[idx].slice(0, 60)}..."`,
        back: sentences[idx] + ".",
      });
    } else break;
  }

  return cards.slice(0, 5);
}

// Main function: analyze exams and generate flashcard decks
export function generateFlashcardDecks(exams, reviews, sessions) {
  const cursinhoTopics = getStudiedTopics();
  const studiedThemes = new Set(reviews.map((r) => r.theme.toLowerCase().trim()));
  const decks = [];
  const seenThemes = new Set();

  exams.forEach((ex) => {
    if (!ex.qDetails || !ex.cats) return;
    const wrongQs = [...(ex.cats.errou_viu || []), ...(ex.cats.errou_nao || [])];

    wrongQs.forEach((n) => {
      const q = ex.qDetails[n];
      if (!q || !q.theme) return;

      const tLow = q.theme.toLowerCase().trim();
      const themeKey = `${q.area}__${tLow}`;

      // Skip if already processed this theme
      if (seenThemes.has(themeKey)) return;

      // Check if this is a studied topic (cursinho or reviews/sessions)
      const isStudied = studiedThemes.has(tLow) ||
        matchesCursinho(q.theme, cursinhoTopics) ||
        (ex.cats.errou_viu || []).includes(n);

      if (!isStudied) return;

      // Find summary data for this theme
      const summary = findBestSummary(q.theme);
      if (!summary) return;

      seenThemes.add(themeKey);

      const rawCards = generateCardsFromSummary(q.theme, q.area, summary);
      const erType = (ex.cats.errou_viu || []).includes(n) ? "ja_vi" : "nunca_vi";
      const areaInfo = areaMap[q.area];

      decks.push({
        id: uid(),
        theme: q.theme,
        area: q.area,
        areaLabel: areaInfo?.label || q.area,
        areaColor: areaInfo?.color || "#888",
        examName: ex.name,
        errorType: erType,
        prevalencia: q.prev || "baixa",
        questionNumber: n,
        cards: rawCards.map((c, i) => ({
          id: uid(),
          deckTheme: q.theme,
          front: c.front,
          back: c.back,
          cardIndex: i,
          // SM-2 initial values
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextDue: today(),
          lastReview: null,
          history: [],
        })),
      });
    });
  });

  return decks;
}

// Merge newly generated decks with existing saved flashcards (preserve SM-2 state)
export function mergeDecks(existingDecks, newDecks) {
  const merged = [...existingDecks];
  const existingThemes = new Set(existingDecks.map(d => `${d.area}__${d.theme.toLowerCase().trim()}`));

  newDecks.forEach((nd) => {
    const key = `${nd.area}__${nd.theme.toLowerCase().trim()}`;
    if (existingThemes.has(key)) {
      // Update existing deck: keep SM-2 state but refresh card content if needed
      const idx = merged.findIndex(d => `${d.area}__${d.theme.toLowerCase().trim()}` === key);
      if (idx >= 0) {
        // Preserve existing card states
        merged[idx] = {
          ...merged[idx],
          examName: nd.examName,
          prevalencia: nd.prevalencia,
          cards: merged[idx].cards.map((ec, i) => {
            const nc = nd.cards[i];
            if (!nc) return ec;
            return { ...ec, front: nc.front, back: nc.back };
          }),
        };
      }
    } else {
      merged.push(nd);
      existingThemes.add(key);
    }
  });

  return merged;
}

// Get cards due for review today
export function getDueCards(decks) {
  const t = today();
  const due = [];
  decks.forEach((deck) => {
    deck.cards.forEach((card) => {
      if (card.nextDue <= t) {
        due.push({ ...card, deckId: deck.id, deckTheme: deck.theme, deckArea: deck.area, areaColor: deck.areaColor, areaLabel: deck.areaLabel });
      }
    });
  });
  return due.sort((a, b) => (a.nextDue || "").localeCompare(b.nextDue || ""));
}

// Review a card and update its SM-2 state
export function reviewCard(decks, deckId, cardId, qualityKey) {
  const quality = QUALITY_MAP[qualityKey];
  return decks.map((deck) => {
    if (deck.id !== deckId) return deck;
    return {
      ...deck,
      cards: deck.cards.map((card) => {
        if (card.id !== cardId) return card;
        const updated = sm2(card, quality);
        return {
          ...card,
          ...updated,
          history: [...(card.history || []), { date: today(), quality: qualityKey, interval: updated.interval }],
        };
      }),
    };
  });
}

// Stats for a deck
export function deckStats(deck) {
  const t = today();
  const total = deck.cards.length;
  const due = deck.cards.filter(c => c.nextDue <= t).length;
  const learned = deck.cards.filter(c => c.repetitions >= 2).length;
  const avgEase = total > 0 ? Math.round(deck.cards.reduce((s, c) => s + (c.easeFactor || 2.5), 0) / total * 100) / 100 : 2.5;
  const mature = deck.cards.filter(c => c.interval >= 21).length;
  return { total, due, learned, avgEase, mature, newCards: total - learned };
}
