import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BookListItem } from '../types/api.types';
import { BookCard } from './BookCard';

describe('BookCard', () => {
  it('renders safely when hydrated book data is missing optional purchase maps', () => {
    const partialBook = {
      id: 'book-1',
      title: 'Compost Handbook',
      author: 'B3 Academy',
      description: 'Healthy soil methods',
      coverImage: '/images/placeholder-book.jpg',
      category: 'Agriculture',
      prices: undefined,
      availability: undefined,
      ownership: undefined,
    } as unknown as BookListItem;

    render(<BookCard book={partialBook} isAr={false} />);

    expect(screen.getByText('Compost Handbook')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
