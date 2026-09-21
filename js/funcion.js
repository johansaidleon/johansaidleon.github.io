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
