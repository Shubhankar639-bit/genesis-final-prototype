#!/usr/bin/env node
// HTML5 parser checks against the generated build. This is not an indexing or citation score.
import { parse } from 'parse5';
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';

const dist = resolve(process.env.GEO_DIST || 'dist');
const errors = [];
let passed = 0;
const check = (ok, where, expected, fix) => {
  if (ok) passed++;
  else errors.push({ where, expected, fix });
};
const attr = (n, name) => n?.attrs?.find(a => a.name === name)?.value;
const children = n => n?.childNodes || [];
const all = (n, test) => [...(test(n) ? [n] : []), ...children(n).flatMap(c => all(c, test))];
const tags = (n, tag) => all(n, c => c.tagName === tag);
const txt = n => n?.nodeName === '#text' ? n.value : children(n).map(txt).join('');
const norm = s => s.replace(/\s+/gu, ' ').trim();
const text = n => norm(txt(n));
const words = s => norm(s).split(/\s+/u).filter(Boolean).length;
const next = n => { const siblings = children(n.parentNode); return siblings.slice(siblings.indexOf(n)+1).find(c => c.tagName); };
const read = path => readFileSync(path, 'utf8');
const htmlFiles = dir => readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? htmlFiles(join(dir,e.name)) : extname(e.name) === '.html' ? [join(dir,e.name)] : []);
if (!existsSync(join(dist,'index.html'))) { console.error('Build missing. Run npm run build first.'); process.exit(1); }
const docs = new Map(htmlFiles(dist).map(f => [f, parse(read(f))]));
const home = docs.get(join(dist,'index.html'));
const canonicalOf = d => attr(tags(d,'link').find(n => attr(n,'rel') === 'canonical'), 'href');
let canonical;
try { canonical = new URL(canonicalOf(home)); } catch { errors.push({where:'/',expected:'Absolute HTTPS canonical',fix:'Set SITE_URL to the real production origin.'}); }
const required = [
 [2,'How much water does training an LLM consume?'],
 [2,'What is the carbon footprint of AI model training?'],
 [2,'Cooling Methods and Ecosystem Impacts'],
 [3,'Evaporative Cooling and Greywater Recycling Methods'],
 [3,'AI Hardware Demands and Sustainable Development Goal 6 Target 6.6'],
 [2,'Section E: Resource consumption comparison'],
 [2,'Section F: Frequently asked questions'],
 [2,'Section G: Sources and methodology'],
];
const requiredFaq = ['How much water does training an LLM consume?', 'What is the carbon footprint of AI model training?', 'Does AI inference consume water?', 'How can data centres reduce their environmental impact?'];
const answerCounts = [];

for (const [file,doc] of docs) {
 const path = file.slice(dist.length).split(sep).join('/');
 const c = canonicalOf(doc);
 check(attr(tags(doc,'html')[0],'lang') === 'en',path,'English language declared','Add lang="en" to html.');
 check(tags(doc,'h1').length === 1,path,'Exactly one H1','Use one page title.');
 check(tags(doc,'main').length === 1,path,'One main landmark','Wrap principal content in main.');
 for (const name of ['header','nav','footer']) check(tags(doc,name).length > 0,path,`${name} landmark`,'Add semantic page navigation and landmarks.');
 check(tags(doc,'title').length === 1 && text(tags(doc,'title')[0]).length > 10,path,'One descriptive title','Add a specific HTML title.');
 const meta = key => tags(doc,'meta').find(n => attr(n,'name') === key || attr(n,'property') === key);
 check(!!attr(meta('description'),'content'),path,'Meta description','Describe the page.');
 check(!/noindex|nosnippet/i.test(attr(meta('robots'),'content') || ''),path,'Index and snippet eligibility','Remove unintended robots restrictions.');
 check(c?.startsWith('https://') && !/example\.(com|org|net)/.test(c),path,'Production HTTPS canonical','Configure the real SITE_URL.');
 check(attr(meta('og:url'),'content') === c,path,'Open Graph URL matches canonical','Use the canonical URL in og:url.');
 for (const key of ['og:title','og:description','og:image','twitter:card','twitter:image']) check(!!attr(meta(key),'content'),path,`${key} metadata`,'Add accurate social metadata.');
 const ids = all(doc,n => !!attr(n,'id')).map(n => attr(n,'id'));
 check(new Set(ids).size === ids.length,path,'Unique IDs','Rename duplicated IDs and update anchors.');
 let previous = 0;
 for (const h of all(doc,n => /^h[1-6]$/.test(n.tagName || ''))) {
   const level = Number(h.tagName[1]);
   check(level <= previous+1 || level === 1,`${path} ${text(h)}`,'No skipped heading levels','Choose the next logical heading level.');
   previous = level;
 }
 for (const script of tags(doc,'script')) check(attr(script,'type') === 'application/ld+json',path,'No executable client JavaScript','Render substantive content at build time.');
 check(!all(doc,n => n.attrs?.some(a => /^on[a-z]+$/.test(a.name))).length,path,'No inline event handlers','Use native HTML interactions.');
 for (const a of tags(doc,'a')) check(!!text(a) || !!attr(a,'aria-label'),path,'Descriptive link text','Label every link.');
 const resourceNodes = [...tags(doc,'a').map(n => [n,'href']),...tags(doc,'link').map(n => [n,'href']),...tags(doc,'img').map(n => [n,'src'])];
 for (const [node,field] of resourceNodes) {
   const raw = attr(node,field);
   if (!raw) continue;
   let u;
   try { u = new URL(raw,c); } catch { check(false,`${path}: ${raw}`,'Valid URL','Fix malformed link.'); continue; }
   if (!['http:','https:'].includes(u.protocol)) continue;
   if (u.origin !== canonical?.origin) continue;
   const relative = decodeURIComponent(u.pathname).replace(/^\//,'');
   const target = resolve(dist,relative || 'index.html');
   const targetFile = extname(target) ? target : join(target,'index.html');
   check(targetFile.startsWith(dist+sep) && existsSync(targetFile),`${path}: ${raw}`,'Existing internal link or asset','Correct its path or generate the resource.');
   if (u.hash && docs.has(targetFile)) check(all(docs.get(targetFile),n => attr(n,'id') === decodeURIComponent(u.hash.slice(1))).length > 0,`${path}: ${raw}`,'Existing anchor target','Add or correct the target ID.');
 }
 for (const m of ['og:image','twitter:image']) {
   const url = new URL(attr(meta(m),'content') || '/',c);
   check(url.origin === canonical?.origin && existsSync(resolve(dist,url.pathname.slice(1))),path,`${m} points to a generated local asset`,'Generate the social preview image.');
 }
}

check(text(tags(home,'h1')[0]) === 'The Environmental Architecture of Generative AI: Carbon and Water Resource Management.','/ H1','Exact article heading','Restore the specified title.');
const headings = all(home,n => /^h[23]$/.test(n.tagName || ''));
let cursor = -1;
for (const [level,title] of required) {
 const i = headings.findIndex((n,index) => index > cursor && n.tagName === `h${level}` && text(n) === title);
 check(i !== -1,title,`Exact H${level} in specified order`,'Restore the heading text and order.');
 if (i !== -1) cursor=i;
}
for (const h of headings) {
 const p = next(h);
 check(p?.tagName === 'p',text(h),'Immediate paragraph sibling','Place a direct answer paragraph immediately after the heading.');
 const count = words(text(p)); answerCounts.push({heading:text(h),words:count,text:text(p)});
 check(count>=40 && count<=60,`${text(h)} (${count} words): ${text(p)}`,'40–60 whitespace-delimited words','Rewrite the direct answer; citations count as visible words.');
}

for (const [id,columns] of [
 ['resource-comparison-table',['Task and assumptions','Energy consumption (kWh)','Water consumption (millilitres)','System boundary','Source']],
 ['cooling-comparison-table',['Method','Water use','Energy requirement','Water availability needed','Operational constraints']],
]) {
 const table=tags(home,'table').find(n => attr(n,'id')===id);
 check(!!table,id,'Required semantic table','Restore the comparison table.');
 if(!table)continue;
 check(tags(table,'caption').length===1,id,'Descriptive caption','Add one caption.');
 const head=tags(table,'thead')[0];
 check(JSON.stringify(tags(head,'th').map(text))===JSON.stringify(columns),id,'Five specified table columns','Use the required column labels.');
 for(const th of tags(head,'th'))check(attr(th,'scope')==='col',id,'Column scope','Set scope="col".');
 for(const tr of tags(tags(table,'tbody')[0],'tr')) {
   check(children(tr).filter(n=>['th','td'].includes(n.tagName)).length===5,id,'Five cells per row','Repair the table row.');
   check(attr(tags(tr,'th')[0],'scope')==='row',id,'Row scope','Set scope="row" on the task or method.');
 }
}
// Each quantitative result must cite evidence in its own block or its evidence card.
for(const n of all(home,n=>['p','li','td','dd'].includes(n.tagName))) {
 if(!/\d[\d,.]*\s*(?:kWh|MWh|litres|liters|mL|tonnes|tCO2e)/i.test(text(n)))continue;
 let block=n;
 while(block.parentNode && block.tagName!=='article' && block.parentNode.tagName!=='main' && !tags(block,'a').length && block.parentNode.tagName!=='section')block=block.parentNode;
 check(tags(block,'a').some(a => /^https:\/\//.test(attr(a,'href')||'')),text(n),'Nearby original-source link','Add a citation beside the quantitative finding.');
}
const schema=[];
for(const s of tags(home,'script'))try{schema.push(JSON.parse(txt(s)));}catch{check(false,'JSON-LD','Valid JSON','Repair structured data serialization.');}
const article=schema.find(s=>s['@type']==='Article');
const faq=schema.find(s=>s['@type']==='FAQPage');
check(!!article,'Article','Article structured data','Add Article JSON-LD.');
if(article){
 check(article.headline===text(tags(home,'h1')[0]).replace(/\.$/,''),'Article headline','Matches H1','Use the shared article title.');
 check(article.url===canonical?.href && article.mainEntityOfPage===canonical?.href,'Article URL','Matches canonical','Use the production canonical.');
 check(article.description===attr(tags(home,'meta').find(n=>attr(n,'name')==='description'),'content'),'Article description','Matches meta description','Use shared metadata.');
 check(tags(home,'time').some(n=>attr(n,'datetime')===article.datePublished) && tags(home,'time').some(n=>attr(n,'datetime')===article.dateModified),'Article dates','Visible dates agree','Synchronize actual publication/review dates.');
 check(article.citation?.length>=6,'Article evidence','Primary references listed','Use the shared source list.');
}
check(!!faq,'FAQPage','FAQ structured data','Generate schema from the visible FAQ data.');
const faqSection=tags(home,'section').find(n=>attr(n,'id')==='section-f-faq');
const visibleFaq=tags(faqSection,'h3');
check(faq?.mainEntity?.length===visibleFaq.length && visibleFaq.length>=4,'FAQ','At least four visible and schema answers','Synchronize the shared FAQ data.');
for(const q of requiredFaq) check(visibleFaq.some(h=>text(h)===q),'FAQ: '+q,'Required question present','Restore the specified question.');
for(const [i,h] of visibleFaq.entries()){
 check(faq?.mainEntity?.[i]?.name===text(h),'FAQ question '+i,'Schema matches visible question','Use one data source.');
 check(norm(faq?.mainEntity?.[i]?.acceptedAnswer?.text||'')===text(next(h)),text(h),'Schema answer matches visible text','Generate both answers from shared data.');
}
const refs=tags(home,'li').filter(n=>(attr(n,'id')||'').startsWith('src-'));
for(const ref of refs)check(tags(ref,'a').some(a=>{try{return new URL(attr(a,'href')).protocol==='https:';}catch{return false;}}),attr(ref,'id'),'HTTPS primary reference','Use an original publication URL.');
check(!/example\.com|verify figures before use|written without re-checking|TODO|Lorem ipsum/i.test(text(home)),'Article copy','No placeholder claims','Resolve placeholder content or describe the actual limitation.');
const robots=existsSync(join(dist,'robots.txt'))?read(join(dist,'robots.txt')):'';
const sitemap=existsSync(join(dist,'sitemap.xml'))?read(join(dist,'sitemap.xml')):'';
check(/^User-agent:\s*\*/im.test(robots) && /^Allow:\s*\/$/im.test(robots) && !/^Disallow:\s*\S+/im.test(robots),'robots.txt','Public crawling allowed','Remove accidental blocks while retaining owner policy.');
check(robots.includes(`Sitemap: ${canonical?.origin}/sitemap.xml`),'robots.txt','Production sitemap reference','Generate from SITE_URL.');
check(sitemap.includes('http://www.sitemaps.org/schemas/sitemap/0.9') && !sitemap.includes('example.com'),'sitemap.xml','Valid namespace and real host','Generate a production sitemap.');
for(const doc of docs.values())check(sitemap.includes(`<loc>${canonicalOf(doc)}</loc>`),canonicalOf(doc),'Page listed in sitemap','Generate sitemap from the published routes.');
const report={passed,failed:errors.length,errors,answerCounts,note:'Technical validation only; not evidence of scientific truth, indexing, or AI citations.'};
writeFileSync(join(dist,'geo-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(`GEO structural validation: ${errors.length?'FAILED':'PASSED'} — ${passed} passed, ${errors.length} failed`);
for(const e of errors)console.error(`FAIL ${e.where}\n  Expected: ${e.expected}\n  Fix: ${e.fix}`);
console.log(report.note);
process.exitCode=errors.length?1:0;
