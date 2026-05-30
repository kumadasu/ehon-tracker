import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { searchMagazineIssues } from './ndlSearch';

beforeEach(() => {
  // Mock fetch because NDL API is an external HTTP dependency
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const mockFetch = (body: string, status = 200) =>
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  } as Response);

const NAMESPACES = `
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcndl="http://ndl.go.jp/dcndl/terms/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
`;

const rss = (items: string[]) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" ${NAMESPACES}>
  <channel>
    ${items.join('\n')}
  </channel>
</rss>`;

const issueItem = ({
  title = '鉄おも!',
  volume = '18巻1号(通号204) 2025年1月',
  publisher = 'ネコ・パブリッシング',
  bibId = '000010823077',
  issn = '',
  guid = 'https://ndlsearch.ndl.go.jp/books/R100000002-I000010823077-i33267934',
} = {}) => `
<item>
  <title>${title}</title>
  <guid isPermaLink="true">${guid}</guid>
  <dc:title>${title}</dc:title>
  <dcndl:volume>${volume}</dcndl:volume>
  <dc:publisher>${publisher}</dc:publisher>
  <dc:date xsi:type="dcterms:W3CDTF">2025</dc:date>
  <dc:identifier xsi:type="dcndl:NDLBibID">${bibId}</dc:identifier>
  ${issn ? `<dc:identifier xsi:type="dcndl:ISSN">${issn}</dc:identifier>` : ''}
</item>`;

const seriesItem = () => `
<item>
  <title>鉄おも!</title>
  <guid isPermaLink="true">https://ndlsearch.ndl.go.jp/books/R100000002-I000010823077</guid>
  <dc:title>鉄おも!</dc:title>
  <dc:publisher>ネコ・パブリッシング</dc:publisher>
  <dc:date xsi:type="dcterms:W3CDTF">2010</dc:date>
  <dcterms:issued>2010-</dcterms:issued>
  <dc:identifier xsi:type="dcndl:NDLBibID">000010823077</dc:identifier>
</item>`;

describe('searchMagazineIssues', () => {
  it('when NDL returns an issue item with volume, it should return that issue', async () => {
    // Arrange
    mockFetch(rss([issueItem()]));

    // Act
    const results = await searchMagazineIssues('鉄おも', 2025);

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('鉄おも!');
    expect(results[0].volume).toBe('18巻1号(通号204) 2025年1月');
    expect(results[0].publisher).toBe('ネコ・パブリッシング');
  });

  it('when item has no volume element, it should be excluded from results', async () => {
    // Arrange
    mockFetch(rss([seriesItem()]));

    // Act
    const results = await searchMagazineIssues('鉄おも', 2025);

    // Assert
    expect(results).toHaveLength(0);
  });

  it('when response contains both series and issue items, it should return only issues', async () => {
    // Arrange
    mockFetch(
      rss([
        seriesItem(),
        issueItem({ volume: '18巻1号(通号204) 2025年1月' }),
        issueItem({ volume: '18巻2号(通号205) 2025年2月' }),
      ])
    );

    // Act
    const results = await searchMagazineIssues('鉄おも', 2025);

    // Assert
    expect(results).toHaveLength(2);
  });

  it('when ISSN is present in the response, it should use ISSN as the identifier', async () => {
    // Arrange
    mockFetch(rss([issueItem({ issn: '1883-6305' })]));

    // Act
    const results = await searchMagazineIssues('鉄おも', 2025);

    // Assert
    expect(results[0].issn).toBe('1883-6305');
  });

  it('when ISSN is absent, it should use NDL BibID as the identifier fallback', async () => {
    // Arrange
    mockFetch(rss([issueItem({ bibId: '000010823077' })]));

    // Act
    const results = await searchMagazineIssues('鉄おも', 2025);

    // Assert
    expect(results[0].issn).toBe('000010823077');
  });

  it('when the NDL link (guid) is present, it should be included in ndlLink', async () => {
    // Arrange
    const guid = 'https://ndlsearch.ndl.go.jp/books/R100000002-I000010823077-i33267934';
    mockFetch(rss([issueItem({ guid })]));

    // Act
    const results = await searchMagazineIssues('鉄おも', 2025);

    // Assert
    expect(results[0].ndlLink).toBe(guid);
  });

  it('when fetch throws, it should return an empty array', async () => {
    // Arrange
    // Mock fetch as a rejected promise to simulate network failure
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));

    // Act
    const results = await searchMagazineIssues('鉄おも', 2025);

    // Assert
    expect(results).toEqual([]);
  });

  it('when the API returns a non-ok status, it should return an empty array', async () => {
    // Arrange
    mockFetch('', 500);

    // Act
    const results = await searchMagazineIssues('鉄おも', 2025);

    // Assert
    expect(results).toEqual([]);
  });

  it('when called, it should include title, year, and dpid in the request URL', async () => {
    // Arrange
    mockFetch(rss([]));

    // Act
    await searchMagazineIssues('鉄おも', 2025);

    // Assert
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain('title=%E9%89%84%E3%81%8A%E3%82%82');
    expect(calledUrl).toContain('from=2025-01-01');
    expect(calledUrl).toContain('until=2025-12-31');
    expect(calledUrl).toContain('dpid=iss-ndl-opac');
  });
});
