# Aplikasi Verifikasi dan Kompilasi Dokumen Gambar

Aplikasi web internal untuk menyederhanakan dan melacak proses pengunggahan, verifikasi, dan kompilasi gambar menjadi satu dokumen yang siap diunduh atau dicetak.

## Fitur Utama

### 🔐 Sistem Autentikasi & Role-Based Access Control
- **Admin**: Mengelola pengguna dan memantau semua aktivitas
- **Uploader**: Mengunggah gambar dan melihat riwayat upload
- **Verifikator**: Memverifikasi gambar dan membuat dokumen kompilasi

### 📤 Modul Upload Gambar
- Upload multiple gambar sekaligus
- Pengelompokan gambar menjadi paket
- Validasi file (ukuran, tipe)
- Preview gambar sebelum upload

### ✅ Modul Verifikasi
- Dashboard paket menunggu verifikasi
- Image viewer dengan zoom functionality
- Verifikasi per gambar (Sesuai/Tidak Sesuai)
- Status tracking real-time

### 📄 Modul Kompilasi Dokumen
- Pilih gambar yang telah disetujui
- Generate PDF otomatis
- Download dokumen kompilasi
- Print functionality

## Teknologi yang Digunakan

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite dengan Prisma ORM
- **Authentication**: NextAuth.js
- **File Upload**: React Dropzone
- **PDF Generation**: jsPDF, html2canvas
- **Icons**: Lucide React

## Instalasi & Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd aplikasi-verifikasi-dokumen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Buat user admin**
   ```bash
   node scripts/create-admin.js
   ```

5. **Buat sample users (opsional)**
   ```bash
   node scripts/create-sample-users.js
   ```

6. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```

7. **Akses aplikasi**
   - URL: http://localhost:3000
   - Login dengan kredensial yang telah dibuat

## Kredensial Default

### Admin
- **Email**: admin@example.com
- **Password**: admin123

### Uploader (Sample)
- **Email**: uploader@example.com
- **Password**: uploader123

### Verifikator (Sample)
- **Email**: verifier@example.com
- **Password**: verifier123

## Struktur Aplikasi

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin pages
│   ├── uploader/          # Uploader pages
│   ├── verifier/          # Verifier pages
│   └── dashboard/         # Dashboard
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                  # Utilities & configurations
├── prisma/               # Database schema & migrations
├── scripts/              # Database scripts
└── types/                # TypeScript type definitions
```

## Alur Kerja (Workflow)

1. **Admin** membuat akun untuk Uploader dan Verifikator
2. **Uploader** login dan mengunggah gambar dalam paket
3. **Verifikator** melihat daftar paket yang menunggu verifikasi
4. **Verifikator** memverifikasi setiap gambar (Sesuai/Tidak Sesuai)
5. **Verifikator** memilih gambar yang disetujui untuk dikompilasi
6. **Sistem** generate PDF dari gambar yang dipilih
7. **User** dapat download atau print dokumen PDF

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Packages
- `GET /api/packages` - Get packages (filtered by role)
- `POST /api/packages` - Create package
- `GET /api/packages/[id]` - Get package detail
- `PUT /api/packages/[id]` - Update package
- `DELETE /api/packages/[id]` - Delete package

### Verification
- `POST /api/packages/[id]/verify` - Verify package images

### Compilation
- `POST /api/packages/[id]/compile` - Compile package to PDF

## Konfigurasi

### Environment Variables
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_MAX_FILE_SIZE="10485760"
NEXT_PUBLIC_ALLOWED_FILE_TYPES="image/*,application/pdf"
```

### File Upload Configuration
- **Max file size**: 10MB per file
- **Max files**: 20 files per package
- **Allowed types**: PNG, JPG, JPEG, GIF, WEBP

## Database Schema

### Users
- `id`, `email`, `name`, `password`, `role`, `createdAt`, `updatedAt`

### Packages
- `id`, `title`, `description`, `status`, `uploaderId`, `verifierId`, `createdAt`, `updatedAt`

### Images
- `id`, `filename`, `originalName`, `filePath`, `fileSize`, `mimeType`, `isVerified`, `verificationStatus`, `packageId`

### Documents
- `id`, `title`, `filePath`, `fileSize`, `packageId`, `createdAt`, `updatedAt`

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set production environment variables
2. Configure database (PostgreSQL recommended)
3. Set up file storage (AWS S3, Cloudinary, etc.)
4. Configure NextAuth secret

## Troubleshooting

### Common Issues

1. **Database connection error**
   - Check DATABASE_URL in .env
   - Run `npx prisma migrate dev`

2. **File upload fails**
   - Check uploads directory permissions
   - Verify file size limits

3. **PDF generation error**
   - Ensure all images are accessible
   - Check file permissions

### Logs
- Check browser console for client-side errors
- Check server logs for API errors
- Use Prisma Studio for database inspection

## Kontribusi

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## Lisensi

MIT License - lihat file LICENSE untuk detail.

## Support

Untuk pertanyaan atau bantuan, silakan buat issue di repository atau hubungi tim development.