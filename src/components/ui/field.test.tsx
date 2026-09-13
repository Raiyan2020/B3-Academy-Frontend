import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field } from './field';
import { Input } from './input';

describe('Field', () => {
  it('associates the label with the control', () => {
    render(<Field label="Email">{(field) => <Input {...field} />}</Field>);

    // Resolvable by label text means htmlFor/id are wired correctly.
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('marks the control invalid and links it to the error message', () => {
    render(
      <Field label="Email" error="Email is required">
        {(field) => <Input {...field} />}
      </Field>,
    );

    const input = screen.getByLabelText('Email');
    const error = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(error).toHaveTextContent('Email is required');
    // The control must point AT the error node, not merely sit near it.
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('renders no error node and no aria-invalid when valid', () => {
    render(<Field label="Email">{(field) => <Input {...field} />}</Field>);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-describedby');
  });

  it('describes the control by both hint and error when both are present', () => {
    render(
      <Field label="Password" hint="At least 8 characters" error="Too short">
        {(field) => <Input {...field} />}
      </Field>,
    );

    const describedBy = screen.getByLabelText('Password').getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const ids = describedBy!.split(' ');
    expect(ids).toHaveLength(2);
    // Both referenced nodes must actually exist, or the reference is dead.
    ids.forEach((id) => expect(document.getElementById(id)).toBeInTheDocument());
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
  });

  it('gives each instance distinct ids so multiple fields do not collide', () => {
    render(
      <>
        <Field label="First">{(field) => <Input {...field} />}</Field>
        <Field label="Second">{(field) => <Input {...field} />}</Field>
      </>,
    );

    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });

  it('lets an explicit aria-invalid on the control win', () => {
    render(
      <Field label="Email">{(field) => <Input {...field} aria-invalid={true} />}</Field>,
    );

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});
