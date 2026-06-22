'use client';

import { LoaderCircle } from 'lucide-react';
import { Button, type ButtonProps } from './button';
import { cn } from '@/lib/utils';

export function SubmitButton({
  isPending,
  label,
  pendingLabel,
  className,
  ...props
}: ButtonProps & {
  isPending?: boolean;
  label: string;
  pendingLabel?: string;
}) {
  return (
    <Button type="submit" disabled={isPending || props.disabled} className={cn(className)} {...props}>
      {isPending && <LoaderCircle size={16} className="animate-spin" />}
      {isPending ? (pendingLabel ?? label) : label}
    </Button>
  );
}
