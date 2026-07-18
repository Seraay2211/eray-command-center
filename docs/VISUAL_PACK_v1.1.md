# Eray Command Center Visual Pack v1.1

## Neler değişti?

Visual Pack v1.1, mevcut tema altyapısını bozmadan daha zengin bir görünüm katmanı ekler. Arka plan, yüzey, yükseltilmiş yüzey, kenarlık, metin, vurgu, durum, finans ve grafik renkleri aynı tema üzerinden yönetilir. Gölge, parıltı ve vurgu geçişleri de tema ile birlikte değişir.

Tema ve yazı tipi seçimi anında uygulanır. Tercihler hesap ayarlarında ve güvenli yerel yedekte korunur. Mevcut temalar kullanılmaya devam eder.

## Visual Pack v1.1 temaları

1. Executive Noir: Grafit yüzeyler ve altın vurgu.
2. Midnight Sapphire: Derin lacivert ve safir odak.
3. Emerald Command: Finans kullanımına uygun zümrüt görünüm.
4. Obsidian Violet: Obsidyen siyahı ve menekşe parıltısı.
5. Arctic Focus: Ferah, buz mavisi açık tema.
6. Sandstone Pro: Sıcak kum tonlarında günlük kullanım.
7. Crimson Ledger: Finans risklerini öne çıkaran koyu kırmızı.
8. Carbon Cyan: Karbon yüzeylerde camgöbeği komuta vurgusu.
9. Olive Tactical: Düşük parlamalı zeytin odak teması.
10. Pearl Minimal: Temiz ve sade açık görünüm.
11. Royal Indigo: Profesyonel indigo ve mor görünüm.
12. Bronze Night: Sıcak bronz premium ofis görünümü.
13. Glacier Mint: Serin ve ferah mint açık tema.
14. Storm Blue: Ciddi ve okunabilir fırtına mavisi.
15. Neon Graphite: Kontrollü lime ve camgöbeği teknoloji görünümü.

## Tema grupları

- Koyu Temalar
- Açık Temalar
- Premium Temalar
- Odak Temaları
- Finans Temaları

Tema kartları mini uygulama yüzeyleri, vurgu noktaları, açıklama ve seçili durumunu gösterir. Tema Kütüphanesi mobilde tam ekran bir seçim alanına dönüşür.

## Yazı tipi seçenekleri

- Sistem
- Inter
- Manrope
- Plus Jakarta Sans
- Nunito Sans
- Roboto
- IBM Plex Sans
- Outfit
- Space Grotesk

Her seçenek Türkçe örnek metinle önizlenir. Uygulama kabuğu seçilen yazı ailesini anında kullanır. Harici yazı tipi indirilemediğinde okunabilir sistem karşılıkları devreye girer.

## Ayarlar deneyimi

Ayarlar; genel bakış, görünüm, dashboard düzeni, bildirimler, finans, akıllı asistan, veri, hesap ve gizlilik alanlarını korur. v1.1 ile üst alan, özet kartları, Tema Kütüphanesi ve yazı tipi önizlemeleri aynı premium görsel dilde birleştirildi.

## Finans deneyimi

Finans ekranının üst kısmı toplam borç, ödenen, kalan ve bu ayki yükü gösteren yeni bir komuta alanına dönüştürüldü. Borç kartları, taksit çizelgesi, ödeme kaydı, dekontlar ve detay paneli mevcut veri akışını kullanmaya devam eder. Gizlilik modu tutarları hem yeni üst alanda hem mevcut finans kartlarında maskeler.

## Dashboard deneyimi

Günlük karşılama alanı Visual Pack yüzeyleriyle güncellendi. Bugünkü görevler, takvim, ödeme sinyalleri, bildirimler, hızlı aksiyonlar, komuta özeti ve son hareketler mevcut kişiselleştirme seçenekleriyle çalışmaya devam eder.

## Mobil kontroller

Tema Kütüphanesi, ayarlar, finans ve dashboard 360 pikselden başlayan ekranlarda tek kolon davranışını korur. Ana aksiyonlar mobilde tam genişliğe geçer; yan paneller mevcut tam ekran veya alt panel davranışını sürdürür. iPhone güvenli alan ve mobil alt menü desteği korunur.

## Kurulum notu

Canlı Supabase projesinde yeni tema ve yazı tipi seçimlerinin cihazlar arasında kalıcı olması için `database/visual-pack-v1.1.sql` bir kez SQL Editor üzerinden çalıştırılmalıdır. Yama yalnızca izin verilen değer listesini genişletir; kullanıcı verilerini silmez veya dönüştürmez.

## Bilinen sınırlamalar

- Bazı yazı tipleri cihazda bulunmuyorsa seçeneğe özel yakın sistem yazı ailesi kullanılır.
- Gerçek cihazdaki Safari görünümü, `docs/IPHONE_PWA_TEST_CHECKLIST.md` ile ayrıca doğrulanmalıdır.

## Tema ve yazı tipi testi

1. Ayarlar > Görünüm Merkezi bölümünü aç.
2. Tema Kütüphanesini aç ve beş grubu sırayla kontrol et.
3. Visual Pack v1.1 temalarından birini seç; dashboard ve finans sayfasına geç.
4. Sayfayı yenile ve temanın korunduğunu doğrula.
5. Dokuz yazı tipini sırayla seç; Türkçe örnek metindeki farkı kontrol et.
6. Sayfayı yenile ve yazı tipi seçiminin korunduğunu doğrula.
