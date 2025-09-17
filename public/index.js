document.addEventListener('DOMContentLoaded', () => {
    const carouselInner = document.querySelector('.carousel-inner');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    let currentIndex = 0;
    const totalItems = document.querySelectorAll('.carousel-item').length;
    let autoSlideInterval;

    function updateCarousel() {
        const offset = -currentIndex * (100 / totalItems);
        carouselInner.style.transform = `translateX(${offset}%)`;
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            currentIndex = (currentIndex < totalItems - 1) ? currentIndex + 1 : 0;
            updateCarousel();
        }, 5000); // 10 seconds
    }

    function pauseAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    function resumeAutoSlide() {
        pauseAutoSlide(); // Clear any existing interval
        startAutoSlide(); // Start a new one
    }

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalItems - 1;
        updateCarousel();
        pauseAutoSlide();
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex < totalItems - 1) ? currentIndex + 1 : 0;
        updateCarousel();
        pauseAutoSlide();
    });

    // Pause on hover
    carouselInner.parentElement.addEventListener('mouseenter', pauseAutoSlide);
    carouselInner.parentElement.addEventListener('mouseleave', resumeAutoSlide);

    // Start the auto-slide when the page loads
    startAutoSlide();
});