import type { InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      <input
        className={`w-full px-3 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${className}`.trim()}
        {...props}
      />
    </div>
  );
}

