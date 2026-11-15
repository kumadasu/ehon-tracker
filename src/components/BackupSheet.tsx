import type { Book } from '../types';
import { serializeBackup } from '../services/backup';
import { today } from '../utils/dateUtils';
import { BottomSheet } from './BottomSheet';
import { BackupImportButton } from './BackupImportButton';
import styles from './BackupSheet.module.css';
import form from './sheetForm.module.css';

interface Props {
  books: Book[];
  onImport: (books: Book[]) => void;
  onMessage: (message: string) => void;
  onClose: () => void;
}

const downloadText = (filename: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** Export every book to a JSON file, or merge one back in. Opened from the header. */
export const BackupSheet = ({ books, onImport, onMessage, onClose }: Props) => {
  const handleExport = () => {
    const date = today();
    downloadText(`ehon-tracker-${date}.json`, serializeBackup(books, date));
    onMessage(`💾 ${books.length}冊を書き出しました`);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className={form.heading}>データのバックアップ</div>
      <div className={styles.hint}>
        {'借り中・読了のすべての記録をファイルに保存して、別の端末で読み込めます。' +
          '同じ記録（同じ回の貸出）はファイルの内容で上書きされ、別の回に借りた記録はそのまま残ります。'}
      </div>
      <div className={styles.actions}>
        <button onClick={handleExport} disabled={books.length === 0} className={styles.button}>
          書き出す
        </button>
        <BackupImportButton
          label="読み込む"
          className={styles.button}
          onImport={(imported) => {
            onImport(imported);
            onClose();
          }}
          onMessage={onMessage}
        />
      </div>
    </BottomSheet>
  );
};
