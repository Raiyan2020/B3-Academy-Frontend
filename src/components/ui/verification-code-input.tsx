'use client';

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function VerificationCodeInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  ariaLabel = 'Verification code',
  className,
}: VerificationCodeInputProps) {
  return (
    <div dir="ltr" className={cn('w-full', className)}>
      <InputOTP
        value={value}
        onChange={onChange}
        maxLength={length}
        pattern={REGEXP_ONLY_DIGITS}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        inputMode="numeric"
        autoComplete="one-time-code"
        containerClassName="w-full justify-center"
      >
        <InputOTPGroup>
          {Array.from({ length }, (_, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              aria-invalid={invalid || undefined}
              className="h-12 w-11 text-lg font-bold sm:w-12"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
