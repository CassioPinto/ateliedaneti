// Get modal and image elements
const modal = document.getElementById('imageModal');
const fullImage = document.getElementById('fullImage');
const closeBtn = document.querySelector('.close');

// Add click event to all images with 'clickable' class
document.querySelectorAll('.catalog-item img').forEach(img => {
  img.addEventListener('click', function() {
    modal.style.display = 'flex'; // Show modal
    fullImage.src = this.src;
    console.log('fullImage', fullImage);
  });
});

// Close modal when clicking the 'X'
closeBtn.addEventListener('click', function() {
  modal.style.display = 'none';
});

// Close modal when clicking outside the image
modal.addEventListener('click', function(event) {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});