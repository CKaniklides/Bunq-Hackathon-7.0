# bunq FairSplit

> **Fair shared expenses, powered by multimodal AI.**

bunq FairSplit is a hackathon prototype built for **bunq Hackathon 7.0**. It helps users resolve shared expense disputes by analyzing bills, receipts, travel evidence, chat screenshots, calendars, payment confirmations, and voice-note transcripts to produce a fair, evidence-backed split and bunq-style payment requests.

---

## How to run

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## App flow

| Step | Screen | Description |
|------|--------|-------------|
| 1 | Landing | Product intro and dispute creation CTA |
| 2 | Setup | Dispute details and participants |
| 3 | Evidence | Upload evidence per participant |
| 4 | Timeline | Evidence-backed presence visualization |
| 5 | Cost Model | Provisional or AI-generated bill decomposition |
| 6 | Recommendation | AI-suggested fair split with reasoning |
| — | Challenge | Submit counter-arguments to the AI mediator |
| 7 | Settlement | bunq-style payment requests |
| — | Pitch | Value summary for bunq judges |

---

## How multimodal AI works here

Traditional expense splitting ignores context. FairSplit demonstrates how multimodal AI can:

1. **Extract structured facts** from unstructured evidence such as bills, boarding passes, chat screenshots, and payment confirmations
2. **Cross-reference evidence** across multiple sources to verify claims
3. **Apply reasoning** to decompose costs fairly based on presence, usage, and prior payments
4. **Generate explanations** that all parties can understand and challenge
5. **Update recommendations** as new evidence is added

In a production system, each evidence type would be processed by dedicated AI models:

- **PDF/images** -> document analysis for bill amounts, dates, and categories
- **Screenshots** -> OCR + NLP for chat context and agreements
- **Voice notes** -> speech-to-text + claim extraction
- **Calendars** -> date parsing + presence inference
- **Payment data** -> direct bunq API integration

---

## Value for bunq

| Metric | Impact |
|--------|--------|
| Payment requests per dispute | 1+ per resolved dispute |
| New user signups | Settlement-driven acquisition path |
| Shared pot creation | Strong follow-on opportunity |
| Repeat usage | Recurring household and group disputes |
| Support ticket reduction | Fewer fairness arguments and manual follow-ups |

**Core value loop:**

1. FairSplit resolves a dispute -> generates bunq payment requests
2. Non-bunq users receive settlement links -> sign up for bunq
3. Groups create shared pots -> deeper bunq engagement
4. Accepted recommendations become reusable house rules -> higher retention

---

## Tech stack

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **framer-motion**
- **lucide-react**
- **Anthropic SDK**

No backend required. API calls go directly from the browser to Anthropic.

---

## Project structure

```text
src/
├── types/index.ts
├── data/mockData.ts
├── utils/claudeApi.ts
├── App.tsx
└── components/
    ├── Layout.tsx
    ├── EvidenceCard.tsx
    └── screens/
        ├── LandingScreen.tsx
        ├── SetupScreen.tsx
        ├── EvidenceScreen.tsx
        ├── TimelineScreen.tsx
        ├── CostModelScreen.tsx
        ├── RecommendationScreen.tsx
        ├── ChallengeScreen.tsx
        ├── PaymentScreen.tsx
        └── PitchScreen.tsx
```

---

## Final pitch

> *"bunq FairSplit turns messy shared expense disputes into fair, evidence-backed settlement recommendations. By analyzing bills, chats, calendars, tickets, payment history, and voice explanations, it moves beyond equal splitting and helps groups resolve money conflicts while generating bunq payment requests and reusable shared-expense rules."*
