import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookCard } from './BookCard';
import { makeBook } from '../test/fixtures';

const noop = { onReturn: vi.fn(), onEdit: vi.fn() };

describe('BookCard', () => {
  it('when the book has a title and authors, it should render both', () => {
    // Verifies the card shows the basic identity of the book

    // Arrange & Act
    render(<BookCard book={makeBook()} {...noop} />);

    // Assert
    expect(screen.getByText('ぐりとぐら')).toBeInTheDocument();
    expect(screen.getByText('中川李枝子')).toBeInTheDocument();
  });

  it('when the book has a volume, it should render it', () => {
    // Verifies magazine issue info is shown when present

    // Arrange & Act
    render(<BookCard book={makeBook({ volume: '18巻1号(通号204) 2025年1月' })} {...noop} />);

    // Assert
    expect(screen.getByText('18巻1号(通号204) 2025年1月')).toBeInTheDocument();
  });

  it('when the book has no memo, it should not render a memo line', () => {
    // Verifies the memo block is omitted rather than rendered empty

    // Arrange & Act
    render(<BookCard book={makeBook({ memo: '' })} {...noop} />);

    // Assert
    expect(screen.queryByText(/"/)).not.toBeInTheDocument();
  });

  it('when the book has a memo, it should render it in quotes', () => {
    // Verifies the memo is shown with the surrounding quote marks

    // Arrange & Act
    render(<BookCard book={makeBook({ memo: 'よろこんでいた' })} {...noop} />);

    // Assert
    expect(screen.getByText('"よろこんでいた"')).toBeInTheDocument();
  });

  it('when the book is not returned, it should offer a return button', () => {
    // Verifies a borrowed book can be marked returned from the card

    // Arrange & Act
    render(<BookCard book={makeBook({ returned: false })} {...noop} />);

    // Assert
    expect(screen.getByRole('button', { name: '返却' })).toBeInTheDocument();
    expect(screen.queryByText('✓ 返却済')).not.toBeInTheDocument();
  });

  it('when the book is returned, it should show the returned badge instead of the button', () => {
    // Verifies a returned book cannot be returned again

    // Arrange & Act
    render(<BookCard book={makeBook({ returned: true })} {...noop} />);

    // Assert
    expect(screen.getByText('✓ 返却済')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '返却' })).not.toBeInTheDocument();
  });

  it('when the return button is tapped, it should report the book id', async () => {
    // Verifies the card wires the return action to the right book

    // Arrange
    const user = userEvent.setup();
    const onReturn = vi.fn();
    render(<BookCard book={makeBook({ id: 'book-7' })} onReturn={onReturn} onEdit={vi.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: '返却' }));

    // Assert
    expect(onReturn).toHaveBeenCalledWith('book-7');
  });

  it('when the edit button is tapped, it should report the whole book', async () => {
    // Verifies editing opens with the book the card represents

    // Arrange
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const book = makeBook({ id: 'book-8' });
    render(<BookCard book={book} onReturn={vi.fn()} onEdit={onEdit} />);

    // Act
    await user.click(screen.getByRole('button', { name: '編集' }));

    // Assert
    expect(onEdit).toHaveBeenCalledWith(book);
  });
});
