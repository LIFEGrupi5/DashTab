'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarOff, ArrowLeftRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { useAppStore } from '@/stores/useAppStore';
import { useUsers } from '@/hooks/useUsers';
import { useWeekShifts, useShiftRequests, useSubmitShiftRequest } from '@/hooks/useSchedule';
import type { ShiftRequest } from '@/lib/api/types';
import { toast } from 'sonner';

// ── Date helpers (same as manager page) ──────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format as the LOCAL calendar date — see the manager page for why we avoid
// toISOString() (it would roll Monday-midnight back to Sunday in UTC+ zones).
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function fmtTime(t: string): string {
  return t.slice(0, 5);
}

// Turns a "YYYY-MM-DD" weekStartDate + DayOfWeek into the actual date string
function shiftDate(weekStart: string, dayOfWeek: string): string {
  const idx = DAYS.indexOf(dayOfWeek);
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + idx);
  return toDateStr(d);
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ShiftRequest['status'] }) {
  const styles: Record<string, string> = {
    pending:  'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
    approved: 'bg-green-50  text-green-700  dark:bg-green-950/30  dark:text-green-300  border border-green-200  dark:border-green-800',
    denied:   'bg-red-50    text-red-700    dark:bg-red-950/30    dark:text-red-300    border border-red-200    dark:border-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

// ── Rest-day request modal ────────────────────────────────────────────────────

function RestDayModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (date: string, reason: string) => void;
  onClose: () => void;
}) {
  const [date, setDate]     = useState('');
  const [reason, setReason] = useState('');

  // Rest days are only allowed from next week onward — earliest pick is next Monday.
  const nextMonday = toDateStr(addDays(getMondayOfWeek(new Date()), 7));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-neutral-900 dark:text-foreground mb-4">Request a rest day</h3>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-muted-foreground mb-1">Date</label>
            <input type="date" value={date} min={nextMonday} onChange={e => setDate(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-1">Only future weeks (from next Monday) can be requested.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-muted-foreground mb-1">Reason (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={500}
              placeholder="Tell your manager why…"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>
        </div>
        <Button fullWidth onClick={() => date >= nextMonday && onSubmit(date, reason)} disabled={!date || date < nextMonday}>Submit request</Button>
      </div>
    </div>
  );
}

// ── Shift-swap request modal ──────────────────────────────────────────────────

function ShiftSwapModal({
  currentUserId,
  currentUserRole,
  colleagues,
  onSubmit,
  onClose,
}: {
  currentUserId: string;
  currentUserRole: string;
  colleagues: { id: string; name: string; role: string }[];
  onSubmit: (targetUserId: string, requestedDate: string, targetDate: string, reason: string) => void;
  onClose: () => void;
}) {
  const [targetUserId,    setTargetUserId]    = useState('');
  const [requestedDate,   setRequestedDate]   = useState('');
  const [targetDate,      setTargetDate]      = useState('');
  const [reason,          setReason]          = useState('');

  // Only show colleagues with the same role (backend enforces this too)
  const sameRole = colleagues.filter(c => c.id !== currentUserId && c.role === currentUserRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-neutral-900 dark:text-foreground mb-4">Request a shift swap</h3>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-muted-foreground mb-1">My shift date</label>
            <input type="date" value={requestedDate} onChange={e => setRequestedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-muted-foreground mb-1">Swap with</label>
            <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Select colleague…</option>
              {sameRole.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {sameRole.length === 0 && (
              <p className="text-xs text-neutral-400 mt-1">No colleagues with the same role found.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-muted-foreground mb-1">Their shift date</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-muted-foreground mb-1">Reason (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} maxLength={500}
              placeholder="Tell your manager why…"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>
        </div>
        <Button fullWidth
          onClick={() => targetUserId && requestedDate && targetDate && onSubmit(targetUserId, requestedDate, targetDate, reason)}
          disabled={!targetUserId || !requestedDate || !targetDate}>
          Submit request
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorkerSchedulePage() {
  const user = useAppStore(s => s.user);
  const [monday, setMonday] = useState(() => getMondayOfWeek(new Date()));
  const weekStart = toDateStr(monday);

  const [showRestDay, setShowRestDay]   = useState(false);
  const [showSwap,    setShowSwap]      = useState(false);

  const isManager = user?.role === 'owner' || user?.role === 'manager';

  const { data: shifts = [] }   = useWeekShifts(weekStart);
  const { data: requests = [] } = useShiftRequests();
  const { data: allUsers = [] } = useUsers(isManager);
  const submitRequest           = useSubmitShiftRequest();

  // shifts are already filtered server-side to this user's published shifts.
  // The API returns dayOfWeek as camelCase ("monday"), so compare case-insensitively.
  function getShift(day: string) {
    return shifts.find(s => s.dayOfWeek.toLowerCase() === day.toLowerCase());
  }

  function handleRestDay(date: string, reason: string) {
    submitRequest.mutate(
      { type: 'restDay', requestedDate: date, reason: reason || undefined },
      {
        onSuccess: () => { toast.success('Rest day request submitted'); setShowRestDay(false); },
        onError:   () => toast.error('Failed to submit request'),
      },
    );
  }

  function handleSwap(targetUserId: string, requestedDate: string, targetDate: string, reason: string) {
    submitRequest.mutate(
      { type: 'shiftSwap', requestedDate, targetUserId, targetDate, reason: reason || undefined },
      {
        onSuccess: () => { toast.success('Shift swap request submitted'); setShowSwap(false); },
        onError:   () => toast.error('Failed to submit request'),
      },
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 w-[95%] mx-auto space-y-6">
      <PageHeader
        title="My Schedule"
        subtitle={formatWeekLabel(monday)}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRestDay(true)}>
              <CalendarOff className="w-4 h-4" /> Rest day
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowSwap(true)}>
              <ArrowLeftRight className="w-4 h-4" /> Swap shift
            </Button>
          </div>
        }
      />

      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMonday(d => addDays(d, -7))}
          className="p-2 rounded-lg border border-neutral-200 dark:border-border hover:bg-neutral-100 dark:hover:bg-muted/30 transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-neutral-700 dark:text-foreground min-w-[200px] text-center">
          {formatWeekLabel(monday)}
        </span>
        <button onClick={() => setMonday(d => addDays(d, 7))}
          className="p-2 rounded-lg border border-neutral-200 dark:border-border hover:bg-neutral-100 dark:hover:bg-muted/30 transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekly schedule — one row per day */}
      <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border divide-y divide-neutral-50 dark:divide-border">
        {DAYS.map(day => {
          const shift = getShift(day);
          const date  = shiftDate(weekStart, day);
          return (
            <div key={day} className="flex items-center gap-4 px-5 py-3">
              <div className="w-28 shrink-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-foreground">{day}</p>
                <p className="text-xs text-neutral-400 dark:text-muted-foreground">{date}</p>
              </div>
              {shift?.isDayOff || (shift?.startTime === '00:00:00' && shift?.endTime === '00:00:00') ? (
                <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-sm font-semibold">
                  Day off
                </span>
              ) : shift ? (
                <span className="px-3 py-1 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-sm font-semibold">
                  {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
                </span>
              ) : (
                <span className="text-sm text-neutral-400 dark:text-muted-foreground italic">Not scheduled</span>
              )}
            </div>
          );
        })}
      </div>

      {shifts.length === 0 && (
        <p className="text-center text-sm text-neutral-400 dark:text-muted-foreground py-2">
          Your schedule for this week hasn&apos;t been published yet. Check back later.
        </p>
      )}

      {/* My requests history */}
      {requests.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-5">
          <h2 className="font-bold text-neutral-900 dark:text-foreground mb-4">My requests</h2>
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 rounded-xl bg-neutral-50 dark:bg-muted/20 border border-neutral-100 dark:border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-foreground">
                    {req.type === 'restDay' ? 'Rest day' : 'Shift swap'}
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      {req.requestedDate}
                      {req.type === 'shiftSwap' && req.targetUserName && ` ↔ ${req.targetUserName} (${req.targetDate})`}
                    </span>
                  </p>
                  {req.reason && (
                    <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-0.5 italic">&ldquo;{req.reason}&rdquo;</p>
                  )}
                  {req.managerNote && (
                    <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">Manager: {req.managerNote}</p>
                  )}
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showRestDay && (
        <RestDayModal onSubmit={handleRestDay} onClose={() => setShowRestDay(false)} />
      )}
      {showSwap && (
        <ShiftSwapModal
          currentUserId={user.id}
          currentUserRole={user.role}
          colleagues={allUsers}
          onSubmit={handleSwap}
          onClose={() => setShowSwap(false)}
        />
      )}
    </div>
  );
}
