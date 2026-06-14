'use client';

import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';

const GRAD_TEXT = 'bg-gradient-to-b from-white to-stone-500 bg-clip-text text-transparent';
const INPUT = 'w-full px-3 py-2.5 rounded-lg border border-white/10 bg-stone-900/60 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-white/30 transition';
const LABEL = 'block text-sm font-medium text-stone-300 mb-1.5';

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
    <div className="bg-stone-950 text-white">
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Get in <span className={GRAD_TEXT}>touch</span>
          </h1>
          <p className="text-stone-400">Questions, demo requests or feedback — we reply within one business day.</p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: Mail, title: 'Email us', sub: 'hello@dashtab.dev', href: 'mailto:hello@dashtab.dev' },
            { icon: MessageSquare, title: 'Request a demo', sub: "We'll set up a live walkthrough", href: 'mailto:demo@dashtab.dev?subject=Demo%20request' },
          ].map(({ icon: Icon, title, sub, href }) => (
            <a key={title} href={href}
              className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-stone-900/60 hover:border-white/25 transition group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition">
                <Icon className="w-5 h-5 text-stone-200" />
              </div>
              <div>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-sm text-stone-400 mt-0.5">{sub}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Contact form */}
        <div className="p-8 rounded-2xl border border-white/10 bg-stone-900/60">
          <h2 className="font-bold text-lg mb-6">Send us a message</h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ardit Kelmendi" className={INPUT} />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@restaurant.com" className={INPUT} />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label className={LABEL}>Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Demo request / Question / Other" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Message</label>
              <textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us about your restaurant and what you're looking for…" className={`${INPUT} resize-none`} />
              {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
            </div>
            <button type="submit"
              className="w-full px-4 py-3 rounded-xl bg-white text-stone-950 font-bold text-sm transition hover:bg-stone-200">
              Send message
            </button>
            <p className="text-xs text-stone-500 text-center">This opens your email client pre-filled. We reply within one business day.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
