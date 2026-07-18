# iPhone PWA Test Kontrol Listesi

Bu kontrol listesi Eray Command Center'ın iPhone Safari ve ana ekran deneyimini doğrulamak için hazırlandı.

## Safari'den Ana Ekrana Ekleme

- iPhone Safari ile uygulama adresini aç.
- Dashboard veya Ayarlar içinde "Eray Command Center'ı iPhone'una Ekle" kartının göründüğünü doğrula.
- "Nasıl Eklenir?" düğmesine dokun ve adımların açıldığını kontrol et.
- Paylaş menüsünden "Ana Ekrana Ekle" akışını tamamla.
- "Şimdi Değil" seçilince kartın aynı oturumda gizlendiğini doğrula.
- "Bir Daha Gösterme" seçilince kartın kalıcı olarak gizlendiğini doğrula.

## Ana Ekrandan Açılış

- Ana ekrandaki ikonla uygulamayı aç.
- Uygulamanın tarayıcı sekmesi gibi değil, tam ekran açıldığını doğrula.
- Üst ve alt güvenli alanlarda içerik kesilmediğini kontrol et.
- Kurulum kartının ana ekrandan açılan uygulamada görünmediğini doğrula.

## İkon ve Manifest

- Ana ekranda Eray Command Center ikonunun net göründüğünü kontrol et.
- `manifest.json` dosyasının giriş yapılmadan erişilebilir olduğunu doğrula.
- `apple-touch-icon.png` dosyasının giriş yapılmadan erişilebilir olduğunu doğrula.

## Mobil Alt Menü

- Alt menüde Dashboard, Bugün, Notlar, Finans ve Daha seçeneklerini kontrol et.
- "Daha" menüsünün alttan açıldığını, dışarı dokununca kapandığını doğrula.
- Görevler, Takvim, Raporlar, Şablonlar, Düzen, AI Asistan, Ayarlar ve Hesap Merkezi bağlantılarını kontrol et.
- Route değişince "Daha" menüsünün kapandığını doğrula.

## Mobil Üst Bar

- Küçük ekranda marka ve aktif sayfa adının göründüğünü kontrol et.
- Arama düğmesinin komut paletini açtığını doğrula.
- Bildirim ve profil düğmelerinin taşmadığını kontrol et.

## Ana Akışlar

- Dashboard açılır ve kartlar tek kolonda taşmadan görünür.
- Notlar listesi açılır, hızlı kayıt ve tam ekran editör mobilde kullanılabilir.
- Finans detay panelinde borç, ödeme ve dekont alanları taşmadan görünür.
- Görevler ve Takvim sayfalarında kartlar yatay taşma üretmez.
- Şablonlar, Düzen, Raporlar, Ayarlar ve Hesap Merkezi sayfaları mobilde okunur kalır.

## Tema, Yazı Tipi ve Gizlilik

- Açık ve koyu temalarda yazıların okunabildiğini kontrol et.
- Seçilen yazı tipinin mobilde de uygulandığını doğrula.
- Gizlilik modu açıkken finans tutarlarının mobilde de gizlendiğini kontrol et.

## Çevrimdışı Uyarısı

- İnternet bağlantısını kapat.
- "Bağlantı yok" uyarısının göründüğünü doğrula.
- İnternet geri gelince uyarının kaybolduğunu kontrol et.

## Ekran Genişliği

- 360px genişlikte yatay kaydırma oluşmadığını doğrula.
- Form inputlarının iOS'ta otomatik yakınlaştırma yapmadığını kontrol et.
- Alt sabit butonların iPhone güvenli alanına takılmadığını doğrula.
