# Eray Command Center Production Deployment

Bu kılavuz GitHub, Vercel ve Supabase kullanarak production yayını hazırlamak içindir.

## 1. Yayın Öncesi Kontrol

Proje kökünde çalıştırın:

```bash
npm install
npm run lint
npm run build
```

Yerel production önizlemesi:

```bash
npm run start
```

Next.js 16 için Node.js 20.9 veya daha yeni bir sürüm kullanın.

## 2. Environment Variables

Yerelde `.env.example` dosyasını `.env.local` olarak kopyalayın. Production
değerlerini Vercel Project Settings > Environment Variables bölümüne ekleyin.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
AI_PROVIDER=gemini
NEXT_PUBLIC_APP_URL=https://uygulama-domaininiz.com
```

| Değişken | Zorunlu | Kapsam |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Evet | Development, Preview, Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Evet | Development, Preview, Production |
| `NEXT_PUBLIC_APP_URL` | Production için evet | Her ortamın kendi URL'si |
| `GEMINI_API_KEY` | Hayır | Yalnızca server, tercihen Sensitive |
| `GEMINI_MODEL` | Hayır | Varsayılan: `gemini-2.5-flash` |
| `AI_PROVIDER` | Hayır | Varsayılan: `gemini` |

Güvenlik kuralları:

- `.env.local` repoya gönderilmez.
- `NEXT_PUBLIC_` ile başlayan değerler tarayıcı paketinde görünür.
- `service_role`, `sb_secret_...` ve diğer özel anahtarlar frontend'e eklenmez.
- Preview ortamı için mümkünse ayrı Supabase projesi veya kontrollü test verisi kullanılır.
- Gemini anahtarı yoksa uygulama build sırasında çökmez; demo AI/OCR akışı devam eder.

## 3. Supabase Production Kurulumu

### Project URL ve Public Key

Supabase Dashboard > Project Settings > API Keys bölümünü açın:

- Project URL değerini `NEXT_PUBLIC_SUPABASE_URL` olarak kullanın.
- Publishable key veya legacy anon public key değerini
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` olarak kullanın.
- Secret veya service role key kullanmayın.

### SQL Şeması

Yeni bir Supabase projesi için:

1. SQL Editor bölümünü açın.
2. `database/schema.sql` dosyasının tamamını çalıştırın.
3. İşlem sonunda tablo, trigger, policy ve bucket kayıtlarını kontrol edin.

`database/schema.sql` güncel ve birleşik kurulum dosyasıdır. Daha eski bir
kurulumu aşamalı güncelliyorsanız yalnızca eksik faz dosyalarını sıra ile çalıştırın:

1. `database/phase-6-tasks.sql`
2. `database/phase-7-reports.sql`
3. `database/phase-8-settings.sql`
4. `database/phase-9-calendar.sql`
5. `database/phase-15-finance.sql`
6. `database/phase-15.1-finance-qa.sql`
7. `database/phase-15.3-finance-receipts.sql`
8. `database/phase-15.3-finance-attachments.sql`
9. `database/phase-16.1-notifications.sql`
10. `database/phase-18-settings-center.sql`
11. `database/phase-18-production-polish.sql`

Mevcut production veritabanında ihtiyaç olmayan faz dosyalarını tekrar çalıştırmayın.
Destructive migration veya tablo sıfırlama yapmayın.

### Auth URL Configuration

Supabase Dashboard > Authentication > URL Configuration:

- Site URL:
  `https://uygulama-domaininiz.com`
- Redirect URLs:
  `https://uygulama-domaininiz.com/auth/callback`
- Yerel geliştirme için ayrıca:
  `http://localhost:3000/auth/callback`
- Vercel Preview kullanılıyorsa gerekli preview callback adreslerini de ekleyin.

Custom domain eklendikten sonra Site URL ve callback kaydını gerçek domain ile güncelleyin.

### Storage Bucket Kontrolü

Supabase Dashboard > Storage bölümünde:

| Bucket | Durum | Kullanım |
| --- | --- | --- |
| `note-images` | Private | Not görselleri |
| `finance-files` | Private | Borç ve ödeme dosyaları, dekontlar |
| `finance-receipts` | Private, legacy akış kullanılıyorsa | Eski ödeme dekont akışı |

Public bucket kullanmayın. Dosya önizlemeleri signed URL üzerinden yapılır.
Storage policy'lerinde kullanıcının yalnızca kendi `user_id` klasörüne eriştiğini doğrulayın.

### RLS Kontrol Listesi

- Kullanıcıya ait tüm tablolarda RLS açık.
- Select, insert, update ve delete policy'leri `auth.uid() = user_id` kontrolü yapıyor.
- Notes, tasks, reports, planner, finance, attachments ve settings kayıtları kullanıcı bazlı.
- Storage object policy'leri klasörün ilk parçasını kullanıcı kimliğiyle eşleştiriyor.
- Anon kullanıcı panel verilerine erişemiyor.
- Frontend veya Vercel env içinde service role key bulunmuyor.

## 4. GitHub'a Yükleme

Proje klasöründe Git henüz başlatılmadıysa:

```bash
git init
git add .
git commit -m "Production deployment preparation"
git branch -M main
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

Push öncesi kontrol:

```bash
git status
git check-ignore .env.local
```

`.env.local` staged görünüyorsa commit etmeyin. `.next`, `node_modules` ve
TypeScript cache dosyaları da repoya gönderilmemelidir.

## 5. Vercel Deploy

1. Vercel Dashboard > Add New > Project bölümünü açın.
2. GitHub reposunu import edin.
3. Framework Preset: `Next.js`.
4. Root Directory: proje bu reponun kökündeyse `.`.
5. Install Command: `npm install`.
6. Build Command: `npm run build`.
7. Output Directory: boş bırakın; Next.js varsayılanı kullanılır.
8. Environment Variables bölümüne bu belgedeki değerleri ekleyin.
9. Deploy işlemini başlatın.

Git entegrasyonunda feature branch push'ları Preview, `main` branch push'ları
Production deployment oluşturabilir.

## 6. Production App URL

- Yerel: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Production: `NEXT_PUBLIC_APP_URL=https://uygulama-domaininiz.com`

Bu değer metadata taban URL'si ve e-posta doğrulama callback bağlantısında
kullanılır. Değer eksik veya geçersizse uygulama build sırasında çökmez; yerelde
`http://localhost:3000`, tarayıcıdaki auth akışında mevcut origin kullanılır.

## 7. Custom Domain

Vercel Project Settings > Domains bölümünden domaini ekleyin. Vercel'in gösterdiği
A, CNAME veya nameserver kayıtlarını domain sağlayıcınızın DNS paneline girin.
DNS doğrulandıktan sonra:

1. `NEXT_PUBLIC_APP_URL` değerini HTTPS custom domain ile güncelleyin.
2. Supabase Site URL ve Redirect URLs kayıtlarını güncelleyin.
3. Vercel'de yeni production deployment alın.

## 8. PWA Production Kontrolü

PWA dosyaları:

- `public/manifest.json`
- `public/sw.js`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-maskable-512.png`

Manifest `/manifest.json`, servis çalışanı `/sw.js` yolundan yayınlanır.
`start_url` ve `scope` `/`, görünüm `standalone` olarak ayarlıdır. Servis çalışanı
yalnızca production modunda kaydedilir. Vercel HTTPS sağladığı için PWA kurulumu
production ortamında desteklenir.

## 9. Deploy Sonrası Kontrol

- `/login` açılıyor ve Türkçe hata mesajları doğru.
- Kayıt doğrulama bağlantısı production callback adresine gidiyor.
- Giriş, çıkış ve session yenileme çalışıyor.
- Dashboard, Notes, Tasks, Reports, Calendar, Templates, Settings ve Finance açılıyor.
- Not görseli yükleme ve signed URL önizlemesi çalışıyor.
- Finans dosyası/dekont yükleme, silme ve OCR çalışıyor.
- Gemini anahtarı varken gerçek provider, yokken demo provider kullanılıyor.
- Tema ve mobil menü yenileme sonrasında korunuyor.
- `/manifest.json`, `/sw.js` ve PWA ikonları `200` yanıtı veriyor.
- Tarayıcı konsolunda tekrar eden auth veya network hatası yok.

Production yayını tamamlamadan önce son kez:

```bash
npm run lint
npm run build
```
