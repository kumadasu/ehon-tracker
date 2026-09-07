import { useState } from 'react';
import { searchMagazineIssues, type NdlMagazineIssue } from '../services/ndlSearch';
import styles from './MagazineSearchView.module.css';

const CURRENT_YEAR = new Date().getFullYear();

interface Props {
  onSelect: (issue: NdlMagazineIssue) => void;
  onClose: () => void;
}

export const MagazineSearchView = ({ onSelect, onClose }: Props) => {
  const [titleInput, setTitleInput] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [issueNumber, setIssueNumber] = useState<number | ''>('');
  const [results, setResults] = useState<NdlMagazineIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (year === '') return;
    setLoading(true);
    setSearched(true);
    const issues = await searchMagazineIssues(
      titleInput.trim(),
      year,
      issueNumber === '' ? undefined : issueNumber
    );
    setResults(issues);
    setLoading(false);
  };

  const canSearch = titleInput.trim().length > 0 && year !== '' && !loading;

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSearch) handleSearch();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.heading}>📖 雑誌を検索</span>
        <button onClick={onClose} className={styles.cancel}>
          キャンセル
        </button>
      </div>

      <div className={styles.form}>
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={submitOnEnter}
          placeholder="タイトルで検索（例：鉄おも）"
          autoFocus
          className={styles.titleInput}
        />
        <div className={styles.filters}>
          <label className={styles.filterLabel}>発行年</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
            onKeyDown={submitOnEnter}
            placeholder={String(CURRENT_YEAR)}
            min={1900}
            max={CURRENT_YEAR + 1}
            className={styles.filterInput}
          />
          <label className={styles.filterLabel}>通号</label>
          <input
            type="number"
            value={issueNumber}
            onChange={(e) => setIssueNumber(e.target.value === '' ? '' : Number(e.target.value))}
            onKeyDown={submitOnEnter}
            placeholder="任意"
            min={1}
            className={styles.filterInput}
          />
          <button onClick={handleSearch} disabled={!canSearch} className={styles.search}>
            {loading ? '検索中…' : '検索'}
          </button>
        </div>
      </div>

      <div className={styles.results}>
        {searched && !loading && results.length === 0 && (
          <div className={styles.empty}>見つかりませんでした</div>
        )}
        {results.map((issue) => (
          <button key={issue.volume} onClick={() => onSelect(issue)} className={styles.result}>
            <div className={styles.resultVolume}>{issue.volume}</div>
            <div className={styles.resultPublisher}>{issue.publisher}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
