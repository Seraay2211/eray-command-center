# Eray Command Center v1.0.1 Post-Launch Monitoring

Bu belge canlı yayın sonrası ilk günlerde sorunları sakin, ölçülü ve hızlı şekilde takip etmek için hazırlanmıştır. Amaç yeni büyük özellik eklemek değil; v1.0 deneyimini güvenli tutmak ve gerekiyorsa küçük v1.0.1 yamalarını planlamaktır.

## İlk 24 Saat Kontrol Listesi

- [ ] Canlı URL açılıyor.
- [ ] Giriş ve çıkış akışı çalışıyor.
- [ ] Dashboard yükleniyor.
- [ ] Bildirim paneli okunabilir açılıyor.
- [ ] Finans borç ve taksit alanları açılıyor.
- [ ] Ödeme işaretleme ve ödeme silme akışı kontrol edildi.
- [ ] Notlar ve tam ekran editör açılıyor.
- [ ] Görevler ve takvim açılıyor.
- [ ] Ayarlar, tema ve yazı tipi değişimi çalışıyor.
- [ ] Mobil 360px görünümde yatay taşma yok.
- [ ] PWA manifest erişilebilir.
- [ ] Kullanıcıya teknik hata metni gösterilmiyor.

## Günlük Kontrol Listesi

- [ ] Yeni hata bildirimi var mı?
- [ ] Finans/taksit hesaplarında tutarsızlık bildirildi mi?
- [ ] Bildirim sayacı ve panel listesi tutarlı mı?
- [ ] AI çıktıları temiz Türkçe üretiyor mu?
- [ ] Veri dışa aktarma akışında sorun var mı?
- [ ] Mobil kullanıcı geri bildirimi var mı?
- [ ] Canlı deployment durumu sağlıklı mı?

## Kullanıcı Hatası Nasıl Kaydedilir?

Her kullanıcı bildirimi için şu şablonu kullan:

```text
Başlık:
Tarih:
Ekran:
Sorun:
Beklenen:
Adımlar:
Sıklık:
Öncelik:
Not:
```

Kullanıcıdan gizli bilgi, şifre, anahtar veya kişisel finans detayının ekran görüntüsünü istemeden önce maskeleme yapılmasını hatırlat.

## v1.0.1 Patch Kriterleri

v1.0.1 yalnızca şu durumlarda açılmalı:

- Canlı kullanımda ekranı bozan UI hatası.
- Finans/taksit hesaplamasında güvenilirliği etkileyen hata.
- Giriş, kayıt veya oturum akışını bozan sorun.
- Mobilde temel ekranların kullanılamaması.
- Bildirim, export veya AI alanında kullanıcıyı yanıltan sonuç.

Küçük metin iyileştirmeleri ve yeni fikirler sonraki planlama listesine alınabilir.

## Hata Sınıflandırması

### Kritik

- Kullanıcı giriş yapamıyor.
- Finans/taksit tutarları yanlış hesaplanıyor.
- Veri kaybı veya yanlış kullanıcı verisi riski var.
- Dashboard, Finans, Notlar veya Ayarlar tamamen açılmıyor.

### Orta

- Bir modüldeki aksiyon çalışıyor ama deneyim bozuk.
- Bildirim sayacı veya paneli yanıltıcı.
- Mobilde önemli bir alan zor kullanılıyor.
- AI çıktısı temizlenmeden görünüyor.

### Düşük

- Metin/etiket hatası.
- Küçük hizalama sorunu.
- Nadir görülen görsel taşma.
- İyileştirme önerisi.

## Rollback Ne Zaman Yapılmalı?

Rollback yalnızca şu durumlarda düşünülmeli:

- Yeni deployment sonrası giriş veya ana modüller kullanılamıyor.
- Finans verisinin doğruluğunu etkileyen kritik hata var.
- Build başarılı olsa bile canlıda yaygın beyaz ekran veya yönlendirme döngüsü oluşuyor.

Rollback adımları için `docs/ROLLBACK_PLAN.md` dosyasını kullan.

## Vercel Deployment Kontrolü

- [ ] Son deployment başarılı.
- [ ] Canlı URL doğru deployment'a işaret ediyor.
- [ ] Build loglarında kırıcı hata yok.
- [ ] Ortam değişkenleri production ortamında eksiksiz.
- [ ] PWA ve manifest canlı URL’de erişilebilir.

## Console Error Kontrolü

Tarayıcı geliştirici konsolunda şu başlıklara bak:

- Hydration hatası var mı?
- Bildirim paneli açılırken hata oluşuyor mu?
- AI veya export aksiyonlarında kullanıcıyı durduran hata var mı?
- Mobil görünümde layout hatası var mı?

Teknik logları kullanıcıya göstermeden, yalnızca geliştirici notu olarak kaydet.

## Mobil Kullanıcı Geri Bildirimi

Özellikle şu ekranlar kontrol edilmeli:

- Dashboard
- Bildirim paneli
- Finans detay paneli
- Taksit ödeme modalı
- Tam ekran not editörü
- Ayarlar / Görünüm Merkezi

## Finans / Taksit Özel Kontrol Maddeleri

- [ ] Taksit vadesi yaklaşan kayıtlar doğru uyarı üretiyor.
- [ ] Geciken taksitler kritik/önemli görünür.
- [ ] Gizlilik modu açıkken tutarlar maskelenir.
- [ ] Ödeme ekleme kalan tutarı doğru günceller.
- [ ] Ödeme silme ödenen tutarı doğru geri alır.

## AI Çıktı Kontrol Maddeleri

- [ ] Çıktı Türkçe.
- [ ] Ham JSON veya kod bloğu görünmüyor.
- [ ] Finans AI çıktısı tavsiye gibi değil, planlama desteği gibi duruyor.
- [ ] Gemini anahtarı yoksa fallback mesajı temiz görünüyor.
- [ ] Yüklenme durumu takılı kalmıyor.

