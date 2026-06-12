'use client';

import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email.';
    if (!message.trim()) e.message = 'Message is required.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const body = encodeURIComponent(`Name: ${name}\n\n${message}`);
    const sub  = encodeURIComponent(subject || 'Contact from DashTab site');
    window.location.href = `mailto:hello@dashtab.dev?subject=${sub}&body=${body}`;
  };


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
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ardit Kelmendi"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@restaurant.com"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Demo request / Question / Other"
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Message</label>
            <textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us about your restaurant and what you're looking for…"
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition resize-none" />
            {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
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
