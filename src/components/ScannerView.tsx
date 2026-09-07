import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { toIsbn13 } from '../utils/isbn';
import styles from './ScannerView.module.css';

type ViewMode = 'camera' | 'manual-user' | 'manual-error';

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export const ScannerView = ({ onDetected, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [manualIsbn, setManualIsbn] = useState('');

  const switchToManual = () => {
    controlsRef.current?.stop();
    setViewMode('manual-user');
  };

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result) {
          const isbn13 = toIsbn13(result.getText());
          if (isbn13) {
            controlsRef.current?.stop();
            onDetected(isbn13);
          }
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch(() => setViewMode('manual-error'));

    return () => {
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  const isbn13 = toIsbn13(manualIsbn);

  const handleManualSubmit = () => {
    if (isbn13) {
      onDetected(isbn13);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.heading}>📷 バーコードをスキャン</span>
        <div className={styles.headerActions}>
          {viewMode === 'camera' && (
            <button onClick={switchToManual} className={styles.ghost}>
              手動で入力
            </button>
          )}
          <button onClick={onClose} className={styles.ghost}>
            キャンセル
          </button>
        </div>
      </div>

      <div className={styles.stage}>
        {viewMode === 'camera' && (
          <>
            <video ref={videoRef} className={styles.video} autoPlay muted playsInline />
            <div className={styles.viewfinder}>
              <div className={styles.frame} />
            </div>
            <div className={styles.hint}>本の裏表紙のバーコードに向けてください</div>
          </>
        )}

        {/* Manual ISBN input: shown when camera is unavailable or user chose manual mode */}
        {viewMode !== 'camera' && (
          <div className={styles.manual}>
            <div className={styles.manualMessage}>
              {viewMode === 'manual-error'
                ? 'カメラを使用できません。ISBNを手動で入力してください。'
                : 'ISBNを入力してください。'}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              placeholder="978xxxxxxxxxx / 4xxxxxxxxx"
              className={styles.manualInput}
            />
            <button onClick={handleManualSubmit} disabled={!isbn13} className={styles.submit}>
              検索する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
