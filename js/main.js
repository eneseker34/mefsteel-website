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

// ===== DİNAMİK GALERİ — manifest.json'dan otomatik yükle =====
const KATEGORI_ETIKET = { konut: 'Konut', ticari: 'Ticari', endustriyel: 'Endüstriyel', diger: 'Diğer' };

function renderGallery(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  if (!projects || projects.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;padding:60px;text-align:center;border-radius:16px;border:1px dashed rgba(255,255,255,0.1)">
        <div style="font-size:2rem;margin-bottom:12px">📸</div>
        <div style="color:#8B9BAA;font-size:0.9rem">Proje fotoğrafları yakında eklenecek</div>
      </div>`;
    return;
  }

  grid.innerHTML = projects.map((p, i) => {
    const imgPath = 'images/projeler/' + p.dosya;
    const kat = p.kategori || 'diger';
    const etiket = KATEGORI_ETIKET[kat] || kat;
    const isim = p.isim || p.dosya.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const spanClass = i === 0 ? ' style="grid-column:span 2;aspect-ratio:16/9"' : '';
    return `
      <div class="project-card" data-cat="${kat}" data-img="${imgPath}"${spanClass}>
        <img src="${imgPath}" alt="${isim}" loading="lazy"
             onerror="this.parentNode.innerHTML='<div class=\\'project-placeholder\\'><div class=\\'ph-icon\\'>🏗️</div><div class=\\'ph-text\\'>${isim}</div></div>'">
        <div class="project-overlay">
          <div class="project-info">
            <div class="project-tag">${etiket}</div>
            <div class="project-name">${isim}</div>
          </div>
        </div>
      </div>`;
  }).join('');

  // Yeni kartlara filter ve lightbox bağla
  bindFilter();
  bindLightbox();
}

// manifest.json yükle
fetch('images/projeler/manifest.json?v=' + Date.now())
  .then(r => r.ok ? r.json() : [])
  .then(data => renderGallery(data))
  .catch(() => renderGallery([]));

// ===== FILTER TABS =====
const filterBtns = document.querySelectorAll('.filter-btn');

function bindFilter() {
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('#projects-grid .project-card[data-cat]').forEach(card => {
        const show = filter === 'tumu' || card.dataset.cat === filter;
        card.style.opacity = show ? '1' : '0.2';
        card.style.transform = show ? 'scale(1)' : 'scale(0.95)';
        card.style.pointerEvents = show ? '' : 'none';
      });
    };
  });
}

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
