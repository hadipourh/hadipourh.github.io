import assert from 'node:assert/strict';
import test from 'node:test';
import { DBLP_AUTHOR_URI, fetchDblpRecords, parseDblpResults } from './lib/dblp.js';
import { resolveCitationCount } from './update-publications.js';

const binding = fields => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value: String(value) }]));
const row = overrides => binding({
  publication: 'https://dblp.org/rec/conf/example/paper',
  title: 'An example paper.',
  year: '2026',
  venue: 'Example Conference',
  url: 'https://doi.org/10.1234/example',
  doi: 'https://doi.org/10.1234/example',
  pages: '10-20',
  authorName: 'First Author',
  authorOrder: '1',
  ...overrides,
});
const result = rows => ({ results: { bindings: rows } });

test('preserves author order and deduplicates joined rows without merging publication versions', () => {
  const second = row({ authorName: 'Second Author', authorOrder: '2' });
  const preprint = row({
    publication: 'https://dblp.org/rec/journals/iacr/example',
    venue: 'IACR Cryptol. ePrint Arch.',
    url: 'https://eprint.iacr.org/2026/1',
    doi: '',
    informal: 'true',
  });
  const records = parseDblpResults(result([second, row(), second, preprint]));
  assert.equal(records.length, 2);
  assert.equal(records[0].authors, 'First Author, Second Author');
  assert.equal(records[0].doi, '10.1234/example');
  assert.equal(records[0].pages, '10-20');
  assert.equal(records[0].year, 2026);
  assert.equal(records[1].publicationType, 'informal');
});

test('uses a DOI or DBLP record link when no primary document link exists', () => {
  assert.equal(parseDblpResults(result([row({ url: '' })]))[0].url, 'https://doi.org/10.1234/example');
  const [record] = parseDblpResults(result([row({ url: '', doi: '' })]));
  assert.equal(record.url, record.dblpUrl);
});

test('rejects empty, malformed, and incomplete records instead of publishing partial metadata', () => {
  for (const input of [{}, result([]), result([row({ title: '' })]), result([row({ year: 'unknown' })]),
    result([row({ authorName: '' })]), result([row({ authorOrder: '2' })])]) {
    assert.throws(() => parseDblpResults(input));
  }
  assert.throws(() => parseDblpResults(result([row(), row({ authorName: 'Conflicting Author' })])), /Conflicting author order/);
});

test('queries the persistent author ID without a result limit and reads standard SPARQL JSON', async () => {
  const records = await fetchDblpRecords(async (url, options) => {
    assert.equal(url.origin, 'https://sparql.dblp.org');
    const query = url.searchParams.get('query');
    assert.ok(query.includes(DBLP_AUTHOR_URI));
    assert.doesNotMatch(query, /\bLIMIT\b/i);
    assert.equal(options.headers.Accept, 'application/sparql-results+json');
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify(result([row()])), { headers: { 'content-type': 'application/sparql-results+json' } });
  });
  assert.equal(records.length, 1);
});

test('rejects bot checks, rate limits, malformed JSON, and empty responses', async () => {
  for (const response of [
    new Response('<html>Bot check</html>', { status: 202, headers: { 'content-type': 'text/html' } }),
    new Response('Rate limited', { status: 429 }),
    new Response('{broken', { headers: { 'content-type': 'application/json' } }),
    new Response(JSON.stringify(result([])), { headers: { 'content-type': 'application/sparql-results+json' } }),
  ]) {
    await assert.rejects(fetchDblpRecords(async () => response));
  }
});

test('keeps cached citations on failure, matches DOI case, and accepts a genuine zero', () => {
  const previous = [{ doi: '10.1234/EXAMPLE', citations: 42 }];
  const paper = { doi: 'https://doi.org/10.1234/example' };
  assert.equal(resolveCitationCount(paper, null, previous), 42);
  assert.equal(resolveCitationCount(paper, 0, previous), 0);
  assert.equal(resolveCitationCount(paper, 55, previous), 55);
});

test('uses stable DBLP identity for cached citations and keeps preprint counts separate', () => {
  const previous = [{ dblpUrl: 'record:published', doi: '10.1234/published', url: 'https://publisher.example/paper', citations: 42 }];
  assert.equal(resolveCitationCount({ dblpUrl: 'record:published', url: 'https://new.example/paper' }, null, previous), 42);
  assert.equal(resolveCitationCount({ dblpUrl: 'record:preprint', url: 'https://eprint.iacr.org/2026/1' }, null, previous), 0);
});
