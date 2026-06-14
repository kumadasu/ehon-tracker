import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { COLORS, FONTS } from '../constants/theme';
import { toIsbn13 } from '../utils/isbn';

const ghostButtonStyle = {
  background: 'rgba(255,255,255,.15)',
  border: 'none',
  borderRadius: 20,
  padding: '4px 14px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
} as const;

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
  const isValidIsbn = isbn13 !== null;

  const handleManualSubmit = () => {
    if (isbn13) {
      onDetected(isbn13);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
        }}
      >
        <span style={{ fontFamily: FONTS.body, fontSize: 16 }}>📷 バーコードをスキャン</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {viewMode === 'camera' && (
            <button onClick={switchToManual} style={ghostButtonStyle}>
              手動で入力
            </button>
          )}
          <button onClick={onClose} style={ghostButtonStyle}>
            キャンセル
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {viewMode === 'camera' && (
          <>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
              muted
              playsInline
            />
            {/* Viewfinder overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: 260,
                  height: 120,
                  border: `2px solid ${COLORS.accent}`,
                  borderRadius: 8,
                  boxShadow: '0 0 0 2000px rgba(0,0,0,.45)',
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                fontSize: 13,
                opacity: 0.8,
              }}
            >
              本の裏表紙のバーコードに向けてください
            </div>
          </>
        )}

        {/* Manual ISBN input: shown when camera is unavailable or user chose manual mode */}
        {viewMode !== 'camera' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: 24,
              gap: 16,
            }}
          >
            <div style={{ color: '#fff', fontSize: 14, textAlign: 'center', opacity: 0.8 }}>
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
              style={{
                width: '100%',
                maxWidth: 320,
                padding: '12px 16px',
                borderRadius: 8,
                border: `1.5px solid ${COLORS.border}`,
                fontSize: 16,
                textAlign: 'center',
                letterSpacing: 2,
              }}
            />
            <button
              onClick={handleManualSubmit}
              disabled={!isValidIsbn}
              style={{
                background: COLORS.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 32px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONTS.body,
                opacity: isValidIsbn ? 1 : 0.5,
              }}
            >
              検索する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
