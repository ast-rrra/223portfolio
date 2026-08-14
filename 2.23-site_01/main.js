// Renders the site from window.CONTENT (see data/content.js)

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function escapeHtml(str) {
  const d = document.createElement('div');
  d.innerText = str || '';
  return d.innerHTML;
}

const PLAY_TRIANGLE = '<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="3,1 13,7 3,13" fill="#1a1a1a"/></svg>';
const PAUSE_ICON = '<svg width="14" height="14" viewBox="0 0 14 14"><rect x="3" y="1" width="3" height="12" fill="#1a1a1a"/><rect x="8" y="1" width="3" height="12" fill="#1a1a1a"/></svg>';
const PLAY_BADGE = '<svg width="16" height="16" viewBox="0 0 14 14"><polygon points="3,1 13,7 3,13" fill="#1a1a1a"/></svg>';

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

/* ---------------- shared chrome ---------------- */

function renderHeader(container) {
  const site = window.CONTENT.site;
  const header = el('div', 'header');
  const logo = el('a', 'logo', site.logo);
  logo.href = 'index.html';
  header.appendChild(logo);

  const nav = el('div', 'nav-links');
  site.links.forEach(l => {
    const a = el('a', null, l.label);
    a.href = l.url;
    a.target = '_blank';
    a.rel = 'noopener';
    nav.appendChild(a);
  });
  const emailLink = el('a', null, site.email);
  emailLink.href = 'mailto:' + site.email;
  nav.appendChild(emailLink);
  header.appendChild(nav);

  container.appendChild(header);
}

// dots-row: left icon = icon-next.svg asset (points left), right icon = icon-prev.svg asset (points right)
// this matches correct prev/next semantics using the provided artwork.
function renderDots(container, opts) {
  opts = opts || {};
  const row = el('div', 'dots-row');

  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '<img src="icons/icon-next.svg" alt="prev">';
  prevBtn.disabled = !opts.onPrev;
  prevBtn.setAttribute('aria-label', 'Назад');
  if (opts.onPrev) prevBtn.onclick = opts.onPrev;

  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '<img src="icons/icon-prev.svg" alt="next">';
  nextBtn.disabled = !opts.onNext;
  nextBtn.setAttribute('aria-label', 'Вперёд');
  if (opts.onNext) nextBtn.onclick = opts.onNext;

  row.appendChild(prevBtn);
  row.appendChild(nextBtn);
  container.appendChild(row);
  return { prevBtn, nextBtn };
}

/* ---------------- index page ---------------- */

function renderIndex() {
  const root = document.getElementById('app');
  root.className = 'page';
  renderHeader(root);

  const intro = el('div', 'intro');
  const block = el('div', 'intro-block');
  block.innerHTML = `<h2>${escapeHtml(window.CONTENT.site.about.title)}</h2><p>${escapeHtml(window.CONTENT.site.about.text)}</p>`;
  intro.appendChild(block);
  root.appendChild(intro);

  renderDots(root, {});

  const grid = el('div', 'grid');
  window.CONTENT.projects.forEach(p => {
    const card = el('a', 'card');
    card.href = 'project.html?id=' + encodeURIComponent(p.id);

    const img = el('div', 'card-image');
    if (p.cover) img.innerHTML = `<img src="${p.cover}" alt="${escapeHtml(p.title)}" loading="lazy">`;
    card.appendChild(img);

    card.appendChild(el('h3', 'card-title', escapeHtml(p.title)));
    if (p.category) card.appendChild(el('p', 'card-category', escapeHtml(p.category)));
    if (p.description) card.appendChild(el('p', 'card-description', escapeHtml(p.description)));
    if (p.credits && p.credits.length) {
      const credits = el('div', 'card-credits');
      p.credits.forEach(c => credits.appendChild(el('div', null, escapeHtml(c))));
      card.appendChild(credits);
    }
    if (p.venue) card.appendChild(el('p', 'card-venue', escapeHtml(p.venue)));

    grid.appendChild(card);
  });
  root.appendChild(grid);

  initCustomCursor();
  initAmbientDots();
}

/* ---------------- project detail page ---------------- */

function renderProject() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const projects = window.CONTENT.projects;
  const idx = projects.findIndex(p => p.id === id);
  const p = projects[idx] || projects[0];
  const root = document.getElementById('app');
  root.className = 'page';

  renderHeader(root);

  const backRow = el('div', 'back-row');
  backRow.innerHTML = `<a href="index.html"><img src="icons/icon-back.svg" alt=""><span>Back</span></a>`;
  root.appendChild(backRow);

  const head = el('div', 'project-head');
  head.appendChild(el('h1', 'project-title', escapeHtml(p.title)));

  const meta = el('div', 'project-meta');
  if (p.category) meta.appendChild(el('p', null, escapeHtml(p.category)));
  if (p.description) meta.appendChild(el('p', null, escapeHtml(p.description).replace(/\n/g, '<br>')));
  if (p.credits && p.credits.length) {
    const credits = el('div', 'credits');
    p.credits.forEach(c => credits.appendChild(el('div', null, escapeHtml(c))));
    meta.appendChild(credits);
  }
  if (p.venue) meta.appendChild(el('p', 'venue', escapeHtml(p.venue)));
  head.appendChild(meta);
  root.appendChild(head);

  const gallery = (p.gallery || []).filter(g => g && (g.src || g.url));

  let galleryEl = null;
  if (gallery.length) {
    const dotsWrap = el('div', 'dots-row-wrap');
    galleryEl = el('div', 'gallery');
    galleryEl.setAttribute('role', 'list');

    const scrollByOne = (dir) => {
      const item = galleryEl.querySelector('.gallery-item');
      const step = item ? item.getBoundingClientRect().width + 8 : 300;
      galleryEl.scrollBy({ left: dir * step, behavior: 'smooth' });
    };
    renderDots(root, {
      onPrev: () => scrollByOne(-1),
      onNext: () => scrollByOne(1)
    });

    gallery.forEach((g, gi) => {
      galleryEl.appendChild(renderGalleryItem(g, gi, gallery));
    });

    const galWrap = el('div', 'gallery-wrap');
    galWrap.appendChild(galleryEl);
    root.appendChild(galWrap);
  } else {
    renderDots(root, {});
  }

  const audioTracks = (p.audio || []).filter(a => a && a.src);
  if (audioTracks.length) {
    root.appendChild(renderAudioSection(audioTracks));
  }

  if (p.about) {
    const about = el('div', 'about-section');
    about.appendChild(el('h2', 'about-heading', 'About'));
    about.appendChild(el('div', 'about-body', escapeHtml(p.about)));
    root.appendChild(about);
  }

  document.title = p.title + ' — ' + window.CONTENT.site.logo;
  initCustomCursor();
  initAmbientDots();
}

function renderGalleryItem(g, gi, gallery) {
  const item = el('div', 'gallery-item');
  item.setAttribute('role', 'listitem');
  if (g.type === 'video') {
    const yid = g.videoId || youtubeId(g.url);
    item.classList.add(g.orientation === 'vertical' ? 'type-video-v' : 'type-video-h');
    if (yid) {
      item.innerHTML = `<img class="video-thumb" src="https://img.youtube.com/vi/${yid}/hqdefault.jpg" alt="${escapeHtml(g.title || '')}" loading="lazy">`;
    } else {
      item.innerHTML = `<div class="video-thumb" style="display:flex;align-items:center;justify-content:center;color:#999;font-size:11px;">video</div>`;
    }
    const badge = el('div', 'play-badge', `<span>${PLAY_BADGE}</span>`);
    item.appendChild(badge);
  } else {
    item.innerHTML = `<img src="${g.src}" alt="${escapeHtml(g.title || '')}" loading="lazy">`;
  }
  item.addEventListener('click', () => openLightbox(gallery, gi));
  return item;
}

/* ---------------- lightbox ---------------- */

let lightboxEl = null;

function openLightbox(items, startIndex) {
  if (!lightboxEl) buildLightbox();
  lightboxEl._items = items;
  lightboxEl._index = startIndex;
  renderLightboxMedia();
  lightboxEl.classList.add('open');
  document.addEventListener('keydown', onLightboxKey);
}

function closeLightbox() {
  lightboxEl.classList.remove('open');
  lightboxEl.querySelector('.lightbox-media').innerHTML = '';
  document.removeEventListener('keydown', onLightboxKey);
}

function onLightboxKey(e) {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(1);
}

function stepLightbox(dir) {
  const items = lightboxEl._items;
  lightboxEl._index = (lightboxEl._index + dir + items.length) % items.length;
  renderLightboxMedia();
}

function renderLightboxMedia() {
  const items = lightboxEl._items;
  const g = items[lightboxEl._index];
  const mediaWrap = lightboxEl.querySelector('.lightbox-media');
  const caption = lightboxEl.querySelector('.lightbox-caption');
  mediaWrap.innerHTML = '';
  if (g.type === 'video') {
    const yid = g.videoId || youtubeId(g.url);
    if (yid) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${yid}?autoplay=1`;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      mediaWrap.appendChild(iframe);
    }
  } else {
    const img = document.createElement('img');
    img.src = g.src;
    img.alt = g.title || '';
    mediaWrap.appendChild(img);
  }
  caption.textContent = g.title || '';
}

function buildLightbox() {
  lightboxEl = el('div', 'lightbox');
  lightboxEl.innerHTML = `
    <button class="lightbox-close" aria-label="Закрыть">&times;</button>
    <button class="lightbox-nav prev" aria-label="Назад"><img src="icons/icon-next.svg" alt=""></button>
    <div class="lightbox-media"></div>
    <button class="lightbox-nav next" aria-label="Вперёд"><img src="icons/icon-prev.svg" alt=""></button>
    <div class="lightbox-caption"></div>
  `;
  lightboxEl.querySelector('.lightbox-close').onclick = closeLightbox;
  lightboxEl.querySelector('.lightbox-nav.prev').onclick = () => stepLightbox(-1);
  lightboxEl.querySelector('.lightbox-nav.next').onclick = () => stepLightbox(1);
  lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox(); });
  document.body.appendChild(lightboxEl);
}

/* ---------------- audio tracks ---------------- */

function renderAudioSection(tracks) {
  const wrap = el('div', 'audio-section');
  tracks.forEach(t => wrap.appendChild(renderAudioTrack(t)));
  return wrap;
}

function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderAudioTrack(t) {
  const row = el('div', 'audio-track');
  const btn = document.createElement('button');
  btn.className = 'play-btn';
  btn.innerHTML = PLAY_TRIANGLE;
  const title = el('div', 'title', escapeHtml(t.title || 'Untitled'));
  const bar = el('div', 'bar');
  const fill = el('div', 'fill');
  bar.appendChild(fill);
  const time = el('div', 'time', '0:00');
  const audio = document.createElement('audio');
  audio.src = t.src;
  audio.preload = 'metadata';

  btn.onclick = () => {
    document.querySelectorAll('.audio-track audio').forEach(a => { if (a !== audio) { a.pause(); } });
    document.querySelectorAll('.audio-track .play-btn').forEach(b => { if (b !== btn) b.innerHTML = PLAY_TRIANGLE; });
    if (audio.paused) { audio.play(); btn.innerHTML = PAUSE_ICON; }
    else { audio.pause(); btn.innerHTML = PLAY_TRIANGLE; }
  };
  audio.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    fill.style.width = pct + '%';
    time.textContent = formatTime(audio.duration ? audio.duration - audio.currentTime : 0);
  });
  audio.addEventListener('loadedmetadata', () => { time.textContent = formatTime(audio.duration); });
  audio.addEventListener('ended', () => { btn.innerHTML = PLAY_TRIANGLE; fill.style.width = '0%'; });
  bar.addEventListener('click', (e) => {
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (audio.duration) audio.currentTime = pct * audio.duration;
  });

  row.appendChild(btn);
  row.appendChild(title);
  row.appendChild(bar);
  row.appendChild(time);
  row.appendChild(audio);
  return row;
}

/* ---------------- custom cursor (dotted arrow) ---------------- */

const CURSOR_SVG = `<svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="16.9707" cy="16.9705" r="2" fill="#2F2F2F"/>
<circle cx="20.5059" cy="20.5062" r="2" fill="#2F2F2F"/>
<circle cx="24.041" cy="24.0418" r="2" fill="#2F2F2F"/>
<circle cx="13.4355" cy="13.4349" r="2" fill="#2F2F2F"/>
<circle cx="9.89844" cy="9.89923" r="2" fill="#2F2F2F"/>
<circle cx="6.36328" cy="6.36407" r="2" fill="#2F2F2F"/>
<circle cx="2.82812" cy="2.82843" r="2" fill="#2F2F2F"/>
<circle cx="16.9707" cy="9.89923" r="2" fill="#2F2F2F"/>
<circle cx="20.5059" cy="6.36407" r="2" fill="#2F2F2F"/>
<circle cx="13.4355" cy="6.36407" r="2" fill="#2F2F2F"/>
<circle cx="9.89844" cy="16.9705" r="2" fill="#2F2F2F"/>
<circle cx="6.36328" cy="20.5062" r="2" fill="#2F2F2F"/>
<circle cx="6.36328" cy="13.4349" r="2" fill="#2F2F2F"/>
</svg>`;
// tip of the dotted arrow (its "hotspot") sits at (2.83, 2.83) in the 27x27 viewBox

function initCustomCursor() {
  if (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (document.querySelector('.cursor-arrow')) return;

  document.body.classList.add('custom-cursor');
  const arrow = el('div', 'cursor-arrow', CURSOR_SVG);
  document.body.appendChild(arrow);

  let mx = -100, my = -100;
  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  window.addEventListener('mouseleave', () => { mx = -100; my = -100; });

  function tick() {
    arrow.style.transform = `translate(${mx - 2.83}px, ${my - 2.83}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------------- ambient background dots (reacts to cursor / touch) ---------------- */

function initAmbientDots() {
  if (document.querySelector('.ambient-dots')) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-dots';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const SPACING = 46;
  const RADIUS = 100;
  const MAX_PUSH = 9;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let vw = 0, vh = 0, dots = [];

  function build() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = vw * DPR;
    canvas.height = vh * DPR;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    dots = [];
    const cols = Math.ceil(vw / SPACING) + 1;
    const rows = Math.ceil(vh / SPACING) + 1;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const ox = i * SPACING + (j % 2 ? SPACING / 2 : 0);
        const oy = j * SPACING;
        dots.push({ ox, oy, x: ox, y: oy });
      }
    }
  }
  build();

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200); });

  let px = -9999, py = -9999;
  window.addEventListener('mousemove', (e) => { px = e.clientX; py = e.clientY; }, { passive: true });
  window.addEventListener('mouseleave', () => { px = -9999; py = -9999; });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) { px = e.touches[0].clientX; py = e.touches[0].clientY; }
  }, { passive: true });
  window.addEventListener('touchend', () => { px = -9999; py = -9999; });

  function frame() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    ctx.fillStyle = '#dcdcdc';
    for (let k = 0; k < dots.length; k++) {
      const d = dots[k];
      const dx = px - d.ox, dy = py - d.oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let tx = d.ox, ty = d.oy;
      if (dist < RADIUS) {
        const f = (1 - dist / RADIUS) * MAX_PUSH;
        tx = d.ox + (dx / (dist || 1)) * f;
        ty = d.oy + (dy / (dist || 1)) * f;
      }
      d.x += (tx - d.x) * 0.18;
      d.y += (ty - d.y) * 0.18;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
