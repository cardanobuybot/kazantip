#!/usr/bin/env node
/**
 * Генератор SEO-страниц для kazantip.org.
 *
 * Входы: data/djs.json, data/genres.json.
 * Выход:
 *   /djs/<slug>/index.html    — страница диджея (30 шт)
 *   /genres/<slug>/index.html — страница жанра (10 шт)
 *   /djs/index.html           — hub всех диджеев
 *   /genres/index.html        — hub всех жанров
 *   /seo-map/index.html       — карта всех seo-страниц (hub-hub)
 *   /djs/by-country/index.html — hub по странам
 *   /djs/by-era/index.html     — hub по эпохам
 *
 * Также обновляет sitemap.xml, вставляя /djs/* и /genres/*.
 *
 * Запуск: `node scripts/gen-seo.mjs`
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const SITE = "https://kazantip.org";
const TODAY = new Date().toISOString().slice(0, 10);

const djs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "djs.json"), "utf8"));
const genres = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "genres.json"), "utf8"));

const djBySlug = Object.fromEntries(djs.map((d) => [d.slug, d]));

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const COMMON_HEAD = (title, desc, canonical) => `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="kaZantip.org">
<meta name="twitter:card" content="summary_large_image">`;

const COMMON_STYLE = `<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--yellow:#FFD400;--orange:#FF7A00;--black:#0d0d0d;--dark:#1a1a1a;--cream:#F5F0E8}
  html{scroll-behavior:smooth}
  body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;background:var(--black);color:var(--cream);line-height:1.7}
  nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(13,13,13,.92);backdrop-filter:blur(10px);padding:14px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--yellow)}
  nav .logo{font-size:1.2rem;font-weight:800;color:var(--yellow);text-decoration:none}
  nav .logo span{color:var(--orange);font-size:1.5rem}
  nav a.back{color:var(--cream);text-decoration:none;font-size:.85rem;opacity:.8}
  nav a.back:hover{color:var(--yellow);opacity:1}
  article,main{max-width:760px;margin:0 auto;padding:100px 22px 60px}
  h1{font-size:clamp(1.8rem,5.5vw,2.6rem);color:var(--yellow);font-weight:900;line-height:1.15;margin-bottom:10px}
  .lede{font-size:1.1rem;color:var(--cream);opacity:.9;margin-bottom:30px}
  h2{font-size:clamp(1.3rem,3.5vw,1.8rem);color:var(--yellow);margin-top:40px;margin-bottom:14px;font-weight:800}
  h2::after{content:'';display:block;width:50px;height:4px;background:var(--orange);margin-top:6px;border-radius:3px}
  h3{color:var(--orange);margin-top:24px;margin-bottom:8px;font-size:1.1rem}
  p{margin-bottom:14px}
  .accent{color:var(--yellow);font-weight:600}
  ul,ol{margin:10px 0 16px 22px}
  li{margin-bottom:6px}
  .quote{border-left:4px solid var(--orange);padding:12px 16px;background:rgba(255,122,0,.08);margin:20px 0;font-style:italic;color:var(--yellow)}
  .meta{display:flex;gap:10px;flex-wrap:wrap;font-size:.82rem;opacity:.75;margin-bottom:26px}
  .meta span{padding:4px 11px;border:1px solid rgba(255,212,0,.25);border-radius:999px}
  .pill-row{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 30px}
  .pill{padding:10px 18px;border-radius:999px;background:linear-gradient(135deg,rgba(255,212,0,.12),rgba(255,122,0,.12));border:1px solid rgba(255,212,0,.35);color:var(--cream);text-decoration:none;font-size:.9rem;transition:transform .2s,background .2s}
  .pill:hover{transform:scale(1.05);background:var(--yellow);color:var(--black)}
  .pill small{display:block;opacity:.6;font-size:.75rem;margin-top:2px}
  .back-home{display:inline-block;margin-top:30px;padding:12px 24px;background:var(--yellow);color:var(--black);font-weight:700;border-radius:999px;text-decoration:none;transition:transform .2s}
  .back-home:hover{transform:scale(1.05)}
  .track-list{background:rgba(255,122,0,.06);padding:16px 20px;border-radius:12px;border:1px solid rgba(255,122,0,.2)}
  footer{text-align:center;padding:30px 20px 50px;font-size:.82rem;opacity:.6;border-top:1px solid rgba(255,212,0,.1);margin-top:50px}
  footer .z{color:var(--orange);font-weight:800}
  footer a{color:var(--yellow);text-decoration:none}
  footer a:hover{text-decoration:underline}
</style>`;

const COMMON_NAV = `<nav>
  <a class="logo" href="/">ka<span>Z</span>antip</a>
  <a class="back" href="/">← На главную</a>
</nav>`;

const COMMON_FOOTER = `<footer>
  <p><a href="/djs/">Все диджеи</a> · <a href="/genres/">Все жанры</a> · <a href="/zrp/">История Казантипа</a> · <a href="/">Главная</a></p>
  <p style="margin-top:10px">kaZantip.org — фанатский сайт-посвящение Республике <span class="z">Z</span>. Сделано с 💛 параdiZером.</p>
  <p style="margin-top:6px">Не является официальным сайтом фестиваля.</p>
</footer>`;

function articleJsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
}

// ─────────────── DJ page ───────────────

function djPage(d) {
  const url = `${SITE}/djs/${d.slug}/`;
  const title = `${d.name_ru} (${d.name}) на Казантипе — ${d.style_ru}, ${d.years_on_z}`;
  const desc = `${d.name_ru} (${d.name}) ${d.flag} — ${d.style_ru}. Что ${d.name_ru} играл на фестивале Казантип в ${d.years_on_z}, его биография, ключевые треки и наследие в Республике Z.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: desc,
    author: { "@type": "Organization", name: "kaZantip.org" },
    publisher: {
      "@type": "Organization",
      name: "kaZantip.org",
      logo: { "@type": "ImageObject", url: `${SITE}/og.png` },
    },
    datePublished: TODAY,
    dateModified: TODAY,
    image: `${SITE}/og.png`,
    mainEntityOfPage: url,
    about: {
      "@type": "Person",
      name: d.name,
      nationality: d.country,
    },
  };
  // Жанры, где участвует этот DJ.
  const relatedGenres = genres.filter((g) => g.dj_slugs.includes(d.slug));
  return `${COMMON_HEAD(title, desc, url)}
${articleJsonLd(jsonLd)}
${COMMON_STYLE}
</head>
<body>
${COMMON_NAV}
<article>
  <h1>${esc(d.name_ru)} <span style="opacity:.6;font-size:.6em;font-weight:400">(${esc(d.name)})</span></h1>
  <div class="meta">
    <span>${esc(d.flag)} ${esc(d.country)}</span>
    <span>🎧 ${esc(d.style_ru)}</span>
    <span>📅 на Z: ${esc(d.years_on_z)}</span>
  </div>
  <p class="lede">${esc(d.intro)}</p>

  <h2>Биография</h2>
  <p>${esc(d.bio)}</p>

  <h2>Что ${esc(d.name_ru)} играл на Казантипе</h2>
  <p>${esc(d.on_z)}</p>

  <h2>Ключевые треки</h2>
  <div class="track-list">${esc(d.track_quote)}</div>

  <h2>Наследие в Республике Z</h2>
  <p>${esc(d.legacy)}</p>

  ${
    relatedGenres.length > 0
      ? `<h2>Жанры ${esc(d.name_ru)} на Z</h2>
  <div class="pill-row">
    ${relatedGenres.map((g) => `<a class="pill" href="/genres/${g.slug}/">${esc(g.name)}<small>${esc(g.bpm)} BPM</small></a>`).join("\n    ")}
  </div>`
      : ""
  }

  <h2>Другие диджеи на Казантипе</h2>
  <div class="pill-row">
    ${djs
      .filter((o) => o.slug !== d.slug)
      .slice(0, 6)
      .map(
        (o) =>
          `<a class="pill" href="/djs/${o.slug}/">${esc(o.flag)} ${esc(o.name_ru)}<small>${esc(o.style_ru)}</small></a>`,
      )
      .join("\n    ")}
  </div>

  <a class="back-home" href="/djs/">← Все диджеи</a>
</article>
${COMMON_FOOTER}
</body>
</html>
`;
}

// ─────────────── Genre page ───────────────

function genrePage(g) {
  const url = `${SITE}/genres/${g.slug}/`;
  const title = `${g.name} на Казантипе — ${g.name_en}, ${g.bpm} BPM`;
  const desc = `${g.name} (${g.name_en}) на фестивале Казантип: что это за жанр, как звучал в Поповке, какие диджеи играли ${g.name.toLowerCase()} на Z — ${g.dj_slugs.length} имён.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: desc,
    author: { "@type": "Organization", name: "kaZantip.org" },
    publisher: {
      "@type": "Organization",
      name: "kaZantip.org",
      logo: { "@type": "ImageObject", url: `${SITE}/og.png` },
    },
    datePublished: TODAY,
    dateModified: TODAY,
    image: `${SITE}/og.png`,
    mainEntityOfPage: url,
  };
  const relatedDjs = g.dj_slugs.map((s) => djBySlug[s]).filter(Boolean);
  return `${COMMON_HEAD(title, desc, url)}
${articleJsonLd(jsonLd)}
${COMMON_STYLE}
</head>
<body>
${COMMON_NAV}
<article>
  <h1>${esc(g.name)} на Казантипе</h1>
  <div class="meta">
    <span>🎧 ${esc(g.name_en)}</span>
    <span>⚡ ${esc(g.bpm)} BPM</span>
    <span>📍 родина: ${esc(g.origin)}</span>
  </div>
  <p class="lede">${esc(g.intro)}</p>

  <h2>Как звучит</h2>
  <p>${esc(g.feel)}</p>

  <h2>Что было на Казантипе</h2>
  <p>${esc(g.on_z)}</p>

  <h2>Иконические треки жанра на Z</h2>
  <div class="track-list">${esc(g.tracks)}</div>

  <h2>Диджеи, игравшие ${esc(g.name.toLowerCase())} на Казантипе</h2>
  <div class="pill-row">
    ${relatedDjs.map((d) => `<a class="pill" href="/djs/${d.slug}/">${esc(d.flag)} ${esc(d.name_ru)}<small>${esc(d.years_on_z)}</small></a>`).join("\n    ")}
  </div>

  <h2>Другие жанры на Z</h2>
  <div class="pill-row">
    ${genres
      .filter((o) => o.slug !== g.slug)
      .map((o) => `<a class="pill" href="/genres/${o.slug}/">${esc(o.name)}<small>${esc(o.bpm)} BPM</small></a>`)
      .join("\n    ")}
  </div>

  <a class="back-home" href="/genres/">← Все жанры</a>
</article>
${COMMON_FOOTER}
</body>
</html>
`;
}

// ─────────────── Hubs ───────────────

function djsHub() {
  const url = `${SITE}/djs/`;
  const title = "Диджеи Казантипа — полный список резидентов фестиваля Z (1993–2014)";
  const desc = `Все главные диджеи фестиваля Казантип: ${djs.length} имён — техно, транс, прогрессив, дабстеп. Carl Cox, Tiësto, Armin van Buuren, Richie Hawtin, Nina Kraviz и другие.`;
  return `${COMMON_HEAD(title, desc, url)}
${COMMON_STYLE}
</head>
<body>
${COMMON_NAV}
<main>
  <h1>Диджеи Казантипа</h1>
  <p class="lede">За двадцать лет на сценах Республики Z играли ${djs.length}+ мировых хедлайнеров. Каждый приносил свой жанр, свой стиль и свой кусочек казантипской легенды.</p>

  <h2>Все диджеи</h2>
  <div class="pill-row">
    ${djs
      .map(
        (d) =>
          `<a class="pill" href="/djs/${d.slug}/">${esc(d.flag)} ${esc(d.name_ru)}<small>${esc(d.style_ru)} · ${esc(d.years_on_z)}</small></a>`,
      )
      .join("\n    ")}
  </div>

  <h2>Больше про Казантип</h2>
  <div class="pill-row">
    <a class="pill" href="/genres/">🎧 Жанры на Z<small>${genres.length} направлений</small></a>
    <a class="pill" href="/zrp/">📖 История Казантипа<small>1993–2014</small></a>
    <a class="pill" href="/anthems/">🎵 Anthems<small>культовые треки</small></a>
    <a class="pill" href="/">🏠 Главная<small>Республика Z</small></a>
  </div>
</main>
${COMMON_FOOTER}
</body>
</html>
`;
}

function genresHub() {
  const url = `${SITE}/genres/`;
  const title = "Жанры Казантипа — техно, транс, прогрессив, дабстеп и другая электроника Z";
  const desc = `Все жанры электронной музыки, которые звучали на фестивале Казантип: ${genres.length} направлений от техно и транса до дабстепа и брейкбита.`;
  return `${COMMON_HEAD(title, desc, url)}
${COMMON_STYLE}
</head>
<body>
${COMMON_NAV}
<main>
  <h1>Жанры электроники на Казантипе</h1>
  <p class="lede">Казантип был не одним стилем — на разных сценах играли ${genres.length} разных жанров, каждый со своей аудиторией и своими героями.</p>

  <h2>Все жанры</h2>
  <div class="pill-row">
    ${genres
      .map(
        (g) =>
          `<a class="pill" href="/genres/${g.slug}/">${esc(g.name)}<small>${esc(g.bpm)} BPM · ${g.dj_slugs.length} DJ</small></a>`,
      )
      .join("\n    ")}
  </div>

  <h2>Больше про Казантип</h2>
  <div class="pill-row">
    <a class="pill" href="/djs/">🎧 Все диджеи<small>${djs.length} имён</small></a>
    <a class="pill" href="/zrp/">📖 История Казантипа<small>1993–2014</small></a>
    <a class="pill" href="/anthems/">🎵 Anthems<small>культовые треки</small></a>
    <a class="pill" href="/">🏠 Главная<small>Республика Z</small></a>
  </div>
</main>
${COMMON_FOOTER}
</body>
</html>
`;
}

function byCountryHub() {
  const url = `${SITE}/djs/by-country/`;
  const title = "Диджеи Казантипа по странам — Германия, Нидерланды, США, Великобритания";
  const desc = "Полный список резидентов Казантипа, сгруппированный по странам происхождения: Германия, Нидерланды, США, Великобритания, Италия и другие.";
  const byCountry = {};
  for (const d of djs) {
    byCountry[d.country] = byCountry[d.country] || [];
    byCountry[d.country].push(d);
  }
  const sorted = Object.entries(byCountry).sort((a, b) => b[1].length - a[1].length);
  return `${COMMON_HEAD(title, desc, url)}
${COMMON_STYLE}
</head>
<body>
${COMMON_NAV}
<main>
  <h1>Диджеи Казантипа по странам</h1>
  <p class="lede">Из каких стран приезжали хедлайнеры в Поповку — ${sorted.length} стран, ${djs.length} диджеев.</p>

  ${sorted
    .map(
      ([country, list]) => `
  <h2>${esc(list[0].flag)} ${esc(country)} <span style="opacity:.5;font-weight:400;font-size:.7em">(${list.length})</span></h2>
  <div class="pill-row">
    ${list.map((d) => `<a class="pill" href="/djs/${d.slug}/">${esc(d.name_ru)}<small>${esc(d.style_ru)}</small></a>`).join("\n    ")}
  </div>`,
    )
    .join("\n")}

  <a class="back-home" href="/djs/">← Все диджеи</a>
</main>
${COMMON_FOOTER}
</body>
</html>
`;
}

function byEraHub() {
  const url = `${SITE}/djs/by-era/`;
  const title = "Эпохи Казантипа — диджеи первой, золотой и закатной эры (1993–2014)";
  const desc = "Все диджеи Казантипа, сгруппированные по эпохам фестиваля: ранняя (1993–2001, Крым), золотая (2002–2010, Поповка), закатная (2011–2014).";
  const parseStart = (y) => parseInt(y.split("–")[0], 10);
  const buckets = {
    "Ранняя эра (1993–2001)": djs.filter((d) => parseStart(d.years_on_z) < 2002),
    "Золотая эра (2002–2010)": djs.filter((d) => {
      const s = parseStart(d.years_on_z);
      return s >= 2002 && s <= 2010;
    }),
    "Закатная эра (2011–2014)": djs.filter((d) => parseStart(d.years_on_z) >= 2011),
  };
  return `${COMMON_HEAD(title, desc, url)}
${COMMON_STYLE}
</head>
<body>
${COMMON_NAV}
<main>
  <h1>Диджеи Казантипа по эпохам</h1>
  <p class="lede">Три эры фестиваля Z — от первых рейвов на мысе Казантип до последних сетов перед эмиграцией в Анаклию. Диджеи, которые приходили в каждую эпоху.</p>

  ${Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(
      ([era, list]) => `
  <h2>${esc(era)} <span style="opacity:.5;font-weight:400;font-size:.7em">(${list.length})</span></h2>
  <div class="pill-row">
    ${list.map((d) => `<a class="pill" href="/djs/${d.slug}/">${esc(d.flag)} ${esc(d.name_ru)}<small>${esc(d.years_on_z)}</small></a>`).join("\n    ")}
  </div>`,
    )
    .join("\n")}

  <a class="back-home" href="/djs/">← Все диджеи</a>
</main>
${COMMON_FOOTER}
</body>
</html>
`;
}

function seoMapHub() {
  const url = `${SITE}/seo-map/`;
  const title = "Карта сайта kaZantip.org — все диджеи, жанры и история Казантипа";
  const desc = `Полная карта контента kaZantip.org: ${djs.length} страниц диджеев, ${genres.length} жанров, история Z, hub-страницы по странам и эпохам.`;
  return `${COMMON_HEAD(title, desc, url)}
${COMMON_STYLE}
</head>
<body>
${COMMON_NAV}
<main>
  <h1>Карта сайта</h1>
  <p class="lede">Все страницы kaZantip.org в одном месте: ${djs.length} диджеев, ${genres.length} жанров, история Z, тематические hub-страницы.</p>

  <h2>Диджеи (${djs.length})</h2>
  <div class="pill-row">
    ${djs.map((d) => `<a class="pill" href="/djs/${d.slug}/">${esc(d.name_ru)}</a>`).join("\n    ")}
  </div>

  <h2>Жанры (${genres.length})</h2>
  <div class="pill-row">
    ${genres.map((g) => `<a class="pill" href="/genres/${g.slug}/">${esc(g.name)}</a>`).join("\n    ")}
  </div>

  <h2>Hub-страницы</h2>
  <div class="pill-row">
    <a class="pill" href="/djs/">Все диджеи</a>
    <a class="pill" href="/genres/">Все жанры</a>
    <a class="pill" href="/djs/by-country/">Диджеи по странам</a>
    <a class="pill" href="/djs/by-era/">Диджеи по эпохам</a>
  </div>

  <h2>Основной сайт</h2>
  <div class="pill-row">
    <a class="pill" href="/">Главная</a>
    <a class="pill" href="/zrp/">История Казантипа</a>
    <a class="pill" href="/anthems/">Anthems</a>
    <a class="pill" href="/government/">Правительство Z</a>
    <a class="pill" href="/baltic/">Балтийский Z</a>
    <a class="pill" href="/chemodan/">Чемоданчик</a>
  </div>
</main>
${COMMON_FOOTER}
</body>
</html>
`;
}

// ─────────────── Writer ───────────────

function writeFile(rel, html) {
  const dest = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html, "utf8");
}

let count = 0;
for (const d of djs) {
  writeFile(`djs/${d.slug}/index.html`, djPage(d));
  count++;
}
for (const g of genres) {
  writeFile(`genres/${g.slug}/index.html`, genrePage(g));
  count++;
}
writeFile("djs/index.html", djsHub());
writeFile("genres/index.html", genresHub());
writeFile("djs/by-country/index.html", byCountryHub());
writeFile("djs/by-era/index.html", byEraHub());
writeFile("seo-map/index.html", seoMapHub());
count += 5;

// ─────────────── Sitemap patch ───────────────

const sitemapPath = path.join(ROOT, "sitemap.xml");
let sitemap = fs.readFileSync(sitemapPath, "utf8");

// Удаляем старые записи /djs/* и /genres/*, если есть.
sitemap = sitemap.replace(
  /\s*<url>\s*<loc>https:\/\/kazantip\.org\/(djs|genres|seo-map)\/[^<]*<\/loc>[\s\S]*?<\/url>/g,
  "",
);

const seoEntries = [];
for (const d of djs) {
  seoEntries.push(
    `  <url>\n    <loc>${SITE}/djs/${d.slug}/</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`,
  );
}
for (const g of genres) {
  seoEntries.push(
    `  <url>\n    <loc>${SITE}/genres/${g.slug}/</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`,
  );
}
for (const extra of ["djs/", "genres/", "djs/by-country/", "djs/by-era/", "seo-map/"]) {
  seoEntries.push(
    `  <url>\n    <loc>${SITE}/${extra}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`,
  );
}

sitemap = sitemap.replace("</urlset>", `${seoEntries.join("\n")}\n</urlset>`);
fs.writeFileSync(sitemapPath, sitemap, "utf8");

console.log(`✓ Сгенерировано ${count} HTML-страниц.`);
console.log(`  /djs/*          — ${djs.length}`);
console.log(`  /genres/*       — ${genres.length}`);
console.log(`  Hubs            — 5 (djs, genres, by-country, by-era, seo-map)`);
console.log(`  sitemap.xml     — обновлён (+${djs.length + genres.length + 5} URL)`);
