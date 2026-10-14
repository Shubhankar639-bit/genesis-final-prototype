# Get Cited — evidence review

Production: https://genesis-final-prototype.vercel.app/

Vercel's project root is `get-cited-ai-environment/`. Run commands from this directory. The repository also contains an older root-level copy; the nested project is the deployed application.

## Install and run

Use Node.js 22 LTS and npm. Astro 4, `@astrojs/tailwind` 5, and Tailwind 3 remain compatible; no framework migration is needed for these content fixes. The lockfile pins the installed dependency graph. `parse5` 7.3.0 is an explicit development dependency for HTML5 parsing.

```sh
git clone https://github.com/Shubhankar639-bit/genesis-final-prototype.git
cd genesis-final-prototype/get-cited-ai-environment
npm ci
npm run dev
```

```sh
npm run check
npm run preview
```

`check` builds static HTML, then validates `dist/`. No hydration, runtime API, browser analytics, or executable client scripts are used.

## Production domain

The configured default is the actual deployed origin. Override it when moving domains:

```sh
SITE_URL=https://your-real-host.invalid npm run check
```

The command above illustrates the syntax; use your actual reachable HTTPS origin. In PowerShell:

```powershell
$env:SITE_URL='https://genesis-final-prototype.vercel.app'
npm run check
```

The configuration rejects sample example domains, credentials, paths, queries, and fragments. Canonicals, Open Graph URLs, Article URLs, robots.txt, and the four-page sitemap derive from the same origin. A build hook generates discovery files after Astro emits all routes. `lastmod` is omitted rather than assigning an invented modification timestamp to every page.

## Deployment

In Vercel use the existing `genesis-final-prototype` project, production branch `main`, root directory `get-cited-ai-environment`, Astro preset, build command `npm run check`, output `dist`, and Node.js 22.x. Set `SITE_URL` to the production origin if changing the default. A push or browser commit to main triggers the existing Git integration.

For the CLI, with the correct owner's authorized account and project already linked:

```sh
vercel --prod
```

Do not publish `node_modules/`, `dist/`, `.astro/`, local environment files, or credentials. No special Vercel runtime adapter is needed for this static site.

## What the validator proves

`scripts/validate-geo.mjs` parses generated HTML with parse5. It verifies headings and their immediate sibling paragraphs, required answer word counts, table headers and row scopes, shared visible/schema FAQ text, metadata, production URLs, local links and anchors, primary-reference URL syntax, citation proximity, robots.txt, sitemap membership, and static substantive content. It emits each failure with an expected condition and suggested fix, exits nonzero on failure, and writes `dist/geo-validation.json` for reproducible technical results.

Word counts normalize whitespace and split on whitespace. Visible citation words count. The exact paragraph text is included in word-count failures. About, contact, and privacy pages are checked for general semantics and links, but the scientific article's 40–60-word answer requirement only applies to the article.

Passing checks do not prove scientific accuracy, external link availability, crawler indexing, rich-result eligibility, or actual AI citations. Source verification and UI checks are separate.

## Evidence and editorial policy

The review on 14 October 2026 checked:

- Li et al., arXiv:2304.03271: the direct cooling-water estimate and water accounting method.
- Patterson et al., arXiv:2104.10350, Table 4: GPT-3 training energy and operational emissions; manufacturing is excluded.
- Elsworth et al., arXiv:2508.15734, Table 2: vendor-reported May 2025 Gemini serving energy and calculated cooling water, not a universal per-prompt value.
- Luccioni et al., arXiv:2311.16863, Table 2: image-generation mean energy per 1,000 queries, with large model variability.
- Official UN Goal 6 and indicator metadata: Target 6.6 and indicator 6.6.1.
- US DOE cooling-tower guidance: water treatment, evaporation, blowdown, and operating practices.

Do not mix these boundaries into a single comparative footprint. Direct water consumption differs from withdrawal and from upstream electricity water. The article explains unit conversions explicitly. No independent measurement or peer review is claimed. The public about page describes AI assistance, source selection, review limits, and the correction process. Contact links to the existing repository's public issues; no email or credentials are invented.

## Before/after audit protocol

Baseline: Cantilever GEO Audit, https://geo.cantilever.co/, 14 October 2026; tool version not exposed. URL: https://genesis-final-prototype.vercel.app/; deployed commit: ab5c04e4f37455ba56fb3c2291f8d0651458e8c0. The free report scored **43/100**, medium confidence, one page analyzed. Content 14/40; structure 12/30; schema 7/20; crawl/access 10/10. Detailed recommendations require contact information and were not accessed. The tool reported three sitemap URLs even though the site's discovery files required production-host correction; record the tool output without treating it as a verified inventory.

After deployment rerun the same tool on the same root URL with the same free-report settings. Record timestamp, commit, total and pillar scores, sample size, confidence, and report URL. Do not interpret score changes across different sample sizes as a controlled causal experiment. Archive a screenshot of each result. Do not submit personal information to unlock the report without explicit authorization.

Prioritized remediation:

1. Critical: replace example.com canonicals/discovery files with one production origin. Verify HTML, robots, sitemap, and HTTP 200 responses.
2. High: verify original references, add real inference findings with boundaries, exact answer headings, citations, and publisher/editorial accountability. Inspect papers and generated article text.
3. Medium: accessible table scrolling, social metadata, favicon, internal trust pages, consistent Article and FAQPage data. Check mobile/desktop, keyboard focus, and generated metadata.
4. Reproducibility: replace regex-only validation with an HTML5 parser and actionable errors; keep actual audit scores distinct from technical checks.

## Retrieval observations

Use this fixed query set and repeat paraphrases across multiple sessions:

- How much water does training an LLM consume?
- What determines the carbon footprint of AI model training?
- Does AI inference consume water?
- How do data centres reduce water consumption?
- What is the relationship between AI infrastructure and SDG 6 Target 6.6?

For each observation record UTC timestamp, platform/model, exact wording, source appearance, direct citation URL, claim accuracy, conflicting information, and sample size. No successful AI citation observations have been claimed for this release. Track technical pass rate, crawl/index eligibility, Cantilever score, sampled citation rate, citation accuracy, and referral traffic separately.

## Live verification

```sh
curl -I https://genesis-final-prototype.vercel.app/
curl https://genesis-final-prototype.vercel.app/robots.txt
curl https://genesis-final-prototype.vercel.app/sitemap.xml
curl https://genesis-final-prototype.vercel.app/geo-validation.json
```

Check the article, About, Contact, and Privacy routes, favicon, and social image return 200. Inspect canonical and Open Graph hosts; verify all original-source links. Review mobile tables and keyboard focus. Use Search Console's URL Inspection and sitemap submission only with the verified site owner's access; no indexing or citation guarantee follows from eligibility. Google's guidance says there is no special AI schema or required AI text file.

References for implementation: [Astro 4 configuration](https://v4.docs.astro.build/en/reference/configuration-reference/), [Tailwind integration](https://v4.docs.astro.build/en/guides/integrations-guide/tailwind/), [Astro on Vercel](https://vercel.com/docs/frameworks/astro), [parse5](https://parse5.js.org/), [Google AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
