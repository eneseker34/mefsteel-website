// ===== YENİ HERO — scroll-expand + foto montajı + kolaj =====
(function () {
  var wrap = document.getElementById('heroWrap');
  if (!wrap) return;
  var collage = document.getElementById('heroCollage');
  var stage = document.getElementById('heroStage');
  var t1 = document.getElementById('heroT1');
  var t2 = document.getElementById('heroT2');
  var sub = document.getElementById('heroSub');
  var cta = document.getElementById('heroCta');
  var hint = document.getElementById('heroHint');
  var slides = stage ? stage.querySelectorAll('.slide') : [];

  // --- Arka kolaj (proje fotolarından ızgara) ---
  var pool = [
    '/images/hero-villa.webp', '/images/about-work-2.webp',
    '/images/projeler/konut/benek-villa-01.webp', '/images/projeler/konut/akkus-villa-05.webp',
    '/images/projeler/konut/mefsteel-proje-150.webp', '/images/projeler/konut/mefsteel-proje-160.webp',
    '/images/projeler/konut/mefsteel-proje-170.webp', '/images/projeler/konut/mefsteel-proje-180.webp',
    '/images/projeler/hibrit/hibrit-yapi-08.webp', '/images/projeler/ticari/putzmeister-ofis-01.webp'
  ];
  if (collage) {
    var n = window.innerWidth < 768 ? 12 : 24;
    for (var i = 0; i < n; i++) {
      var d = document.createElement('div');
      d.style.backgroundImage = "url('" + pool[i % pool.length] + "')";
      collage.appendChild(d);
    }
  }

  // --- Montaj (video hissi: çapraz geçiş) ---
  if (slides.length > 1) {
    var idx = 0;
    setInterval(function () {
      slides[idx].classList.remove('on');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('on');
    }, 2600);
  }

  // --- Scroll-expand ---
  var isM = window.innerWidth < 768;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function onScroll() {
    var rect = wrap.getBoundingClientRect();
    var total = wrap.offsetHeight - window.innerHeight;
    var p = clamp(-rect.top / total, 0, 1);
    var w = 320 + p * (isM ? 640 : 1300);
    var h = 420 + p * (isM ? 260 : 400);
    if (stage) {
      stage.style.width = Math.min(w, window.innerWidth * 0.96) + 'px';
      stage.style.height = Math.min(h, window.innerHeight * 0.92) + 'px';
      stage.style.borderRadius = (18 - p * 14) + 'px';
    }
    var tx = p * (isM ? 60 : 46);
    if (t1) t1.style.transform = 'translateX(-' + tx + 'vw)';
    if (t2) t2.style.transform = 'translateX(' + tx + 'vw)';
    var fade = String(clamp(1 - p * 2.5, 0, 1));
    if (sub) sub.style.opacity = fade;
    if (cta) cta.style.opacity = fade;
    if (hint) hint.style.opacity = fade;
    if (collage) collage.style.opacity = String(clamp(1 - p * 0.7, 0.15, 1));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { isM = window.innerWidth < 768; onScroll(); });
  onScroll();
})();
