# Project Plan: Contextual Vocabulary Weaver
**A collaborative browser extension for passive language learning**

---

## Overview

This plan divides the project across 5 contributors, each owning a distinct vertical. Work is structured in two phases mirroring the product's two-phase learning model. The POC targets **Spanish** only.

---

## Team Structure

| Person | Role | Core Focus |
|--------|------|------------|
| P1 | Infrastructure Lead | Project setup, WXT, build pipeline, cross-browser architecture |
| P2 | Frontend / UI Engineer | Options page, dashboard, visual mechanics |
| P3 | DOM & NLP Engineer | DOM traversal, text extraction, POS tagging |
| P4 | Translation Pipeline Engineer | Chrome AI Translation API, word/sentence selection logic |
| P5 | Algorithm & Data Engineer | Spaced repetition engine, BKT model, local storage |

---

## Phase 1: Foundation (POC Core)
*Goal: Working extension that swaps isolated words into Spanish with hover-to-revert.*

---

### Person 1 — Infrastructure Lead

**Responsibilities:** Owns the project skeleton. Unblocks everyone else on Day 1.

**Tasks:**
- [ ] Initialize the WXT project repo with hot-module replacement (HMR) configured
- [ ] Set up manifest V3 configuration for Chrome (content scripts, permissions, service worker)
- [ ] Establish shared folder structure (`/content`, `/options`, `/background`, `/lib`)
- [ ] Configure TypeScript + ESLint + Prettier for the team
- [ ] Write a `CONTRIBUTING.md` / local dev setup guide so all 5 members can run the extension immediately
- [ ] Set up a lightweight CI check (e.g., GitHub Actions) for lint + build validation

**Dependencies:** None — this is the first thing that must be done.

**Technologies:** WXT, Node.js, TypeScript, Manifest V3, GitHub Actions

---

### Person 2 — Frontend / UI Engineer

**Responsibilities:** Everything the user sees and interacts with directly.

**Tasks:**
- [ ] Build the **Options/Settings Page** (React or Vue via WXT):
  - Language selector (Spanish locked for POC; extensible for future)
  - Density slider: Beginner (1%) → Aggressive (10%)
  - Toggle to enable/disable the extension per-site
- [ ] Build the **Vocabulary Dashboard**:
  - List of "learned" words with exposure count and last-seen date
  - Simple progress indicator (e.g., words known / total tracked)
- [ ] Implement **visual toggle mechanics** in the content layer:
  - Dashed underline or subtle highlight on replaced words
  - Hover reveals original native-language word (tooltip or inline swap)
  - Smooth CSS transitions so the effect feels natural, not jarring
- [ ] Coordinate with P5 to wire dashboard data to the storage layer

**Dependencies:** P1 (project scaffold), P5 (storage API for dashboard data)

**Technologies:** React or Vue, Tailwind CSS, CSS transitions, DOM event listeners, Chrome Storage API (read-only from UI side)

---

### Person 3 — DOM & NLP Engineer

**Responsibilities:** Safely reading page content and understanding it linguistically before any word is touched.

**Tasks:**
- [ ] Write a **DOM walker** that extracts text nodes from `<p>`, `<article>`, `<li>`, etc. while explicitly skipping:
  - `<code>`, `<pre>`, `<script>`, `<style>` blocks
  - Navigation bars, footers, form inputs, buttons
  - Elements marked as UI components (ARIA roles like `navigation`, `banner`)
- [ ] Integrate **compromise.js** as the in-browser POS tagger:
  - Tag words as nouns, verbs, adjectives, adverbs
  - Flag idioms and multi-word expressions to prevent mid-phrase swaps
  - Handle edge cases: proper nouns (never translate names), URLs left in text
- [ ] Expose a clean `extractCandidates(document) => WordCandidate[]` interface for P4 to consume
- [ ] Write unit tests for the walker against a set of sample HTML fixtures

**Dependencies:** P1 (project scaffold)

**Technologies:** Vanilla JavaScript / TypeScript, compromise.js, DOM TreeWalker API

---

### Person 4 — Translation Pipeline Engineer

**Responsibilities:** Taking candidate words from P3 and replacing them on the page using Chrome's native AI.

**Tasks:**
- [ ] Integrate the **Chrome Built-in AI Translation API** (`window.translation`):
  - Implement the one-time language model download flow with a clear progress UI prompt
  - Handle graceful degradation when the API is unavailable (show a "not supported" message in settings)
- [ ] Build the **word selection logic**: given a list of `WordCandidate[]` from P3, apply the density setting from P2 to select the right percentage of words to swap
- [ ] Perform the **DOM replacement**: swap selected text nodes in-place without breaking surrounding HTML or CSS
- [ ] Implement **Phase 1 replacement** (isolated words only) — pass single tokens to the translation API
- [ ] Prepare the pipeline to support **Phase 2 sentence replacement** (hook exists, activated by P5's BKT trigger)
- [ ] Handle async translation gracefully: page content should not flicker or shift during replacement

**Dependencies:** P1 (scaffold), P3 (candidate extraction API), P2 (density setting), P5 (Phase 2 trigger signal)

**Technologies:** Chrome `window.translation` API, TypeScript, DOM manipulation

---

### Person 5 — Algorithm & Data Engineer

**Responsibilities:** The brain of the system — tracking what the user knows and deciding what to show next.

**Tasks:**
- [ ] Design and implement the **local data schema** using `chrome.storage.local` / IndexedDB:
  - Per-word record: `{ word, exposureCount, recallFailures, lastSeen, nextDue, pKnown }`
  - Extension settings record
- [ ] Build the **Spaced Repetition Engine**:
  - On each page load, mark words as "exposed"
  - On hover (reveal), mark as "recall failure" for that session
  - Calculate `nextDue` timestamp using a probabilistic decay model (Bayesian Knowledge Tracing probability of knowing, `P(Known)`)
  - Expose a `getWordPriority(word) => score` function for P4's selection logic
- [ ] Implement the **Phase 1 → Phase 2 transition trigger**:
  - Define a threshold: when `P(Known) >= 0.85` for N% of the top-200 most common Spanish words, signal P4 to switch to sentence-level replacement
- [ ] Build the **BKT Grammar Skills Matrix** (Phase 2):
  - Model grammatical constructions as distinct skills (e.g., noun-adjective agreement, SVO order, past-tense conjugation)
  - Update skill probabilities based on implicit interaction with translated sentences
- [ ] Expose a simple read API for P2's dashboard to consume word/skill progress data

**Dependencies:** P1 (scaffold), P2 (needs storage read API), P4 (needs word priority scores and Phase 2 signal)

**Technologies:** TypeScript, Chrome Storage API, IndexedDB, JavaScript Math (BKT probability model)

---

## Phase 2: Grammar & Sentence-Level Translation
*Goal: Transition users from word swaps to full sentence translations, teaching grammar in context.*

This phase is unlocked by P5's BKT trigger. The main Phase 2 work items are:

| Owner | Work Item |
|-------|-----------|
| P4 | Switch translation pipeline from single tokens to full simple sentences |
| P3 | Update DOM walker to identify and extract sentence-level candidates |
| P5 | Extend BKT engine to track grammatical skill mastery per construction |
| P2 | Update dashboard to show grammar skill progress alongside vocabulary |

---

## Stretch Goal: Domain-Specific Adaptation
*Only after Phase 2 is stable.*

| Owner | Work Item |
|-------|-----------|
| P3 | Add a local TF-IDF script to extract keywords from each page visited |
| P5 | Build a local interest profile store (topic → weight map) |
| P4 | Update word selection to boost domain-relevant vocabulary |
| P2 | Add a "Your Topics" view to the dashboard |

---

## Key Integration Points (Where Tracks Meet)

```
P3 (DOM + NLP) ──> extractCandidates() ──> P4 (Translation Pipeline)
P5 (SRS Engine) ──> getWordPriority()  ──> P4 (word selection)
P5 (Storage)    ──> read API           ──> P2 (Dashboard)
P5 (BKT)        ──> phase2Trigger()    ──> P4 (switch to sentences)
P2 (Settings)   ──> density value      ──> P4 (how many words to swap)
```

---

## Suggested Milestones

| Milestone | Description | Owners |
|-----------|-------------|--------|
| M0 — Scaffold | Repo up, HMR working, all 5 can run locally | P1 |
| M1 — First Swap | A hardcoded word is replaced on a test page | P1, P3, P4 |
| M2 — Full Phase 1 | Density-controlled word swaps + hover reveal working | P2, P3, P4 |
| M3 — SRS Live | Words are tracked; next-exposure logic is active | P5 |
| M4 — Dashboard | Users can see their vocabulary progress | P2, P5 |
| M5 — Phase 2 | Sentence-level translation triggered by BKT | P3, P4, P5 |
| M6 — Stretch | Domain adaptation / local interest profile | All |

---

## Open Questions for the Team

1. **React vs. Vue** for the options page — decide at kickoff and lock it in before P2 starts.
2. **IndexedDB vs. chrome.storage.local** — chrome.storage.local has a 10MB quota; if the word corpus grows large, P5 should evaluate IndexedDB early.
3. **Language model download UX** — who owns the first-run onboarding flow? (Suggested: P4 builds the logic, P2 builds the UI.)
4. **Sentence selection for Phase 2** — we need clear criteria for what makes a sentence "simple enough" to translate. P3 and P5 should align on this definition before M5.
