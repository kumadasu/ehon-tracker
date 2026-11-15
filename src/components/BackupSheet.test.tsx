import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackupSheet } from './BackupSheet';
import { makeBook } from '../test/fixtures';

let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // jsdom has no object URLs and cannot navigate to a download, so stub the
  // browser's file-save boundary
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  clickSpy.mockRestore();
});

describe('BackupSheet', () => {
  it('when export is pressed, it should download a dated JSON file, report the count and close', async () => {
    // Verifies the download is triggered with a recognisable filename

    // Arrange
    const onMessage = vi.fn();
    const onClose = vi.fn();
    render(
      <BackupSheet
        books={[makeBook({ id: '1' }), makeBook({ id: '2' })]}
        onImport={vi.fn()}
        onMessage={onMessage}
        onClose={onClose}
      />
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: '書き出す' }));

    // Assert
    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^ehon-tracker-\d{4}-\d{2}-\d{2}\.json$/);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    expect(onMessage).toHaveBeenCalledWith('💾 2冊を書き出しました');
    expect(onClose).toHaveBeenCalled();
  });

  it('when there are no books, it should disable export but still offer import', () => {
    // Verifies an empty backup cannot be written, while a fresh device can restore

    // Act
    render(<BackupSheet books={[]} onImport={vi.fn()} onMessage={vi.fn()} onClose={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: '書き出す' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '読み込む' })).toBeEnabled();
  });
});
