#!/usr/bin/env node
/**
 * GEO structural validator for the static build in dist/.
 *
 * Checks structure, markup, metadata, and JSON-LD consistency only.
 * Passing does NOT prove that any AI system has crawled, indexed, or cited this page.
 *
 * Usage: npm run validate   (run `npm run build` first)
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('dist');
const errors = [];
const warnings = [];
let passed = 0;

const check = (condition, message) => {
  if (condition) passed += 1;
  else errors.push(message);
};

const read = (relPath) => {
  const path = resolve(DIST, relPath);
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
};

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const plain = (html) =>
  decode(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const wordCount = (text) => (text.match(/\S+/g) || []).length;

const H1 = 'The Environmental Architecture of Generative AI: Carbon and Water Resource Management.';

const REQUIRED_HEADINGS = [
  [2, 'Section A: How much water does training an LLM consume?'],
  [2, 'Section B: What is the carbon footprint of AI model training?'],
  [2, 'Cooling Methods and Ecosystem Impacts'],
  [3, 'Section C: Evaporative Cooling and Greywater Recycling Methods'],
  [3, 'Section D: AI Hardware Demands and Sustainable Development Goal 6 Target 6.6'],
  [2, 'Section E: Resource consumption comparison'],
  [2, 'Section F: Frequently asked questions'],
  [2, 'Section G: Sources and methodology'],
];

const REQUIRED_FAQ_QUESTIONS = [
  'How much water does training an LLM consume?',
  'What is the carbon footprint of AI model training?',
  'Does AI inference consume water?',
  'How can data centres reduce their environmental impact?',
];

const REQUIRED_RESOURCE_COLUMNS = [
  'Task and assumptions',
  'Energy consumption (kWh)',
  'Water consumption (millilitres)',
  'System boundary',
  'Source',
];

const REQUIRED_COOLING_COLUMNS = [
  'Method',
  'Water use',
  'Energy requirement',
  'Water availability needed',
  'Operational constraints',
];

const STAT = /\d[\d,.]*\s*(?:kWh|MWh|TWh|litres?|liters?|mL|millilitres|tonnes?|tCO2e?|CO2e|%)/i;

// ---------- Load build output ----------
const html = read('index.html');
if (html === null) {
  console.error('✖ dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

// ---------- Document basics ----------
check(/<html\b[^>]*\blang="[a-z-]+"/i.test(html), 'The <html> element must declare a lang attribute.');
check(/<title>[^<]+<\/title>/i.test(html), 'A non-empty <title> is required.');
check(/<meta\b[^>]*name="description"[^>]*content="[^"]+"/i.test(html), 'A meta description is required.');

const canonicalMatch =
  html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i) ||
  html.match(/<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/i);
check(canonicalMatch && /^https:\/\//.test(canonicalMatch[1]), 'A canonical link with an absolute https URL is required.');
if (canonicalMatch && /example\.com/i.test(canonicalMatch[1])) {
  warnings.push('Canonical URL uses the placeholder domain example.com. Set SITE_URL before deploying.');
}

// ---------- Semantic landmarks ----------
const count = (re) => (html.match(re) || []).length;
check(count(/<main\b/gi) === 1, `Expected exactly one <main>, found ${count(/<main\b/gi)}.`);
check(count(/<header\b/gi) >= 1, 'A <header> landmark is required.');
check(count(/<footer\b/gi) >= 1, 'A <footer> landmark is required.');
check(count(/<nav\b/gi) >= 1, 'A <nav> landmark is required.');
check(count(/<section\b/gi) >= 6, 'At least six <section> elements are expected.');
check(count(/<article\b/gi) >= 3, 'At least three <article> cards are expected.');
check(count(/<time\b[^>]*datetime=/gi) >= 2, 'Publication and review dates must use <time datetime>.');
check(count(/<table\b/gi) >= 2, 'Two tables (cooling methods and resource comparison) are expected.');
check(count(/<a\b[^>]*\bhref="#main-content"/gi) >= 1, 'A skip link to #main-content is required.');

// ---------- No client-side JavaScript ----------
const scriptTags = [...html.matchAll(/<script\b([^>]*)>/gi)];
const nonLdScripts = scriptTags.filter((m) => !/type="application\/ld\+json"/i.test(m[1]));
check(
  nonLdScripts.length === 0,
  `Found ${nonLdScripts.length} non-JSON-LD <script> tag(s). The site must not use client-side JavaScript.`,
);
check(!/\son[a-z]+="/i.test(html), 'Inline event-handler attributes (onclick, etc.) were found.');

// ---------- Headings ----------
const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
  level: Number(m[1]),
  text: plain(m[2]),
  end: m.index + m[0].length,
}));

const h1s = headings.filter((h) => h.level === 1);
check(h1s.length === 1, `Expected exactly one H1, found ${h1s.length}.`);
check(h1s.length === 1 && h1s[0].text === H1, `H1 text must be exactly: "${H1}"`);

// Every H2/H3 must be immediately followed by a paragraph of 40–60 words.
for (const h of headings.filter((x) => x.level === 2 || x.level === 3)) {
  const after = html.slice(h.end);
  const m = after.match(/^\s*<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) {
    errors.push(`H${h.level} "${h.text}" is not immediately followed by a paragraph.`);
    continue;
  }
  const wc = wordCount(plain(m[1]));
  check(wc >= 40 && wc <= 60, `Answer under H${h.level} "${h.text}" has ${wc} words (required 40–60).`);
}

// Required headings must exist, with exact text, in order.
let cursor = 0;
for (const [level, text] of REQUIRED_HEADINGS) {
  const idx = headings.findIndex((h, i) => i >= cursor && h.level === level && h.text === text);
  if (idx === -1) {
    errors.push(`Missing or out-of-order H${level}: "${text}"`);
  } else {
    cursor = idx + 1;
    passed += 1;
  }
}

// ---------- Tables ----------
const getTable = (id) =>
  [...html.matchAll(/<table\b([^>]*)>([\s\S]*?)<\/table>/gi)].find((m) => new RegExp(`\\bid="${id}"`).test(m[1]));

function validateTable(id, requiredColumns, label) {
  const table = getTable(id);
  check(!!table, `${label} table with id="${id}" was not found.`);
  if (!table) return null;
  const body = table[2];
  check(/<caption\b/i.test(body), `${label} table needs a <caption>.`);

  const thead = (body.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/i) || [])[1] || '';
  const headers = [...thead.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => plain(m[1]));
  for (const col of requiredColumns) {
    check(headers.includes(col), `${label} table is missing column "${col}".`);
  }

  const tbody = (body.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i) || [])[1] || '';
  const rows = [...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const row of rows) {
    const cells = (row[1].match(/<t[dh]\b/gi) || []).length;
    check(cells === headers.length, `${label} table row has ${cells} cells; expected ${headers.length}.`);
  }
  return { body, plainText: plain(body) };
}

const resourceTable = validateTable('resource-comparison-table', REQUIRED_RESOURCE_COLUMNS, 'Resource comparison');
if (resourceTable) {
  check(
    /Not established/i.test(resourceTable.plainText),
    'Resource comparison table should use "Not established" where comparable values are unavailable.',
  );
}
validateTable('cooling-comparison-table', REQUIRED_COOLING_COLUMNS, 'Cooling comparison');

// ---------- Statistics must have source links ----------
const checkStat = (block, where) => {
  const text = plain(block);
  if (!STAT.test(text)) return;
  if (/Not established/i.test(text)) return;
  if (/<a\b[^>]*href=/i.test(block)) {
    passed += 1;
  } else {
    errors.push(`Numeric statistic without a source link in ${where}: "${text.slice(0, 80)}…"`);
  }
};
const articleBlocks = [...html.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map((m) => m[0]);
articleBlocks.forEach((b) => checkStat(b, 'a metric or evidence card'));
const outsideArticles = html.replace(/<article\b[\s\S]*?<\/article>/gi, ' ');
for (const m of outsideArticles.matchAll(/<(p|li|td|dd)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
  checkStat(m[0], `<${m[1]}>`);
}

// ---------- Required notice ----------
check(
  /environmental impacts vary by model, hardware, workload, location, and electricity source/i.test(plain(html)),
  'The page must include the notice that environmental impacts vary by model, hardware, workload, location, and electricity source.',
);

// ---------- JSON-LD ----------
const ldBlocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(
  (m) => m[1],
);
const ld = [];
for (const raw of ldBlocks) {
  try {
    ld.push(JSON.parse(raw));
  } catch (err) {
    errors.push(`Invalid JSON-LD block: ${err.message}`);
  }
}

const article = ld.find((x) => x['@type'] === 'Article');
const faq = ld.find((x) => x['@type'] === 'FAQPage');

check(!!article, 'Article JSON-LD is missing.');
if (article) {
  check(article.headline === H1.replace(/\.$/, ''), 'Article headline must match the H1 (without the trailing period).');
  check(!!article.datePublished && !!article.dateModified, 'Article JSON-LD requires datePublished and dateModified.');
  check(!!article.description, 'Article JSON-LD requires a description.');
}

check(!!faq, 'FAQPage JSON-LD is missing.');
if (faq) {
  const entries = Array.isArray(faq.mainEntity) ? faq.mainEntity : [];
  check(entries.length >= 4, `FAQPage must contain at least four questions; found ${entries.length}.`);

  for (const q of REQUIRED_FAQ_QUESTIONS) {
    check(entries.some((e) => e.name === q), `FAQPage is missing required question: "${q}"`);
  }

  const fIdx = headings.findIndex((h) => h.level === 2 && h.text.startsWith('Section F:'));
  const gIdx = headings.findIndex((h) => h.level === 2 && h.text.startsWith('Section G:'));
  const visibleFaq = headings.slice(fIdx + 1, gIdx).filter((h) => h.level === 3);

  check(
    visibleFaq.length === entries.length,
    `Visible FAQ count (${visibleFaq.length}) does not match FAQPage count (${entries.length}).`,
  );

  entries.forEach((entry, i) => {
    const vis = visibleFaq[i];
    if (!vis) return;
    check(vis.text === entry.name, `FAQ question ${i + 1} differs: visible "${vis.text}" vs JSON-LD "${entry.name}".`);
    const answerMatch = html.slice(vis.end).match(/^\s*<p\b[^>]*>([\s\S]*?)<\/p>/i);
    // Remove inline tags without inserting spaces, so "(<a>Name</a>)" compares as "(Name)".
    const visibleAnswer = answerMatch
      ? norm(decode(answerMatch[1].replace(/<[^>]+>/g, '')))
      : '';
    const schemaAnswer = norm(entry.acceptedAnswer?.text ?? '');
    check(visibleAnswer === schemaAnswer, `FAQ answer for "${entry.name}" does not match the visible text.`);
  });
}

// ---------- Robots and sitemap ----------
const robots = read('robots.txt');
check(robots !== null, 'robots.txt is missing from dist/. Ensure it exists in public/.');
if (robots) {
  const lines = robots
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);

  for (const line of lines) {
    const m = line.match(/^disallow\s*:\s*(.*)$/i);
    if (m && m[1].trim() !== '') {
      errors.push(`robots.txt blocks "${m[1].trim()}". The page is meant to be crawlable; remove the rule or document why it exists.`);
    }
  }
  check(lines.some((l) => /^allow\s*:\s*\/$/i.test(l)), 'robots.txt should explicitly allow "/".');
  check(lines.some((l) => /^sitemap\s*:/i.test(l)), 'robots.txt has no Sitemap line.');
}

const sitemap = read('sitemap.xml');
check(sitemap !== null, 'sitemap.xml is missing from dist/.');
if (sitemap) {
  const locs = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  check(locs.length > 0, 'sitemap.xml contains no <loc> entries.');
  locs.forEach((loc) => check(/^https:\/\//.test(loc), `Sitemap URL must be https: ${loc}`));
  if (canonicalMatch && !locs.includes(canonicalMatch[1])) {
    warnings.push(`Canonical URL ${canonicalMatch[1]} is not listed in sitemap.xml.`);
  }
}

// ---------- Report ----------
console.log(`\nGEO structural validation: ${errors.length === 0 ? 'PASSED' : 'FAILED'}`);
console.log(`✔ ${passed} checks passed`);

for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✖ ${e}`);

console.log(
  '\nNote: these are structural checks only. They do not show that any AI system has discovered, indexed, or cited this page.\n',
);

process.exit(errors.length === 0 ? 0 : 1);
