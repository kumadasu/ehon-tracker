import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DueDateSheet } from './DueDateSheet';
import { makeBook } from '../test/fixtures';

const group = [
  makeBook({ id: 'book-1', title: 'ぐりとぐら' }),
  makeBook({ id: 'book-2', title: 'はらぺこあおむし' }),
];

const dateInput = () => document.querySelector('input[type="date"]') as HTMLInputElement;

describe('DueDateSheet', () => {
  it('when opened, it should preselect the current due date of the group', () => {
    // Verifies the picker starts from the date the user is correcting, not from today

    // Arrange & Act
    render(<DueDateSheet books={group} onSave={vi.fn()} onCancel={vi.fn()} />);

    // Assert
    expect(dateInput().value).toBe('2024-01-15');
  });

  it('when opened, it should list the titles the change will apply to', () => {
    // Verifies the user can confirm the scope of the bulk change before saving

    // Arrange & Act
    render(<DueDateSheet books={group} onSave={vi.fn()} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByText('ぐりとぐら')).toBeInTheDocument();
    expect(screen.getByText('はらぺこあおむし')).toBeInTheDocument();
    expect(screen.getByText('2冊の返却期限を変更')).toBeInTheDocument();
  });

  it('when the -1日 shortcut is tapped, it should move the due date one day earlier', async () => {
    // Verifies the most common correction: the scan happened a day after the books were borrowed

    // Arrange
    const user = userEvent.setup();
    render(<DueDateSheet books={group} onSave={vi.fn()} onCancel={vi.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: '-1日' }));

    // Assert
    expect(dateInput().value).toBe('2024-01-14');
  });

  it('when a shortcut is tapped twice, it should apply the shift cumulatively', async () => {
    // Verifies shortcuts shift the value in the picker rather than the original due date

    // Arrange
    const user = userEvent.setup();
    render(<DueDateSheet books={group} onSave={vi.fn()} onCancel={vi.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: '-1日' }));
    await user.click(screen.getByRole('button', { name: '-1日' }));

    // Assert
    expect(dateInput().value).toBe('2024-01-13');
  });

  it('when +14日 is tapped, it should cross the month boundary correctly', async () => {
    // Verifies the extension case rolls over into the next month

    // Arrange
    const user = userEvent.setup();
    render(<DueDateSheet books={group} onSave={vi.fn()} onCancel={vi.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: '+14日' }));

    // Assert
    expect(dateInput().value).toBe('2024-01-29');
  });

  it('when the confirm button is tapped, it should report the chosen date', async () => {
    // Verifies the sheet hands the picked date back to the caller

    // Arrange
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DueDateSheet books={group} onSave={onSave} onCancel={vi.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: '-1日' }));
    await user.click(screen.getByRole('button', { name: /変更する/ }));

    // Assert
    expect(onSave).toHaveBeenCalledWith('2024-01-14');
  });

  it('when the date is cleared, it should disable both the shortcuts and the confirm button', async () => {
    // Verifies an empty picker cannot produce an invalid date via the shortcuts

    // Arrange
    const user = userEvent.setup();
    render(<DueDateSheet books={group} onSave={vi.fn()} onCancel={vi.fn()} />);

    // Act
    await user.clear(dateInput());

    // Assert
    expect(screen.getByRole('button', { name: '-1日' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /日付を選んでください/ })).toBeDisabled();
  });

  it('when the backdrop is clicked, it should cancel without saving', async () => {
    // Verifies dismissing the sheet leaves the due dates untouched

    // Arrange
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(
      <DueDateSheet books={group} onSave={onSave} onCancel={onCancel} />
    );

    // Act
    await user.click(container.firstElementChild as HTMLElement);

    // Assert
    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
