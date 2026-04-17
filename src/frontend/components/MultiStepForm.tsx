'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import FileUpload from '@/components/FileUpload';
import { staffSchema, type StaffFormData } from '@/lib/schemas';

const STEPS = ['Personal Info', 'Role & Date', 'Photo & Bio'];

type Props = {
  onClose: () => void;
  onSubmit: (data: StaffFormData) => void;
};

export default function MultiStepForm({ onClose, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);

  const { register, trigger, getValues, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { fullName: '', email: '', role: 'waiter', startDate: '', bio: '' },
  });

  const next = async () => {
    const fields: (keyof StaffFormData)[][] = [
      ['fullName', 'email'],
      ['role', 'startDate'],
      ['bio'],
    ];
    const valid = await trigger(fields[step] as (keyof StaffFormData)[]);
    if (!valid) return;
    if (step === 2) {
      onSubmit(getValues());
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-card rounded-2xl shadow-xl w-full max-w-md border border-neutral-100 dark:border-border">

        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-border">
          <h2 className="font-semibold text-neutral-900 dark:text-card-foreground">Add Staff Member</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 dark:text-muted-foreground hover:text-neutral-600 dark:hover:text-foreground"
          >
            ×
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 px-5 pt-4">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1 min-w-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  i <= step
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-100 dark:bg-muted text-neutral-400 dark:text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs truncate ${i === step ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-neutral-400 dark:text-muted-foreground'}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 ? (
                <div className={`flex-1 h-px min-w-[4px] ${i < step ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-muted'}`} />
              ) : null}
            </div>
          ))}
        </div>

        <div>
          <div className="p-5 space-y-4">

            {step === 0 && (
              <>
                <div>
                  <TextField label="Full Name" placeholder="Ana Berisha" {...register('fullName')} />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <TextField label="Email" type="email" placeholder="ana@restaurant.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Role</label>
                  <select
                    className="w-full px-3 py-3 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-card text-sm text-neutral-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
                    {...register('role')}
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                  {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
                </div>
                <div>
                  <TextField label="Start Date" type="date" {...register('startDate')} />
                  {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <FileUpload value={photo} onChange={setPhoto} />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Bio (optional)</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-3 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-card text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    {...register('bio')}
                  />
                </div>
              </>
            )}

          </div>

          <div className="flex gap-3 p-5 pt-0">
            <Button variant="secondary" onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button fullWidth onClick={next}>
              {step === 2 ? 'Add Member' : 'Next'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
