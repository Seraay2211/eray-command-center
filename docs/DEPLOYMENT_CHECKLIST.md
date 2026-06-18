# Eray Command Center v1.0 Deployment Checklist

Bu liste v1.0 release candidate yayına alınmadan hemen önce kullanılmalıdır.

## 1. Yerel Kalite Kapısı

- [ ] `npm run lint` çalıştırıldı.
- [ ] `npm run build` çalıştırıldı.
- [ ] Build çıktısında kırıcı hata yok.
- [ ] `.env`, `.env.local`, log dosyaları veya gizli anahtarlar staged değil.
- [ ] `git status` kontrol edildi.

## 2. Commit ve Push

```bash
git status
git add .
git commit -m "Release v1.0"
git push
```

## 3. Vercel Kontrolü

- [ ] GitHub push sonrası Vercel deployment başladı.
- [ ] Framework ayarı Next.js olarak görünüyor.
- [ ] Build command `npm run build`.
- [ ] Environment Variables production ortamında tanımlı.
- [ ] Deploy başarılı tamamlandı.

## 4. Canlı URL Smoke Test

- [ ] Login ekranı açılıyor.
- [ ] Giriş yapılabiliyor.
- [ ] Dashboard açılıyor.
- [ ] Finans ekranı açılıyor.
- [ ] Taksit/ödeme alanları görünüyor.
- [ ] Ayarlar açılıyor.
- [ ] Tema değişikliği çalışıyor.
- [ ] Veri dışa aktarma çalışıyor.
- [ ] Mobil 360px görünümde yatay taşma yok.

## 5. Üretim Sonrası Kontrol

- [ ] Bildirim merkezi açılıyor.
- [ ] AI Komuta Özeti çalışıyor veya fallback gösteriyor.
- [ ] Günün Özeti çalışıyor veya fallback gösteriyor.
- [ ] PWA manifest erişilebilir.
- [ ] Ana ekrana ekleme davranışı güvenli.
- [ ] Hata ekranlarında teknik detay görünmüyor.

## 6. Rollback Hazırlığı

- [ ] Rollback planı hazır: `docs/ROLLBACK_PLAN.md`
- [ ] Bir önceki başarılı Vercel deployment biliniyor.
- [ ] Geri alınacak commit bilgisi not edildi.
- [ ] Rollback sonrası smoke test dosyası hazır: `docs/FINAL_SMOKE_TEST_v1.md`

