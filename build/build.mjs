// Writes the 12 pages (home + privacy, 6 languages) and the sitemap from build/texts.mjs.
// No dependencies: `node build/build.mjs` from the repo root, then commit the output.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LANGS, LINKS } from './texts.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://iggykimi.github.io/setrack-web/'
const UPDATED = '2026-10-05'
const CODES = Object.keys(LANGS)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Relative prefix back to the site root from a page path ('' → '', 'en/privacy/' → '../../'). */
const up = (path) => '../'.repeat(path.split('/').filter(Boolean).length)

/* The app's barbell (src/components/Barbell.tsx): same geometry, heaviest plates inside. */
const HEIGHTS = [60, 54, 48, 42, 36]
const PLATES = ['push', 'pull', 'legs', 'core', 'push']
function barbell(label) {
  const W = 320, MID = 32, PW = 10, GAP = 3, SLEEVE = 96
  const pairs = PLATES.map((region, i) => {
    const h = HEIGHTS[i], off = i * (PW + GAP), y = MID - h / 2
    return `<g class="par" style="--i:${i}" data-region="${region}">` +
      `<rect class="izq" x="${SLEEVE - off - PW - 10}" y="${y}" width="${PW}" height="${h}" rx="3"/>` +
      `<rect class="der" x="${W - SLEEVE + off + 10}" y="${y}" width="${PW}" height="${h}" rx="3"/></g>`
  }).join('')
  return `<svg class="barra" viewBox="0 0 ${W} 64" role="img" aria-label="${esc(label)}">` +
    `<rect x="4" y="29.5" width="312" height="5" rx="2.5" fill="var(--line)"/>` +
    `<rect x="${SLEEVE - 8}" y="25" width="6" height="14" rx="2" fill="var(--dust)"/>` +
    `<rect x="${W - SLEEVE + 2}" y="25" width="6" height="14" rx="2" fill="var(--dust)"/>${pairs}</svg>`
}

function alternates(kind) {
  const href = (c) => SITE + (kind === 'home' ? LANGS[c].path : LANGS[c].privacy)
  return CODES.map((c) => `<link rel="alternate" hreflang="${LANGS[c].htmlLang}" href="${href(c)}">`).join('\n') +
    `\n<link rel="alternate" hreflang="x-default" href="${href('en')}">`
}

function head({ t, code, path, kind, title, description }) {
  const base = up(path)
  const og = code === 'es' ? 'og.jpg' : `og-${code}.jpg`
  const ld = kind === 'home' ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'SetRack', operatingSystem: 'Android',
    applicationCategory: 'HealthApplication', description, inLanguage: t.htmlLang, isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    featureList: t.features.map(([f]) => f),
    author: { '@type': 'Person', name: 'iggykimi', url: 'https://github.com/iggykimi' },
  })}</script>` : ''
  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#000000">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
${alternates(kind)}
<link rel="icon" href="${base}assets/icon.svg" type="image/svg+xml">
<link rel="preload" href="${base}fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}assets/site.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SetRack">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}assets/${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${t.ogLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}assets/${og}">
${ld}
</head>`
}

function header({ t, code, path, kind }) {
  const base = up(path)
  const langs = CODES.map((c) => {
    const target = base + (kind === 'home' ? LANGS[c].path : LANGS[c].privacy)
    const current = c === code ? ' aria-current="page"' : ''
    return `<a href="${target || './'}" hreflang="${LANGS[c].htmlLang}" lang="${LANGS[c].htmlLang}" title="${LANGS[c].name}"${current}>${c}</a>`
  }).join('')
  return `<a class="saltar" href="#contenido">${esc(t.skip)}</a>
<header class="cabecera envoltura">
  <a class="marca" href="${base + t.path || './'}"><img src="${base}assets/icon.svg" alt="" width="28" height="28"><span>SetRack</span></a>
  <nav class="idiomas" aria-label="${esc(t.langNav)}">${langs}</nav>
</header>`
}

function policyBlock(t, { standalone, base }) {
  const p = t.policy
  const tag = standalone ? 'h1' : 'h3'
  const own = standalone ? '' : `<p class="aparte"><a href="${base}${t.privacy}">${esc(p.own)} →</a></p>`
  return `<article class="politica" id="politica">
  <${tag}>${esc(p.title)}</${tag}>
  <p class="fecha">${esc(p.updated)}</p>
  ${p.body.map((b) => `<p>${esc(b)}</p>`).join('\n  ')}
  <ul>${p.list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  <p>${esc(p.after)}</p>
  <p>${esc(p.contact[0])}<a href="${LINKS.issues}">${esc(p.contact[1])}</a>${esc(p.contact[2])}</p>
  ${own}
</article>`
}

function footer(t, base) {
  return `<footer class="pie envoltura">
  <p class="pie-marca"><img src="${base}assets/icon.svg" alt="" width="22" height="22">SetRack · 2026</p>
  <nav aria-label="SetRack">
    <a href="${LINKS.kofi}">Ko-fi</a>
    <a href="${LINKS.issues}">${esc(t.footer.issues)}</a>
    <a href="${base}${t.privacy}">${esc(t.footer.privacy)}</a>
  </nav>
</footer>`
}

const twoLines = ([a, b]) => `${esc(a)}<span class="tenue">${esc(b)}</span>`

function home(code) {
  const t = LANGS[code]
  const base = up(t.path)
  const img = (name, alt, h) => `<img src="${base}assets/img/${code}-${name}.webp" alt="${esc(alt)}" width="640" height="${h}" decoding="async">`
  const features = t.features.map(([f, d], i) => `<li data-region="${PLATES[i % PLATES.length]}"><span class="n" aria-hidden="true">${i + 1}</span><span><strong>${esc(f)}</strong> ${esc(d)}</span></li>`).join('\n      ')
  return `${head({ t, code, path: t.path, kind: 'home', title: t.title, description: t.description })}
<body>
${header({ t, code, path: t.path, kind: 'home' })}
<main id="contenido" tabindex="-1">
  <section class="portada envoltura" aria-labelledby="t-portada">
    <h1 id="t-portada">${twoLines(t.hero)}</h1>
    ${barbell(t.barLabel)}
    <div class="portada-pie">
      <p class="entrada">${esc(t.lead)}</p>
      <div class="acciones">
        <span class="play" aria-disabled="true">${esc(t.play)}</span>
        <a class="cafe" href="${LINKS.kofi}">${esc(t.kofi)}</a>
      </div>
    </div>
  </section>

  <section class="app envoltura" id="app" aria-labelledby="t-app">
    <div class="app-texto">
      <h2 id="t-app">${twoLines(t.appTitle)}</h2>
      <ol class="series">
      ${features}
      </ol>
    </div>
    <div class="pantallas">
      <figure class="pantalla principal">${img('sesion', t.altSession, 871)}</figure>
      <figure class="pantalla segunda">${img('selector', t.altPicker, 859)}</figure>
    </div>
  </section>

  <section class="datos envoltura" id="privacidad" aria-labelledby="t-datos">
    <h2 id="t-datos">${twoLines(t.dataTitle)}</h2>
    <p class="entrada">${esc(t.dataLead)}</p>
    ${policyBlock(t, { standalone: false, base })}
  </section>

  <section class="apoyo envoltura" aria-labelledby="t-apoyo">
    <h2 id="t-apoyo">${esc(t.supportTitle)}</h2>
    <p>${esc(t.supportLead)}</p>
    <a class="cafe" href="${LINKS.kofi}">${esc(t.kofi)}</a>
  </section>
</main>
${footer(t, base)}
</body>
</html>
`
}

function privacy(code) {
  const t = LANGS[code]
  const base = up(t.privacy)
  return `${head({ t, code, path: t.privacy, kind: 'privacy', title: `${t.policy.title} · SetRack`, description: t.dataLead })}
<body>
${header({ t, code, path: t.privacy, kind: 'privacy' })}
<main id="contenido" tabindex="-1" class="envoltura legal">
  <p class="volver"><a href="${base + t.path || './'}">← ${esc(t.policy.back)}</a></p>
  ${policyBlock(t, { standalone: true, base })}
</main>
${footer(t, base)}
</body>
</html>
`
}

function sitemap() {
  const block = (kind) => CODES.map((c) => {
    const loc = SITE + (kind === 'home' ? LANGS[c].path : LANGS[c].privacy)
    const alts = CODES.map((a) => `    <xhtml:link rel="alternate" hreflang="${LANGS[a].htmlLang}" href="${SITE + (kind === 'home' ? LANGS[a].path : LANGS[a].privacy)}"/>`).join('\n')
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${UPDATED}</lastmod>\n${alts}\n  </url>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${block('home')}
${block('privacy')}
</urlset>
`
}

function write(rel, text) {
  const file = join(ROOT, rel, rel.endsWith('.xml') ? '' : 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}

for (const code of CODES) {
  write(LANGS[code].path, home(code))
  write(LANGS[code].privacy, privacy(code))
}
write('sitemap.xml', sitemap())
console.log(`built ${CODES.length * 2} pages`)
