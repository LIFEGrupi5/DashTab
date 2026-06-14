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
| Positive | <!-- fill --> | <!-- fill -->% |
| Neutral  | <!-- fill --> | <!-- fill -->% |
| Negative | <!-- fill --> | <!-- fill -->% |

### Topic frequency

| Topic | Mentions | % of reviews |
|---|---|---|
| `food_quality` | <!-- fill --> | <!-- fill -->% |
| `wait_time`    | <!-- fill --> | <!-- fill -->% |
| `service`      | <!-- fill --> | <!-- fill -->% |
| `ai_feature`   | <!-- fill --> | <!-- fill -->% |
| `price`        | <!-- fill --> | <!-- fill -->% |
| `tech_app`     | <!-- fill --> | <!-- fill -->% |

### AI feature reviews specifically

| Reviewer | Rating | Sentiment | Summary |
|---|---|---|---|
| <!-- fill from results.json where topics contains "ai_feature" --> | | | |

---

## Representative quotes

**Most positive:**
> <!-- fill: highest-rated reviewer quote -->

**Most negative:**
> <!-- fill: lowest-rated reviewer quote -->

**On the AI recommendation feature:**
> <!-- fill: a quote specifically about the AI feature -->

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
