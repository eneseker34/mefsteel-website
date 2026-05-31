// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  updateActiveNav();
});

// ===== HAMBURGER MENU =====
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('nav');
hamburger.addEventListener('click', () => {
  nav.classList.toggle('open');
  hamburger.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ===== ACTIVE NAV =====
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`nav a[href="#${id}"]`);
    if (link) link.classList.toggle('active', scrollY >= top && scrollY < top + height);
  });
}

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up, .fade-left, .fade-right').forEach(el => observer.observe(el));

// ===== COUNTER ANIMATION =====
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const step = target / (1800 / 16);
  let current = 0;
  const update = () => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current) + suffix;
    if (current < target) requestAnimationFrame(update);
  };
  update();
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.counted) {
      entry.target.dataset.counted = true;
      animateCounter(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// ===== GALLERY4 CAROUSEL =====
const KATEGORI_ETIKET = { konut: 'Konut', ticari: 'Ticari', endustriyel: 'Endüstriyel', diger: 'Diğer' };

let g4Index = 0;
let g4Total = 0;
const g4Track = document.getElementById('gallery4-track');
const g4Dots  = document.getElementById('gallery4-dots');
const g4Prev  = document.getElementById('g4-prev');
const g4Next  = document.getElementById('g4-next');

function g4CardWidth() {
  const card = g4Track?.querySelector('.gallery4-card');
  if (!card) return 360;
  return card.offsetWidth + 20;
}

function g4UpdateState() {
  if (!g4Track) return;
  const offset = g4Index * g4CardWidth();
  g4Track.style.transform = `translateX(-${offset}px)`;
  if (g4Prev) g4Prev.disabled = g4Index === 0;
  if (g4Next) g4Next.disabled = g4Index >= g4Total - 1;
  document.querySelectorAll('.gallery4-dot').forEach((d, i) => d.classList.toggle('active', i === g4Index));
}

function g4Render(projects) {
  if (!g4Track) return;

  if (!projects || projects.length === 0) {
    g4Track.innerHTML = `<div class="gallery4-empty"><div style="font-size:2.5rem;margin-bottom:12px">📸</div><div>Proje fotoğrafları yakında eklenecek</div></div>`;
    if (g4Dots) g4Dots.innerHTML = '';
    return;
  }

  g4Total = projects.length;

  g4Track.innerHTML = projects.map(p => {
    const imgPath = 'images/projeler/' + p.dosya;
    const kat  = p.kategori || 'diger';
    const etiket = KATEGORI_ETIKET[kat] || kat;
    const isim = p.isim || p.dosya.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const aciklama = p.aciklama || '';
    return `
      <div class="gallery4-card" data-img="${imgPath}">
        <img src="${imgPath}" alt="${isim}" loading="lazy"
             onerror="this.style.display='none';this.parentNode.style.background='linear-gradient(135deg,#112233,#1E3A5F)'">
        <div class="gallery4-card-overlay"></div>
        <div class="gallery4-card-body">
          <div class="gallery4-card-tag">${etiket}</div>
          <div class="gallery4-card-title">${isim}</div>
          ${aciklama ? `<div class="gallery4-card-desc">${aciklama}</div>` : ''}
          <div class="gallery4-card-more">
            Detaylar
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>`;
  }).join('');

  // Dots
  if (g4Dots) {
    g4Dots.innerHTML = projects.map((_, i) =>
      `<button class="gallery4-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="Slayt ${i+1}"></button>`
    ).join('');
    g4Dots.querySelectorAll('.gallery4-dot').forEach(d => {
      d.addEventListener('click', () => { g4Index = +d.dataset.i; g4UpdateState(); });
    });
  }

  // Lightbox bağla
  g4Track.querySelectorAll('.gallery4-card[data-img]').forEach((card, i, arr) => {
    const imgs = [...arr].map(c => c.dataset.img);
    card.addEventListener('click', () => openLightbox(imgs, i));
  });

  g4Index = 0;
  g4UpdateState();
}

// Prev / Next
if (g4Prev) g4Prev.addEventListener('click', () => { if (g4Index > 0) { g4Index--; g4UpdateState(); } });
if (g4Next) g4Next.addEventListener('click', () => { if (g4Index < g4Total - 1) { g4Index++; g4UpdateState(); } });

// Dokunmatik / mouse drag
(function() {
  if (!g4Track) return;
  let startX = 0, isDragging = false;
  const onStart = e => { startX = (e.touches?.[0] || e).clientX; isDragging = true; };
  const onEnd   = e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = (e.changedTouches?.[0] || e).clientX - startX;
    if (dx < -50 && g4Index < g4Total - 1) { g4Index++; g4UpdateState(); }
    if (dx > 50  && g4Index > 0)            { g4Index--; g4UpdateState(); }
  };
  g4Track.addEventListener('mousedown',  onStart);
  g4Track.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('mouseup',  onEnd);
  window.addEventListener('touchend', onEnd);
})();

// manifest.json yükle
fetch('images/projeler/manifest.json?v=' + Date.now())
  .then(r => r.ok ? r.json() : [])
  .then(data => g4Render(data))
  .catch(() => g4Render([]));

// ===== LIGHTBOX =====
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbClose = document.getElementById('lb-close');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');
let lbImages = [];
let lbIndex = 0;

function openLightbox(images, index) {
  lbImages = images;
  lbIndex = index;
  lbImg.src = lbImages[lbIndex];
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
lbPrev.addEventListener('click', () => { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; lbImg.src = lbImages[lbIndex]; });
lbNext.addEventListener('click', () => { lbIndex = (lbIndex + 1) % lbImages.length; lbImg.src = lbImages[lbIndex]; });

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lbPrev.click();
  if (e.key === 'ArrowRight') lbNext.click();
});

function bindLightbox() {
  const cards = document.querySelectorAll('#projects-grid .project-card[data-img]');
  const imgs = [...cards].map(c => c.dataset.img);
  cards.forEach((card, i) => {
    card.addEventListener('click', () => openLightbox(imgs, i));
  });
}

// ===== CONTACT FORM =====
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const success = form.querySelector('.form-success');
    btn.textContent = 'Gönderiliyor...';
    btn.disabled = true;
    setTimeout(() => {
      form.reset();
      btn.style.display = 'none';
      success.style.display = 'block';
      success.textContent = '✓ Mesajınız iletildi! En kısa sürede dönüş yapacağız.';
    }, 1200);
  });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
