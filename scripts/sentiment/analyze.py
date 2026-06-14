"""
M6.6 — Customer Feedback Sentiment Analysis
Reads reviews.json, classifies each review via OpenAI, aggregates results,
and writes findings to stdout (pipe to a file or paste into docs/feedback-analysis.md).

Usage:
    pip install -r requirements.txt
    export OPENAI_API_KEY=sk-...
    python analyze.py

If OPENAI_API_KEY is not set, the script prints a clear message and exits.
"""

import json
import os
import sys
from pathlib import Path
from openai import OpenAI

MODEL = "gpt-4o-mini"
REVIEWS_FILE = Path(__file__).parent / "reviews.json"

SYSTEM_PROMPT = """\
You are a restaurant analytics assistant. For each customer review you will return a JSON object with exactly these fields:
- "sentiment": one of "positive", "neutral", "negative"
- "topics": an array of strings from this set only: ["food_quality", "wait_time", "service", "price", "ai_feature", "tech_app"]
- "summary": a single sentence (max 15 words) capturing the review's core point

Return only valid JSON. No markdown, no explanation."""

USER_TEMPLATE = 'Review (rating {rating}/5): "{text}"'


def classify(client: OpenAI, review: dict) -> dict:
    """Call the OpenAI chat API to classify one review. Returns the parsed result dict."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_TEMPLATE.format(
                rating=review["rating"],
                text=review["text"]
            )},
        ],
        temperature=0,
        max_tokens=120,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content
    return json.loads(raw)


def main():
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("ERROR: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
        print("  export OPENAI_API_KEY=sk-...", file=sys.stderr)
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    reviews = json.loads(REVIEWS_FILE.read_text())
    print(f"Analysing {len(reviews)} reviews with {MODEL}...\n")

    results = []
    for r in reviews:
        try:
            classification = classify(client, r)
            results.append({**r, **classification})
            sentiment_icon = {"positive": "✅", "neutral": "⚪", "negative": "❌"}.get(
                classification.get("sentiment", ""), "?"
            )
            print(f"  [{sentiment_icon}] #{r['id']:2d} {r['reviewer']:<15} | "
                  f"{classification.get('sentiment','?'):<8} | "
                  f"{', '.join(classification.get('topics', []))}")
        except Exception as e:
            print(f"  [!!] #{r['id']:2d} {r['reviewer']:<15} | ERROR: {e}", file=sys.stderr)
            results.append({**r, "sentiment": "error", "topics": [], "summary": str(e)})

    # ── Aggregate ────────────────────────────────────────────────────────────
    sentiments = {"positive": 0, "neutral": 0, "negative": 0, "error": 0}
    topic_counts: dict[str, int] = {}
    for r in results:
        sentiments[r.get("sentiment", "error")] = sentiments.get(r.get("sentiment", "error"), 0) + 1
        for t in r.get("topics", []):
            topic_counts[t] = topic_counts.get(t, 0) + 1

    total = len(results)
    valid = total - sentiments["error"]

    # ── Print report ─────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("DASHTAB CUSTOMER FEEDBACK ANALYSIS — M6.6")
    print("=" * 60)

    print(f"\nSample: {total} reviews | Model: {MODEL}\n")

    print("SENTIMENT BREAKDOWN")
    print("-" * 30)
    for s in ("positive", "neutral", "negative"):
        count = sentiments[s]
        pct = round(count / valid * 100) if valid else 0
        bar = "█" * (pct // 5)
        print(f"  {s:<10} {count:>2}  ({pct:>3}%)  {bar}")
    if sentiments["error"]:
        print(f"  errors     {sentiments['error']:>2}")

    print("\nTOPIC FREQUENCY (all reviews)")
    print("-" * 30)
    for topic, count in sorted(topic_counts.items(), key=lambda x: -x[1]):
        pct = round(count / total * 100)
        print(f"  {topic:<20} {count:>2}  ({pct}%)")

    print("\nREPRESENTATIVE QUOTES")
    print("-" * 30)
    for sentiment in ("positive", "negative", "neutral"):
        matches = [r for r in results if r.get("sentiment") == sentiment]
        if matches:
            r = matches[0]
            print(f"\n  [{sentiment.upper()}] — {r['reviewer']} (⭐{r['rating']})")
            print(f"  \"{r['text'][:120]}{'...' if len(r['text']) > 120 else ''}\"")

    print("\nAI FEATURE REVIEWS")
    print("-" * 30)
    ai_reviews = [r for r in results if "ai_feature" in r.get("topics", [])]
    for r in ai_reviews:
        icon = {"positive": "✅", "neutral": "⚪", "negative": "❌"}.get(r.get("sentiment", ""), "?")
        print(f"  {icon} {r['reviewer']:<15} ⭐{r['rating']}  {r.get('summary', '')}")

    print("\n" + "=" * 60)
    print("Raw results saved to: results.json")

    # Save full results for the docs write-up
    out_path = Path(__file__).parent / "results.json"
    out_path.write_text(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
