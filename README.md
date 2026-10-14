# Get Cited: The Environmental Architecture of Generative AI

A static Astro 4 prototype for the "Get Cited — Build the Most AI-Visible Page" hackathon. It presents published estimates of the water and carbon footprint of generative AI, with explicit evidence standards, system boundaries, and a repeatable structural validator.

This project does not claim that any structure guarantees AI citations, search rankings, or rich results.

## Important: verify the figures before publishing

The numerical claims (700,000 L of water for GPT-3 training from Li et al., 2023; 1,287 MWh and 552 tCO2e from Patterson et al., 2021) and all URLs were written from memory and were not re-checked against the live originals. Confirm each one before publication. The validator checks structure only; it cannot confirm that a figure or URL is correct.

## Requirements

- Node.js 18.14.1 or later (Node 20 LTS recommended)
- npm

## 1. Installation

Unzip the download, then install:

```bash
unzip get-cited-ai-environment.zip
cd get-cited-ai-environment
npm install
```

Before deploying, set your production origin. This drives the canonical URL, Open Graph URL, and JSON-LD:

```bash
SITE_URL=https://your-domain.example npm run build
```

Also replace `example.com` in `public/robots.txt` and `public/sitemap.xml` with the same domain.

## 2. Development

```bash
npm run dev       # http://localhost:4321
```

## 3. Build (static output)

```bash
npm run build     # writes dist/
npm run preview   # serves dist/ locally
```

## 4. Validate the GEO structure

Run after a build:

```bash
npm run validate
```

Or build and validate in one step:

```bash
npm run check
```

The validator checks:

- Exactly one H1, with the exact required text.
- Required H2 and H3 headings, in order, each immediately followed by a 40–60-word paragraph.
- Required landmarks (`header`, `nav`, `main`, `section`, `article`, `table`, `time`, `footer`).
- Comparison tables with the required columns and consistent row lengths.
- Numeric statistics with a source link, or marked "Not established".
- FAQPage JSON-LD that matches the visible FAQ questions and answers.
- Article JSON-LD headline and dates.
- No client-side JavaScript (JSON-LD only).
- `robots.txt` contains no Disallow paths and has a Sitemap entry; the sitemap is valid.

The exit code is 0 on pass and 1 on failure, so it can be used in CI.

## 5. Manual testing checklist

Automated checks cannot establish what external systems do. Run these by hand.

**Public accessibility**
- [ ] The deployed URL loads over HTTPS without authentication.
- [ ] `/robots.txt` and `/sitemap.xml` return HTTP 200.
- [ ] The page is readable with CSS disabled, in logical order.
- [ ] Keyboard-only navigation reaches the skip link, nav, links, and tables.
- [ ] Text contrast and focus outlines are visible at mobile and desktop widths.

**Crawler permissions**
- [ ] `robots.txt` does not disallow the crawlers you intend to permit.
- [ ] Check each crawler's documentation for its user-agent token and robots.txt behaviour before relying on it.
- [ ] Server logs show requests from the crawlers you expect, if any.

**HTML extraction**
- [ ] View the page source. The H1, H2s, and H3s appear in the HTML (there is no client-side JavaScript).
- [ ] Paste the FAQ JSON-LD into a schema validator and confirm it parses without errors.
- [ ] Confirm the visible FAQ text matches the JSON-LD text.

**Citation testing (observational, not proof)**
- [ ] Record the date and exact query for each test.
- [ ] Ask the AI systems you are evaluating questions the page answers, and note whether they cite the page, paraphrase it, or cite other sources.
- [ ] Repeat across several sessions, since answers vary.
- [ ] Treat results as anecdotal. One positive or negative result is not evidence of a structural effect.

**Source verification (required before publication)**
- [ ] Open every URL in Section G and confirm it resolves to the stated document.
- [ ] Confirm each figure against the original paper, including the stated boundary.
- [ ] Confirm the Elsworth et al. (2025) and Luccioni et al. (2024) identifiers and any values before adding them to Section E.
- [ ] Confirm the UN text paraphrased in Section D against the official target and indicator pages.

## 6. Deployment to Vercel

Vercel detects Astro automatically. No `vercel.json` is needed.

**Option A: dashboard**
1. Push the project to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Use these settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `SITE_URL=https://your-domain`
4. Deploy.

**Option B: CLI**

```bash
npm i -g vercel
vercel login
vercel link
vercel env add SITE_URL production    # enter https://your-domain
vercel --prod
```

After deployment, run the validator locally against the same build, then repeat the manual checklist on the live URL.

## Content structure notes

- Visible page layout and answers: `src/pages/index.astro`.
- FAQ questions, answers, and the `SOURCES` table: `src/data/content.ts`. The FAQPage JSON-LD is generated from the same data as the visible FAQ.
- Citations are written as markers such as `{{li2023}}`, so each link and its label stay consistent.
- Publication and review dates: `src/data/site.ts`. Update `reviewed` whenever content changes.
- The H2 "Cooling Methods and Ecosystem Impacts" is a structural addition that gives Sections C and D a valid parent heading.
- No author credentials, ratings, or review claims are included. Article `author` and `publisher` are the project name.
