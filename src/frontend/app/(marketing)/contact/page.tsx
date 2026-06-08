import type { Metadata } from 'next';
import { Mail, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact — DashTab',
  description: 'Get in touch with the DashTab team or request a live demo.',
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight mb-3">
          Get in touch
        </h1>
        <p className="text-neutral-500 dark:text-muted-foreground">
          Questions, demo requests or feedback — we reply within one business day.
        </p>
      </div>

      {/* Contact options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <a href="mailto:hello@dashtab.dev"
          className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-card hover:border-orange-300 dark:hover:border-orange-700 transition group">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition">
            <Mail className="w-5 h-5 text-orange-500 group-hover:text-white transition" />
          </div>
          <div>
            <p className="font-bold text-neutral-900 dark:text-foreground text-sm">Email us</p>
            <p className="text-sm text-neutral-500 dark:text-muted-foreground mt-0.5">hello@dashtab.dev</p>
          </div>
        </a>
        <a href="mailto:demo@dashtab.dev?subject=Demo%20request"
          className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-card hover:border-orange-300 dark:hover:border-orange-700 transition group">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition">
            <MessageSquare className="w-5 h-5 text-orange-500 group-hover:text-white transition" />
          </div>
          <div>
            <p className="font-bold text-neutral-900 dark:text-foreground text-sm">Request a demo</p>
            <p className="text-sm text-neutral-500 dark:text-muted-foreground mt-0.5">We&apos;ll set up a live walkthrough</p>
          </div>
        </a>
      </div>

      {/* Contact form */}
      <div className="p-8 rounded-2xl border border-neutral-200 dark:border-border bg-white dark:bg-card">
        <h2 className="font-bold text-lg text-neutral-900 dark:text-foreground mb-6">Send us a message</h2>
        <form action="mailto:hello@dashtab.dev" method="get" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Name</label>
              <input name="name" type="text" placeholder="Ardit Kelmendi" required
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Email</label>
              <input name="email" type="email" placeholder="you@restaurant.com" required
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Subject</label>
            <input name="subject" type="text" placeholder="Demo request / Question / Other"
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Message</label>
            <textarea name="body" rows={5} placeholder="Tell us about your restaurant and what you're looking for…"
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition resize-none" />
          </div>
          <button type="submit"
            className="w-full px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition shadow shadow-orange-500/20">
            Send message
          </button>
          <p className="text-xs text-neutral-400 dark:text-muted-foreground text-center">
            This opens your email client pre-filled. We reply within one business day.
          </p>
        </form>
      </div>
    </div>
  );
}
