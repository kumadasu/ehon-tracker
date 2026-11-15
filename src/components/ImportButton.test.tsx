import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportButton } from './ImportButton';
import { makeBook } from '../test/fixtures';
import { serializeBackup } from '../services/backup';

const jsonFile = (text: string) => new File([text], 'backup.json', { type: 'application/json' });

const renderButton = () => {
  const onImport = vi.fn();
  const onMessage = vi.fn();
  render(<ImportButton label="読み込む" onImport={onImport} onMessage={onMessage} />);
  return { onImport, onMessage, input: screen.getByTestId('backup-file-input') };
};

describe('ImportButton', () => {
  it('when a valid backup is chosen, it should pass its books on and report the count', async () => {
    // Verifies the happy path from file picker to onImport

    // Arrange
    const { onImport, onMessage, input } = renderButton();
    const file = jsonFile(serializeBackup([makeBook({ id: 'x' })], '2026-11-15'));

    // Act
    await userEvent.upload(input, file);

    // Assert
    expect(onImport).toHaveBeenCalledWith([makeBook({ id: 'x' })]);
    expect(onMessage).toHaveBeenCalledWith('📥 1冊を読み込みました');
  });

  it('when an invalid file is chosen, it should report an error and import nothing', async () => {
    // Verifies a bad file never reaches storage

    // Arrange
    const { onImport, onMessage, input } = renderButton();

    // Act
    await userEvent.upload(input, jsonFile('garbage'));

    // Assert
    expect(onImport).not.toHaveBeenCalled();
    expect(onMessage).toHaveBeenCalledWith(
      'ファイルを読み込めませんでした。書き出したファイルを選んでください'
    );
  });

  it('when the picker is closed without a file, it should do nothing', () => {
    // Verifies cancelling the picker is harmless

    // Arrange
    const { onImport, onMessage, input } = renderButton();

    // Act
    // A cancelled picker can still fire change with an empty list
    fireEvent.change(input, { target: { files: [] } });

    // Assert
    expect(onImport).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('when the button is pressed, it should open the file picker', async () => {
    // Verifies the visible button forwards to the hidden input

    // Arrange
    const { input } = renderButton();
    const inputClick = vi.spyOn(input, 'click');

    // Act
    await userEvent.click(screen.getByRole('button', { name: '読み込む' }));

    // Assert
    expect(inputClick).toHaveBeenCalled();
  });
});
