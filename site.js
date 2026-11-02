// Dark mode: the visitor's choice wins and is remembered; until they choose, the system setting decides.
const root = document.documentElement;
const toggle = document.querySelector('[data-mode-toggle]');
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.mode ? root.dataset.mode === 'dark' : systemDark.matches);
const syncToggle = () => toggle.setAttribute('aria-pressed', String(isDark()));

toggle.addEventListener('click', () => {
  const mode = isDark() ? 'light' : 'dark';
  root.dataset.mode = mode;
  try { localStorage.setItem('mode', mode); } catch { /* the choice lasts for this page only */ }
  syncToggle();
});
systemDark.addEventListener('change', syncToggle);
syncToggle();

// Explore: opens a random picture from anywhere on the site, never the one already showing.
const base = document.body.dataset.root;
const pictures = window.SITE_PICTURES;
const viewer = document.querySelector('[data-viewer]');
const img = new Image();
img.className = 'viewer__img';
img.dataset.viewerImg = '';
viewer.querySelector('figure').prepend(img);
const caption = viewer.querySelector('[data-viewer-caption]');
const credit = viewer.querySelector('[data-viewer-credit]');
const subject = viewer.querySelector('[data-viewer-subject]');
let current = -1;

const showRandom = () => {
  let i = Math.floor(Math.random() * pictures.length);
  if (i === current) i = (i + 1) % pictures.length;
  current = i;
  const p = pictures[i];
  img.src = base + p.src;
  img.alt = p.alt;
  caption.textContent = p.alt;
  credit.innerHTML = p.credit ? `Photograph: ${p.credit}` : '';
  subject.href = base + p.href;
  subject.textContent = `See ${p.subject}`;
};

document.querySelector('[data-explore]').addEventListener('click', () => {
  showRandom();
  viewer.showModal();
});
viewer.querySelector('[data-viewer-next]').addEventListener('click', showRandom);
viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
