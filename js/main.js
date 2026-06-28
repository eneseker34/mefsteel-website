// ===== WEBGL SHADER — Mobilden devre dışı =====
(function initShader(canvasId, opacity) {
  if (window.innerWidth < 768) return; // Mobilde WebGL kapalı
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const gl = canvas.getContext('webgl');
  if (!gl) return;

  const vert = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const frag = `
    precision highp float;
    uniform float iTime;
    uniform vec2 iRes;
    mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    float vary(vec2 v1,vec2 v2,float st,float sp){return sin(dot(normalize(v1),normalize(v2))*st+iTime*sp)/100.;}
    vec3 circle(vec2 uv,vec2 c,float r,float w){
      vec2 d=c-uv;float l=length(d);
      l+=vary(d,vec2(0.,1.),5.,2.);
      l-=vary(d,vec2(1.,0.),5.,2.);
      return vec3(smoothstep(r-w,r,l)-smoothstep(r,r+w,l));
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/iRes;
      uv.x*=1.5;uv.x-=.25;
      float m=0.;
      vec2 c=vec2(.5);
      m+=circle(uv,c,.35,.035).r;
      m+=circle(uv,c,.332,.01).r;
      m+=circle(uv,c,.368,.005).r;
      vec2 v=rot(iTime)*uv;
      vec3 fg=vec3(v.x,v.y,.7-v.y*v.x);
      vec3 col=mix(vec3(0.),fg,m);
      col=mix(col,vec3(1.),circle(uv,c,.35,.003).r);
      gl_FragColor=vec4(col,1.);
    }`;

  const mkShader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s); return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(ap);
  gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);

  const tLoc = gl.getUniformLocation(prog, 'iTime');
  const rLoc = gl.getUniformLocation(prog, 'iRes');

  const resize = () => {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  let raf;
  const render = t => {
    gl.uniform1f(tLoc, t * 0.001);
    gl.uniform2f(rLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);
})('shader-canvas');

// Hero shader başlatıldı, pricing shader ayrıca başlatılıyor
(function initPricingShader() {
  if (window.innerWidth < 768) return; // Mobilde kapalı
  const canvas = document.getElementById('pricing-shader');
  if (!canvas) return;
  const gl = canvas.getContext('webgl');
  if (!gl) return;
  const vert = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const frag = `
    precision highp float;
    uniform float iTime;uniform vec2 iRes;
    mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    float vary(vec2 v1,vec2 v2,float st,float sp){return sin(dot(normalize(v1),normalize(v2))*st+iTime*sp)/100.;}
    vec3 circle(vec2 uv,vec2 c,float r,float w){vec2 d=c-uv;float l=length(d);l+=vary(d,vec2(0.,1.),5.,2.);l-=vary(d,vec2(1.,0.),5.,2.);return vec3(smoothstep(r-w,r,l)-smoothstep(r,r+w,l));}
    void main(){vec2 uv=gl_FragCoord.xy/iRes;uv.x*=1.5;uv.x-=.25;float m=0.;vec2 c=vec2(.5);m+=circle(uv,c,.35,.035).r;m+=circle(uv,c,.332,.01).r;m+=circle(uv,c,.368,.005).r;vec2 v=rot(iTime)*uv;vec3 fg=vec3(v.x,v.y,.7-v.y*v.x);vec3 col=mix(vec3(0.055,0.067,0.082),fg,m);col=mix(col,vec3(1.),circle(uv,c,.35,.003).r);gl_FragColor=vec4(col,1.);}`;
  const mk = (t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;};
  const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,vert));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,frag));gl.linkProgram(p);gl.useProgram(p);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const ap=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
  const tL=gl.getUniformLocation(p,'iTime'),rL=gl.getUniformLocation(p,'iRes');
  const resize=()=>{canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;gl.viewport(0,0,canvas.width,canvas.height);};
  resize();window.addEventListener('resize',resize);
  const render=t=>{gl.uniform1f(tL,t*.001);gl.uniform2f(rL,canvas.width,canvas.height);gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(render);};
  requestAnimationFrame(render);
})();

// ===== RİPPLE BUTONU =====
document.querySelectorAll('.ripple-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

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

// Galeri kartları ekrana girince animasyonu tetikle (sayfa yüklenirken değil)
const galleryGridEl = document.getElementById('gallery-grid');
if (galleryGridEl) {
  const galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        galleryGridEl.classList.add('in-view');
        galleryObserver.disconnect();
      }
    });
  }, { threshold: 0.1 });
  galleryObserver.observe(galleryGridEl);
}

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
}, { threshold: 0.1 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// Sayfa yüklenir yüklenmez görünür sayaçları tetikle (500ms gecikme ile)
setTimeout(() => {
  document.querySelectorAll('[data-target]').forEach(el => {
    if (!el.dataset.counted) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.dataset.counted = true;
        animateCounter(el);
      }
    }
  });
}, 500);

// ===== CARDSTACK 3D FAN =====
const KATEGORI_ETIKET = { konut: 'Konut', ticari: 'Ticari', endustriyel: 'Endüstriyel', diger: 'Diğer' };

const CS = {
  items: [],
  active: 0,
  fan: document.getElementById('cardstack-fan'),
  dots: document.getElementById('cardstack-dots'),
  dragging: false,
  startX: 0,

  CARD_W: 340,
  SPREAD: 48,
  OVERLAP: 0.48,
  DEPTH: 140,
  TILT: 12,
  MAX_VIS: 7,

  go(idx) {
    this.active = ((idx % this.items.length) + this.items.length) % this.items.length;
    this.render();
  },

  render() {
    if (!this.fan) return;
    const cards = this.fan.querySelectorAll('.cs-card');
    const n = this.items.length;
    const maxOff = Math.floor(this.MAX_VIS / 2);
    const stepDeg = maxOff > 0 ? this.SPREAD / maxOff : 0;
    const spacing = Math.round(this.CARD_W * (1 - this.OVERLAP));

    cards.forEach((card, i) => {
      let off = i - this.active;
      // wrap
      if (off > n / 2)  off -= n;
      if (off < -n / 2) off += n;
      const abs = Math.abs(off);
      const vis = abs <= maxOff;

      card.style.opacity    = vis ? '1' : '0';
      card.style.pointerEvents = vis ? '' : 'none';
      card.classList.toggle('active', off === 0);

      const rotZ  = off * stepDeg;
      const tx    = off * spacing;
      const ty    = abs * 10 + (off === 0 ? -22 : 0);
      const tz    = -abs * this.DEPTH;
      const scale = off === 0 ? 1.03 : 0.94;
      const rotX  = off === 0 ? 0 : this.TILT;
      card.style.zIndex = 100 - abs;
      card.style.transform = `translate(${tx}px, ${ty}px) translateZ(${tz}px) rotateZ(${rotZ}deg) rotateX(${rotX}deg) scale(${scale})`;
    });

    this.dots && this.dots.querySelectorAll('.cs-dot').forEach((d, i) => d.classList.toggle('active', i === this.active));
  },

  build(projects) {
    if (!this.fan) return;
    if (!projects || !projects.length) return;
    this.items = projects;

    this.fan.innerHTML = projects.map((p, i) => {
      const img  = p.dosya.startsWith('http') ? p.dosya : 'images/projeler/' + p.dosya;
      const kat  = p.kategori || 'diger';
      const etiket = KATEGORI_ETIKET[kat] || kat;
      const isim = p.isim || p.dosya.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const desc = p.aciklama || '';
      return `
        <div class="cs-card" data-i="${i}" data-img="${img}">
          <img src="${img}" alt="${isim}" loading="lazy"
               onerror="this.style.display='none';this.parentNode.style.background='linear-gradient(135deg,#112233,#1E3A5F)'">
          <div class="cs-card-overlay"></div>
          <div class="cs-card-body">
            <div class="cs-card-tag">${etiket}</div>
            <div class="cs-card-title">${isim}</div>
            ${desc ? `<div class="cs-card-desc">${desc}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    // Dots
    if (this.dots) {
      this.dots.innerHTML = projects.map((_, i) =>
        `<button class="cs-dot" data-i="${i}" aria-label="Slayt ${i+1}"></button>`
      ).join('');
      this.dots.querySelectorAll('.cs-dot').forEach(d =>
        d.addEventListener('click', () => this.go(+d.dataset.i))
      );
    }

    // Kart tıklama
    this.fan.querySelectorAll('.cs-card').forEach(card => {
      card.addEventListener('click', e => {
        if (this.dragging) return;
        const i = +card.dataset.i;
        if (i === this.active) {
          openLightbox(this.items.map(p => p.dosya.startsWith('http') ? p.dosya : 'images/projeler/' + p.dosya), i);
        } else {
          this.go(i);
        }
      });
    });

    // Drag / swipe (aktif kart)
    this.fan.addEventListener('mousedown',  e => this._dragStart(e.clientX));
    this.fan.addEventListener('touchstart', e => this._dragStart(e.touches[0].clientX), { passive: true });
    window.addEventListener('mouseup',  e => this._dragEnd(e.clientX));
    window.addEventListener('touchend', e => this._dragEnd(e.changedTouches[0].clientX));

    // Klavye
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  this.go(this.active - 1);
      if (e.key === 'ArrowRight') this.go(this.active + 1);
    });

    this.active = 0;
    this.render();
  },

  _dragStart(x) { this.startX = x; this.dragging = false; },
  _dragEnd(x) {
    const dx = x - this.startX;
    if (Math.abs(dx) > 60) {
      this.dragging = true;
      dx > 0 ? this.go(this.active - 1) : this.go(this.active + 1);
      setTimeout(() => { this.dragging = false; }, 100);
    }
  }
};

// manifest.json yükle → CardStack'e ver
fetch('images/projeler/manifest.json?v=2026062801')
  .then(r => r.ok ? r.json() : [])
  .then(data => CS.build(data))
  .catch(() => {});

// ===== GALLERY4 CAROUSEL =====

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
fetch('images/projeler/manifest.json?v=2026062801')
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

// ===== GALERİ — manifest.json'dan yükle =====
const KAT = { konut: 'Konut', ticari: 'Ticari', endustriyel: 'Endüstriyel', hibrit: 'Hibrit', diger: 'Diğer' };
const GALERI_LIMIT = 24; // İlk yükleme limiti
let tumProjeler = [];
let mevcutKat = 'tumu';

function renderGalleryItems(projects) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const filtered = mevcutKat === 'tumu' ? projects : projects.filter(p => p.kategori === mevcutKat);
  const allImgs = projects.map(p => p.dosya.startsWith('http') ? p.dosya : 'images/projeler/' + p.dosya);

  const html = filtered.slice(0, GALERI_LIMIT).map((p, i) => {
    const img = p.dosya.startsWith('http') ? p.dosya : 'images/projeler/' + p.dosya;
    const kat = p.kategori || 'konut';
    const tag = KAT[kat] || 'Proje';
    const isim = p.isim || ('Proje ' + (i + 1));
    const desc = p.aciklama || 'Hafif çelik yapı projesi';
    const big  = i === 0 ? ' big' : '';
    return `<div class="gallery-item${big}" data-cat="${kat}" data-img="${img}" data-title="${isim}" data-desc="${desc}" style="animation-delay:${(i % 12) * 0.06}s">
      <img src="${img}" alt="${isim}" loading="lazy" onerror="this.parentNode.style.background='#1E3A5F'">
      <div class="gi-overlay">
        <div class="gi-tag">${tag}</div>
        <div class="gi-title">${isim}</div>
        <div class="gi-desc">${desc}</div>
      </div>
    </div>`;
  }).join('');

  // Daha Fazla butonu
  const kalan = filtered.length - GALERI_LIMIT;
  const dahaFazla = kalan > 0
    ? `<div class="gallery-more-btn" id="gallery-more" style="grid-column:1/-1;text-align:center;padding:32px 0">
        <button onclick="galeriTumunu()" style="background:linear-gradient(135deg,#F4A261,#E76F51);color:#fff;border:none;padding:14px 36px;border-radius:50px;font-size:1rem;font-weight:700;cursor:pointer">
          Tümünü Gör (${kalan} daha)
        </button>
       </div>`
    : '';

  grid.innerHTML = html + dahaFazla;

  grid.querySelectorAll('.gallery-item').forEach((item, idx) => {
    const realIdx = projects.findIndex(p => 'images/projeler/' + p.dosya === item.dataset.img || p.dosya === item.dataset.img);
    item.addEventListener('click', () => openLightbox(allImgs, realIdx >= 0 ? realIdx : idx));
  });
}

function galeriTumunu() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const filtered = mevcutKat === 'tumu' ? tumProjeler : tumProjeler.filter(p => p.kategori === mevcutKat);
  const allImgs = tumProjeler.map(p => p.dosya.startsWith('http') ? p.dosya : 'images/projeler/' + p.dosya);
  grid.innerHTML = filtered.map((p, i) => {
    const img = p.dosya.startsWith('http') ? p.dosya : 'images/projeler/' + p.dosya;
    const kat = p.kategori || 'konut';
    const big = i === 0 ? ' big' : '';
    return `<div class="gallery-item${big}" data-cat="${kat}" data-img="${img}" style="animation-delay:${(i % 12) * 0.06}s">
      <img src="${img}" alt="${p.isim}" loading="lazy" onerror="this.parentNode.style.background='#1E3A5F'">
      <div class="gi-overlay"><div class="gi-tag">${KAT[kat]||'Proje'}</div><div class="gi-title">${p.isim}</div></div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.gallery-item').forEach((item, idx) => {
    item.addEventListener('click', () => openLightbox(allImgs, idx));
  });
}

function buildGallery(projects) {
  tumProjeler = projects;
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  if (!projects.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#8B9BAA">
      <div style="font-size:3rem;margin-bottom:16px">🏗️</div>
      <div style="font-size:1.1rem;font-weight:600;color:#E8EDF2;margin-bottom:8px">Projelerimiz yükleniyor</div>
    </div>`;
    return;
  }

  renderGalleryItems(projects);

  // Filtre
  const filterBtns = document.querySelectorAll('.gf-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mevcutKat = btn.dataset.cat;
      renderGalleryItems(tumProjeler);
    });
  });
}

fetch('images/projeler/manifest.json?v=2026062801')
  .then(r => r.ok ? r.json() : [])
  .then(data => buildGallery(data))
  .catch(() => {});

// ===== CONTACT FORM — Web3Forms =====
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn     = form.querySelector('.form-submit');
    const success = form.querySelector('.form-success');

    btn.textContent = 'Gönderiliyor...';
    btn.disabled = true;

    const data = new FormData(form);
    data.append('access_key', 'f54aebdf-71a6-4465-9963-bd12a09cf186');
    data.append('subject',    'MefSteel Web Sitesi - Yeni Mesaj');
    data.append('from_name',  'MefSteel Web Formu');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data
      });
      const json = await res.json();

      if (json.success) {
        form.reset();
        btn.style.display   = 'none';
        success.style.display = 'block';
        success.textContent = '✓ Mesajınız iletildi! En kısa sürede dönüş yapacağız.';
      } else {
        throw new Error(json.message || 'Gönderi hatası');
      }
    } catch (err) {
      // Yedek: WhatsApp
      const d   = new FormData(form);
      const msg = encodeURIComponent(
        `Merhaba! ${d.get('name') || ''} | ${d.get('service') || ''} | ${d.get('message') || ''}`
      );
      window.open(`https://wa.me/905535430212?text=${msg}`, '_blank');
      btn.textContent = 'Mesaj Gönder →';
      btn.disabled    = false;
    }
  });
}

// ===== OLAY TAKİP (Google Analytics) =====
(function() {
  function gaEvent(name) {
    if (typeof gtag === 'function') gtag('event', name);
  }

  // Hero "Teklif Al"
  document.querySelector('a.btn-secondary')?.addEventListener('click', () => gaEvent('teklif_al_tikla'));

  // Projelerimizi Gör
  document.querySelector('a.btn-primary')?.addEventListener('click', () => gaEvent('projeler_gor_tikla'));

  // Paket "İletişime Geç" butonları
  document.querySelectorAll('.pricing-btn').forEach(el =>
    el.addEventListener('click', () => gaEvent('iletisime_gec_tikla'))
  );

  // WhatsApp linkleri
  document.querySelectorAll('a[href*="wa.me"]').forEach(el =>
    el.addEventListener('click', () => gaEvent('whatsapp_tikla'))
  );

  // İletişim formu gönder
  document.getElementById('contact-form')?.addEventListener('submit', () => gaEvent('form_gonder'));
})();

// ===== SERVICE CARD ACCORDION =====
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', e => {
    if (e.target.closest('a')) return; // CTA linkine tıklandıysa accordion açma
    const isOpen = card.classList.contains('open');
    document.querySelectorAll('.service-card').forEach(c => c.classList.remove('open'));
    if (!isOpen) card.classList.add('open');
  });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
