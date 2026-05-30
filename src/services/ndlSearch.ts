// Relative path is proxied to https://ndlsearch.ndl.go.jp/api/opensearch
// (Vite devServer.proxy in development, hosting proxy in production)
const NDL_BASE = '/api/ndl/opensearch';
const NS_DCNDL = 'http://ndl.go.jp/dcndl/terms/';
const NS_DC = 'http://purl.org/dc/elements/1.1/';
const NS_XSI = 'http://www.w3.org/2001/XMLSchema-instance';

export interface NdlMagazineIssue {
  title: string;
  volume: string; // e.g. "18巻1号(通号204) 2025年1月"
  publisher: string;
  year: string;
  issn: string; // ISSN if available, NDL BibID as fallback
  ndlLink: string;
}

function first(el: Element, ns: string, local: string): string {
  return el.getElementsByTagNameNS(ns, local)[0]?.textContent?.trim() ?? '';
}

export const searchMagazineIssues = async (
  title: string,
  year: number
): Promise<NdlMagazineIssue[]> => {
  const params = new URLSearchParams({
    title,
    from: `${year}-01-01`,
    until: `${year}-12-31`,
    cnt: '50',
    dpid: 'iss-ndl-opac',
  });

  try {
    const res = await fetch(`${NDL_BASE}?${params}`);
    if (!res.ok) throw new Error(`NDL API ${res.status}`);
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    const results: NdlMagazineIssue[] = [];
    for (const item of Array.from(doc.getElementsByTagName('item'))) {
      const volume = item.getElementsByTagNameNS(NS_DCNDL, 'volume')[0]?.textContent?.trim();
      if (!volume) continue; // series-level records have no volume element

      const titleText =
        first(item, NS_DC, 'title') ||
        item.getElementsByTagName('title')[0]?.textContent?.trim() ||
        '';
      const publisher = first(item, NS_DC, 'publisher');
      const dateText = first(item, NS_DC, 'date');
      const link =
        item.getElementsByTagName('guid')[0]?.textContent?.trim() ||
        item.getElementsByTagName('link')[0]?.textContent?.trim() ||
        '';

      let issn = '';
      let bibId = '';
      for (const idEl of Array.from(item.getElementsByTagNameNS(NS_DC, 'identifier'))) {
        const type = idEl.getAttributeNS(NS_XSI, 'type') ?? idEl.getAttribute('xsi:type') ?? '';
        if (type.includes('ISSN') && !issn) issn = idEl.textContent?.trim() ?? '';
        if (type.includes('NDLBibID') && !bibId) bibId = idEl.textContent?.trim() ?? '';
      }

      results.push({
        title: titleText,
        volume,
        publisher,
        year: dateText.slice(0, 4) || String(year),
        issn: issn || bibId,
        ndlLink: link,
      });
    }

    return results;
  } catch {
    return [];
  }
};
