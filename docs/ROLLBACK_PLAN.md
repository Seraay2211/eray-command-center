# Eray Command Center Rollback Planı

Bu plan, v1.0 yayını sonrası beklenmeyen bir sorun görülürse güvenli şekilde önceki kararlı sürüme dönmek için hazırlanmıştır.

## 1. Vercel Üzerinden Önceki Yayına Dönüş

1. Vercel panelinde ilgili projeyi aç.
2. **Deployments** bölümüne gir.
3. Sorunsuz çalışan önceki deployment kaydını seç.
4. **Promote to Production** veya eşdeğer geri alma aksiyonunu çalıştır.
5. Canlı URL açıldıktan sonra giriş, dashboard, finans ve ayarlar ekranlarını kontrol et.

## 2. Git Üzerinden Geri Dönüş Temeli

1. Yayına alınan commit bilgisini not et.
2. Geri dönülecek kararlı commit'i belirle.
3. Yeni bir düzeltme commit'i ile geri alma tercih edilir.
4. Zorunlu değilse geçmişi yeniden yazan işlemlerden kaçın.
5. Geri dönüş sonrası tekrar build ve smoke test çalıştır.

## 3. Ortam Değişkenleri İçin Dikkat

- Geri dönüş sırasında gizli anahtar değerlerini değiştirme.
- Production ortamındaki değişkenleri silmeden önce yedek ekran görüntüsü veya güvenli not al.
- Yanlış ortam değişkeni kullanıcı girişini, AI çıktısını veya dosya önizlemelerini etkileyebilir.
- Gizli değerler dokümana, commit mesajına veya issue metnine yazılmamalı.

## 4. Supabase / Veri Güvenliği Dikkati

- Destructive SQL çalıştırma.
- Tablo silme, kolon silme veya veri temizleme işlemi yapma.
- Eğer bir migration çalıştırıldıysa geri dönüş planı önce staging veya ayrı test ortamında denenmeli.
- Storage dosyaları ve kullanıcı kayıtları elle silinmemeli.

## 5. Rollback Sonrası Kontrol

- Giriş ve çıkış akışı.
- Dashboard yüklenmesi.
- Finans borç/taksit/ödeme görünümü.
- Not oluşturma ve tam ekran editör.
- Görev ve takvim açılışı.
- Ayarlar, tema ve gizlilik modu.
- Veri dışa aktarma.
- Mobil görünüm.

## 6. Rollback Sonrası Smoke Test

Rollback tamamlandıktan sonra `docs/FINAL_SMOKE_TEST_v1.md` dosyasındaki temel akışlardan en az şu alanlar kontrol edilmeli:

- Giriş / Kayıt
- Dashboard
- Finans
- Notlar
- Görevler
- Takvim
- Ayarlar
- Mobil
- PWA
- Güvenlik

