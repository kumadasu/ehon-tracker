export async function onRequest(context: {
  request: Request;
  params: { path?: string | string[] };
}): Promise<Response> {
  const url = new URL(context.request.url);
  const pathParam = context.params.path;
  const path = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam ?? 'opensearch');
  const ndlUrl = `https://ndlsearch.ndl.go.jp/api/${path}${url.search}`;

  try {
    const ndlResponse = await fetch(ndlUrl);
    return new Response(ndlResponse.body, {
      status: ndlResponse.status,
      headers: {
        'Content-Type': ndlResponse.headers.get('Content-Type') ?? 'application/xml',
      },
    });
  } catch {
    return new Response('NDL proxy error', { status: 502 });
  }
}
