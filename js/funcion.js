// ---------- carrusel de certificaciones ----------
const carousel = document.querySelector('.carousel-inner');
if (carousel) {
  const images = carousel.querySelectorAll('img');
  const prevBtn = document.querySelector('.prev');
  const nextBtn = document.querySelector('.next');

  let currentIndex = 0;

  function showImage(index) {
    images.forEach(img => img.classList.remove('active'));
    images[index].classList.add('active');
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(currentIndex);
  }

  nextBtn.addEventListener('click', nextImage);
  prevBtn.addEventListener('click', prevImage);

  // Cambiar imagen automáticamente cada 5 segundos
  setInterval(nextImage, 5000);
}

// ---------- efecto de escritura en la terminal del hero ----------
const typedEl = document.querySelector('.typed');
if (typedEl) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fullText = 'contactar --now';

  if (prefersReducedMotion) {
    typedEl.textContent = fullText;
  } else {
    let i = 0;
    function typeChar() {
      if (i <= fullText.length) {
        typedEl.textContent = fullText.slice(0, i);
        i++;
        setTimeout(typeChar, 70);
      }
    }
    setTimeout(typeChar, 600);
  }
}

// ---------- animación de entrada al hacer scroll ----------
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

// ---------- contadores de estadísticas ----------
const counters = document.querySelectorAll('.stat-num[data-count]');
const runCounter = (el) => {
  const target = parseInt(el.dataset.count, 10);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = target; return; }
  const start = performance.now();
  const dur = 1200;
  const tick = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if (counters.length) {
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  } else {
    counters.forEach(runCounter);
  }
}

// ---------- filtros de proyectos ----------
const filterBtns = document.querySelectorAll('.filter');
const projectCards = document.querySelectorAll('#project-grid .project');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    projectCards.forEach(card => {
      const cats = (card.dataset.cat || '').split(' ');
      card.classList.toggle('hide', f !== 'all' && !cats.includes(f));
    });
  });
});

// ---------- resalta la sección activa en el menú ----------
const navLinks = document.querySelectorAll('nav ul li a:not(.nav-cta)');
const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && sections.length) {
  const so = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => so.observe(s));
}
