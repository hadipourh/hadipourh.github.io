// Official API: https://blog.dblp.org/2024/09/09/introducing-our-public-sparql-query-service/
// Metadata schema: https://dblp.org/rdf/docu/
export const DBLP_SPARQL_API = 'https://sparql.dblp.org/sparql';
export const DBLP_AUTHOR_URI = 'https://dblp.org/pid/244/8979';

// No row limit: author signatures produce several rows per publication.
// Optional metadata keeps incomplete records visible for validation below.
const PUBLICATIONS_QUERY = `PREFIX dblp: <https://dblp.org/rdf/schema#>
SELECT ?publication ?title ?year ?venue ?url ?doi ?pages ?volume ?number
       ?authorName ?authorOrder ?informal WHERE {
  ?publication dblp:authoredBy <${DBLP_AUTHOR_URI}> .
  OPTIONAL { ?publication dblp:title ?title . }
  OPTIONAL { ?publication dblp:yearOfPublication ?year . }
  OPTIONAL { ?publication dblp:publishedIn ?venue . }
  OPTIONAL { ?publication dblp:primaryDocumentPage ?url . }
  OPTIONAL { ?publication dblp:doi ?doi . }
  OPTIONAL { ?publication dblp:pagination ?pages . }
  OPTIONAL { ?publication dblp:publishedInJournalVolume ?volume . }
  OPTIONAL { ?publication dblp:publishedInJournalIssue ?number . }
  OPTIONAL { ?publication a dblp:Informal . BIND(true AS ?informal) }
  OPTIONAL {
    ?publication dblp:hasSignature ?signature .
    ?signature a dblp:AuthorSignature ;
               dblp:signatureDblpName ?authorName ;
               dblp:signatureOrdinal ?authorOrder .
  }
} ORDER BY ?publication ?authorOrder ?url ?doi`;

export function parseDblpResults(data) {
  const rows = data?.results?.bindings;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('DBLP returned an empty or invalid publication result');
  }

  const records = new Map();
  for (const row of rows) {
    const value = field => typeof row?.[field]?.value === 'string' ? row[field].value : '';
    const id = value('publication');
    const title = value('title');
    const year = value('year');
    const author = value('authorName');
    const ordinal = Number(value('authorOrder'));
    if (!id.startsWith('https://dblp.org/rec/') || !title.trim() || !/^\d{4}$/.test(year) ||
        !author.trim() || !Number.isInteger(ordinal) || ordinal < 1) {
      throw new Error(`Incomplete DBLP metadata for ${id || 'an unidentified publication'}`);
    }

    if (!records.has(id)) {
      const doi = value('doi').replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
      const url = value('url') || (doi ? `https://doi.org/${doi}` : id);
      if (!/^https?:\/\//i.test(url)) throw new Error(`Invalid publication link for ${id}`);
      records.set(id, {
        dblpUrl: id,
        title,
        year: Number(year),
        venue: value('venue') || 'Unknown Venue',
        url,
        doi,
        publicationType: value('informal') === 'true' ? 'informal' : '',
        pages: value('pages'),
        volume: value('volume'),
        number: value('number'),
        authorsByOrder: new Map(),
      });
    }
    const record = records.get(id);
    const existingAuthor = record.authorsByOrder.get(ordinal);
    if (existingAuthor && existingAuthor !== author) {
      throw new Error(`Conflicting author order for ${id}`);
    }
    record.authorsByOrder.set(ordinal, author);
  }

  return [...records.values()].map(({ authorsByOrder, ...record }) => {
    const ordered = [...authorsByOrder].sort(([a], [b]) => a - b);
    if (ordered.some(([ordinal], index) => ordinal !== index + 1)) {
      throw new Error(`Incomplete author list for ${record.dblpUrl}`);
    }
    return { ...record, authors: ordered.map(([, name]) => name).join(', ') };
  });
}

export async function fetchDblpRecords(fetchImpl = fetch) {
  const url = new URL(DBLP_SPARQL_API);
  url.searchParams.set('query', PUBLICATIONS_QUERY);
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'Academic-Website-Bot/1.0 (+https://hoseinhadipour.com)',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`DBLP SPARQL request failed: HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || 'unknown content type';
  if (!contentType.includes('json')) {
    throw new Error(`DBLP returned HTTP ${response.status} (${contentType}) instead of JSON`);
  }
  return parseDblpResults(await response.json());
}
