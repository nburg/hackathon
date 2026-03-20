# Contextual Vocabulary Weaver — Presentation Slides

---

## Slide 1: The Problem & Opportunity

### "You already spend hours reading online. What if that time taught you a language?"

**The Problem**
- Language learning requires dedicated study time most people don't have
- Apps like Duolingo demand context-switching away from daily life
- Vocabulary retention is highest in natural, contextual reading — not flashcard drills
- The #1 reason learners quit: it never fits into their schedule

**The Opportunity**
- The average person spends 6–7 hours/day reading online (news, docs, social media)
- Passive immersion is a proven acquisition pathway — used by polyglots worldwide
- On-device AI translation is now fast enough to run invisibly in the browser
- No app to open. No time to carve out. Learning happens _while_ you browse.

[Image: Split screen — left side shows a person struggling to find time for a language app with a packed calendar; right side shows someone relaxed and browsing news with a few Spanish words glowing on the page]

---

## Slide 2: How It Works

### Five layers working together to turn every webpage into a language lesson

**The User Experience**
1. Install the extension. Pick your language (83 available). Set density to 1–10%.
2. Browse any website normally.
3. A handful of words silently swap to their translation — just enough to notice, not enough to disrupt.
4. Hover a word to reveal the original English (this signals you didn't know it).
5. Open the dashboard to see your vocabulary growing in real time.

[Image: Annotated screenshot of a news article mid-read — a few common English words (e.g. "important", "people", "change") are shown replaced with their Spanish equivalents ("importante", "personas", "cambio"), each in a subtly highlighted span. A tooltip hovers over one word showing the original English on hover.]

---

**Under the Hood — 5 Modules**

| Layer | What it does |
|-------|-------------|
| **DOM & NLP (P3)** | TreeWalker skips `<code>`, `<nav>`, `<script>`, hidden elements; compromise.js POS-tags every word to identify nouns, verbs, adjectives, adverbs |
| **Translation Pipeline (P4)** | Wraps each word in `[[markers]]` inside its full sentence and sends context to Chrome's on-device Translation API — the markers survive, extracting the correct translated word |
| **SRS / BKT Engine (P5)** | Bayesian Knowledge Tracing (Corbett & Anderson, 1994) models P(user knows word). Priority = 1 - P(Known), so struggling words appear more often; mastered words are skipped |
| **UI Layer (P2)** | React dashboard with donut chart of known/learning/new words, Phase 2 progress bar, per-word cards showing exposure count and confidence % |
| **Extension Shell (P1)** | WXT + Manifest V3; background service worker owns the Translator instance (Chrome API restriction); content script runs the pipeline on each page load |

[Image: Architecture diagram — five labeled boxes arranged left to right: "Web Page DOM" -> "P3: NLP Extractor" -> "P5: BKT Scorer" -> "P4: Translation Pipeline + Chrome AI" -> "P2: Dashboard UI". Arrows show data flow. A "chrome.storage.local" cylinder sits below P5 and P4.]

---

**The Science: Bayesian Knowledge Tracing**

Each word carries a probability `P(Known)` updated after every observation:

- **Exposure without hovering** = weak positive signal (user may have skipped the word)
- **Hover to reveal original** = negative signal (user didn't recognize the translation)

```
P(Known | correct) = P(Known) * (1 - P_slip)
                     ─────────────────────────────────────────
                     P(Known) * (1 - P_slip) + (1-P(Known)) * P_guess

Then apply learning transition:
P(Known_new) = P(Known | obs) + (1 - P(Known | obs)) * P_transit
```

Words below 85% confidence remain in rotation. Words above it are retired.

[Image: Animated probability curve for a single word — x-axis is "times seen", y-axis is P(Known) 0.0 to 1.0. The line climbs steadily with small upward bumps on each exposure and drops slightly on each hover event, eventually crossing the 0.85 "mastered" threshold and flattening.]

---

**Context-Aware Translation**

Naive translation fails on polysemous words: "can" translates to "lata" (tin can) instead of "puedo" (I can).

Solution: wrap the word in `[[markers]]` inside its actual sentence:
```
Input:  "She [[can]] speak three languages."
Output: "Ella [[puede]] hablar tres idiomas."
Extract: "puede"
```

POS-based fallback frames when no sentence context is available:
- Verb "can" → `"I [[can]]"` → `"puedo"`
- Noun "can" → `"The [[can]]"` → `"lata"`

[Image: Two-column table showing "Naive translation" vs "Context-aware translation" for 4 ambiguous English words (can, bark, rock, fast), with wrong translations on the left and correct ones on the right.]

---

**Two-Phase Learning Model**

- **Phase 1** — Individual word replacement. The default. Low cognitive load.
- **Phase 2** — Full sentence replacement. Unlocks automatically when the user has mastered >= 70% of the top-200 most common words in their target language.

[Image: Side-by-side webpage mockups. Left (Phase 1): a paragraph with 2-3 individual words swapped out, underlined in blue. Right (Phase 2): a full sentence highlighted and replaced with its translation, with a softer green underline.]

---

**The Dashboard**

[Image: Screenshot of the vocabulary dashboard showing: (1) a stats strip at the top with "47 words tracked / 12 mastered / 23 learning / 12 new", (2) a donut chart divided into green/yellow/red segments for known/learning/new, (3) a progress bar for Phase 2 unlock reading "58/200 top words known — 70% needed", (4) a grid of word cards each showing the English word, its Spanish translation, "X% known", "Seen N times", "Last: Today/Yesterday/N days ago".]

---

## Slide 3: How We Used Claude Code

### Claude Code was the connective tissue of a 5-person parallel build

**The Challenge**
- 5 independent modules developed simultaneously with strict interface contracts
- Module integration required coordinating types, storage schemas, and API boundaries without a shared runtime

**How Claude Code Helped**

| Task | What Claude Code did |
|------|---------------------|
| Module integration | Wired P3 candidates → P5 scoring → P4 replacement without regressions |
| BKT implementation | Translated the Corbett & Anderson paper's math directly into TypeScript with correct P(slip)/P(guess)/P(transit) parameters |
| 83-language support | Generated per-language top-200 word lists (one `.ts` file per language, 83 total) |
| Test suite | Wrote 47 P3 tests and 40 P4/P5 tests; mocked `chrome.storage` API for Vitest |
| Context-aware translation | Designed the `[[marker]]` extraction strategy and POS-based fallback frames |
| DOM surgery | Implemented right-to-left text node splitting so replacing one word never shifts the offsets of adjacent replacements |
| Text-width padding | Prevented page reflow on hover by pre-computing pixel widths via Canvas API and locking `min-width` on each span |

[Image: Claude Code terminal session showing a diff — highlighted lines adding the BKT update formula in storage-manager.ts alongside the comment "Corbett & Anderson, 1994", with green "+" lines indicating new code.]

---

## Slide 4: What's Next

### The foundation is production-ready. The roadmap is long.

**Short-Term (next sprint)**
- Phase 2 UX announcement — surface a modal or banner when the user unlocks sentence mode
- Frequency-weighted candidate selection — prioritize the top 2,000 English words before rarer vocabulary
- Highlight style polish — configurable underline color, subtle animation on first appearance

**Medium-Term**
- **Text-to-speech** on hover — hear the word pronounced in the target language
- **Anki / CSV export** — one-click export of your word list with P(Known) scores for external flashcard apps
- **Firefox & Edge** — the extension is MV3-ready; port the background translator to non-Chrome APIs

**Long-Term Vision**
- **Multi-language mode** — weave two languages simultaneously for advanced learners
- **Reading difficulty targeting** — NLP-based sentence complexity scoring to surface the right sentence-level content at the right time
- **Cross-device sync** — sync `word_stats` via `chrome.storage.sync` so your vocabulary follows you between machines
- **Enterprise/education tier** — teacher dashboard to assign vocabulary lists, class-level progress reports, LMS integration

[Image: Product roadmap timeline — horizontal swimlane with three lanes labeled "Now", "Q2", "Q4". Milestones shown as milestone diamonds. "Phase 2 UX" and "TTS" in Q2; "Anki export", "Firefox port" in Q3; "Multi-language", "Sync", "Edu tier" in Q4.]

---

**The core insight:**
> Language acquisition doesn't require a dedicated hour. It requires thousands of low-stakes encounters with the right words at the right moment. We built the infrastructure to make every webpage that encounter.
