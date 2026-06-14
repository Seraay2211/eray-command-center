# Eray Command Center

Kişisel operasyon, not, görev, takvim, rapor ve finans süreçlerini tek panelde yöneten Next.js + Supabase uygulaması.

## Gereksinimler

- Node.js 20.9 veya daha yeni bir sürüm
- npm
- Bir Supabase projesi
- İsteğe bağlı Gemini API anahtarı

## Yerel Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell kullanıyorsanız:

```powershell
Copy-Item .env.example .env.local
```

`.env.local` içine Supabase bilgilerinizi girin ve uygulamayı
`http://localhost:3000` adresinde açın. Windows üzerinde alternatif olarak
`AYARLA_SUPABASE.cmd` ve `BASLAT.cmd` dosyaları kullanılabilir.

## Ortam Değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
AI_PROVIDER=gemini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Publishable veya anon public key.
- `GEMINI_API_KEY`: Yalnızca sunucuda kullanılan opsiyonel Gemini anahtarı.
- `GEMINI_MODEL`: Varsayılan değer `gemini-2.5-flash`.
- `AI_PROVIDER`: Şu anda `gemini`; anahtar yoksa demo akışı kullanılır.
- `NEXT_PUBLIC_APP_URL`: Yerelde `http://localhost:3000`, production ortamında gerçek HTTPS adresi.

`service_role`, `sb_secret_...` veya başka bir sunucu sırrını
`NEXT_PUBLIC_` değişkenlerine koymayın. `.env.local` Git tarafından yok
sayılır ve repoya gönderilmemelidir.

## Kontroller

```bash
npm run lint
npm run build
npm run start
```

## Production

1. Projeyi bir GitHub reposuna gönderin.
2. Repoyu Vercel'e bağlayın ve framework olarak Next.js seçin.
3. `.env.example` içindeki değişkenleri Vercel Project Settings bölümüne ekleyin.
4. Supabase Authentication URL ayarlarına production domainini ve callback adresini ekleyin.
5. Supabase SQL şemasını çalıştırın ve private Storage bucket'larını doğrulayın.
6. Deploy sonrasında Auth, Dashboard, Notes, Finance, Calendar ve PWA akışlarını test edin.

Ayrıntılı adımlar için [Deployment Kılavuzu](docs/DEPLOYMENT.md), yayın öncesi
kontroller için [Production QA Listesi](docs/PRODUCTION_QA.md) dosyasını
kullanın.

## Temel Komutlar

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Paket komutları olmayan bir dosyaya bağlı değildir. Supabase eksikse giriş
ekranı Türkçe yapılandırma uyarısı gösterir; Gemini anahtarı eksikse desteklenen
AI ve OCR akışları güvenli demo sonucuna döner.
