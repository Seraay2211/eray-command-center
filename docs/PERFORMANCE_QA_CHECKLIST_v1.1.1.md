# Performans QA Kontrol Listesi v1.1.1

## Otomatik Kontroller

- [x] `npm run lint`
- [x] `npm run build`
- [x] TypeScript kontrolü (`next build` içinde)
- [x] Production route üretimi
- [x] Git diff whitespace kontrolü
- [x] Kaynaklarda gereksiz production console/debug ifadesi taraması
- [ ] Ayrı `npm run typecheck` komutu (projede tanımlı değil)
- [ ] Ayrı `npm test` komutu (projede tanımlı değil)

## Kimlik Doğrulama

- [ ] Login başarılı
- [ ] Register başarılı
- [ ] Oturumsuz panel erişimi login'e yönleniyor
- [ ] Login/Register sabit marka teması korunuyor
- [ ] Logout başarılı

## Dashboard

- [ ] Sayfa boş ekran olmadan skeleton ile açılıyor
- [ ] Kart, plan, finans ve bildirim verileri doğru
- [ ] Aynı bildirim/ayar başlangıç verisi gereksiz tekrar çekilmiyor
- [ ] AI Komuta Özeti tek istekle çalışıyor
- [ ] AI hatası Türkçe ve teknik olmayan mesaj gösteriyor

## Finans

- [ ] Borçlar ve mevcut ödemeler doğru görüntüleniyor
- [ ] Yeni ödeme sonrası tutarlar ve özet güncelleniyor
- [ ] Taksit ödeme çalışıyor
- [ ] Ödendi İşaretle akışı çalışıyor
- [ ] Ödeme silme tutarları doğru geri alıyor
- [ ] Hızlı çift tıklama iki kayıt oluşturmuyor
- [ ] Loading durumu başarı/hata sonrasında kapanıyor
- [ ] Gizlilik modu tutarları maskeleyebiliyor
- [ ] Dekont ve OCR alanları açılıyor
- [ ] Finance AI tek istekle çalışıyor veya güvenli hata gösteriyor

## Notes, Tasks ve Calendar

- [ ] Not listesi, detay ve tam ekran editör çalışıyor
- [ ] Not AI işlemleri başarısızlıkta takılı kalmıyor
- [ ] Görev oluşturma, durum değiştirme ve arşiv çalışıyor
- [ ] Takvim sayfası hidrasyon uyarısı üretmiyor
- [ ] Plan ve günlük To-Do akışları çalışıyor
- [ ] Finans, Görevler ve Takvim yükleme iskeletleri tema uyumlu

## Ayarlar ve Görünüm

- [ ] Ayarlar sayfası açılıyor
- [ ] Tema anında değişiyor
- [ ] Yazı tipi anında değişiyor
- [ ] Yenileme sonrası tema/yazı tipi korunuyor
- [ ] Ayarlar ilk açılışta eski değere geri sıçramıyor
- [ ] Tema Kütüphanesi filtreleri akıcı çalışıyor
- [ ] Dashboard kişiselleştirme korunuyor
- [ ] Hesap Merkezi, gizlilik ve veri alanları çalışıyor

## Bildirim Merkezi

- [ ] Panel desktopta normal genişlikte açılıyor
- [ ] Mobilde ekran dışına taşmıyor
- [ ] Metinler normal sarılıyor
- [ ] Okunmamış sayısı listeyle tutarlı
- [ ] Bugünkü görev gecikmiş olarak etiketlenmiyor
- [ ] Aynı kayıt için dinamik/saklı bildirim çift görünmüyor
- [ ] Okundu ve tümünü okundu işaretleme çalışıyor
- [ ] Gizlilik modunda finans tutarı açık gösterilmiyor

## AI ve Raporlar

- [ ] Günün Özeti AI çalışıyor veya güvenli fallback gösteriyor
- [ ] Finance AI çalışıyor veya güvenli fallback gösteriyor
- [ ] Note/Report AI çalışıyor veya güvenli fallback gösteriyor
- [ ] 25 saniye aşımında temiz Türkçe mesaj gösteriliyor
- [ ] Boş/bozuk sağlayıcı yanıtı teknik hata göstermiyor
- [ ] AI prompt ve çıktısı production loguna yazılmıyor

## Export, PWA ve Production

- [ ] Export/yedekleme tamamlanıyor
- [ ] `/manifest.json` 200 dönüyor
- [ ] PWA ikonlarında 401/404 yok
- [ ] Service worker kaydı normal
- [ ] Browser console'da normal kullanımda kırmızı hata yok
- [ ] Network panelinde kontrolsüz istek döngüsü yok
- [ ] Kullanıcıya stack trace, sorgu veya teknik hata kodu gösterilmiyor

## Mobil Genişlikler

Her genişlikte Dashboard, Finans, Ayarlar, Tema Kütüphanesi, Bildirimler, AI modal/drawer ve formlar kontrol edilmeli.

- [ ] 360 px: yatay scroll yok
- [ ] 375 px: yatay scroll yok
- [ ] 390 px: yatay scroll yok
- [ ] 393 px: yatay scroll yok
- [ ] 430 px: yatay scroll yok
- [ ] Butonlar kesilmiyor ve dokunma alanları yeterli
- [ ] Input fontları iPhone otomatik zoom oluşturmayacak boyutta
- [ ] Alt aksiyonlar safe-area arkasında kalmıyor
- [ ] Desktop düzeni regresyona uğramadı

## Release Sonucu

- [ ] Gerçek kullanıcı hesabıyla kritik manuel akışlar tamamlandı
- [ ] Production deploy sonrası Vercel logları kontrol edildi
- [ ] Supabase sorgu süreleri production veri hacmiyle kontrol edildi
- [ ] Release onayı verildi
