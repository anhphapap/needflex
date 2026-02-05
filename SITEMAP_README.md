# 🗺️ Sitemap Guide - Needflex

## 📋 Files Created:

```
public/
├── sitemap.xml              # Sitemap Index (root)
├── sitemap-static.xml       # Static pages
├── sitemap-movies.xml       # Dynamic movies
└── robots.txt               # Robots configuration

scripts/
└── generate-sitemap.js      # Script to generate movie sitemap
```

---

## 🚀 Usage:

### 1️⃣ Generate Movie Sitemap:

```bash
# Install dependencies first (if not already)
npm install node-fetch

# Generate sitemap
npm run sitemap

# Or
npm run generate:sitemap
```

**Output:**
- ✅ Fetches 800 movies from Ophim API (50 pages × 16 movies)
- ✅ Generates `public/sitemap-movies.xml` với video + image markup
- ✅ Updates `public/sitemap.xml` lastmod date

---

### 2️⃣ Verify Sitemaps:

```bash
# Check if files exist
ls -la public/sitemap*.xml public/robots.txt

# Test locally
curl http://localhost:5173/sitemap.xml
curl http://localhost:5173/sitemap-static.xml
curl http://localhost:5173/sitemap-movies.xml
curl http://localhost:5173/robots.txt
```

---

### 3️⃣ Deploy to Production:

```bash
# Build and deploy
npm run build
# Upload to Cloudflare Pages / Vercel / etc.
```

**Verify production:**
- https://needflex.site/sitemap.xml
- https://needflex.site/sitemap-static.xml
- https://needflex.site/sitemap-movies.xml
- https://needflex.site/robots.txt

---

## 🔍 Submit to Search Engines:

### **Google Search Console:**

1. Go to: https://search.google.com/search-console
2. Select your property: `needflex.site`
3. Left menu → **Sitemaps**
4. Add new sitemap: `https://needflex.site/sitemap.xml`
5. Click **Submit**

**Alternative - Manual ping:**
```
https://www.google.com/ping?sitemap=https://needflex.site/sitemap.xml
```

---

### **Bing Webmaster Tools:**

1. Go to: https://www.bing.com/webmasters
2. Add your site: `needflex.site`
3. Navigate to **Sitemaps**
4. Submit: `https://needflex.site/sitemap.xml`

**Alternative - Manual ping:**
```
https://www.bing.com/ping?sitemap=https://needflex.site/sitemap.xml
```

---

### **Yandex Webmaster:**

1. Go to: https://webmaster.yandex.com
2. Add site → Submit sitemap

---

## ⏰ Automation (Recommended):

### **Option 1: GitHub Actions (Weekly)**

Create `.github/workflows/sitemap.yml`:

```yaml
name: Generate Sitemap

on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at 00:00
  workflow_dispatch:      # Manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install node-fetch
      - run: npm run sitemap
      - name: Commit and push
        run: |
          git config user.name "Bot"
          git config user.email "bot@needflex.site"
          git add public/sitemap*.xml
          git commit -m "chore: update sitemap [skip ci]"
          git push
```

---

### **Option 2: Cron Job (Server)**

```bash
# Edit crontab
crontab -e

# Add (runs every Sunday at 2 AM)
0 2 * * 0 cd /path/to/movie-web && npm run sitemap
```

---

### **Option 3: Cloudflare Worker (Advanced)**

Generate sitemap dynamically on-the-fly when accessed.

---

## 📊 Sitemap Stats:

### **sitemap.xml** (Index)
- 2 sitemaps listed
- Updates when child sitemaps update

### **sitemap-static.xml**
- ~15 static pages
- Priority: 0.3 - 1.0
- Changefreq: daily/weekly/monthly

### **sitemap-movies.xml**
- ~800 movies (can increase)
- Video + Image markup
- Priority: 0.8
- Changefreq: weekly

---

## 🔧 Configuration:

Edit `scripts/generate-sitemap.js`:

```javascript
const CONFIG = {
  MAX_PAGES: 50,        // Increase for more movies (max ~100)
  ITEMS_PER_PAGE: 16,   // API returns 16 per page
  // ...
};
```

**Limits:**
- Max URLs per sitemap: 50,000
- Max file size: 50MB (uncompressed)
- Current: ~800 URLs ≈ 100KB ✅

---

## ✅ Checklist:

- [x] Create sitemap.xml (index)
- [x] Create sitemap-static.xml
- [x] Create sitemap-movies.xml (template)
- [x] Create robots.txt
- [x] Create generate script
- [x] Add npm scripts
- [ ] Run `npm run sitemap` to generate
- [ ] Deploy to production
- [ ] Verify URLs accessible
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster
- [ ] Set up automation (optional)
- [ ] Monitor crawl stats

---

## 📚 Resources:

- [Google Sitemap Guidelines](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Bing Sitemap Guide](https://www.bing.com/webmasters/help/how-to-submit-sitemaps-82a15bd4)
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Video Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps)
- [Image Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)

---

## 🐛 Troubleshooting:

**Sitemap not found (404):**
- Check file exists in `public/` folder
- Verify deployment includes static files
- Check Cloudflare cache (purge if needed)

**0 URLs discovered:**
- Wait 24-48 hours after submission
- Check robots.txt allows crawling
- Verify sitemap XML is valid: https://www.xml-sitemaps.com/validate-xml-sitemap.html

**Script fails:**
- Install node-fetch: `npm install node-fetch`
- Check API is accessible: `curl https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat`
- Check permissions: `chmod +x scripts/generate-sitemap.js`

---

Good luck! 🚀

