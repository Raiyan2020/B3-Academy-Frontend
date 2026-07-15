import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('preserves RTL direction on the logical icon container', () => {
    render(<PasswordInput aria-label="كلمة المرور" dir="rtl" />);

    expect(screen.getByLabelText('كلمة المرور').parentElement).toHaveAttribute('dir', 'rtl');
  });
});
