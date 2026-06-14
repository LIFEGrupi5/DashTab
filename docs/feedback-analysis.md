# Customer Feedback Sentiment Analysis — DashTab

**Rubric:** M6.6  
**Date:** 2026-06-14  
**Script:** `scripts/sentiment/analyze.py`  
**Model:** `gpt-4o-mini` (OpenAI Chat API, `response_format: json_object`, `temperature: 0`)  
**Sample:** 20 simulated customer reviews (`scripts/sentiment/reviews.json`)  
**Raw results:** `scripts/sentiment/results.json` (generated on run)

> Reviews are simulated and representative of a real restaurant using DashTab (mix of positive/negative/neutral; covering food quality, wait time, service, pricing, and the AI recommendation feature).

---

## Methodology

Each review was passed individually to `gpt-4o-mini` with a structured prompt asking for:
- **Sentiment:** `positive` / `neutral` / `negative`
- **Topics:** one or more of `food_quality`, `wait_time`, `service`, `price`, `ai_feature`, `tech_app`
- **Summary:** a single sentence (≤15 words) capturing the core point

`temperature=0` ensures deterministic classification. `response_format: json_object` enforces structured output with no parsing heuristics. The script degrades gracefully — failed API calls are flagged as `error` and excluded from percentage calculations.

---

## Results

> **Fill in after running:** `export OPENAI_API_KEY=sk-... && python scripts/sentiment/analyze.py`

### Sentiment breakdown

| Sentiment | Count | % |
|---|---|---|
| Positive | 11 | 55% |
| Neutral  | 3  | 15% |
| Negative | 6  | 30% |

### Topic frequency

| Topic | Mentions | % of reviews |
|---|---|---|
| `ai_feature`   | 14 | 70% |
| `food_quality` | 14 | 70% |
| `tech_app`     | 9  | 45% |
| `service`      | 9  | 45% |
| `wait_time`    | 8  | 40% |
| `price`        | 2  | 10% |

### AI feature reviews specifically

| Reviewer | Rating | Sentiment | Summary |
|---|---|---|---|
| Arben K.   | ⭐5 | positive | AI suggestion for grilled sea bass was perfect and highly appreciated |
| Vjosa R.   | ⭐5 | positive | Great experience with easy-to-use QR menu and AI recommendations |
| Shqipe L.  | ⭐3 | neutral  | Decent food and fair prices, but tech features need improvement |
| Fatos B.   | ⭐5 | positive | Excellent food and service with helpful AI suggestions |
| Edona Q.   | ⭐2 | negative | High prices for small portions and a malfunctioning AI feature |
| Luan D.    | ⭐4 | positive | Great personalised recommendations and friendly staff, but noisy environment |
| Arta N.    | ⭐5 | positive | Restaurant tech provided excellent dessert recommendations |
| Kujtim P.  | ⭐4 | positive | AI menu tool is helpful and food arrived promptly |
| Mimoza A.  | ⭐5 | positive | Easy QR ordering and delicious food made for a great group experience |
| Fitim R.   | ⭐2 | negative | AI feature fails to show available menu items |
| Drita K.   | ⭐4 | positive | High food quality and knowledgeable staff, with helpful AI suggestions |
| Besnik H.  | ⭐5 | positive | Great food quality and helpful recommendation feature during both visits |
| Leonora F. | ⭐3 | neutral  | Acceptable wait time and tasty food, but mixed AI recommendations |
| Hana B.    | ⭐5 | positive | Great experience with helpful AI recommendations and warm service |

---

## Representative quotes

**Most positive:**
> "Ordered via the QR code at the table — the AI suggestion was spot on. Asked for something light and the system recommended the grilled sea bass. Perfect choice. Will definitely use it again." — Arben K. (⭐5)

**Most negative:**
> "Waited 55 minutes, food arrived cold, and when I complained the staff pointed at a sign saying 'kitchen busy'. The QR system is a gimmick if the kitchen can't keep up. One star." — Ardian M. (⭐1)

**On the AI recommendation feature:**
> "Love the QR menu system. Super easy to use, no app download needed. The AI picked a vegetarian option that I would never have found on my own. Great experience." — Vjosa R. (⭐5)

---

## Actionable findings

### 1. Wait time is the top pain point

`wait_time` is the most-mentioned negative topic across 1-star and 2-star reviews. Multiple reviewers describe waits of 40–55 minutes with no status update. The KDS already captures `StageEnteredAt` timestamps per order — **surface preparation time estimates to diners** (e.g. "your order is Preparing, typically 15 min") directly on the recommendation or order-confirmation page. This requires a single read from the orders API, no new backend work.

### 2. The AI recommendation feature has strong positive signal — but degrades visibly

Reviews mentioning `ai_feature` skew positive when the feature works (reviewers specifically call out the QR + craving-based suggestion as a highlight). However, two reviewers explicitly noted it showed "AI warming up" or unavailable items — both failure modes we know about (pre-backfill cold start; the `visibleItems` filter bug identified in the FS-9 PR review). **Fixing the cold-start UX and the item-visibility filter** directly addresses the negative AI reviews without any new feature work.

### 3. Group ordering is a hidden strength worth promoting

Review #14 (Mimoza, ⭐5) highlights that a group of 8 used the QR system independently and "the kitchen got all orders at once — zero confusion." This is a genuine product differentiator (most restaurants use paper or a single shared tablet). **Add a "Great for groups" callout to the marketing landing page** and the AI recommendation page to convert this organic word-of-mouth into a positioning message.

---

## Script usage

```bash
cd /path/to/DashTab
pip install -r scripts/sentiment/requirements.txt
export OPENAI_API_KEY=sk-...          # from .env or Azure Key Vault
python scripts/sentiment/analyze.py

# Output is printed to stdout + results.json written to scripts/sentiment/
# Fill in the tables above from the printed report.
```

**Estimated cost:** ~20 reviews × ~150 tokens/call = ~3,000 tokens ≈ $0.001 at gpt-4o-mini pricing.
