// ---------- carrusel de certificaciones + visor ampliado ----------
const carousel = document.querySelector('.carousel-inner');
if (carousel) {
  const images = Array.from(carousel.querySelectorAll('img'));
  const prevBtn = document.querySelector('.prev');
  const nextBtn = document.querySelector('.next');

  let currentIndex = 0;
  let lightboxOpen = false;
  let lastFocus = null;

  // --- visor (se crea por JS, no hace falta tocar el HTML) ---
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Vista ampliada de la certificación');
  lightbox.innerHTML = `
    <button class="lightbox-btn lightbox-close" aria-label="Cerrar">&times;</button>
    <button class="lightbox-btn lightbox-prev" aria-label="Anterior">&#10094;</button>
    <img alt="">
    <button class="lightbox-btn lightbox-next" aria-label="Siguiente">&#10095;</button>
    <p class="lightbox-count"></p>`;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('img');
  const lbCount = lightbox.querySelector('.lightbox-count');
  const lbClose = lightbox.querySelector('.lightbox-close');
  const lbPrev = lightbox.querySelector('.lightbox-prev');
  const lbNext = lightbox.querySelector('.lightbox-next');

  function updateLightbox() {
    const img = images[currentIndex];
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCount.textContent = `${currentIndex + 1} / ${images.length} · ${img.alt}`;
  }

  function openLightbox() {
    lastFocus = document.activeElement;
    lightboxOpen = true;
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightboxOpen = false;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  // --- carrusel ---
  function showImage(index) {
    images.forEach(img => img.classList.remove('active'));
    images[index].classList.add('active');
    if (lightboxOpen) updateLightbox();
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

  images.forEach(img => {
    img.tabIndex = 0;
    img.addEventListener('click', openLightbox);
    img.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox();
      }
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', prevImage);
  lbNext.addEventListener('click', nextImage);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox(); // clic en el fondo
  });

  document.addEventListener('keydown', e => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') nextImage();
    else if (e.key === 'ArrowLeft') prevImage();
    else if (e.key === 'Tab') {
      // mantiene el foco dentro del visor
      const items = [lbClose, lbPrev, lbNext];
      const i = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  });

  // Cambiar imagen automáticamente cada 5 segundos (en pausa con el visor abierto)
  setInterval(() => {
    if (!lightboxOpen) nextImage();
  }, 8000);
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
