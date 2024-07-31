const carousel = document.querySelector('.carousel-inner');
const images = carousel.querySelectorAll('img');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

let currentIndex = 0;

function showImage(index) {
    images.forEach(img => img.classList.remove('active'));
    images[index].classList.add('active');
}

function nextImage() {
    currentIndex++;
    if (currentIndex >= images.length) {
        currentIndex = 0;
    }
    showImage(currentIndex);
}

function prevImage() {
    currentIndex--;
    if (currentIndex < 0) {
        currentIndex = images.length - 1;
    }
    showImage(currentIndex);
}

nextBtn.addEventListener('click', nextImage);
prevBtn.addEventListener('click', prevImage);

// Cambiar imagen automáticamente cada 5 segundos
setInterval(nextImage, 5000);
