'use client';

import { useState, useRef, use } from 'react';
import { Sparkles, ArrowRight, Loader2, RotateCcw, ChefHat } from 'lucide-react';
import { recommend, type RecommendedItem } from '@/lib/api/public';

function ItemCard({ item, index }: { item: RecommendedItem; index: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-orange-500/30 hover:bg-white/[0.08]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center shrink-0">
              {index + 1}
            </span>
            <h3 className="font-bold text-white text-lg leading-tight">{item.name}</h3>
          </div>
          <p className="text-stone-400 text-sm leading-relaxed mt-1">{item.description}</p>
        </div>
        <span className="shrink-0 text-xl font-extrabold text-orange-400">
          €{item.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Something light and fresh',
  'Spicy and hearty',
  'Quick to prepare',
  'Good for sharing',
  'Something vegetarian',
  'Rich and indulgent',
];

export default function RecommendClient({
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

  const handleSubmit = async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
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

  const visibleItems = items.filter(
    item => !message || message.toLowerCase().includes(item.name.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col">

      {/* Logo bar */}
      <div className="shrink-0 px-6 pt-8 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">DashTab</span>
        </div>
      </div>

      {!hasResult ? (
        /* Ask screen */
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-20">
          <div className="w-full max-w-lg">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> AI Menu Assistant
              </div>
            </div>

            <h1 className="text-center text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-3">
              What are you in the{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                mood for?
              </span>
            </h1>
            <p className="text-center text-stone-400 text-sm mb-8 max-w-sm mx-auto">
              Describe your craving and we&apos;ll find the perfect dishes from our menu.
            </p>

            <div className="flex gap-2 mb-5">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="e.g. something spicy and filling…"
                autoFocus
                className="flex-1 px-5 py-4 rounded-2xl bg-white/5 border border-white/15 text-white placeholder:text-stone-600 focus:outline-none focus:border-orange-500/60 text-sm transition"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !query.trim()}
                className="px-5 py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition shadow-lg shadow-orange-900/40"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button key={s}
                  onClick={() => { setQuery(s); handleSubmit(s); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-stone-300 hover:border-orange-500/40 hover:text-orange-300 hover:bg-orange-500/10 transition">
                  {s}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-5 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Result screen */
        <div className="flex-1 flex flex-col items-center px-5 py-8">
          <div className="w-full max-w-2xl">
            <button onClick={reset}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-white transition mb-6">
              <RotateCcw className="w-3.5 h-3.5" /> Ask something else
            </button>

            {message && (
              <div className="flex gap-3 p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 mb-6">
                <div className="w-7 h-7 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <p className="text-stone-200 text-sm leading-relaxed">{message}</p>
              </div>
            )}

            {visibleItems.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">
                  Recommended for you
                </p>
                {visibleItems.map((item, i) => <ItemCard key={i} item={item} index={i} />)}
              </div>
            )}

            <p className="text-center text-xs text-stone-700 mt-10">
              Powered by DashTab AI · Recommendations based on our current menu
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
