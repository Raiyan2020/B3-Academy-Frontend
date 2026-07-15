import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichText } from './rich-text';

describe('RichText', () => {
  it('renders backend list markup', () => {
    render(<RichText html="<ul><li>First benefit</li><li>Second benefit</li></ul>" />);

    expect(screen.getByText('First benefit')).toBeInTheDocument();
    expect(screen.getByText('Second benefit')).toBeInTheDocument();
  });

  it('removes executable markup before rendering', () => {
    const { container } = render(
      <RichText html={'<p>Safe content</p><script>alert(1)</script><img src="x" onerror="alert(1)">'} />,
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('img')).not.toHaveAttribute('onerror');
  });
});
