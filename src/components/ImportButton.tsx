import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { Book } from '../types';
import { parseBackup } from '../services/backup';
import styles from './ImportButton.module.css';

interface Props {
  label: string;
  className?: string;
  onImport: (books: Book[]) => void;
  onMessage: (message: string) => void;
}

/** A button that opens the file picker and hands a parsed backup to onImport. */
export const ImportButton = ({ label, className, onImport, onMessage }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    // Reset so choosing the same file again still fires a change event
    input.value = '';
    if (!file) return;
    try {
      const imported = parseBackup(await file.text());
      onImport(imported);
      onMessage(`📥 ${imported.length}冊を読み込みました`);
    } catch {
      onMessage('ファイルを読み込めませんでした。書き出したファイルを選んでください');
    }
  };

  return (
    <>
      <button onClick={() => inputRef.current?.click()} className={className}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className={styles.fileInput}
        data-testid="backup-file-input"
      />
    </>
  );
};
