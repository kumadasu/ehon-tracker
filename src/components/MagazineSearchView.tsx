import { useState } from 'react';
import { COLORS, FONTS } from '../constants/theme';
import { searchMagazineIssues, type NdlMagazineIssue } from '../services/ndlSearch';

interface Props {
  onSelect: (issue: NdlMagazineIssue) => void;
  onClose: () => void;
}

export const MagazineSearchView = ({ onSelect, onClose }: Props) => {
  const currentYear = new Date().getFullYear();
  const [titleInput, setTitleInput] = useState('');
  const [year, setYear] = useState(currentYear);
  const [results, setResults] = useState<NdlMagazineIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!titleInput.trim()) return;
    setLoading(true);
    setSearched(true);
    const issues = await searchMagazineIssues(titleInput.trim(), year);
    setResults(issues);
    setLoading(false);
  };

  const canSearch = titleInput.trim().length > 0 && !loading;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: COLORS.bg,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.paper,
        }}
      >
        <span style={{ fontFamily: FONTS.body, fontSize: 16, fontWeight: 700, color: COLORS.ink }}>
          📖 雑誌を検索
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: '4px 14px',
            color: COLORS.inkLight,
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: FONTS.body,
          }}
        >
          キャンセル
        </button>
      </div>

      {/* Search form */}
      <div
        style={{
          padding: '16px 20px',
          background: COLORS.paper,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && canSearch && handleSearch()}
          placeholder="タイトルで検索（例：鉄おも）"
          autoFocus
          style={{
            width: '100%',
            padding: '10px 14px',
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 8,
            fontSize: 15,
            color: COLORS.ink,
            background: COLORS.bg,
            marginBottom: 10,
            fontFamily: FONTS.body,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: COLORS.inkLight, flexShrink: 0 }}>発行年</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={1900}
            max={currentYear + 1}
            style={{
              width: 90,
              padding: '8px 10px',
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 15,
              color: COLORS.ink,
              background: COLORS.bg,
              fontFamily: FONTS.body,
            }}
          />
          <button
            onClick={handleSearch}
            disabled={!canSearch}
            style={{
              flex: 1,
              padding: '10px',
              background: COLORS.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: canSearch ? 'pointer' : 'default',
              fontFamily: FONTS.body,
              opacity: canSearch ? 1 : 0.6,
            }}
          >
            {loading ? '検索中…' : '検索'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {searched && !loading && results.length === 0 && (
          <div style={{ textAlign: 'center', color: COLORS.inkLight, padding: 40, fontSize: 14 }}>
            見つかりませんでした
          </div>
        )}
        {results.map((issue, i) => (
          <button
            key={i}
            onClick={() => onSelect(issue)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: COLORS.paper,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 8,
              cursor: 'pointer',
              fontFamily: FONTS.body,
              display: 'block',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 2 }}>
              {issue.volume}
            </div>
            <div style={{ fontSize: 12, color: COLORS.inkLight }}>{issue.publisher}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
