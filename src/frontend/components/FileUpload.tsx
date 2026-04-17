'use client';

import { Upload } from 'lucide-react';

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
};

export default function FileUpload({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">Profile Photo</label>
      <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-neutral-200 dark:border-border rounded-xl cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 transition bg-neutral-50/50 dark:bg-muted/20">
        <Upload className="w-6 h-6 text-neutral-400 dark:text-muted-foreground" />
        <span className="text-sm text-neutral-500 dark:text-muted-foreground">Click to upload (max 5 MB)</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
