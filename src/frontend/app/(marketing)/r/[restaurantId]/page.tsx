'use client';

import { useState, useRef, use } from 'react';
import { ChefHat, Sparkles, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { recommend, type RecommendedItem } from '@/lib/api/public';

// ── Item card ──────────────────────────────────────────────────────────────────
function ItemCard({ item }: { item: RecommendedItem }) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/5">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full sm:w-24 h-36 sm:h-24 object-cover rounded-xl shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="font-bold text-lg leading-tight">{item.name}</p>
          <span className="shrink-0 text-lg font-extrabold text-orange-400">
            €{item.price.toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-stone-400 mt-1 leading-relaxed">{item.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function RecommendPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = use(params);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const SUGGESTIONS = [
    'Something light and fresh',
    'Spicy and hearty',
    'Quick to prepare',
    'Good for sharing',
    'Something vegetarian',
  ];

  const handleSubmit = async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setHasResult(false);
    try {
      const result = await recommend(restaurantId, trimmed);
      setMessage(result.message);
      setItems(result.items);
      setHasResult(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuery('');
    setHasResult(false);
    setMessage(null);
    setItems([]);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-stone-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow shadow-orange-500/40">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">DashTab</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-5 py-10">
        {!hasResult ? (
          /* ── Ask screen ── */
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" /> AI Menu Assistant
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
                What are you in the mood for?
              </h1>
              <p className="text-stone-400 text-sm leading-relaxed">
                Tell us what you&apos;re craving and we&apos;ll suggest the perfect dishes from our menu.
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="e.g. something spicy and filling…"
                autoFocus
                className="flex-1 px-4 py-3.5 rounded-xl bg-stone-900/80 border border-white/10 text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm transition"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !query.trim()}
                className="px-5 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition shadow shadow-orange-900/40"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setQuery(s); handleSubmit(s); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-stone-300 hover:border-orange-500/40 hover:text-orange-300 transition">
                  {s}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">{error}</div>
            )}
          </div>
        ) : (
          /* ── Result screen ── */
          <div>
            <button onClick={reset}
              className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-white transition mb-6">
              <RotateCcw className="w-3.5 h-3.5" /> Ask something else
            </button>

            <div className="flex items-start gap-2.5 mb-6 p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5">
              <Sparkles className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <p className="text-sm text-stone-200 leading-relaxed">
                {message ?? "Here are some dishes you might enjoy:"}
              </p>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => <ItemCard key={i} item={item} />)}
            </div>

            <p className="text-center text-xs text-stone-600 mt-8">
              Powered by DashTab AI · Recommendations based on our current menu
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
