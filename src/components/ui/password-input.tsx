'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  containerClassName?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      containerClassName,
      showPasswordLabel = 'Show password',
      hidePasswordLabel = 'Hide password',
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);
    const label = visible ? hidePasswordLabel : showPasswordLabel;

    return (
      <div className={cn('relative w-full', containerClassName)} dir={props.dir}>
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pe-11', className)}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-md text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
          aria-label={label}
          title={label}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
