# GEO FLOW - File Upload Application

Aplikasi modern untuk upload file peta, PDF, dan screenshot dengan antarmuka yang user-friendly.

## Fitur

- 🗺️ **Upload Peta** - Upload file gambar peta dengan preview
- 📄 **Upload PDF** - Upload dokumen PDF dengan ikon yang sesuai
- 📸 **Upload Screenshot** - Upload screenshot dengan preview gambar
- 🎨 **UI Modern** - Antarmuka yang clean dan responsive menggunakan Tailwind CSS
- 📱 **Responsive** - Bekerja dengan baik di desktop dan mobile
- ⚡ **Real-time Progress** - Indikator progress saat upload
- 🔄 **Drag & Drop** - Upload file dengan drag and drop
- 👁️ **Preview** - Preview file sebelum dan sesudah upload
- 💾 **Download** - Download file yang sudah diupload
- 🗑️ **Delete** - Hapus file yang tidak diperlukan

## Teknologi

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Backend**: Next.js API Routes

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Buka [http://localhost:3000](http://localhost:3000) di browser

## Struktur Proyek

```
├── app/
│   ├── api/
│   │   ├── upload/route.ts          # API untuk upload file
│   │   ├── files/route.ts           # API untuk list file
│   │   └── files/[filename]/route.ts # API untuk delete file
│   ├── uploads/[...path]/route.ts   # Static file serving
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
├── components/
│   └── FileUpload.tsx               # Komponen upload utama
├── uploads/                         # Direktori file upload
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## API Endpoints

- `POST /api/upload` - Upload file
- `GET /api/files` - List semua file
- `DELETE /api/files/[filename]` - Hapus file
- `GET /uploads/[filename]` - Serve static file

## Penggunaan

1. **Upload File**: Drag & drop file ke area upload atau klik untuk memilih file
2. **Preview**: File gambar akan ditampilkan preview-nya
3. **Download**: Klik tombol download untuk mengunduh file
4. **Hapus**: Klik tombol X untuk menghapus file
5. **Lihat**: Klik tombol "Lihat" untuk membuka file di tab baru

## Batasan File

- Maksimal ukuran file: 10MB
- Format yang didukung: PNG, JPG, JPEG, GIF, WebP, PDF
- Maksimal 10 file per upload

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Lisensi

MIT License