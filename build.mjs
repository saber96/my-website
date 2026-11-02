// Builds the site from site.json: node build.mjs
// Also makes the small copy (-960) of any photo in images/ that lacks one or is newer than it.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const site = JSON.parse(fs.readFileSync('site.json', 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const smallCopy = (slug) => {
  const big = `images/${slug}.jpg`, small = `images/${slug}-960.jpg`;
  if (fs.existsSync(small) && fs.statSync(small).mtimeMs >= fs.statSync(big).mtimeMs) return;
  try { execFileSync('sips', ['-Z', '960', big, '--out', small], { stdio: 'ignore' }); }
  catch { fs.copyFileSync(big, small); }
};

const page = ({ title, description, root, current, body, credits = [] }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}styles.css">
<script>
(function () { var d = document.documentElement; d.classList.add('js');
  try { var m = localStorage.getItem('mode'); if (m === 'dark' || m === 'light') d.dataset.mode = m; } catch (e) {} })();
</script>
<script src="${root}pictures.js" defer></script>
<script src="${root}site.js" defer></script>
</head>
<body data-root="${root}">
<a class="skip" href="#main">Skip to content</a>
<header class="header">
  <a class="name" href="${root}index.html">${esc(site.name)}</a>
  <nav class="nav" aria-label="Main">
    <a href="${root}index.html"${current === 'work' ? ' aria-current="page"' : ''}>Work</a>
    <a href="${root}contact.html"${current === 'contact' ? ' aria-current="page"' : ''}>Contact</a>
    <button class="nav__button" type="button" data-explore aria-haspopup="dialog">Explore</button>
    <button class="mode" type="button" data-mode-toggle aria-label="Dark mode" aria-pressed="false">
      <svg class="mode__moon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      <svg class="mode__sun" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
    </button>
  </nav>
</header>
<main id="main">
${body}
</main>
<footer class="footer">
  <nav class="footer__links" aria-label="Footer">
    <a href="${root}index.html">Work</a>
    <a href="${root}contact.html">Contact</a>
  </nav>
  <p class="footer__legal">© ${new Date().getFullYear()} ${esc(site.name)}</p>${credits.length ? `
  <p class="footer__credits" data-credits>Photographs: ${credits.join('; ')}. All from Wikimedia Commons.</p>` : ''}
</footer>
<dialog class="viewer" data-viewer aria-label="A random picture">
  <figure class="viewer__figure">
    <figcaption aria-live="polite"><span data-viewer-caption></span> <small data-viewer-credit></small></figcaption>
  </figure>
  <div class="viewer__controls">
    <button class="btn btn--ink" type="button" data-viewer-next autofocus>Another picture</button>
    <a class="btn" data-viewer-subject href="${root}index.html">See the subject</a>
    <button class="btn" type="button" data-viewer-close>Close</button>
  </div>
</dialog>
</body>
</html>
`;

const write = (file, html) => { fs.mkdirSync(file.split('/').slice(0, -1).join('/') || '.', { recursive: true }); fs.writeFileSync(file, html); };

site.galleries.forEach((g) => g.photos.forEach((p) => smallCopy(p.file)));

// Every picture on the site, for the Explore button.
const pictures = site.galleries.flatMap((g) => g.photos.map((p) => ({
  src: `images/${p.file}.jpg`, alt: p.alt, credit: p.credit || '', subject: g.title, href: `work/${g.slug}.html`,
})));
fs.writeFileSync('pictures.js', `window.SITE_PICTURES = ${JSON.stringify(pictures, null, 2)};\n`);

// Work
const tiles = site.galleries.map((g, i) => {
  const p = g.photos[0];
  return `  <a class="tile" href="work/${g.slug}.html">
    <img src="images/${p.file}-960.jpg" width="960" height="960" sizes="(min-width: 40rem) 30vw, 100vw" srcset="images/${p.file}-960.jpg 960w, images/${p.file}.jpg 1920w" alt="${esc(p.alt)}"${i < 3 ? ' fetchpriority="high"' : ' loading="lazy"'}${p.position ? ` style="object-position: ${p.position}"` : ''}>
    <h2>${esc(g.title)}</h2>
  </a>`;
}).join('\n');
write('index.html', page({
  title: `${site.name}: photography`,
  description: site.description,
  root: '',
  current: 'work',
  body: `<h1 class="visually-hidden">${esc(site.name)}: photography</h1>\n<div class="grid">\n${tiles}\n</div>`,
  credits: site.galleries.map((g) => g.photos[0].credit),
}));

// One page per subject
site.galleries.forEach((g, i) => {
  const next = site.galleries[(i + 1) % site.galleries.length];
  const photos = g.photos.map((p, n) => `  <img src="../images/${p.file}.jpg" width="1920" height="1080" sizes="100vw" srcset="../images/${p.file}-960.jpg 960w, ../images/${p.file}.jpg 1920w" alt="${esc(p.alt)}"${n === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}${p.position ? ` style="object-position: ${p.position}"` : ''}>`).join('\n');
  write(`work/${g.slug}.html`, page({
    title: `${g.title}: ${site.name}`,
    description: g.intro,
    root: '../',
    current: 'work',
    body: `<h1 class="visually-hidden">${esc(g.title)}</h1>
<p class="intro">${esc(g.intro)}</p>
<div class="stack">
${photos}
</div>
<p class="next"><a href="${next.slug}.html">${esc(next.title)}<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25"><path d="m9 4 8 8-8 8"/></svg></a></p>`,
    credits: g.photos.map((p) => p.credit),
  }));
});

// Contact
const blank = (text) => `<span class="fill">${esc(text)}</span>`;
write('contact.html', page({
  title: `Contact: ${site.name}`,
  description: `About ${site.name} and how to get in touch.`,
  root: '',
  current: 'contact',
  body: `<div class="about">
  <div class="about__text">
    <h1 class="about__label">About</h1>
    ${site.about ? site.about.split('\n\n').map((t) => `<p class="about__body">${esc(t)}</p>`).join('\n    ') : `<p class="about__body">${blank('Your about text goes here: who you are, what you shoot and who you shoot it for.')}</p>`}
  </div>
  <div class="about__side">
    <h2 class="about__label">Contact</h2>
    <p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
    <p>${site.city ? esc(site.city) : blank('City to be added')}</p>
  </div>
</div>`,
}));
