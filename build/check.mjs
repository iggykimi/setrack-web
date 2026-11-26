// Checks the generated site: one shape for every language, correct hreflang,
// canonical and sitemap, no broken local links, and no stray English or JS.
// Run after `node build/build.mjs`: `node build/check.mjs`.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, UPDATED, VERSION } from './config.mjs'
import { FAQ, LANGS } from './texts.mjs'
import { webpSize } from './webp.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CODES = Object.keys(LANGS)
const problems = []
const fail = (message) => problems.push(message)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8')

/** Same keys, same array lengths, same nesting: no language can drift. */
function shape(value) {
  if (Array.isArray(value)) return `[${value.map(shape).join('|')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${k}:${shape(value[k])}`).join('|')}}`
  }
  return typeof value
}

const reference = shape(LANGS.es)
for (const code of CODES.slice(1)) {
  if (shape(LANGS[code]) !== reference) fail(`LANGS.${code}: keys or array lengths differ from es`)
  if (shape(FAQ[code]) !== shape(FAQ.es)) fail(`FAQ.${code}: keys or array lengths differ from es`)
}

const paths = new Set()
const privacyPaths = new Set()
const htmlLangs = new Set()
for (const code of CODES) {
  const t = LANGS[code]
  if (!t.name || !t.title || !t.description || !t.hero?.length) fail(`${code}: empty required copy`)
  if (!t.path.endsWith('/') && t.path !== '') fail(`${code}: paths must end with /`)
  if (!t.privacy.endsWith('/')) fail(`${code}: privacy path must end with /`)
  for (const [what, value, seen] of [['path', t.path, paths], ['privacy', t.privacy, privacyPaths], ['htmlLang', t.htmlLang, htmlLangs]]) {
    if (seen.has(value)) fail(`${code}: duplicate ${what} ${value}`)
    seen.add(value)
  }
  if (!/^[a-z]{2}(-[A-Za-z]+)?$/.test(t.htmlLang)) fail(`${code}: htmlLang ${t.htmlLang} is not a language tag`)
  if (t.title.length > 70) fail(`${code}: title is ${t.title.length} chars`)
  if (t.description.length < 30 || t.description.length > 170) fail(`${code}: description is ${t.description.length} chars`)
  if (t.features.length !== 8) fail(`${code}: expected 8 features, found ${t.features.length}`)
  if (FAQ[code].items.length !== 5) fail(`${code}: expected 5 questions, found ${FAQ[code].items.length}`)
  if (!FAQ[code].items[0][1].includes('17')) fail(`${code}: first answer does not state the 17 app languages`)
  for (const [q, a] of FAQ[code].items) {
    if (!q.trim() || !a.trim()) fail(`${code}: empty question or answer`)
    if (a.length < 20) fail(`${code}: answer too short: ${q}`)
  }
}

function checkLinks(html, pageRel) {
  const dir = dirname(join(ROOT, pageRel))
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1]
    if (/^(https?:|mailto:|#|data:)/.test(raw)) continue
    const clean = raw.split('#')[0].split('?')[0]
    if (!clean) continue
    let file = clean.startsWith('/') ? join(ROOT, clean) : join(dir, clean)
    if (clean.endsWith('/')) file = join(file, 'index.html')
    else if (!extname(file)) file = join(file, 'index.html')
    if (!existsSync(file)) fail(`${pageRel}: broken local link ${raw}`)
  }
}

function checkMarkup(html, pageRel) {
  for (const tag of ['div', 'section', 'article', 'main', 'header', 'footer', 'nav', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'details', 'summary', 'p']) {
    const open = (html.match(new RegExp(`<${tag}(\\s|>)`, 'g')) ?? []).length
    const close = (html.match(new RegExp(`</${tag}>`, 'g')) ?? []).length
    if (open !== close) fail(`${pageRel}: <${tag}> ${open} open, ${close} close`)
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  if (new Set(ids).size !== ids.length) fail(`${pageRel}: duplicate id`)
  const labels = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))
  for (const label of labels) if (!ids.includes(label)) fail(`${pageRel}: aria-labelledby points to missing #${label}`)
  for (const hash of [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1])) {
    if (!ids.includes(hash)) fail(`${pageRel}: link to missing #${hash}`)
  }
  const scripts = (html.match(/<script/g) ?? []).length
  if (scripts > 1) fail(`${pageRel}: ${scripts} scripts, the site is JavaScript-free`)
  if (/[?&](utm_|fbclid)/.test(html)) fail(`${pageRel}: tracking parameter in a link`)
  if (/(undefined|NaN|\[object Object\])/.test(html) || /\b(TODO|FIXME)\b/.test(html)) fail(`${pageRel}: placeholder text in the output`)
  for (const img of html.matchAll(/<img\s[^>]*>/g)) {
    const tag = img[0]
    if (!/\salt="/.test(tag)) fail(`${pageRel}: image without alt: ${tag.slice(0, 80)}`)
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1]
    if (!src || /^https?:/.test(src) || !src.endsWith('.webp')) continue
    const file = join(dirname(join(ROOT, pageRel)), src.split('?')[0])
    if (!existsSync(file)) continue
    const actual = webpSize(file)
    const width = Number(tag.match(/\swidth="(\d+)"/)?.[1])
    const height = Number(tag.match(/\sheight="(\d+)"/)?.[1])
    if (width !== actual.width || height !== actual.height) {
      fail(`${pageRel}: ${src} is ${actual.width}×${actual.height}, markup says ${width}×${height}`)
    }
    if (src.includes('assets/img/') && !/\sloading="lazy"/.test(tag)) fail(`${pageRel}: screenshot ${src} is not lazy`)
  }
}

function verifyPage(code, kind) {
  const t = LANGS[code]
  const rel = kind === 'home' ? `${t.path}index.html` : `${t.privacy}index.html`
  if (!existsSync(join(ROOT, rel))) {
    fail(`${rel}: missing`)
    return
  }
  const html = read(rel)
  const path = kind === 'home' ? t.path : t.privacy
  const title = kind === 'home' ? t.title : `${t.policy.title} · SetRack`
  const description = kind === 'home' ? t.description : t.dataLead

  if (!html.includes(`<html lang="${t.htmlLang}">`)) fail(`${rel}: wrong <html lang>`)
  if (!html.includes(`<title>${esc(title)}</title>`)) fail(`${rel}: wrong title`)
  if (!html.includes(`<meta name="description" content="${esc(description)}">`)) fail(`${rel}: wrong description`)
  if (!html.includes('<meta name="robots" content="index, follow, max-image-preview:large">')) fail(`${rel}: missing robots meta`)
  if (!html.includes(`<meta property="og:image:alt" content="${esc(title)}">`)) fail(`${rel}: missing og:image:alt`)
  if (!html.includes(`<meta name="twitter:title" content="${esc(title)}">`)) fail(`${rel}: missing twitter:title`)
  if (!html.includes(`<link rel="canonical" href="${SITE}${path}">`)) fail(`${rel}: wrong canonical`)

  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
  if (alternates.length !== CODES.length + 1) fail(`${rel}: ${alternates.length} hreflang links, expected ${CODES.length + 1}`)
  for (const c of CODES) {
    const target = SITE + (kind === 'home' ? LANGS[c].path : LANGS[c].privacy)
    if (!alternates.some(([, lang, href]) => lang === LANGS[c].htmlLang && href === target)) {
      fail(`${rel}: missing hreflang ${LANGS[c].htmlLang} -> ${target}`)
    }
  }
  const xDefault = SITE + (kind === 'home' ? LANGS.en.path : LANGS.en.privacy)
  if (!alternates.some(([, lang, href]) => lang === 'x-default' && href === xDefault)) fail(`${rel}: wrong x-default`)
  if (!html.includes(`<meta property="og:locale" content="${t.ogLocale}">`)) fail(`${rel}: wrong og:locale`)
  const ogAlternates = [...html.matchAll(/<meta property="og:locale:alternate" content="([^"]+)">/g)].map((m) => m[1])
  if (ogAlternates.length !== CODES.length - 1) fail(`${rel}: ${ogAlternates.length} og:locale:alternate, expected ${CODES.length - 1}`)
  if (ogAlternates.includes(t.ogLocale)) fail(`${rel}: current og:locale repeated as an alternate`)
  if (!html.includes(`<meta property="og:image" content="${SITE}assets/${code === 'es' ? 'og.jpg' : `og-${code}.jpg`}">`)) fail(`${rel}: wrong og:image`)

  const faqCount = (html.match(/<dt>/g) ?? []).length
  if (kind === 'home') {
    if (faqCount !== 5) fail(`${rel}: ${faqCount} questions, expected 5`)
    if ((html.match(/<nav class="secciones"/g) ?? []).length !== 1) fail(`${rel}: missing section nav`)
    if ((html.match(/\shref="#app"/g) ?? []).length !== 1) fail(`${rel}: section nav does not link to #app`)
    if ((html.match(/\shref="#preguntas"/g) ?? []).length !== 1) fail(`${rel}: section nav does not link to #preguntas`)
    if ((html.match(/\shref="#privacidad"/g) ?? []).length !== 1) fail(`${rel}: section nav does not link to #privacidad`)
    const trust = html.match(/<ul class="confianza">([\s\S]*?)<\/ul>/)?.[1] ?? ''
    if ((trust.match(/<li>/g) ?? []).length !== 4) fail(`${rel}: expected 4 trust chips`)
    const steps = html.match(/<ol class="pasos">([\s\S]*?)<\/ol>/)?.[1] ?? ''
    if ((steps.match(/<li>/g) ?? []).length !== 3) fail(`${rel}: expected 3 how-to steps`)
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    if (!ld) fail(`${rel}: missing JSON-LD`)
    else {
      try {
        const data = JSON.parse(ld[1])
        if (!Array.isArray(data) || data.length !== 3) fail(`${rel}: JSON-LD should hold 3 nodes`)
        if (data[0]?.['@type'] !== 'SoftwareApplication') fail(`${rel}: first JSON-LD node is not SoftwareApplication`)
        if (data[1]?.['@type'] !== 'FAQPage') fail(`${rel}: second JSON-LD node is not FAQPage`)
        if (data[2]?.['@type'] !== 'HowTo') fail(`${rel}: third JSON-LD node is not HowTo`)
        if (data[1]?.mainEntity?.length !== 5) fail(`${rel}: FAQPage does not hold 5 questions`)
        if (data[2]?.step?.length !== 3) fail(`${rel}: HowTo does not hold 3 steps`)
        if (data[0]?.inLanguage !== t.htmlLang || data[2]?.inLanguage !== t.htmlLang) fail(`${rel}: JSON-LD inLanguage mismatch`)
        if (data[0]?.dateModified !== UPDATED) fail(`${rel}: JSON-LD dateModified is not ${UPDATED}`)
        if (data[0]?.softwareVersion !== VERSION) fail(`${rel}: JSON-LD softwareVersion is not ${VERSION}`)
      } catch (error) {
        fail(`${rel}: JSON-LD does not parse: ${error.message}`)
      }
    }
  } else {
    if (faqCount !== 0) fail(`${rel}: privacy page should not carry the FAQ`)
    if ((html.match(/<nav class="secciones"/g) ?? []).length !== 0) fail(`${rel}: privacy page should not carry the section nav`)
    if (!html.includes(esc(t.policy.back))) fail(`${rel}: privacy page lost its back link`)
  }

  checkLinks(html, rel)
  checkMarkup(html, rel)
}

for (const code of CODES) {
  verifyPage(code, 'home')
  verifyPage(code, 'privacy')
  for (const name of ['sesion', 'selector']) {
    const file = `assets/img/${code}-${name}.webp`
    if (!existsSync(join(ROOT, file))) fail(`${file}: missing screenshot`)
  }
  const og = code === 'es' ? 'assets/og.jpg' : `assets/og-${code}.jpg`
  if (!existsSync(join(ROOT, og))) fail(`${og}: missing Open Graph image`)
}

const sitemap = read('sitemap.xml')
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (locs.length !== CODES.length * 2) fail(`sitemap.xml: ${locs.length} URLs, expected ${CODES.length * 2}`)
if (new Set(locs).size !== locs.length) fail('sitemap.xml: duplicate URLs')
for (const code of CODES) {
  for (const path of [LANGS[code].path, LANGS[code].privacy]) {
    if (!locs.includes(SITE + path)) fail(`sitemap.xml: missing ${SITE + path}`)
  }
}
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1])
if (lastmods.length !== locs.length || lastmods.some((d) => d !== UPDATED)) fail(`sitemap.xml: lastmod should be ${UPDATED} on every URL`)
for (const block of sitemap.split('<url>').slice(1)) {
  const links = (block.match(/<xhtml:link /g) ?? []).length
  if (links !== CODES.length + 1) fail('sitemap.xml: a URL does not carry all hreflang alternates')
}

const llms = read('llms.txt')
for (const code of CODES) {
  const home = SITE + LANGS[code].path
  const privacy = SITE + LANGS[code].privacy
  if (!llms.includes(home)) fail(`llms.txt: missing ${home}`)
  if (!llms.includes(privacy)) fail(`llms.txt: missing ${privacy}`)
}
if (!llms.includes('17')) fail('llms.txt: does not state the 17 app languages')
if (!llms.includes(UPDATED)) fail(`llms.txt: not dated ${UPDATED}`)

const css = read('assets/site.css')
if (/@import|url\(\s*["']?https?:/.test(css)) fail('site.css: external request')
if (!/\.respuestas\s*\{[^}]*columns:\s*2/.test(css)) fail('site.css: the FAQ lost its second column')
const apoyoH2 = css.match(/\.apoyo h2\s*\{([^}]*)\}/)?.[1] ?? ''
const apoyoLineHeight = Number(apoyoH2.match(/line-height:\s*([\d.]+)/)?.[1])
if (!(apoyoLineHeight >= 1.02)) {
  fail('site.css: .apoyo h2 needs line-height >= 1.02, or background-clip: text cuts the ink')
}
for (const file of ['assets/icon.svg', 'assets/favicon.svg', 'fonts/archivo-latin.woff2', 'robots.txt']) {
  if (!existsSync(join(ROOT, file))) fail(`${file}: missing`)
}

if (problems.length) {
  console.error(`${problems.length} problem(s):`)
  for (const problem of problems) console.error(`  · ${problem}`)
  process.exit(1)
}
console.log(`checked ${CODES.length * 2} pages, ${CODES.length} languages, ${CODES.length * 2} sitemap URLs, 0 problems`)
