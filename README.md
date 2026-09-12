# DOWNLY - Universal Media Downloader

Web app pengunduh video & audio modern tanpa server backend (100% Client-Side SPA).

## Cara Menjalankan & Deploy di GitHub Tanpa Action

Ada 2 cara mudah untuk menjalankan atau mempublikasikan proyek ini di GitHub:

---

### Cara 1: Menggunakan GitHub Pages Langsung dari Branch (Paling Mudah)

Jika Anda ingin langsung aktif di GitHub Pages tanpa GitHub Actions:

1. **Jalankan Build secara Lokal:**
   ```bash
   npm install
   npm run build
   ```
2. Hasil build tersimpan di folder `dist/`. Di dalamnya terdapat:
   - `index.html`
   - `404.html` (fallback routing)
   - folder `assets/` (berisi `.js` bundle dan `.css`)

3. **Deploy folder `dist/` ke branch `gh-pages`:**
   ```bash
   git add dist -f
   git commit -m "Deploy client-side build"
   git subtree push --prefix dist origin gh-pages
   ```

4. **Aktifkan di GitHub:**
   - Masuk ke menu **Settings** repository GitHub Anda.
   - Klik **Pages** di sidebar kiri.
   - Di bagian **Build and deployment > Source**, pilih **Deploy from a branch**.
   - Pilih branch `gh-pages` dan folder `/ (root)`.
   - Simpan. Website Anda langsung live!

---

### Cara 2: Menjalankan Langsung di Komputer / Codespaces / Terminal

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev

# 3. Atau jalankan preview build produksi
npm run build
npm run preview
```

Buka URL `http://localhost:3000` di peramban Anda.
