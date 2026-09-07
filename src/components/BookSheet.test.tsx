import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookSheet } from './BookSheet';
import { makeBook } from '../test/fixtures';

const dateInput = () => document.querySelector('input[type="date"]') as HTMLInputElement;

describe('BookSheet', () => {
  it('when opened, it should show the book title and authors', () => {
    // Verifies the sheet identifies which book is being edited

    // Arrange & Act
    render(<BookSheet book={makeBook()} onSave={vi.fn()} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByText('ぐりとぐら')).toBeInTheDocument();
    expect(screen.getByText('中川李枝子')).toBeInTheDocument();
  });

  it('when the book has a volume, it should show it', () => {
    // Verifies magazine issue info is visible while editing

    // Arrange & Act
    render(
      <BookSheet book={makeBook({ volume: '18巻1号' })} onSave={vi.fn()} onCancel={vi.fn()} />
    );

    // Assert
    expect(screen.getByText('18巻1号')).toBeInTheDocument();
  });

  it('when opened, it should preselect the existing due date', () => {
    // Verifies editing starts from the current value rather than a default

    // Arrange & Act
    render(
      <BookSheet book={makeBook({ dueDate: '2024-01-15' })} onSave={vi.fn()} onCancel={vi.fn()} />
    );

    // Assert
    expect(dateInput().value).toBe('2024-01-15');
  });

  it('when saved after editing the memo, it should report the new memo', async () => {
    // Verifies edits to the memo reach the caller

    // Arrange
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<BookSheet book={makeBook({ memo: '' })} onSave={onSave} onCancel={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('子どもの反応や好きなシーンなど…'), 'たのしい');
    await user.click(screen.getByRole('button', { name: '保存する' }));

    // Assert
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ memo: 'たのしい' }));
  });

  it('when saved, it should preserve the fields it does not edit', async () => {
    // Verifies the sheet round-trips identity fields instead of dropping them

    // Arrange
    const user = userEvent.setup();
    const onSave = vi.fn();
    const book = makeBook({ id: 'book-3', isbn: '9784001140309', borrowedAt: '2024-01-01' });
    render(<BookSheet book={book} onSave={onSave} onCancel={vi.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: '保存する' }));

    // Assert
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'book-3', isbn: '9784001140309', borrowedAt: '2024-01-01' })
    );
  });

  it('when the backdrop is clicked, it should cancel without saving', async () => {
    // Verifies dismissing the sheet discards the edits

    // Arrange
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(
      <BookSheet book={makeBook()} onSave={onSave} onCancel={onCancel} />
    );

    // Act
    await user.click(container.firstElementChild as HTMLElement);

    // Assert
    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
