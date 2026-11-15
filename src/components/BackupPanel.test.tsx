import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackupPanel } from './BackupPanel';
import { makeBook } from '../test/fixtures';
import { serializeBackup } from '../services/backup';

const jsonFile = (text: string, name = 'backup.json') =>
  new File([text], name, { type: 'application/json' });

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

describe('BackupPanel — export', () => {
  it('when export is pressed, it should download a dated JSON file and report the count', async () => {
    // Verifies the download is triggered with a recognisable filename

    // Arrange
    const onMessage = vi.fn();
    render(
      <BackupPanel
        books={[makeBook({ id: '1' }), makeBook({ id: '2' })]}
        onImport={vi.fn()}
        onMessage={onMessage}
      />
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: '書き出す' }));

    // Assert
    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^ehon-tracker-\d{4}-\d{2}-\d{2}\.json$/);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    expect(onMessage).toHaveBeenCalledWith('💾 2冊を書き出しました');
  });

  it('when there are no books, it should disable export', () => {
    // Verifies an empty backup cannot be written by accident

    // Act
    render(<BackupPanel books={[]} onImport={vi.fn()} onMessage={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: '書き出す' })).toBeDisabled();
  });
});

describe('BackupPanel — import', () => {
  it('when a valid backup is chosen, it should pass its books on and report the count', async () => {
    // Verifies the happy path from file picker to onImport

    // Arrange
    const onImport = vi.fn();
    const onMessage = vi.fn();
    render(<BackupPanel books={[]} onImport={onImport} onMessage={onMessage} />);
    const file = jsonFile(serializeBackup([makeBook({ id: 'x' })], '2026-11-15'));

    // Act
    await userEvent.upload(screen.getByTestId('backup-file-input'), file);

    // Assert
    expect(onImport).toHaveBeenCalledWith([makeBook({ id: 'x' })]);
    expect(onMessage).toHaveBeenCalledWith('📥 1冊を読み込みました');
  });

  it('when an invalid file is chosen, it should report an error and import nothing', async () => {
    // Verifies a bad file never reaches storage

    // Arrange
    const onImport = vi.fn();
    const onMessage = vi.fn();
    render(<BackupPanel books={[]} onImport={onImport} onMessage={onMessage} />);

    // Act
    await userEvent.upload(screen.getByTestId('backup-file-input'), jsonFile('garbage'));

    // Assert
    expect(onImport).not.toHaveBeenCalled();
    expect(onMessage).toHaveBeenCalledWith(
      'ファイルを読み込めませんでした。書き出したファイルを選んでください'
    );
  });

  it('when the picker is closed without a file, it should do nothing', async () => {
    // Verifies cancelling the picker is harmless

    // Arrange
    const onImport = vi.fn();
    const onMessage = vi.fn();
    render(<BackupPanel books={[]} onImport={onImport} onMessage={onMessage} />);

    // Act
    // A cancelled picker can still fire change with an empty list
    fireEvent.change(screen.getByTestId('backup-file-input'), { target: { files: [] } });

    // Assert
    expect(onImport).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('when import is pressed, it should open the file picker', async () => {
    // Verifies the visible button forwards to the hidden input

    // Arrange
    render(<BackupPanel books={[]} onImport={vi.fn()} onMessage={vi.fn()} />);
    const input = screen.getByTestId('backup-file-input');
    const inputClick = vi.spyOn(input, 'click');

    // Act
    await userEvent.click(screen.getByRole('button', { name: '読み込む' }));

    // Assert
    expect(inputClick).toHaveBeenCalled();
  });
});
