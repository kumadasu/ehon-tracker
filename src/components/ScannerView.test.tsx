import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScannerView } from './ScannerView';

// Mock @zxing/browser because it drives a real camera, which jsdom has no access to.
const { decodeFromVideoDevice, stop } = vi.hoisted(() => ({
  decodeFromVideoDevice: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoDevice = decodeFromVideoDevice;
  },
}));

type DecodeCallback = (result: { getText: () => string } | null) => void;

/** Hands back the callback zxing was given, so tests can simulate a scan. */
const cameraStarts = () => {
  let callback: DecodeCallback = () => {};
  decodeFromVideoDevice.mockImplementation((_id: unknown, _el: unknown, cb: DecodeCallback) => {
    callback = cb;
    return Promise.resolve({ stop });
  });
  return () => callback;
};

const cameraFails = () => {
  decodeFromVideoDevice.mockRejectedValue(new Error('NotAllowedError'));
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ScannerView', () => {
  it('when the camera starts, it should show the viewfinder guidance', async () => {
    // Verifies the default mode is the live camera

    // Arrange
    cameraStarts();

    // Act
    render(<ScannerView onDetected={vi.fn()} onClose={vi.fn()} />);

    // Assert
    expect(screen.getByText('本の裏表紙のバーコードに向けてください')).toBeInTheDocument();
    await waitFor(() => expect(decodeFromVideoDevice).toHaveBeenCalled());
  });

  it('when a valid ISBN-13 barcode is scanned, it should report it', async () => {
    // Verifies the happy path of the scanner

    // Arrange
    const onDetected = vi.fn();
    const getCallback = cameraStarts();
    render(<ScannerView onDetected={onDetected} onClose={vi.fn()} />);
    await waitFor(() => expect(decodeFromVideoDevice).toHaveBeenCalled());

    // Act
    getCallback()({ getText: () => '9784001140309' });

    // Assert
    expect(onDetected).toHaveBeenCalledWith('9784001140309');
    expect(stop).toHaveBeenCalled();
  });

  it('when an ISBN-10 barcode is scanned, it should report the ISBN-13 form', async () => {
    // Verifies legacy Japanese ISBNs are normalized before being reported

    // Arrange
    const onDetected = vi.fn();
    const getCallback = cameraStarts();
    render(<ScannerView onDetected={onDetected} onClose={vi.fn()} />);
    await waitFor(() => expect(decodeFromVideoDevice).toHaveBeenCalled());

    // Act
    getCallback()({ getText: () => '4001140306' });

    // Assert
    expect(onDetected).toHaveBeenCalledWith('9784001140309');
  });

  it('when a non-ISBN barcode is scanned, it should keep scanning', async () => {
    // Verifies unrelated barcodes do not close the scanner

    // Arrange
    const onDetected = vi.fn();
    const getCallback = cameraStarts();
    render(<ScannerView onDetected={onDetected} onClose={vi.fn()} />);
    await waitFor(() => expect(decodeFromVideoDevice).toHaveBeenCalled());

    // Act
    getCallback()({ getText: () => '4901234567894' });

    // Assert
    expect(onDetected).not.toHaveBeenCalled();
  });

  it('when the scan callback fires with no result, it should do nothing', async () => {
    // Verifies the between-frames case where zxing reports no barcode

    // Arrange
    const onDetected = vi.fn();
    const getCallback = cameraStarts();
    render(<ScannerView onDetected={onDetected} onClose={vi.fn()} />);
    await waitFor(() => expect(decodeFromVideoDevice).toHaveBeenCalled());

    // Act
    getCallback()(null);

    // Assert
    expect(onDetected).not.toHaveBeenCalled();
  });

  it('when the camera cannot be started, it should fall back to manual input with an explanation', async () => {
    // Verifies the documented fallback when the camera prompt fails

    // Arrange
    cameraFails();

    // Act
    render(<ScannerView onDetected={vi.fn()} onClose={vi.fn()} />);

    // Assert
    expect(
      await screen.findByText('カメラを使用できません。ISBNを手動で入力してください。')
    ).toBeInTheDocument();
  });

  it('when the user chooses manual input, it should switch without the error wording', async () => {
    // Verifies the deliberate switch reads differently from the camera failure

    // Arrange
    const user = userEvent.setup();
    cameraStarts();
    render(<ScannerView onDetected={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => expect(decodeFromVideoDevice).toHaveBeenCalled());

    // Act
    await user.click(screen.getByRole('button', { name: '手動で入力' }));

    // Assert
    expect(screen.getByText('ISBNを入力してください。')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '手動で入力' })).not.toBeInTheDocument();
  });

  it('when the manual input is not a valid ISBN, it should keep the search button disabled', async () => {
    // Verifies an unusable value cannot be submitted

    // Arrange
    const user = userEvent.setup();
    cameraFails();
    render(<ScannerView onDetected={vi.fn()} onClose={vi.fn()} />);
    await screen.findByPlaceholderText('978xxxxxxxxxx / 4xxxxxxxxx');

    // Act
    await user.type(screen.getByPlaceholderText('978xxxxxxxxxx / 4xxxxxxxxx'), '123');

    // Assert
    expect(screen.getByRole('button', { name: '検索する' })).toBeDisabled();
  });

  it('when a valid ISBN is typed and submitted, it should report it', async () => {
    // Verifies the manual path reaches the same callback as the camera path

    // Arrange
    const user = userEvent.setup();
    const onDetected = vi.fn();
    cameraFails();
    render(<ScannerView onDetected={onDetected} onClose={vi.fn()} />);
    await screen.findByPlaceholderText('978xxxxxxxxxx / 4xxxxxxxxx');

    // Act
    await user.type(screen.getByPlaceholderText('978xxxxxxxxxx / 4xxxxxxxxx'), '978-4-00-114030-9');
    await user.click(screen.getByRole('button', { name: '検索する' }));

    // Assert
    expect(onDetected).toHaveBeenCalledWith('9784001140309');
  });

  it('when cancel is tapped, it should close', async () => {
    // Verifies the scanner can be dismissed

    // Arrange
    const user = userEvent.setup();
    const onClose = vi.fn();
    cameraStarts();
    render(<ScannerView onDetected={vi.fn()} onClose={onClose} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    // Assert
    expect(onClose).toHaveBeenCalled();
  });

  it('when unmounted, it should stop the camera', async () => {
    // Verifies the documented cleanup via controls.stop()

    // Arrange
    cameraStarts();
    const { unmount } = render(<ScannerView onDetected={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => expect(decodeFromVideoDevice).toHaveBeenCalled());

    // Act
    unmount();

    // Assert
    expect(stop).toHaveBeenCalled();
  });
});
