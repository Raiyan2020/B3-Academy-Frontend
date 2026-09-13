import { useForm, type FieldValues, type UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';

/**
 * `useForm` wired to a zod schema.
 *
 * The schema is typed `ZodType<TFieldValues, TFieldValues>` — output *and* input — rather
 * than `ZodType<TFieldValues>`. zod 4's `ZodType<Output, Input>` defaults `Input` to
 * `unknown`, and @hookform/resolvers' zod-4 overload constrains `Input extends FieldValues`,
 * so the one-argument form never matched any overload. Stating both sides expresses the
 * actual contract of a form schema: what the user types is what comes out.
 *
 * Doing it this way removes the `as UseFormProps<TFieldValues>['resolver']` cast that used
 * to sit here. That cast was not just untidy — it suppressed exactly this mismatch, so a
 * schema with a transform (where input and output genuinely differ) would have type-checked
 * while handing react-hook-form values of the wrong shape at runtime. Such a schema now
 * fails to compile here, which is the correct outcome.
 */
export function useAppForm<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues, TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>,
) {
  return useForm<TFieldValues>({
    ...options,
    resolver: zodResolver(schema),
  });
}
