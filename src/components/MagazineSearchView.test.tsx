import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MagazineSearchView } from './MagazineSearchView';
import { searchMagazineIssues, type NdlMagazineIssue } from '../services/ndlSearch';

// Mock the NDL service because it is the HTTP boundary of this component.
vi.mock('../services/ndlSearch', () => ({
  searchMagazineIssues: vi.fn(),
}));

const searchMock = vi.mocked(searchMagazineIssues);

const issue = (volume: string): NdlMagazineIssue => ({
  title: '鉄おも',
  volume,
  publisher: 'ネコ・パブリッシング',
  year: '2025',
  issn: '18823629',
  ndlLink: 'https://ndlsearch.ndl.go.jp/books/R100000002-I000000012345',
});

beforeEach(() => {
  vi.clearAllMocks();
  searchMock.mockResolvedValue([]);
});

const yearInput = () => document.querySelectorAll('input[type="number"]')[0] as HTMLInputElement;
const issueInput = () => document.querySelectorAll('input[type="number"]')[1] as HTMLInputElement;

describe('MagazineSearchView', () => {
  it('when the title is empty, it should keep the search button disabled', () => {
    // Verifies a search cannot be run without a title

    // Arrange & Act
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: '検索' })).toBeDisabled();
  });

  it('when the year is missing, it should keep the search button disabled', async () => {
    // Verifies the year is required alongside the title

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');

    // Assert
    expect(screen.getByRole('button', { name: '検索' })).toBeDisabled();
  });

  it('when a title and year are given, it should search with them', async () => {
    // Verifies the required inputs reach the service, with the optional one omitted

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '  鉄おも  ');
    await user.type(yearInput(), '2025');
    await user.click(screen.getByRole('button', { name: '検索' }));

    // Assert
    expect(searchMock).toHaveBeenCalledWith('鉄おも', 2025, undefined);
  });

  it('when an issue number is given, it should pass it to the search', async () => {
    // Verifies the optional issue-number filter is forwarded

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025');
    await user.type(issueInput(), '204');
    await user.click(screen.getByRole('button', { name: '検索' }));

    // Assert
    expect(searchMock).toHaveBeenCalledWith('鉄おも', 2025, 204);
  });

  it('when Enter is pressed in the title field, it should run the search', async () => {
    // Verifies the keyboard shortcut matches the button

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025');
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '{Enter}');

    // Assert
    expect(searchMock).toHaveBeenCalled();
  });

  it('when the search returns issues, it should list them', async () => {
    // Verifies results are rendered with volume and publisher

    // Arrange
    const user = userEvent.setup();
    searchMock.mockResolvedValue([issue('18巻1号(通号204) 2025年1月')]);
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025');
    await user.click(screen.getByRole('button', { name: '検索' }));

    // Assert
    expect(await screen.findByText('18巻1号(通号204) 2025年1月')).toBeInTheDocument();
    expect(screen.getByText('ネコ・パブリッシング')).toBeInTheDocument();
  });

  it('when the search returns nothing, it should say so', async () => {
    // Verifies the empty state appears only after a search has run

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText('見つかりませんでした')).not.toBeInTheDocument();

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '存在しない雑誌');
    await user.type(yearInput(), '2025');
    await user.click(screen.getByRole('button', { name: '検索' }));

    // Assert
    expect(await screen.findByText('見つかりませんでした')).toBeInTheDocument();
  });

  it('when a result is tapped, it should report that issue', async () => {
    // Verifies selecting a result hands the whole issue to the caller

    // Arrange
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const found = issue('18巻1号(通号204) 2025年1月');
    searchMock.mockResolvedValue([found]);
    render(<MagazineSearchView onSelect={onSelect} onClose={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025');
    await user.click(screen.getByRole('button', { name: '検索' }));
    await user.click(await screen.findByText('18巻1号(通号204) 2025年1月'));

    // Assert
    expect(onSelect).toHaveBeenCalledWith(found);
  });

  it('when the year is cleared after being typed, it should disable the search again', async () => {
    // Verifies the numeric fields handle being emptied

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025');
    expect(screen.getByRole('button', { name: '検索' })).toBeEnabled();

    // Act
    await user.clear(yearInput());

    // Assert
    expect(screen.getByRole('button', { name: '検索' })).toBeDisabled();
  });

  it('when Enter is pressed in the year field, it should run the search', async () => {
    // Verifies the shortcut works from the year input too

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025{Enter}');

    // Assert
    expect(searchMock).toHaveBeenCalled();
  });

  it('when Enter is pressed in the issue-number field, it should run the search', async () => {
    // Verifies the shortcut works from the issue-number input too

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);

    // Act
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025');
    await user.type(issueInput(), '204{Enter}');

    // Assert
    expect(searchMock).toHaveBeenCalledWith('鉄おも', 2025, 204);
  });

  it('when the issue number is cleared, it should search without it', async () => {
    // Verifies emptying the optional field falls back to undefined rather than NaN

    // Arrange
    const user = userEvent.setup();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025');
    await user.type(issueInput(), '204');

    // Act
    await user.clear(issueInput());
    await user.click(screen.getByRole('button', { name: '検索' }));

    // Assert
    expect(searchMock).toHaveBeenCalledWith('鉄おも', 2025, undefined);
  });

  it('while the search is in flight, it should show a loading label and block re-submission', async () => {
    // Verifies the button reflects the pending request

    // Arrange
    const user = userEvent.setup();
    let resolveSearch: (issues: NdlMagazineIssue[]) => void = () => {};
    searchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      })
    );
    render(<MagazineSearchView onSelect={vi.fn()} onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('タイトルで検索（例：鉄おも）'), '鉄おも');
    await user.type(yearInput(), '2025');

    // Act
    await user.click(screen.getByRole('button', { name: '検索' }));

    // Assert
    expect(screen.getByRole('button', { name: '検索中…' })).toBeDisabled();
    resolveSearch([]);
    expect(await screen.findByRole('button', { name: '検索' })).toBeEnabled();
  });

  it('when cancel is tapped, it should close', async () => {
    // Verifies the view can be dismissed

    // Arrange
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MagazineSearchView onSelect={vi.fn()} onClose={onClose} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    // Assert
    expect(onClose).toHaveBeenCalled();
  });
});
