import type { Metadata } from 'next';
import { ChefHat, Zap, ShieldCheck, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About — DashTab',
  description: 'The team and story behind DashTab — built to make restaurants run smarter.',
};

const TEAM = [
  {
    name: 'Olti Ramadani',
    role: 'Backend Lead',
    bio: 'Designed the Clean Architecture backend — API, auth, real-time messaging, and data layer.',
    initials: 'OR',
  },
  {
    name: 'Enes Drejta',
    role: 'DevOps & Fullstack Lead',
    bio: 'Built the Kubernetes infrastructure, CI/CD pipelines, and the full observability stack.',
    initials: 'ED',
  },
  {
    name: 'Jeta Fazliu',
    role: 'Product & Frontend Lead',
    bio: 'Defined the product vision and built the frontend — from UX design to accessible components.',
    initials: 'JF',
  },
];

const VALUES = [
  { icon: Zap, title: 'Speed first', desc: 'Restaurants move fast. DashTab is built for sub-second response — real-time SignalR, Redis cache, optimised queries.' },
  { icon: ShieldCheck, title: 'Security by design', desc: 'httpOnly cookie auth, Keycloak JWT, Trivy-scanned images, full tenant isolation. Security is not an afterthought.' },
  { icon: Users, title: 'Built for teams', desc: 'Four distinct roles, each seeing exactly what they need. No shared login, no confusion, no accidental data access.' },
  { icon: ChefHat, title: 'Restaurant-first', desc: 'Every feature was designed around a real restaurant flow — from first order to end-of-day analytics.' },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      {/* Story */}
      <div className="text-center mb-20">
        <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight mb-6">
          Built for restaurants that mean business
        </h1>
        <p className="text-neutral-600 dark:text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto mb-5">
          DashTab started with a simple frustration: restaurants in 2026 still running on paper notes and WhatsApp groups. We built the system we wish existed — one that actually works during a busy Saturday night service.
        </p>
        <p className="text-neutral-600 dark:text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Every feature is designed around a real restaurant workflow. The kitchen display replaces shouting. The order flow replaces paper. The analytics replace guesswork.
        </p>
      </div>

      {/* Values */}
      <div className="mb-20">
        <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-foreground text-center mb-10">What we stand for</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-neutral-100 dark:border-border bg-neutral-50 dark:bg-card flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 dark:text-foreground mb-1">{title}</p>
                <p className="text-sm text-neutral-500 dark:text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div>
        <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-foreground text-center mb-10">The team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TEAM.map(m => (
            <div key={m.name} className="p-6 rounded-2xl border border-neutral-100 dark:border-border bg-neutral-50 dark:bg-card text-center">
              <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                {m.initials}
              </div>
              <p className="font-bold text-neutral-900 dark:text-foreground">{m.name}</p>
              <p className="text-xs text-orange-500 font-semibold mb-2">{m.role}</p>
              <p className="text-sm text-neutral-500 dark:text-muted-foreground leading-relaxed">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
