const express = require('express');
const serverless = require('serverless-http');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const EXTENSIONS = ['.webp', '.jpg', '.png', '.jpeg'];
const WORD_CONVERSION = {
  'berco': 'berço',
  'bebe': 'bebê',
  'colecao': 'coleção'
};

// Middleware for extensionless image requests
app.use(async (req, res, next) => {
  const filePath = path.join(__dirname, '../images', req.path);
  if (!path.extname(req.path)) {
    for (const ext of EXTENSIONS) {
      try {
        const fullPath = filePath + ext;
        await fs.access(fullPath);
        return res.redirect(req.path + ext);
      } catch (err) {
        continue;
      }
    }
  }
  next();
});

function formatCategory(unformattedCategory) {
  let formattedCategory = unformattedCategory;
  for (const key in WORD_CONVERSION) {
    if (formattedCategory.includes(key)) {
      formattedCategory = formattedCategory.replaceAll(key, WORD_CONVERSION[key]);
    }
  }
  return formattedCategory
    .split(' ')
    .map(word => word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

// Copy your /catalog, /category, and /api/catalog-images routes from app.js
app.get('/catalog', async (req, res) => {
  try {
    const catalogDir = path.join(__dirname, '../images/images/catalog');
    const folders = await fs.readdir(catalogDir, { withFileTypes: true });
    const categories = folders
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        category: dirent.name,
        displayName: formatCategory(dirent.name),
        description: `Conjuntos personalizados de ${formatCategory(dirent.name).toLowerCase()} para o bebê.`
      }));

    const gridItems = categories
      .map(category => `
        <div class="item" data-category="${category.category}">
          <img src="" alt="${category.displayName}">
          <h3>${category.displayName}</h3>
        </div>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Catálogo - Ateliê da Neti</title>
          <link rel="stylesheet" href="/styles.css">
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
              $("#header").load("/header.html");
              $("#floating-button").load("/floatingButton.html");
              $("#footer").load("/footer.html");
              $(".item").click(function() {
                const category = $(this).data("category");
                window.location.href = '/.netlify/functions/api/category?category=' + category;
              });
              $.get('/.netlify/functions/api/api/catalog-images', function(data) {
                $('[data-category]').each(function() {
                  const category = $(this).data('category');
                  if (data[category]) {
                    $(this).find('img').attr('src', data[category]);
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
    res.send(html);
  } catch (err) {
    res.status(500).send('Error reading catalog directories');
  }
});

app.get('/category', async (req, res) => {
  const category = req.query.category;
  const formattedCategory = formatCategory(category);
  const folderPath = path.join(__dirname, '../images/images/catalog', category);
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
        <script src="/catalog-items.js"></script>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script>
          $(document).ready(function() {
            $("#header").load("/header.html");
            $("#floating-button").load("/floatingButton.html");
            $("#footer").load("/footer.html");
          });
        </script>
      </body>
    </html>
  `);
});

app.get('/api/catalog-images', async (req, res) => {
  try {
    const catalogPath = path.join(__dirname, '../images/images/catalog');
    const categories = await fs.readdir(catalogPath);
    const categoryImages = {};

    for (const category of categories) {
      const categoryPath = path.join(catalogPath, category);
      const stats = await fs.stat(categoryPath);

      if (stats.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        const imageFiles = files
          .filter(file => EXTENSIONS.includes(path.extname(file).toLowerCase()))
          .sort();
        const lastImage = imageFiles.length > 0 ? imageFiles[imageFiles.length - 1] : null;
        categoryImages[category] = `/images/catalog/${category}/${lastImage}`;
      }
    }

    res.json(categoryImages);
  } catch (err) {
    console.error('Error reading catalog:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports.handler = serverless(app);