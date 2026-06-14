# Production QA Kontrol Listesi

Bu liste, Eray Command Center production yayını öncesinde ve sonrasında
uygulanacak temel kalite kontrollerini içerir.

## Otomatik Kontroller

- `npm install` tamamlanıyor.
- `npm run lint` hatasız tamamlanıyor.
- `npm run build` hatasız tamamlanıyor.
- `/api/health` yanıtında `app: "ok"` görülüyor.
- Health yanıtı yalnızca yapılandırma durumunu gösteriyor; anahtar veya secret
  döndürmüyor.

## Environment

- `NEXT_PUBLIC_SUPABASE_URL` tanımlı.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` tanımlı.
- `NEXT_PUBLIC_APP_URL` gerçek HTTPS production adresi.
- `GEMINI_API_KEY` yalnızca sunucu ortamında tutuluyor.
- Gemini anahtarı yokken AI ekranı demo uyarısı gösteriyor ve uygulama
  çökmüyor.
- `.env` ve `.env.local` Git tarafından yok sayılıyor.

## Supabase

- `database/schema.sql` yeni kurulumda başarıyla çalışıyor.
- Mevcut kurulumda `database/phase-18-production-polish.sql` bir kez
  çalıştırıldı.
- `user_settings.onboarding_completed` alanı mevcut.
- Notes, tasks, reports, planner, finance ve settings tablolarında RLS açık.
- `note-images` ve `finance-files` bucket'ları private.
- Kullanıcı yalnızca kendi kayıtlarını ve kendi Storage klasörünü görebiliyor.

## Auth

- Kayıt olma ve e-posta doğrulama akışı çalışıyor.
- Giriş, çıkış ve session yenileme çalışıyor.
- Hatalı bilgiler Türkçe ve anlaşılır mesaj gösteriyor.
- “Şifremi unuttum” e-postası gönderiliyor.
- Şifre yenileme bağlantısı `/auth/callback?next=/reset-password` üzerinden
  güvenli biçimde açılıyor.
- Yeni şifre kaydedildikten sonra giriş ekranına dönülüyor.

## Temel Kullanıcı Akışları

- İlk kullanıcı Dashboard'da üç adımlı onboarding kartını görüyor.
- Onboarding tamamlandığında yenileme sonrası tekrar görünmüyor.
- Ayarlar > Çalışma Alanı içinden onboarding yeniden açılabiliyor.
- Dashboard, Notes, Tasks, Reports, Calendar, Finance, Templates ve Settings
  sayfaları açılıyor.
- Boş listeler açıklama ve birincil aksiyon gösteriyor.
- Global loading, hata ve 404 ekranları tema ile uyumlu.
- PWA bilgilendirme kartı mobilde kapatılabiliyor ve yeniden görünmüyor.

## Veri ve Dosya Akışları

- Not oluşturma, düzenleme ve silme çalışıyor.
- Görev ve takvim To-Do akışları çalışıyor.
- Borç ve ödeme tutarları Türkçe para formatını koruyor.
- Dekont yükleme, signed URL önizleme, OCR ve silme çalışıyor.
- Dosya ve OCR hata durumları yükleme göstergesini takılı bırakmıyor.

## Görsel ve Mobil Kontrol

- 360 px genişlikte yatay taşma oluşmuyor.
- Mobil menü açılıyor, overlay ve route değişiminde kapanıyor.
- Fullscreen not editörü mobil klavyeyle kullanılabiliyor.
- Açık ve koyu temalarda metin, input, kart ve modal kontrastı okunabilir.
- Türkçe karakterler bozulmadan görünüyor.
- `/manifest.json`, `/sw.js` ve PWA ikonları `200` yanıtı veriyor.

## Deploy Sonrası

- Supabase Site URL production domainiyle eşleşiyor.
- Redirect URL listesinde production `/auth/callback` adresi var.
- Vercel Environment Variables Development, Preview ve Production kapsamlarına
  doğru dağıtıldı.
- Tarayıcı konsolunda tekrar eden auth, hydration veya network hatası yok.
- `/api/health` production domaininde erişilebilir.
