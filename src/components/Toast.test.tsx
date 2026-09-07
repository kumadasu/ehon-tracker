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
});
