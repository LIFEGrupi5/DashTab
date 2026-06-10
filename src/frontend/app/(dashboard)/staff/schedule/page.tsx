'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Send, Check, X, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { useUsers } from '@/hooks/useUsers';
import {
  useWeekShifts, useCreateShift, useUpdateShift,
  useDeleteShift, usePublishWeek, useShiftRequests,
  useReviewShiftRequest,
} from '@/hooks/useSchedule';
import type { WorkShift } from '@/lib/api/types';
import { toast } from 'sonner';

// ── Date helpers ──────────────────────────────────────────────────────────────

const DAYS: { key: string; label: string }[] = [
  { key: 'Monday',    label: 'Mon' },
  { key: 'Tuesday',   label: 'Tue' },
  { key: 'Wednesday', label: 'Wed' },
  { key: 'Thursday',  label: 'Thu' },
  { key: 'Friday',    label: 'Fri' },
  { key: 'Saturday',  label: 'Sat' },
  { key: 'Sunday',    label: 'Sun' },
];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format as the LOCAL calendar date. We deliberately avoid toISOString(), which
// converts to UTC and can roll a local Monday-midnight back to the previous
// Sunday in timezones ahead of UTC — breaking the "week starts Monday" invariant.
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`; // "YYYY-MM-DD"
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

// "09:00:00" → "09:00"
function fmtTime(t: string): string {
  return t.slice(0, 5);
}

// ── Shift cell modal ──────────────────────────────────────────────────────────

function ShiftModal({
  shift,
  onSave,
  onDelete,
  onClose,
}: {
  shift: WorkShift | null;
  onSave: (start: string, end: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(shift ? fmtTime(shift.startTime) : '09:00');
  const [end,   setEnd]   = useState(shift ? fmtTime(shift.endTime)   : '17:00');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-card rounded-2xl border border-neutral-200 dark:border-border shadow-xl p-6 w-72" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-neutral-900 dark:text-foreground mb-4">
          {shift ? 'Edit shift' : 'Add shift'}
        </h3>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-muted-foreground mb-1">Start time</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-muted-foreground mb-1">End time</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button fullWidth onClick={() => onSave(start, end)}>Save</Button>
          {shift && (
            <button type="button" onClick={onDelete}
              className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition">
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ManagerSchedulePage() {
  const [monday, setMonday] = useState(() => getMondayOfWeek(new Date()));
  const weekStart = toDateStr(monday);

  // Modal state: which cell is open
  const [modal, setModal] = useState<{ userId: string; userName: string; day: string; shift: WorkShift | null } | null>(null);

  const { data: users = [] }  = useUsers();
  const { data: shifts = [] } = useWeekShifts(weekStart);
  const { data: requests = [] } = useShiftRequests();

  const createShift  = useCreateShift(weekStart);
  const updateShift  = useUpdateShift(weekStart);
  const deleteShift  = useDeleteShift(weekStart);
  const publishWeek  = usePublishWeek(weekStart);
  const reviewRequest = useReviewShiftRequest();

  const pendingRequests = requests.filter(r => r.status === 'pending');

  // Find a shift for a specific user + day. The API serializes the DayOfWeek
  // enum as camelCase ("monday"), while our DAYS keys are PascalCase ("Monday"),
  // so compare case-insensitively.
  function getShift(userId: string, day: string): WorkShift | undefined {
    return shifts.find(s => s.userId === userId && s.dayOfWeek.toLowerCase() === day.toLowerCase());
  }

  function openModal(userId: string, userName: string, day: string) {
    const existing = getShift(userId, day) ?? null;
    setModal({ userId, userName, day, shift: existing });
  }

  async function handleSave(start: string, end: string) {
    if (!modal) return;
    const { userId, day, shift } = modal;

    if (shift) {
      // Edit existing shift
      updateShift.mutate(
        { id: shift.id, startTime: start + ':00', endTime: end + ':00' },
        { onSuccess: () => { toast.success('Shift updated'); setModal(null); },
          onError: () => toast.error('Failed to update shift') },
      );
    } else {
      // Create new shift
      createShift.mutate(
        { userId, weekStartDate: weekStart, dayOfWeek: day, startTime: start + ':00', endTime: end + ':00' },
        { onSuccess: () => { toast.success('Shift added'); setModal(null); },
          onError: () => toast.error('Failed to add shift') },
      );
    }
  }

  async function handleDelete() {
    if (!modal?.shift) return;
    deleteShift.mutate(modal.shift.id, {
      onSuccess: () => { toast.success('Shift removed'); setModal(null); },
      onError: () => toast.error('Failed to remove shift'),
    });
  }

  function handlePublish() {
    publishWeek.mutate(undefined, {
      onSuccess: () => toast.success('Week published — staff can now see their schedules'),
      onError: () => toast.error('Failed to publish week'),
    });
  }

  function handleReview(id: string, decision: 'approved' | 'denied') {
    reviewRequest.mutate({ id, decision }, {
      onSuccess: () => toast.success(decision === 'approved' ? 'Request approved' : 'Request denied'),
      onError: () => toast.error('Failed to review request'),
    });
  }

  const isPublished = shifts.length > 0 && shifts.every(s => s.isPublished);

  return (
    <div className="p-6 w-[95%] mx-auto space-y-6">
      <PageHeader
        title="Weekly Schedule"
        subtitle={formatWeekLabel(monday)}
        action={
          <Button onClick={handlePublish} disabled={publishWeek.isPending || isPublished}>
            {publishWeek.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
              : isPublished ? '✓ Published' : <><Send className="w-4 h-4" /> Publish week</>}
          </Button>
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

      {/* Schedule grid */}
      <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-border">
              <th className="text-left px-4 py-3 font-semibold text-neutral-500 dark:text-muted-foreground w-36">Staff</th>
              {DAYS.map(d => (
                <th key={d.key} className="px-2 py-3 font-semibold text-neutral-500 dark:text-muted-foreground text-center">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 dark:divide-border">
            {users.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-400 dark:text-muted-foreground">No staff members yet.</td></tr>
            )}
            {users.map(user => (
              <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-muted/10 transition">
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-foreground whitespace-nowrap">
                  <div>{user.name}</div>
                  <div className="text-xs text-neutral-400 capitalize">{user.role}</div>
                </td>
                {DAYS.map(d => {
                  const shift = getShift(user.id, d.key);
                  return (
                    <td key={d.key} className="px-2 py-2 text-center">
                      <button
                        onClick={() => openModal(user.id, user.name, d.key)}
                        className={`w-full min-w-[64px] px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                          shift
                            ? shift.isPublished
                              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                            : 'bg-neutral-50 dark:bg-muted/20 text-neutral-400 dark:text-muted-foreground border border-dashed border-neutral-200 dark:border-border hover:border-orange-300 hover:text-orange-500'
                        }`}
                      >
                        {shift ? `${fmtTime(shift.startTime)}–${fmtTime(shift.endTime)}` : '+'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-orange-300 bg-orange-50 inline-block" /> Draft
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-green-300 bg-green-50 inline-block" /> Published
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-dashed border-neutral-300 bg-neutral-50 inline-block" /> Off / not set
        </span>
      </div>

      {/* Pending requests panel */}
      {pendingRequests.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-5">
          <h2 className="font-bold text-neutral-900 dark:text-foreground mb-4">
            Pending requests ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-muted/20 border border-neutral-100 dark:border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-foreground">
                    {req.requesterName}
                    <span className="ml-2 text-xs font-normal text-neutral-500 dark:text-muted-foreground capitalize">
                      {req.type === 'restDay' ? 'Rest day' : 'Shift swap'}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">
                    {req.type === 'restDay'
                      ? `Requesting off on ${req.requestedDate}`
                      : `Swap ${req.requestedDate} with ${req.targetUserName ?? '?'} (${req.targetDate})`}
                  </p>
                  {req.reason && <p className="text-xs text-neutral-400 dark:text-muted-foreground mt-1 italic">&ldquo;{req.reason}&rdquo;</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleReview(req.id, 'approved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleReview(req.id, 'denied')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition">
                    <X className="w-3.5 h-3.5" /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift modal */}
      {modal && (
        <ShiftModal
          shift={modal.shift}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
