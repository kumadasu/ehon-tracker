import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { COLORS, FONTS } from '../constants/theme';

const ISBN_REGEX = /^97[89]\d{10}$/;

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export const ScannerView = ({ onDetected, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualIsbn, setManualIsbn] = useState('');

  const switchToManual = () => {
    controlsRef.current?.stop();
    setManualMode(true);
  };

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result) {
          const text = result.getText();
          if (ISBN_REGEX.test(text)) {
            controlsRef.current?.stop();
            onDetected(text);
          }
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch(() => setCameraError(true));

    return () => {
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  const handleManualSubmit = () => {
    const isbn = manualIsbn.trim().replace(/-/g, '');
    if (ISBN_REGEX.test(isbn)) {
      onDetected(isbn);
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
          {!cameraError && !manualMode && (
            <button
              onClick={switchToManual}
              style={{
                background: 'rgba(255,255,255,.15)',
                border: 'none',
                borderRadius: 20,
                padding: '4px 14px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              手動で入力
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.15)',
              border: 'none',
              borderRadius: 20,
              padding: '4px 14px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            キャンセル
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {!cameraError && !manualMode && (
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
        {(cameraError || manualMode) && (
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
              {cameraError
                ? 'カメラを使用できません。ISBNを手動で入力してください。'
                : 'ISBNを入力してください。'}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              placeholder="978xxxxxxxxxx"
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
              disabled={!/^97[89]\d{10}$/.test(manualIsbn.trim().replace(/-/g, ''))}
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
                opacity: ISBN_REGEX.test(manualIsbn.trim().replace(/-/g, '')) ? 1 : 0.5,
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
