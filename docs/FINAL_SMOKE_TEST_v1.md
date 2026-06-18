# Eray Command Center v1.0 Final Smoke Test

Bu kontrol listesi v1.0 yayını öncesi hızlı ama kapsamlı son kontrol için hazırlanmıştır. Her satırda Durum alanı `Geçti`, `Kaldı` veya `Tekrar bakılacak` olarak işaretlenebilir.

## 1. Giriş / Kayıt

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Giriş ekranını aç | Marka teması bozulmadan görünür |  |  |
| Yeni hesap oluştur | Kullanıcı kayıt sonrası uygulamaya yönlenir |  |  |
| Mevcut hesapla giriş yap | Dashboard açılır |  |  |
| Çıkış yap | Kullanıcı giriş ekranına döner |  |  |

## 2. Dashboard

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Dashboard aç | Günlük komuta alanı yüklenir |  |  |
| Hızlı aksiyonlara tıkla | İlgili sayfa açılır |  |  |
| Gizlilik modu açıkken kontrol et | Finans tutarları maskelenir |  |  |
| Kişiselleştirilmiş widget görünürlüğü | Gizlenen bölümler görünmez |  |  |

## 3. Finans

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Finans sayfasını aç | Özet ve borç kartları görünür |  |  |
| Borç kartı seç | Detay paneli açılır |  |  |
| Ödeme ekle | Ödenen ve kalan tutar güncellenir |  |  |
| Ödeme sil | Tutarlar doğru geri alınır |  |  |

## 4. Taksit Sistemi

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Taksitli borç oluştur | Taksit planı oluşur |  |  |
| Taksit öde işaretle | İlgili taksit kapandı görünür |  |  |
| Kısmi ödeme gir | Ödeme tutarı doğru kaydedilir |  |  |
| Dashboard finans kartını kontrol et | Kalan tutar doğru görünür |  |  |

## 5. Notlar

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Notlar sayfasını aç | Liste ve arama alanı görünür |  |  |
| Yeni not oluştur | Not kaydedilir ve listede görünür |  |  |
| Tam ekran editörü aç | Başlık ve içerik alanı kullanılabilir |  |  |
| Şablondan not oluştur | Şablon içeriği temiz aktarılır |  |  |

## 6. Görevler

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Görevler sayfasını aç | Liste veya pano görünümü yüklenir |  |  |
| Görev oluştur | Yeni görev görünür |  |  |
| Durum değiştir | Kart güncel durumu gösterir |  |  |
| Arşivlenmiş görevleri kontrol et | Arşiv akışı çalışır |  |  |

## 7. Takvim

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Takvim sayfasını aç | Bugünün planı ve To-Do alanı görünür |  |  |
| Plan oluştur | Plan listede görünür |  |  |
| Hızlı To-Do ekle | Görev bugünün listesine eklenir |  |  |
| To-Do tamamla / geri al | Durum anında güncellenir |  |  |

## 8. AI Asistan

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| AI sayfasını aç | Metin işleme alanı görünür |  |  |
| Kısa çıktı üret | Türkçe ve temiz yanıt gelir |  |  |
| API anahtarı yokken dene | Demo/fallback mesajı düzgün görünür |  |  |
| Kaydetme aksiyonunu kontrol et | Sonuç not olarak kaydedilebilir |  |  |

## 9. AI Komuta Özeti

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Dashboard AI komuta özeti oluştur | Öncelikler ve uyarılar Türkçe gelir |  |  |
| Yüklenme sırasında bekle | Buton takılı kalmaz |  |  |
| Fallback durumunu kontrol et | Kullanıcı dostu açıklama görünür |  |  |

## 10. Günün Özeti

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Günün özeti sayfasını aç | Günlük akış görünür |  |  |
| AI özet oluştur | Bölümlü ve okunabilir çıktı gelir |  |  |
| Not olarak kaydet | Günlük not oluşturulur |  |  |

## 11. Bildirim Merkezi

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Bildirim panelini aç | Uyarılar listelenir |  |  |
| Finans uyarılarını kontrol et | Vade ve gecikme bilgisi anlaşılırdır |  |  |
| Gizlilik modu açıkken kontrol et | Hassas tutarlar maskelenir |  |  |

## 12. Ayarlar

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Ayarlar aç | Genel Bakış ilk ekran olarak görünür |  |  |
| Menü gruplarını gez | Tüm bölümler açılır |  |  |
| Sürüm etiketini kontrol et | `Sürüm: v1.0` görünür |  |  |

## 13. Görünüm Merkezi

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Tema değiştir | Tema tek tıkla uygulanır |  |  |
| Yazı tipi değiştir | Yazı tipi uygulanır |  |  |
| Yoğunluk ve radius ayarla | Arayüz tercihi korunur |  |  |

## 14. Tema Kütüphanesi

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Tema kütüphanesini aç | Tema kartları taşmadan görünür |  |  |
| Tema ara | Arama sonucu doğru filtrelenir |  |  |
| Açık/koyu tema kontrolü | Yazılar okunabilir kalır |  |  |

## 15. Hesap Merkezi

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Hesap merkezini aç | Profil kartı ve ana kontroller görünür |  |  |
| Şifre aksiyonunu başlat | Kullanıcı dostu bilgi mesajı görünür |  |  |
| Gelişmiş tercihleri aç | İkincil ayarlar erişilebilir |  |  |

## 16. Gizlilik Modu

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Gizlilik modunu aç | Hassas finans alanları maskelenir |  |  |
| Gizlilik modunu kapat | Tutarlar normal görünür |  |  |
| Dashboard ve bildirimleri kontrol et | Maskeleme tutarlı çalışır |  |  |

## 17. Veri ve Yedekleme

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Tam yedek indir | JSON dosyası oluşur |  |  |
| Notları dışa aktar | JSON/TXT çıktısı alınır |  |  |
| Finans dışa aktar | CSV dosyası oluşur |  |  |
| Türkçe karakterleri kontrol et | Dosyada karakterler bozulmaz |  |  |

## 18. Mobil

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| 360px genişlikte aç | Yatay taşma oluşmaz |  |  |
| Mobil menüyü aç/kapat | Menü overlay ile çalışır |  |  |
| Modal ve drawer kontrolü | Ekran dışına taşmaz |  |  |
| Butonları kontrol et | Dokunma alanları rahat kalır |  |  |

## 19. PWA

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Manifest kontrolü | Uygulama adı ve ikonlar doğru |  |  |
| Ana ekrana ekleme | Tarayıcı seçenek sunar |  |  |
| Standalone açılış | Uygulama gibi açılır |  |  |

## 20. Güvenlik

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Gizli dosyaları kontrol et | `.env` ve `.env.local` commit dışında kalır |  |  |
| Anahtar sızıntısı kontrolü | Gizli anahtar görünmez |  |  |
| Kullanıcı verisi kontrolü | Sayfalar yalnızca oturum sahibinin verisini gösterir |  |  |
| Hata mesajları | Teknik detaylar kullanıcıya gösterilmez |  |  |

## 21. Deploy

| Test | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| `npm run lint` | Başarılı tamamlanır |  |  |
| `npm run build` | Başarılı tamamlanır |  |  |
| Vercel deploy | Production build canlıya çıkar |  |  |
| Canlı URL smoke test | Login, Dashboard, Finans ve Ayarlar açılır |  |  |

