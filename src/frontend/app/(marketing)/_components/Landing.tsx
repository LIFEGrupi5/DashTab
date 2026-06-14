'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import {
  ChefHat, Zap, LayoutDashboard, Users, BarChart3, ShieldCheck,
  Check, ChevronDown, ArrowRight, Clock, Sparkles, Star,
} from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { useFeatureFlag } from '@/lib/experiment';

// Warm "ember" palette — amber → orange, no pink. Used for emphasis + primary CTAs.
const EMBER = 'bg-gradient-to-r from-amber-300 via-orange-400 to-orange-600';
const EMBER_TEXT = `${EMBER} bg-clip-text text-transparent`;
const BTN = 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 shadow-lg shadow-orange-900/40';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} variants={fadeUp} custom={delay}
      initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      {children}
    </motion.div>
  );
}

function CountUp({ to, suffix = '', prefix = '', duration = 1.4 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0, start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

// ── Floating order-ticket chips (subtle functional color) ─────────────────────
const CHIPS = [
  { label: '#247 · Smash Burger',  tone: 'text-sky-300/90 border-sky-500/20 bg-sky-500/10',       pos: 'top-[12%] right-[6%]',  d: 0 },
  { label: 'Ready · Table 7',      tone: 'text-emerald-300/90 border-emerald-500/20 bg-emerald-500/10', pos: 'top-[38%] right-[20%]', d: 1.2 },
  { label: 'Preparing · 04:02',    tone: 'text-amber-300/90 border-amber-500/20 bg-amber-500/10', pos: 'bottom-[26%] right-[4%]', d: 0.6 },
  { label: '#241 · 2x Margherita', tone: 'text-orange-300/90 border-orange-500/20 bg-orange-500/10', pos: 'top-[8%] right-[34%]', d: 1.8 },
];

function FloatingChips() {
  return (
    <div aria-hidden className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
      {CHIPS.map((c, i) => (
        <motion.div key={i}
          className={`absolute ${c.pos} px-3 py-1.5 rounded-lg border text-xs font-medium backdrop-blur ${c.tone}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
          transition={{ opacity: { delay: 0.4 + i * 0.15 }, y: { duration: 5 + c.d, repeat: Infinity, ease: 'easeInOut' } }}>
          {c.label}
        </motion.div>
      ))}
    </div>
  );
}

// ── Full-bleed kinetic marquee (ember + ghost) ────────────────────────────────
function Marquee() {
  const words = ['Orders', 'Kitchen Display', 'Staff', 'Analytics', 'Real-time', 'Multi-tenant'];
  const track = [...words, ...words];
  const Row = ({ reverse = false, ghost = false }: { reverse?: boolean; ghost?: boolean }) => (
    <div className="flex overflow-hidden">
      <motion.div className="flex shrink-0 items-center gap-6 pr-6"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}>
        {track.map((w, i) => (
          <span key={i}
            className={`text-5xl sm:text-7xl font-extrabold tracking-tighter whitespace-nowrap ${ghost ? 'text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.12)]' : EMBER_TEXT}`}>
            {w} <span className="text-orange-500/60">/</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
  return (
    <div className="relative -rotate-1 border-y border-white/10 bg-orange-500/[0.03] py-5 my-4 space-y-1">
      <Row />
      <Row reverse ghost />
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const lines = ['Run your', 'restaurant'];
  return (
    <section className="relative overflow-hidden bg-stone-950 text-white">
      {/* warm primary glow + cool counter-glow for depth */}
      <motion.div aria-hidden className="absolute -top-48 -left-32 w-[620px] h-[620px] rounded-full blur-[130px] bg-orange-500/25"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div aria-hidden className="absolute top-16 -right-40 w-[520px] h-[520px] rounded-full blur-[130px] bg-teal-500/10"
        animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.12, 1] }} transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }} />

      <FloatingChips />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 pt-28 sm:pt-36 pb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-semibold mb-7">
          <Sparkles className="w-3.5 h-3.5" /> The operating system for modern restaurants
        </motion.div>

        <h1 className="font-extrabold tracking-tighter leading-[0.85] text-6xl sm:text-8xl lg:text-[8.5rem]">
          {lines.map((line, i) => (
            <motion.span key={line} className="block"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}>
              {line}
            </motion.span>
          ))}
          <motion.span className={`block w-fit ${EMBER_TEXT}`}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            smarter.
          </motion.span>
        </h1>

        <div className="mt-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-base sm:text-lg text-stone-400 max-w-md leading-relaxed">
            One platform for the floor, the line, and the back office. Real-time orders, kitchen display, staff and analytics — no paper, no WhatsApp, no chaos.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/login?demo=1"
              className={`group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl ${BTN} font-bold transition`}>
              Try the live demo <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-white/15 hover:border-white/40 hover:bg-white/5 text-white font-semibold transition">
              See pricing
            </Link>
          </motion.div>
        </div>
      </div>

      <Marquee />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { v: <CountUp to={90} suffix="%" />, l: 'fewer order errors' },
          { v: <><span>&lt;</span><CountUp to={1} suffix="s" /></>, l: 'real-time updates' },
          { v: <CountUp to={5} />, l: 'role-based views' },
          { v: <CountUp to={24} suffix="/7" />, l: 'always-on uptime' },
        ].map((s, i) => (
          <Reveal key={i} delay={i} className="text-center">
            <p className={`text-3xl font-extrabold ${EMBER_TEXT}`}>{s.v}</p>
            <p className="text-xs text-stone-500 mt-1">{s.l}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── Product glimpse (tilted, scroll-revealed) ─────────────────────────────────
function ProductGlimpse() {
  const tickets = [
    { table: 'T3', items: ['Margherita', 'Caprese'], tone: 'sky', label: 'New' },
    { table: 'T7', items: ['Tavë Kosi', 'Byrek'], tone: 'amber', label: 'Preparing' },
    { table: 'T1', items: ['Espresso ×2'], tone: 'emerald', label: 'Ready' },
    { table: 'T9', items: ['Wings', 'Lemonade'], tone: 'sky', label: 'New' },
  ] as const;
  const tones: Record<string, string> = {
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };
  return (
    <section className="relative bg-stone-950 text-white py-20 px-5 sm:px-6 overflow-hidden">
      <Reveal className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">See the line move in real time</h2>
        <p className="text-stone-400 mt-2 text-sm">The kitchen display every station watches during service.</p>
      </Reveal>
      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: 12 }} whileInView={{ opacity: 1, y: 0, rotateX: 6 }}
        viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1200 }}
        className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-stone-900/70 backdrop-blur shadow-2xl shadow-orange-900/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center"><ChefHat className="w-3.5 h-3.5 text-white" /></div>
            <span className="text-xs font-semibold">Kitchen Display</span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
          {tickets.map((t, i) => (
            <motion.div key={t.table} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
              className="rounded-lg bg-stone-800/60 border border-white/5 p-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">{t.table}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${tones[t.tone]}`}>{t.label}</span>
              </div>
              {t.items.map(it => (
                <p key={it} className="text-[10px] text-stone-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5 text-stone-600" /> {it}</p>
              ))}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ── Features (bento, warm + complementary accents) ────────────────────────────
const FEATURES = [
  { icon: LayoutDashboard, title: 'Kitchen Display System', desc: 'Real-time order board across all stations. Status changes push instantly — no polling, no delays.', span: 'lg:col-span-2', tint: 'from-orange-500/10', icon_c: 'text-orange-400' },
  { icon: Zap, title: 'Instant Orders', desc: 'Waiters create orders in seconds; the kitchen sees them the moment they land.', span: '', tint: 'from-amber-500/10', icon_c: 'text-amber-400' },
  { icon: Users, title: 'Role-Based Access', desc: 'Owner, Manager, Waiter, Kitchen — each sees exactly what they need.', span: '', tint: 'from-emerald-500/10', icon_c: 'text-emerald-400' },
  { icon: BarChart3, title: 'Analytics & Reporting', desc: 'Revenue, peak hours, top items. Know your numbers without a spreadsheet.', span: '', tint: 'from-sky-500/10', icon_c: 'text-sky-400' },
  { icon: ShieldCheck, title: 'Secure & Multi-tenant', desc: 'Every restaurant fully isolated. Keycloak auth, httpOnly cookies, scanned images.', span: 'lg:col-span-2', tint: 'from-orange-500/10', icon_c: 'text-orange-400' },
];

function Features() {
  return (
    <section id="features" className="relative py-24 px-5 sm:px-6 bg-stone-900 text-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything your restaurant needs</h2>
          <p className="text-stone-400 mt-3 max-w-xl mx-auto">One system, every flow. No separate apps, no integrations, no data silos.</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {FEATURES.map(({ icon: Icon, title, desc, span, tint, icon_c }, i) => (
            <Reveal key={title} delay={i % 3} className={span}>
              <motion.div whileHover={{ y: -4 }}
                className={`group relative h-full p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${tint} to-stone-950/40 overflow-hidden hover:border-white/20 transition`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Icon className={`w-5 h-5 ${icon_c}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-1.5">{title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AI Recommendations + QR (scan to try) ────────────────────────────────────
function AIRecommend() {
  return (
    <section className="relative py-24 px-5 sm:px-6 bg-stone-900 text-white overflow-hidden">
      <motion.div aria-hidden className="absolute -bottom-32 -left-24 w-[480px] h-[480px] rounded-full blur-[130px] bg-orange-500/15"
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> AI-powered
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Let your guests ask AI <span className={EMBER_TEXT}>what to order</span>
          </h2>
          <p className="text-stone-400 leading-relaxed mb-6 max-w-md">
            Diners scan a QR code at the table, describe a craving — &ldquo;something light and spicy&rdquo; — and our AI
            recommends real dishes from that restaurant&apos;s menu. True RAG: semantic search over menu embeddings,
            then a friendly recommendation written on the spot.
          </p>
          <ul className="space-y-2.5 mb-8">
            {['No app to download — just scan and ask', 'Recommendations only from the live menu', 'Per-restaurant, fully isolated'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" /> {f}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* QR card */}
        <Reveal delay={1} className="flex justify-center">
          <motion.div whileHover={{ y: -4 }}
            className="rounded-3xl border border-white/10 bg-stone-950/60 p-6 sm:p-8 shadow-2xl shadow-orange-900/20 text-center">
            <img src="/ai-recommend-qr.jpg" alt="Scan to try the AI menu recommendation"
              width={300} height={390} className="w-60 sm:w-72 h-auto mx-auto rounded-xl" />
            <p className="mt-5 text-sm font-semibold text-white">Scan to try it live</p>
            <p className="mt-1 text-xs text-stone-500">Point your phone camera at the code</p>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Pricing ─────────────────────────────────────────────────────────────────
function PricingTeaser() {
  const variant = useFeatureFlag('pricing-highlight-variant');
  const showHighlight = variant !== 'no-highlight';
  return (
    <section className="relative py-24 px-5 sm:px-6 bg-stone-950 text-white">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Simple, transparent pricing</h2>
          <p className="text-stone-400 mt-3">No hidden fees. Cancel any time.</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.key} delay={i}>
              <motion.div whileHover={{ y: -6 }}
                className={`relative h-full p-6 rounded-2xl border flex flex-col transition ${
                  showHighlight && plan.highlight ? 'border-orange-400/50 bg-gradient-to-b from-orange-500/15 to-stone-900 shadow-2xl shadow-orange-900/30' : 'border-white/10 bg-stone-900/60'
                }`}>
                {showHighlight && plan.highlight && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full ${EMBER} text-white text-xs font-bold shadow-lg`}>Most popular</div>
                )}
                <p className="font-bold text-lg">{plan.name}</p>
                <p className="text-4xl font-extrabold my-3">{plan.price}<span className="text-base font-normal text-stone-500">/mo</span></p>
                <p className="text-sm text-stone-400 mb-5">{plan.staff}</p>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-300"><Check className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" /> {f}</li>
                  ))}
                </ul>
                <Link href={`/register?plan=${plan.key}`}
                  className={`mt-6 block text-center px-4 py-2.5 rounded-xl font-bold text-sm transition ${plan.highlight ? `${BTN}` : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                  Get started
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-8">
          <Link href="/pricing" className="text-sm text-orange-400 hover:text-orange-300 font-medium">See full plan comparison →</Link>
        </Reveal>
      </div>
    </section>
  );
}

// ── Social proof ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: 'We cut order errors by 90% in the first week. The kitchen board alone was worth it.', name: 'Ardit Kelmendi', role: 'Owner, Restorant Besa', initials: 'AK' },
  { quote: 'Finally a system that works during a busy Saturday night. The team picked it up in minutes.', name: 'Mirlinda Hoxha', role: 'Manager, Kafja Joni', initials: 'MH' },
  { quote: 'The real-time kitchen display changed how we work. No more shouting across the kitchen.', name: 'Blerim Gashi', role: 'Head Chef, Restorant Iliria', initials: 'BG' },
];

function SocialProof() {
  return (
    <section className="py-24 px-5 sm:px-6 bg-stone-950 text-white">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-12"><h2 className="text-3xl font-extrabold tracking-tight">Trusted by restaurants across the region</h2></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i}>
              <div className="h-full p-6 rounded-2xl border border-white/10 bg-stone-900/50">
                <div className="flex gap-0.5 mb-4 text-amber-400">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="w-4 h-4 fill-current" />)}</div>
                <p className="text-stone-300 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${EMBER} flex items-center justify-center text-white text-xs font-bold`}>{t.initials}</div>
                  <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-stone-500">{t.role}</p></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Do I need any hardware?', a: 'No. DashTab runs in the browser on any device — tablet, phone, or laptop. No proprietary hardware required.' },
  { q: 'Can staff use their own phones?', a: 'Yes. The app is fully responsive. Waiters take orders from their phone; the kitchen board works great on a wall tablet.' },
  { q: 'Is each restaurant\'s data isolated?', a: 'Completely. DashTab is multi-tenant — every restaurant has its own isolated data space.' },
  { q: 'How does real-time work?', a: 'Orders push instantly to the kitchen — no polling, no page refresh. Status changes flow back just as fast.' },
  { q: 'Can I change my plan later?', a: 'Yes. Upgrade or downgrade any time from your settings. Changes take effect immediately.' },
  { q: 'Is there a free trial?', a: 'There is no free trial at this time. Choose a plan and subscribe to get started.' },
];

function FAQ() {
  return (
    <section className="py-24 px-5 sm:px-6 bg-stone-900 text-white">
      <div className="max-w-2xl mx-auto">
        <Reveal className="text-center mb-12"><h2 className="text-3xl font-extrabold tracking-tight">Frequently asked questions</h2></Reveal>
        <Reveal>
          <div className="divide-y divide-white/10">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex items-center justify-between text-sm font-semibold cursor-pointer list-none">{q}<ChevronDown className="w-4 h-4 text-stone-500 group-open:rotate-180 transition-transform shrink-0 ml-4" /></summary>
                <p className="mt-3 text-sm text-stone-400 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Hero />
      <ProductGlimpse />
      <Features />
      <AIRecommend />
      <PricingTeaser />
      <SocialProof />
      <FAQ />
    </>
  );
}
