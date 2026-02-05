/**
 * Generate sitemap-movies.xml từ Ophim API
 * 
 * Usage:
 * node scripts/generate-sitemap.js
 * 
 * Note: Requires Node.js v18+ (built-in fetch)
 */

import fs from 'fs/promises';

const CONFIG = {
    API_BASE: 'https://ophim1.com/v1/api',
    SITE_URL: 'https://needflex.site',
    OUTPUT_FILE: './public/sitemap-movies.xml',
    MAX_PAGES: 50, // Fetch 50 pages = 800 movies (16 per page)
    ITEMS_PER_PAGE: 16,
};

/**
 * Escape XML special characters
 */
function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Format date to ISO 8601
 */
function formatDate(dateObj) {
    if (!dateObj?.time) return new Date().toISOString().split('T')[0];
    return new Date(dateObj.time).toISOString().split('T')[0];
}

/**
 * Fetch movies từ Ophim API
 */
async function fetchMovies(page = 1) {
    try {
        const url = `${CONFIG.API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`;
        console.log(`📡 Fetching page ${page}...`);

        const response = await fetch(url);
        const data = await response.json();

        return data.data?.items || [];
    } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error.message);
        return [];
    }
}

/**
 * Generate URL entries
 */
function generateUrlEntry(movie) {
    const slug = movie.slug;
    const tmdbId = movie.tmdb?.id || 0;
    const tmdbType = movie.tmdb?.type || 'movie';
    const url = `${CONFIG.SITE_URL}/trang-chu?movie=${slug}&tmdb_id=${tmdbId}&tmdb_type=${tmdbType}`;

    const posterUrl = movie.poster_url
        ? `https://img.ophim.live/uploads/movies/${movie.poster_url}`
        : `${CONFIG.SITE_URL}/android-chrome-512x512.png`;

    const thumbUrl = movie.thumb_url
        ? `https://img.ophim.live/uploads/movies/${movie.thumb_url}`
        : posterUrl;

    const title = escapeXml(movie.name);
    const description = escapeXml(
        movie.content?.replace(/<[^>]*>/g, '').substring(0, 200) ||
        `Xem phim ${movie.name} HD Vietsub miễn phí tại Needflex`
    );

    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${formatDate(movie.modified)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${posterUrl}</image:loc>
      <image:title>${title}</image:title>
    </image:image>
    <video:video>
      <video:title>${title}</video:title>
      <video:description>${description}</video:description>
      <video:thumbnail_loc>${thumbUrl}</video:thumbnail_loc>
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
      <video:publication_date>${formatDate(movie.created)}</video:publication_date>
    </video:video>
  </url>`;
}

/**
 * Generate sitemap
 */
async function generateSitemap() {
    console.log('🚀 Starting sitemap generation...');
    console.log(`📊 Will fetch ${CONFIG.MAX_PAGES} pages (≈${CONFIG.MAX_PAGES * CONFIG.ITEMS_PER_PAGE} movies)`);

    let allMovies = [];

    // Fetch movies from multiple pages
    for (let page = 1; page <= CONFIG.MAX_PAGES; page++) {
        const movies = await fetchMovies(page);
        if (movies.length === 0) break;

        allMovies = allMovies.concat(movies);
        console.log(`✅ Page ${page}: ${movies.length} movies (Total: ${allMovies.length})`);

        // Rate limiting - delay 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`📝 Generating XML for ${allMovies.length} movies...`);

    // Generate XML
    const urlEntries = allMovies.map(movie => generateUrlEntry(movie)).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

    // Write to file
    await fs.writeFile(CONFIG.OUTPUT_FILE, xml, 'utf-8');

    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📁 File: ${CONFIG.OUTPUT_FILE}`);
    console.log(`🎬 Total movies: ${allMovies.length}`);
    console.log(`📊 File size: ${(xml.length / 1024).toFixed(2)} KB`);

    // Update sitemap index lastmod
    await updateSitemapIndex();
}

/**
 * Update sitemap.xml lastmod
 */
async function updateSitemapIndex() {
    try {
        const indexPath = './public/sitemap.xml';
        let content = await fs.readFile(indexPath, 'utf-8');

        const today = new Date().toISOString().split('T')[0];
        content = content.replace(
            /<lastmod>[\d-]+<\/lastmod>/g,
            `<lastmod>${today}</lastmod>`
        );

        await fs.writeFile(indexPath, content, 'utf-8');
        console.log(`✅ Updated sitemap.xml lastmod to ${today}`);
    } catch (error) {
        console.error('❌ Error updating sitemap.xml:', error.message);
    }
}

// Run
generateSitemap().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

