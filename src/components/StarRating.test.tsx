import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('when rendered, it should show five stars', () => {
    // Verifies the rating scale is always five wide regardless of the value

    // Arrange & Act
    render(<StarRating value={3} />);

    // Assert
    expect(screen.getAllByText('★')).toHaveLength(5);
  });

  it('when onChange is given and a star is clicked, it should report that position', async () => {
    // Verifies the editable mode reports the 1-based rating

    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);

    // Act
    await user.click(screen.getAllByText('★')[3]);

    // Assert
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('when onChange is omitted, it should not fail on click', async () => {
    // Verifies the read-only mode used by BookCard is inert

    // Arrange
    const user = userEvent.setup();
    render(<StarRating value={2} />);

    // Act
    await user.click(screen.getAllByText('★')[0]);

    // Assert
    expect(screen.getAllByText('★')).toHaveLength(5);
  });
});
