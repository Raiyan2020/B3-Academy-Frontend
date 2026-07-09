import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { VerificationCodeInput } from './verification-code-input';

function ControlledCodeInput({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return <VerificationCodeInput value={value} onChange={setValue} ariaLabel="Verification code" />;
}

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  document.elementFromPoint = vi.fn(() => null);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('VerificationCodeInput', () => {
  it('renders a controlled six-digit verification code', () => {
    render(<ControlledCodeInput initialValue="123456" />);

    const input = screen.getByLabelText('Verification code');
    expect(input).toHaveValue('123456');
    expect(input).toHaveAttribute('maxlength', '6');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
  });

  it('always displays codes left-to-right', () => {
    const { container } = render(<ControlledCodeInput />);

    expect(container.querySelector('[dir="ltr"]')).toBeInTheDocument();
  });
});
