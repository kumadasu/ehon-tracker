import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('when given a message, it should render that message', () => {
    // Verifies the toast shows the text it was handed

    // Arrange & Act
    render(<Toast message="📚 登録しました！" />);

    // Assert
    expect(screen.getByText('📚 登録しました！')).toBeInTheDocument();
  });

  it('when rendered, it should expose the message to assistive technology as a status', () => {
    // Verifies the toast is announced rather than being a silent visual-only notice

    // Arrange & Act
    render(<Toast message="✓ 返却済みに変更しました" />);

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('✓ 返却済みに変更しました');
  });

  it('when rendered, it should announce politely rather than interrupting', () => {
    // Verifies confirmations do not preempt whatever the user is doing

    // Arrange & Act
    render(<Toast message="📚 登録しました！" />);

    // Assert
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
