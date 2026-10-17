#!/usr/bin/env node

/**
 * CV updater: parses public/cv/CV.tex and regenerates src/data/cv.ts.
 *
 * CV.tex is the single source of truth for the CV page, with one exception:
 * publications come from src/data/publications.json (the DBLP data behind the
 * Publications page), so "Research and Publications" only fixes their position
 * in the section order.
 *
 * The updater fails loudly instead of silently dropping content. An unknown
 * \section, an unsupported LaTeX command, or text a section parser does not
 * understand stops the run, and src/data/cv.ts is left untouched.
 *
 * Usage: npm run update:cv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CV_TEX = path.join(ROOT, 'public', 'cv', 'CV.tex');
const CV_TS = path.join(ROOT, 'src', 'data', 'cv.ts');

class CvError extends Error {}

function fail(message) {
  throw new CvError(message);
}

function snippet(text, at = 0, length = 80) {
  return text.slice(at, at + length).replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Scanning LaTeX source
// ---------------------------------------------------------------------------

function skipSpace(text, index) {
  while (index < text.length && /\s/.test(text[index])) index++;
  return index;
}

/** Read the balanced {...} (or [...]) group that starts at `start`. */
function readGroup(text, start, open = '{', close = '}') {
  if (text[start] !== open) return null;
  let depth = 0;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (char === '\\') {
      index++; // escaped character, e.g. \{ or \%
      continue;
    }
    if (char === open) depth++;
    if (char === close && --depth === 0) {
      return { value: text.slice(start + 1, index), end: index + 1 };
    }
  }
  return null;
}

/**
 * Find every use of the given commands together with their arguments.
 * `arity` maps a command name to its number of mandatory {arguments}; a
 * leading [optional argument] is skipped. A \cventry may be followed by one
 * extra {...} group, which the Education section uses for its itemize details.
 */
function findCommands(text, arity) {
  const pattern = new RegExp(String.raw`\\(${Object.keys(arity).join('|')})(?![A-Za-z@])`, 'g');
  const found = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const command = match[1];
    let cursor = skipSpace(text, match.index + match[0].length);
    if (text[cursor] === '[') {
      const optional = readGroup(text, cursor, '[', ']');
      if (!optional) fail(`Unclosed [ after \\${command}: "${snippet(text, match.index)}"`);
      cursor = optional.end;
    }
    const args = [];
    while (args.length < arity[command]) {
      cursor = skipSpace(text, cursor);
      const argument = readGroup(text, cursor);
      if (!argument) {
        fail(`\\${command} needs ${arity[command]} {arguments} but has ${args.length}: "${snippet(text, match.index)}"`);
      }
      args.push(argument.value);
      cursor = argument.end;
    }
    let extra = '';
    if (command === 'cventry') {
      const group = readGroup(text, skipSpace(text, cursor));
      if (group) {
        extra = group.value;
        cursor = group.end;
      }
    }
    found.push({ command, args, extra, start: match.index, end: cursor });
    pattern.lastIndex = cursor;
  }
  return found;
}

/** Find the itemize environments in `text`, with their items as raw LaTeX. */
function findItemizes(text) {
  const lists = [];
  const begin = /\\begin\s*\{itemize\}/g;
  let match;
  while ((match = begin.exec(text)) !== null) {
    const bodyStart = match.index + match[0].length;
    const boundary = /\\(begin|end)\s*\{itemize\}/g;
    boundary.lastIndex = bodyStart;
    let depth = 1;
    let token;
    while (depth > 0 && (token = boundary.exec(text)) !== null) {
      depth += token[1] === 'begin' ? 1 : -1;
    }
    if (depth > 0) fail(`Unclosed \\begin{itemize}: "${snippet(text, match.index)}"`);
    const end = token.index + token[0].length;
    lists.push({ items: splitItems(text.slice(bodyStart, token.index)), start: match.index, end });
    begin.lastIndex = end;
  }
  return lists;
}

function splitItems(body) {
  const token = /\\begin\s*\{[^}]*\}|\\end\s*\{[^}]*\}|\\item(?![A-Za-z@])|\\.|[{}]/g;
  const starts = [];
  let braces = 0;
  let environments = 0;
  let match;
  while ((match = token.exec(body)) !== null) {
    const value = match[0];
    if (value === '{') braces++;
    else if (value === '}') braces--;
    else if (value.startsWith('\\begin')) environments++;
    else if (value.startsWith('\\end')) environments--;
    else if (value === '\\item' && braces === 0 && environments === 0) {
      starts.push({ at: match.index, after: match.index + value.length });
    }
  }
  const lead = body.slice(0, starts[0]?.at ?? body.length).trim();
  if (lead) fail(`Text before the first \\item: "${snippet(lead)}"`);
  return starts.map((start, index) => {
    let item = body.slice(start.after, starts[index + 1]?.at ?? body.length).trim();
    if (item.startsWith('[')) item = item.slice(readGroup(item, 0, '[', ']').end); // \item[label]
    return item.trim();
  });
}

/** Split `content` at each \section (or \subsection) into titled parts. */
function splitByHeading(content, command) {
  const pattern = new RegExp(String.raw`\\${command}\*?\s*\{`, 'g');
  const headings = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const title = readGroup(content, match.index + match[0].length - 1);
    if (!title) fail(`Unclosed \\${command}{: "${snippet(content, match.index)}"`);
    headings.push({ start: match.index, title: text(title.value), bodyStart: title.end });
    pattern.lastIndex = title.end;
  }
  return {
    intro: content.slice(0, headings[0]?.start ?? content.length),
    parts: headings.map((heading, index) => ({
      title: heading.title,
      content: content.slice(heading.bodyStart, headings[index + 1]?.start ?? content.length),
    })),
  };
}

function removeSpans(text, spans) {
  let rest = '';
  let position = 0;
  for (const { start, end } of [...spans].sort((a, b) => a.start - b.start)) {
    rest += text.slice(position, start);
    position = Math.max(position, end);
  }
  return rest + text.slice(position);
}

// Spacing and page-break commands mean nothing on the web page.
const LAYOUT_COMMANDS = /\\(?:vspace|hspace|addvspace)\*?\s*\{[^{}]*\}|\\(?:newpage|clearpage|pagebreak|linebreak|newline|medskip|bigskip|smallskip|noindent|par)(?![A-Za-z@])/g;

/** Fail if anything in `text` is left over once the parsed spans are removed. */
function assertFullyParsed(sectionTitle, text, spans) {
  const rest = removeSpans(text, spans).replace(LAYOUT_COMMANDS, '').trim();
  if (rest) {
    fail(
      `Section "${sectionTitle}" has content the updater does not understand:\n` +
      `    "${snippet(rest, 0, 160)}"\n` +
      '  Use the entry macros this section supports, or extend scripts/update-cv-from-latex.js.'
    );
  }
}

// ---------------------------------------------------------------------------
// Preprocessing
// ---------------------------------------------------------------------------

function stripComments(tex) {
  return tex
    .split('\n')
    .map(line => {
      for (let index = 0; index < line.length; index++) {
        if (line[index] === '\\') index++; // \% is a literal percent sign
        else if (line[index] === '%') return line.slice(0, index);
      }
      return line;
    })
    .join('\n');
}

function documentBody(tex) {
  const begin = tex.indexOf('\\begin{document}');
  const end = tex.indexOf('\\end{document}');
  if (begin === -1 || end === -1) fail('CV.tex has no \\begin{document} ... \\end{document}.');
  return tex.slice(begin + '\\begin{document}'.length, end);
}

/**
 * The website is public, so resolve the \ifpublic switch the way the public
 * PDF does: keep \ifpublic branches and drop \unless\ifpublic ones.
 */
function resolvePublicConditionals(body) {
  const opener = /\\unless\s*\\ifpublic(?![A-Za-z@])|\\ifpublic(?![A-Za-z@])/g;
  let match;
  while ((match = opener.exec(body)) !== null) {
    const branchStart = match.index + match[0].length;
    const { elseStart, elseEnd, fiStart, fiEnd } = findConditionalEnd(body, branchStart);
    const whenPublic = body.slice(branchStart, elseStart ?? fiStart);
    const whenPrivate = elseStart === null ? '' : body.slice(elseEnd, fiStart);
    const kept = match[0].startsWith('\\unless') ? whenPrivate : whenPublic;
    body = body.slice(0, match.index) + kept + body.slice(fiEnd);
    opener.lastIndex = match.index;
  }
  return body;
}

function findConditionalEnd(text, from) {
  // \ifthenelse is a macro, not a TeX conditional, and has no matching \fi.
  const token = /\\(if(?!thenelse)[A-Za-z@]*|else|fi)(?![A-Za-z@])/g;
  token.lastIndex = from;
  let depth = 0;
  let elseStart = null;
  let elseEnd = null;
  let match;
  while ((match = token.exec(text)) !== null) {
    if (match[1] === 'fi') {
      if (depth === 0) return { elseStart, elseEnd, fiStart: match.index, fiEnd: match.index + match[0].length };
      depth--;
    } else if (match[1] === 'else') {
      if (depth === 0) {
        elseStart = match.index;
        elseEnd = match.index + match[0].length;
      }
    } else {
      depth++;
    }
  }
  fail('An \\ifpublic in CV.tex has no matching \\fi.');
}

// ---------------------------------------------------------------------------
// Rendering inline LaTeX as text or HTML
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cleanUrl(raw) {
  const url = raw.replace(/\\([#$%&_~{}])/g, '$1').replace(/\s+/g, '');
  if (!/^(https?:\/\/|mailto:)/i.test(url)) {
    fail(`Unsupported link target "${url}": only http, https and mailto links are published.`);
  }
  return url;
}

function link(url, label, mode) {
  if (mode === 'text') return label;
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

const wrap = tag => ({
  args: 1,
  render: ([content], mode) => {
    const inner = renderInline(content, mode);
    return mode === 'html' ? `<${tag}>${inner}</${tag}>` : inner;
  },
});
const passThrough = { args: 1, render: ([content], mode) => renderInline(content, mode) };
const symbol = value => ({ args: 0, render: () => value });
const ignored = symbol('');

// Inline commands the CV may use. Anything else stops the updater, so new
// markup is added here deliberately instead of leaking into the page.
const INLINE_COMMANDS = {
  textbf: wrap('strong'),
  emph: wrap('em'),
  textit: wrap('em'),
  textsl: wrap('em'),
  texttt: wrap('code'),
  textsc: passThrough,
  textrm: passThrough,
  textsf: passThrough,
  textup: passThrough,
  textmd: passThrough,
  textnormal: passThrough,
  text: passThrough,
  mbox: passThrough,
  href: { args: 2, render: ([url, label], mode) => link(cleanUrl(url), renderInline(label, mode), mode) },
  url: {
    args: 1,
    render: ([url], mode) => {
      const target = cleanUrl(url);
      return link(target, mode === 'html' ? escapeHtml(target) : target, mode);
    },
  },
  LaTeX: symbol('LaTeX'),
  TeX: symbol('TeX'),
  ldots: symbol('…'),
  dots: symbol('…'),
  // Used for ranges, as in "ToSC 2026-2 $\sim$ ToSC 2027-1".
  sim: symbol(' – '),
  times: symbol('×'),
  cdot: symbol('·'),
  textendash: symbol('–'),
  textemdash: symbol('—'),
  ss: symbol('ß'),
  newline: symbol(' '),
  linebreak: symbol(' '),
  hfill: symbol(' '),
  // Font and layout declarations only matter in the PDF.
  bfseries: ignored,
  mdseries: ignored,
  itshape: ignored,
  slshape: ignored,
  upshape: ignored,
  small: ignored,
  footnotesize: ignored,
  scriptsize: ignored,
  normalsize: ignored,
  large: ignored,
  Large: ignored,
  centering: ignored,
  raggedright: ignored,
  strut: ignored,
  noindent: ignored,
  ding: { args: 1, render: () => '' },
};

const ACCENTS = {
  '"': '\u0308', "'": '\u0301', '`': '\u0300', '^': '\u0302', '~': '\u0303', '=': '\u0304', '.': '\u0307',
  c: '\u0327', v: '\u030C', u: '\u0306', H: '\u030B',
};

function renderAccent(accent, source, position) {
  let cursor = /[A-Za-z]/.test(accent) ? skipSpace(source, position) : position;
  let base;
  if (source[cursor] === '{') {
    const group = readGroup(source, cursor);
    base = renderInline(group.value, 'text');
    cursor = group.end;
  } else {
    base = source[cursor] ?? '';
    cursor++;
  }
  return { value: (base + ACCENTS[accent]).normalize('NFC'), end: cursor };
}

function renderCommand(name, source, position, mode) {
  if (/^fa[A-Z]/.test(name)) return { value: '', end: skipSpace(source, position) }; // FontAwesome icon
  if (name.length === 1 && name in ACCENTS) return renderAccent(name, source, position);
  const spec = INLINE_COMMANDS[name];
  if (!spec) {
    fail(`Unsupported LaTeX command \\${name} in "${snippet(source)}".\n  Add it to INLINE_COMMANDS in scripts/update-cv-from-latex.js.`);
  }
  let cursor = position;
  const args = [];
  while (args.length < spec.args) {
    cursor = skipSpace(source, cursor);
    const group = readGroup(source, cursor);
    if (!group) fail(`\\${name} needs ${spec.args} {argument(s)} in "${snippet(source)}"`);
    args.push(group.value);
    cursor = group.end;
  }
  // Like TeX, a control word without arguments swallows the spaces after it.
  if (spec.args === 0) cursor = skipSpace(source, cursor);
  return { value: spec.render(args, mode), end: cursor };
}

function renderControlSymbol(char, source, position, mode) {
  if (!char) fail(`Stray backslash at the end of "${snippet(source)}"`);
  if (char in ACCENTS) return renderAccent(char, source, position);
  if (char === '\\') {
    const optional = readGroup(source, skipSpace(source, position), '[', ']'); // \\[2pt]
    return { value: ' ', end: optional ? optional.end : position };
  }
  if ('&%#_${}'.includes(char)) return { value: mode === 'html' ? escapeHtml(char) : char, end: position };
  if (char === ' ' || char === '\n' || char === '\t' || char === ';') return { value: ' ', end: position };
  if (char === ',') return { value: '\u2009', end: position };
  if (char === '-' || char === '/' || char === '!') return { value: '', end: position };
  fail(`Unsupported LaTeX control symbol \\${char} in "${snippet(source)}"`);
}

function renderInline(source, mode) {
  let out = '';
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    let result = null;
    if (char === '\\') {
      const next = source[index + 1] ?? '';
      if (/[A-Za-z@]/.test(next)) {
        let end = index + 1;
        while (end < source.length && /[A-Za-z@]/.test(source[end])) end++;
        result = renderCommand(source.slice(index + 1, end), source, end, mode);
      } else {
        result = renderControlSymbol(next, source, index + 2, mode);
      }
    } else if (char === '{') {
      const group = readGroup(source, index);
      if (!group) fail(`Unbalanced { in "${snippet(source, index)}"`);
      result = { value: renderInline(group.value, mode), end: group.end };
    } else if (char === '}') {
      fail(`Unbalanced } in "${snippet(source)}"`);
    } else if (char === '$') {
      result = { value: '', end: index + 1 }; // inline math: keep its contents
    } else if (char === '~') {
      result = { value: '\u00A0', end: index + 1 };
    } else if (source.startsWith('---', index)) {
      result = { value: '—', end: index + 3 };
    } else if (source.startsWith('--', index)) {
      result = { value: '–', end: index + 2 };
    } else if (source.startsWith('``', index)) {
      result = { value: '“', end: index + 2 };
    } else if (source.startsWith("''", index)) {
      result = { value: '”', end: index + 2 };
    } else {
      result = { value: mode === 'html' ? escapeHtml(char) : char, end: index + 1 };
    }
    out += result.value;
    index = result.end;
  }
  return out;
}

const collapse = value => value.replace(/[ \t\r\n]+/g, ' ').replace(/ ?\u00A0 ?/g, '\u00A0').trim();

/** Inline LaTeX as plain text, for fields the page renders as text. */
function text(source) {
  return collapse(renderInline(source, 'text'));
}

/** A date or period; "Feb.~2025--\newline Present" becomes "Feb. 2025–Present". */
function period(source) {
  return text(source).replace(/\s*–\s*/g, '–');
}

/** Inline LaTeX as escaped HTML (links, bold, italics), for fields ending in `Html`. */
function html(source) {
  return collapse(renderInline(source, 'html'));
}

/** Render a block that may contain itemize lists: prose as HTML plus one HTML string per item. */
function renderBlock(source) {
  const lists = findItemizes(source);
  return {
    html: html(removeSpans(source, lists)),
    items: lists.flatMap(list => list.items.map(html)),
  };
}

function firstUrl(source) {
  const [found] = findCommands(source, { href: 2, url: 1 });
  return found ? cleanUrl(found.args[0]) : '';
}

/** Split "A, B; C (x, y)" at top-level commas and semicolons. */
function splitList(value) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (const char of value) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if ((char === ',' || char === ';') && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map(part => part.trim().replace(/\.$/, '')).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Section parsers
// ---------------------------------------------------------------------------

const ENTRY = { cventry: 6, experienceentry: 6 };
const LABELED = { cvitem: 2, detailitem: 2, skillitem: 2 };

function parseProfile(title, content) {
  const items = findCommands(content, { cvitem: 2 });
  assertFullyParsed(title, content, items);
  return items.map(({ args }) => html(args[1]));
}

/** \experienceentry and \cventry share {time}{title}{organization}{city}{country}{description}. */
function timelineEntry({ args, extra }) {
  const [time, title, organization, city, country, description] = args;
  const block = renderBlock(`${description} ${extra}`);
  return {
    time: period(time),
    title: text(title),
    organization: text(organization),
    location: [city, country].map(text).filter(Boolean).join(', '),
    descriptionHtml: block.html,
    detailsHtml: block.items,
  };
}

function parseTimeline(title, content) {
  const entries = findCommands(content, ENTRY);
  assertFullyParsed(title, content, entries);
  return entries.map(timelineEntry);
}

function parseTeaching(title, content) {
  const entries = findCommands(content, { ...ENTRY, ...LABELED });
  assertFullyParsed(title, content, entries);
  const teaching = [];
  const supervision = [];
  for (const entry of entries) {
    if (entry.command in ENTRY) {
      const { time, title: role, organization, location, descriptionHtml } = timelineEntry(entry);
      const course = /^Course:\s*(.+?)\.?$/i.exec(text(entry.args[5]))?.[1] ?? null;
      teaching.push({ time, role, institution: organization, location, course, descriptionHtml: course ? '' : descriptionHtml });
    } else {
      supervision.push({ label: text(entry.args[0]), descriptionHtml: html(entry.args[1]) });
    }
  }
  return { teaching, supervision };
}

/** "\textbf{Role} at \href{url}{Venue 2026}" or "Role for \href{url}{Venue 2026}". */
function serviceEntry(item) {
  const [venue] = findCommands(item, { href: 2 });
  if (!venue) return { role: '', highlight: false, venue: text(item), url: '' };
  const role = item.slice(0, venue.start).trim().replace(/\s+(?:for|at)$/i, '');
  return {
    role: text(role),
    highlight: /\\textbf/.test(role),
    venue: text(venue.args[1] + item.slice(venue.end)),
    url: cleanUrl(venue.args[0]),
  };
}

function parseService(title, content) {
  const lists = findItemizes(content);
  assertFullyParsed(title, content, lists);
  return lists.flatMap(list => list.items).map(serviceEntry);
}

/** Index of the "(" that opens the parenthetical ending `source`, ignoring parentheses inside {...}. */
function trailingParenthesisStart(source) {
  let braces = 0;
  let parens = 0;
  for (let index = source.length - 1; index >= 0; index--) {
    const char = source[index];
    if (char === '}') braces++;
    else if (char === '{') braces--;
    else if (braces === 0 && char === ')') parens++;
    else if (braces === 0 && char === '(' && --parens === 0) return index;
  }
  return -1;
}

function topLevelComma(source) {
  let braces = 0;
  let parens = 0;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '(') parens++;
    else if (char === ')') parens--;
    else if (char === ',' && braces === 0 && parens === 0) return index;
  }
  return -1;
}

/** "\textbf{\href{url}{Title}}, Place, Dates (\href{url}{Note})" as used by Visits and Talks. */
function eventEntry(time, details) {
  let body = details.trim();
  let note = '';
  if (body.endsWith(')')) {
    const open = trailingParenthesisStart(body);
    if (open > 0) {
      note = body.slice(open + 1, -1);
      body = body.slice(0, open).trim();
    }
  }
  let title;
  let rest;
  const bold = /^\\textbf\s*\{/.exec(body);
  if (bold) {
    const group = readGroup(body, bold[0].length - 1);
    title = group.value;
    rest = body.slice(group.end);
  } else {
    const comma = topLevelComma(body);
    title = comma === -1 ? body : body.slice(0, comma);
    rest = comma === -1 ? '' : body.slice(comma);
  }
  return {
    time: period(time),
    title: text(title),
    url: firstUrl(title),
    detailsHtml: html(rest.replace(/^\s*,\s*/, '')),
    noteHtml: html(note),
  };
}

function parseEvents(title, content) {
  const items = findCommands(content, { cvitem: 2 });
  assertFullyParsed(title, content, items);
  return items.map(({ args: [time, details] }) => eventEntry(time, details));
}

function parseHonors(title, content) {
  const entries = findCommands(content, { cventry: 6 });
  assertFullyParsed(title, content, entries);
  return entries.map(({ args: [time, distinction, event, location, date, details], extra }) => ({
    time: period(time),
    distinction: text(distinction),
    event: text(event),
    location: text(location),
    date: period(date),
    detailsHtml: html(`${details} ${extra}`),
  }));
}

function parseSkills(title, content) {
  const items = findCommands(content, LABELED);
  assertFullyParsed(title, content, items);
  return items.map(({ args: [category, list] }) => ({ category: text(category), items: splitList(text(list)) }));
}

function parseResearchInterests(title, content) {
  const items = findCommands(content, { cvlistitem: 1, cvlistdoubleitem: 2 });
  assertFullyParsed(title, content, items);
  return items.flatMap(({ args }) => args.map(html));
}

const LANGUAGE_LEVELS = {
  'mother tongue': 5,
  native: 5,
  bilingual: 5,
  fluent: 4,
  advanced: 4,
  proficient: 4,
  'upper intermediate': 3,
  intermediate: 3,
  basic: 2,
  elementary: 2,
  beginner: 1,
  learning: 1,
};

function parseLanguages(title, content) {
  const items = findCommands(content, LABELED);
  assertFullyParsed(title, content, items);
  return items.map(({ args: [name, levelSource] }) => {
    const language = text(name);
    const level = text(levelSource);
    const proficiency = LANGUAGE_LEVELS[level.toLowerCase()];
    if (!proficiency) {
      fail(`Unknown level "${level}" for ${language}. Add it to LANGUAGE_LEVELS in scripts/update-cv-from-latex.js.`);
    }
    return { language, level, proficiency };
  });
}

// CV.tex only names personal interests; the cards add an icon and a short line.
const INTEREST_CARDS = [
  { match: /hik|mountain|climb/i, icon: 'mountain', description: 'Outdoor adventures and nature exploration' },
  { match: /swim/i, icon: 'waves', description: 'Regular swimming for fitness and relaxation' },
  { match: /tennis/i, icon: 'tennis', description: 'Playing tennis for recreation and sport' },
  { match: /bik|cycl/i, icon: 'activity', description: 'Cycling for fitness and exploration' },
  { match: /travel/i, icon: 'globe', description: 'Exploring new cultures and destinations' },
  { match: /movie|film|documentar/i, icon: 'film', description: 'Watching films and educational content' },
  { match: /read|book/i, icon: 'book', description: 'Reading literature and academic materials' },
  { match: /program|coding/i, icon: 'code', description: 'Software development and technical projects' },
  { match: /music|guitar|piano/i, icon: 'music', description: 'Playing musical instruments and composition' },
  { match: /chess|puzzle/i, icon: 'puzzle', description: 'Strategic games and mental challenges' },
];
const DEFAULT_INTEREST_CARD = { icon: 'activity', description: 'Personal hobby and interest' };

/** "Hiking, swimming, tennis, music, and chess." -> one card per interest. */
function personalInterests(list) {
  return splitList(list.replace(/\s+and\s+/gi, ', '))
    .map(name => name.replace(/^and\s+/i, ''))
    .map(name => {
      const { icon, description } = INTEREST_CARDS.find(card => card.match.test(name)) ?? DEFAULT_INTEREST_CARD;
      return { title: name.charAt(0).toUpperCase() + name.slice(1), description, icon };
    });
}

const PERSONAL_INTERESTS = /^(personal\s+)?(interests|hobbies)$/i;

/** "Other Information": a Memberships subsection, whose "Interests" row holds personal interests. */
function parseOtherInformation(title, content) {
  const { intro, parts } = splitByHeading(content, 'subsection');
  assertFullyParsed(title, intro, []);
  const result = { memberships: [], interests: [], sections: [] };
  for (const part of parts) {
    const where = `${title} > ${part.title}`;
    if (/membership/i.test(part.title)) {
      const items = findCommands(part.content, LABELED);
      assertFullyParsed(where, part.content, items);
      for (const { args: [label, body] } of items) {
        if (PERSONAL_INTERESTS.test(text(label))) result.interests.push(...personalInterests(text(body)));
        else result.memberships.push({ time: period(label), organization: text(body) });
      }
      if (result.memberships.length > 0) result.sections.push({ key: 'memberships', title: part.title });
    } else if (PERSONAL_INTERESTS.test(part.title)) {
      const items = findCommands(part.content, { ...LABELED, cvlistitem: 1 });
      assertFullyParsed(where, part.content, items);
      for (const { args } of items) result.interests.push(...personalInterests(text(args[args.length - 1])));
    } else {
      fail(`Unknown subsection "${part.title}" in "${title}". Handle it in parseOtherInformation in scripts/update-cv-from-latex.js.`);
    }
  }
  if (result.interests.length > 0) result.sections.push({ key: 'interests', title: 'Personal Interests' });
  return result;
}

/**
 * Every \section in CV.tex must match one of these titles (case-insensitive),
 * so a renamed or new section is never dropped silently.
 */
const SECTIONS = [
  { key: 'profile', titles: ['research profile', 'profile', 'summary'], parse: (t, c) => ({ researchProfile: parseProfile(t, c) }) },
  { key: 'appointments', titles: ['research appointments', 'appointments', 'experience', 'professional experience', 'employment'], parse: (t, c) => ({ appointments: parseTimeline(t, c) }) },
  { key: 'education', titles: ['education'], parse: (t, c) => ({ education: parseTimeline(t, c) }) },
  // Listed from src/data/publications.json; this section only fixes the position.
  { key: 'publications', titles: ['research and publications', 'publications', 'selected publications'], parse: () => ({}) },
  { key: 'teaching', titles: ['teaching and supervision', 'teaching', 'teaching experience'], parse: parseTeaching },
  { key: 'service', titles: ['academic service', 'professional service', 'service', 'reviews'], parse: (t, c) => ({ service: parseService(t, c) }) },
  { key: 'visits', titles: ['visits', 'research visits'], parse: (t, c) => ({ visits: parseEvents(t, c) }) },
  { key: 'honors', titles: ['honors', 'honors and awards', 'awards'], parse: (t, c) => ({ honors: parseHonors(t, c) }) },
  { key: 'skills', titles: ['technical skills', 'computer skills', 'skills'], parse: (t, c) => ({ skills: parseSkills(t, c) }) },
  { key: 'researchInterests', titles: ['research interests'], parse: (t, c) => ({ researchInterests: parseResearchInterests(t, c) }) },
  { key: 'talks', titles: ['selected talks and presentations', 'talks and presentations', 'talks', 'invited talks'], parse: (t, c) => ({ talks: parseEvents(t, c) }) },
  { key: 'languages', titles: ['languages'], parse: (t, c) => ({ languages: parseLanguages(t, c) }) },
  { key: 'other', titles: ['other information'], parse: parseOtherInformation },
  // Never published on the website, whatever \ifpublic says.
  { key: 'references', titles: ['references', 'reference persons', 'referees'], skip: true },
];

const normalizeTitle = title => title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]+/g, ' ').trim();

function parseCv(tex) {
  const body = resolvePublicConditionals(documentBody(stripComments(tex)));
  const data = {
    sections: [],
    researchProfile: [],
    appointments: [],
    education: [],
    teaching: [],
    supervision: [],
    service: [],
    visits: [],
    honors: [],
    skills: [],
    researchInterests: [],
    talks: [],
    languages: [],
    memberships: [],
    interests: [],
  };
  const seen = new Set();
  for (const { title, content } of splitByHeading(body, 'section').parts) {
    const spec = SECTIONS.find(section => section.titles.includes(normalizeTitle(title)));
    if (!spec) {
      fail(
        `Unknown section "\\section{${title}}".\n` +
        '  Map it in SECTIONS in scripts/update-cv-from-latex.js, or mark it skip: true to keep it off the website.'
      );
    }
    if (seen.has(spec.key)) fail(`CV.tex has two sections that map to "${spec.key}" ("${title}").`);
    seen.add(spec.key);
    if (spec.skip) continue;

    const { sections, ...parsed } = spec.parse(title, content);
    Object.assign(data, parsed);
    if (sections) {
      data.sections.push(...sections);
    } else if (spec.key !== 'profile' && (spec.key === 'publications' || Object.values(parsed).some(list => list.length > 0))) {
      data.sections.push({ key: spec.key, title });
    }
  }
  for (const key of ['appointments', 'education']) {
    if (data[key].length === 0) console.warn(`WARNING: no ${key} found; the CV page opens with a timeline of them.`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const EXPORTS = [
  ['cvSections', 'sections', 'CvSection[]'],
  ['researchProfile', 'researchProfile', 'string[]'],
  ['appointments', 'appointments', 'TimelineEntry[]'],
  ['education', 'education', 'TimelineEntry[]'],
  ['teaching', 'teaching', 'TeachingEntry[]'],
  ['supervision', 'supervision', 'SupervisionEntry[]'],
  ['service', 'service', 'ServiceEntry[]'],
  ['visits', 'visits', 'EventEntry[]'],
  ['honors', 'honors', 'Honor[]'],
  ['skills', 'skills', 'SkillGroup[]'],
  ['researchInterests', 'researchInterests', 'string[]'],
  ['talks', 'talks', 'EventEntry[]'],
  ['languages', 'languages', 'Language[]'],
  ['memberships', 'memberships', 'Membership[]'],
  ['interests', 'interests', 'Interest[]'],
];

function toModule(data) {
  const types = [...new Set(EXPORTS.map(([, , type]) => type.replace('[]', '')).filter(type => type !== 'string'))];
  return [
    '// AUTO-GENERATED by scripts/update-cv-from-latex.js from public/cv/CV.tex.',
    '// Do not edit by hand: change CV.tex and run `npm run update:cv`.',
    '// Publications are not here; the CV page reads src/data/publications.json.',
    '// Fields ending in `Html` hold escaped HTML rendered from LaTeX; render them with set:html.',
    `import type { ${types.join(', ')} } from '../types/cv';`,
    '',
    ...EXPORTS.map(([name, field, type]) => `export const ${name}: ${type} = ${JSON.stringify(data[field], null, '\t')};\n`),
  ].join('\n');
}

function main() {
  const relative = file => path.relative(ROOT, file);
  if (!fs.existsSync(CV_TEX)) {
    console.error(`ERROR: ${relative(CV_TEX)} not found.`);
    process.exit(1);
  }
  let data;
  try {
    data = parseCv(fs.readFileSync(CV_TEX, 'utf8'));
  } catch (error) {
    if (!(error instanceof CvError)) throw error;
    console.error(`ERROR: ${error.message}\n${relative(CV_TS)} was not changed.`);
    process.exit(1);
  }
  fs.writeFileSync(CV_TS, toModule(data));

  console.log(`Updated ${relative(CV_TS)} from ${relative(CV_TEX)}`);
  console.log(`  Research Profile: ${data.researchProfile.length} paragraph(s)`);
  for (const { key, title } of data.sections) {
    const count = key === 'publications' ? 'from publications.json'
      : key === 'teaching' ? `${data.teaching.length} teaching, ${data.supervision.length} supervision`
      : data[key].length;
    console.log(`  ${title}: ${count}`);
  }
}

main();
