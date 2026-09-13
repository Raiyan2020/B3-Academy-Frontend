'use client';

import * as React from 'react';
import { Label } from './label';
import { FormFieldError } from '@/components/feedback/feedback';

interface FieldRenderProps {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

interface FieldProps {
  label?: React.ReactNode;
  /** Validation message. Falsy means the field is valid and nothing renders. */
  error?: React.ReactNode;
  /** Optional helper text rendered above the error slot. */
  hint?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  children: (props: FieldRenderProps) => React.ReactNode;
}

/**
 * Wires up the three things a form field needs for assistive tech, in one place:
 *
 *   1. a generated id, so `<Label htmlFor>` actually points at the control
 *      (`htmlFor` appeared exactly once in this whole codebase before this)
 *   2. `aria-invalid` on the control when there's an error
 *   3. `aria-describedby` linking the control to its `FormFieldError` message,
 *      so the error is announced rather than only shown in red
 *
 * Uses a render prop rather than cloning children, because the aria attributes
 * must land on the actual control element — which may be `Input`, `Textarea`,
 * `PhoneInput`, `PasswordInput` or a plain `<select>`. Cloning would guess wrong.
 *
 * Renders no wrapper styling of its own beyond the `className` you pass, so
 * dropping it into an existing form does not change layout. Usage:
 *
 *   <Field label="Email" error={errors.email?.message}>
 *     {(field) => <Input {...field} {...register('email')} type="email" />}
 *   </Field>
 */
export function Field({ label, error, hint, className, labelClassName, children }: FieldProps) {
  const reactId = React.useId();
  const id = `field-${reactId}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = Boolean(error);

  const describedBy = [hint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={className}>
      {label ? (
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
      ) : null}
      {children({
        id,
        'aria-invalid': hasError || undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
      <FormFieldError id={errorId}>{error}</FormFieldError>
    </div>
  );
}
