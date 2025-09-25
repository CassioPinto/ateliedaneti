const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = 3000;
const EXTENSIONS = ['.webp', '.jpg', '.png', '.jpeg'];
const WORD_CONVERSION = {
  'berco': 'berço',
  'bebe': 'bebê',
  'colecao': 'coleção'
};

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to handle extensionless image requests
app.use(async (req, res, next) => {
  const filePath = path.join(__dirname, 'public', req.path);

  // Check if the request path has no extension
  if (!path.extname(req.path)) {
    for (const ext of EXTENSIONS) {
      try {
        // Check if file exists with the extension
        const fullPath = filePath + ext;
        await fs.access(fullPath); // Check if file exists
        return res.redirect(req.path + ext); // Redirect to file with extension
      } catch (err) {
        // File with this extension doesn't exist, try the next one
        continue;
      }
    }
  }
  next(); // If no file is found, proceed to the next middleware or 404
});

function formatCategory(unformattedCategory) {
  let formattedCategory = unformattedCategory;

  for (i in WORD_CONVERSION) {
    if (formattedCategory.includes(i)) {
      formattedCategory = formattedCategory.replaceAll(i, WORD_CONVERSION[i]);
    }
  }

  formattedCategory = formattedCategory.split(' ').map(word => {
    return word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }).join(' ');

  return formattedCategory;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to render the catalog page
app.get('/catalog', async (req, res) => {
  try {
    // Path to the images/catalog directory
    const catalogDir = path.join(__dirname, 'public/images/catalog');

    // Read the directories in /images/catalog/
    const folders = await fs.readdir(catalogDir, { withFileTypes: true });
    const categories = folders
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {

        let formattedCategory = formatCategory(dirent.name);

        return {
          category: dirent.name,
          displayName: formattedCategory,
          description: `Conjuntos personalizados de ${formattedCategory.toLowerCase()} para o bebê.`
        };
      });

    // Generate the grid HTML dynamically
    const gridItems = categories
      .map(category => `
        <div class="item" data-category="${category.category}">
          <img src="" alt="${category.displayName}">
          <h3>${category.displayName}</h3>
        </div>
      `)
      .join('');

    // Full HTML response
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Catálogo - Ateliê da Neti</title>
          <link rel="stylesheet" href="styles.css">
        </head>
        <body>
          <div id="header"></div>
          <main>
            <section class="catalog">
              <div class="nossas-criacoes-title">
                <div class="nossas-criacoes-text">
                  <h2>Catálogo</h2>
                  <p>Chame a Neti no Whats para fazer o orçamento da sua personalização!</p>
                </div>
              </div>
              <div class="grid">
                ${gridItems}
              </div>
            </section>
          </main>
          <div id="floating-button"></div>
          <div id="footer"></div>
          <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
          <script>
            $(document).ready(function() {
                $("#header").load("header.html");
                $("#floating-button").load("floatingButton.html");
                $("#footer").load("footer.html");
                $(".item").click(function() {
                  const category = $(this).data("category");
                  window.location.href = '/category?category=' + category;
              });
              $.get('/api/catalog-images', function(data) {
                // Query all elements with data-category and set their img src
                $('[data-category]').each(function() {
                  const category = $(this).data('category'); // Get the data-category value
                  if (data[category]) { // Check if the category exists in the data object
                    $(this).find('img').attr('src', data[category]); // Set the img src
                  }
                });
              }).fail(function(err) {
                console.error('Error fetching images:', err);
              });
            });
          </script>
        </body>
      </html>
    `;

    // Send the HTML response
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reading catalog directories');
  }
});

// Dynamic category route
app.get('/category', async (req, res) => {
  const category = req.query.category;

  let formattedCategory = formatCategory(category);

  const folderPath = path.join(__dirname, 'public', 'images', 'catalog', category);
  let images = [];

  try {
    const files = await fs.readdir(folderPath);
    images = files
      .reverse()
      .filter(file => EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext)))
      .map(file => ({
        src: `/images/catalog/${category}/${file}`
      }));
  } catch (error) {
    console.error(`Error reading directory ${folderPath}:`, error);
  }

  // Serve a dynamic HTML response
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Catálogo - ${formattedCategory} - Ateliê da Neti</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div id="header"></div>
        <main>
          <section class="catalog">
            <div class="nossas-criacoes-title">
              <div class="nossas-criacoes-text">
                <h2>${formattedCategory}</h2>
                <p>Chame a Neti no Whats para fazer o orçamento da sua personalização!</p>
              </div>
            </div>
            <div class="grid">
              ${images.map(img => `
                <div class="catalog-item">
                  <img src="${img.src}">
                </div>
              `).join('')}
            </div>
          </section>
          <div id="imageModal" class="modal">
            <span class="close">&times;</span>
            <img class="modal-content" id="fullImage">
          </div>
        </main>
        <div id="floating-button"></div>
        <div id="footer"></div>
        <script src="catalog-items.js"></script>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script>
          $(document).ready(function() {
            $("#header").load("header.html");
            $("#floating-button").load("floatingButton.html");
            $("#footer").load("footer.html");
          });
        </script>
      </body>
    </html>
  `);
});

// New API endpoint to get the first image from each category
app.get('/api/catalog-images', async (req, res) => {
  try {
    const catalogPath = path.join(__dirname, 'public', 'images', 'catalog');
    const categories = await fs.readdir(catalogPath); // Get all subdirectories
    const categoryImages = {};

    for (const category of categories) {
      const categoryPath = path.join(catalogPath, category);
      const stats = await fs.stat(categoryPath);

      if (stats.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        // Filter image files and sort to ensure consistent order
        const imageFiles = files
          .filter(file => EXTENSIONS.includes(path.extname(file).toLowerCase()))
          .sort(); // Sort alphabetically for consistent "last" image
        // Select the last image, or use fallback if none found
        const lastImage = imageFiles.length > 0 ? imageFiles[imageFiles.length - 1] : null;
        categoryImages[category] = `/images/catalog/${category}/${lastImage}`
      }
    }

    res.json(categoryImages);
  } catch (err) {
    console.error('Error reading catalog:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});