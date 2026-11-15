import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { Book } from '../types';
import { parseBackup, serializeBackup } from '../services/backup';
import { today } from '../utils/dateUtils';
import styles from './BackupPanel.module.css';

interface Props {
  books: Book[];
  onImport: (books: Book[]) => void;
  onMessage: (message: string) => void;
}

const downloadText = (filename: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** Export every book to a JSON file, or merge one back in. */
export const BackupPanel = ({ books, onImport, onMessage }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const date = today();
    downloadText(`ehon-tracker-${date}.json`, serializeBackup(books, date));
    onMessage(`💾 ${books.length}冊を書き出しました`);
  };

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
    <section className={styles.panel} aria-label="データのバックアップ">
      <div className={styles.title}>データのバックアップ</div>
      <div className={styles.hint}>
        {'借り中・読了のすべての記録をファイルに保存して、別の端末で読み込めます。' +
          '同じ記録（同じ回の貸出）はファイルの内容で上書きされ、別の回に借りた記録はそのまま残ります。'}
      </div>
      <div className={styles.actions}>
        <button onClick={handleExport} disabled={books.length === 0} className={styles.button}>
          書き出す
        </button>
        <button onClick={() => inputRef.current?.click()} className={styles.button}>
          読み込む
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className={styles.fileInput}
          data-testid="backup-file-input"
        />
      </div>
    </section>
  );
};
