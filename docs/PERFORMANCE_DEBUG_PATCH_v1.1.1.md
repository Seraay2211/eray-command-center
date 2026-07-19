# Faz 33 - Performans ve Debug Yaması v1.1.1

## Denetlenen Alanlar

- App Router sunucu/istemci sınırları ve hidrasyon riski taşıyan tarih, tema ve tarayıcı API kullanımları
- Dashboard, Finans, Bildirim Merkezi, Ayarlar, tema/yazı tipi ve AI akışları
- Supabase sorgularındaki tekrarlar, limitler ve kullanıcı kapsamı
- Mobil taşma, güvenli alan, modal/drawer genişlikleri ve form boyutları
- Yükleme, boş durum ve hata ekranları
- Production logları, kullanılmayan importlar ve ağır ilk yükleme bağımlılıkları

## Uygulanan Düzeltmeler

### Console ve hidrasyon

- Ayarlar ilk render'ı yalnızca sunucudan gelen değerlerle başlatıldı. Yerel tema/yazı tipi tercihleri mount sonrasında birleştirilerek server/client HTML farkı önlendi.
- Yerel tercihlerin ilk effect sırasında sunucu değerleriyle ezilmesine yol açan yarış koşulu kaldırıldı.
- Takvim zaman referansı sunucuda bir kez üretilip istemciye aktarıldı; render sırasında değişen `Date.now()` başlangıç değeri kaldırıldı.
- Bildirim tarihleri `useSyncExternalStore` tabanlı dakikalık saat kaynağıyla güncelleniyor. İlk sunucu ve istemci snapshot'ı sabit kaldığı için göreli tarih metinleri hidrasyonu bozmuyor.

### Dashboard

- Layout ve Dashboard tarafından tekrarlanan ayar/bildirim başlangıç sorguları request düzeyinde önbelleklendi.
- Dashboard tarafından çağrılıp sonucu kullanılmayan finans uyarısı üretimi kaldırıldı.
- Bildirim listesi ve okunmamış sayısı tek snapshot çağrısında toplanıyor.
- Mevcut limitli özet sorguları, kısa not önizlemeleri ve paralel veri toplama yapısı korundu.

### Finans

- Borç-taksit ve ödeme-borç eşleştirmeleri render içinde tekrar tekrar filtrelemek yerine `Map` indeksleriyle memoize edildi.
- Ödeme ekleme, taksit ödeme ve ödeme silmede tam finans listesini tekrar çekmek yerine yalnızca özet ve son ödemeler yenileniyor.
- Borç, ödeme, taksit ve ödeme silme işlemlerine eşzamanlı ikinci isteği engelleyen ref tabanlı koruma eklendi.
- Mutasyonların `finally` blokları loading durumunu ve koruma kilitlerini her sonuçta serbest bırakıyor.
- Ağır AI finans paneli yalnızca açıldığında yüklenen dinamik bileşene çevrildi.
- Borç, ödeme, taksit, para hesapları, gizlilik modu ve kullanıcı kapsamı değiştirilmedi.

### Ayarlar, tema ve yazı tipi

- Sunucu ayarları request içinde Layout ve Dashboard arasında paylaşılıyor.
- Tema/yazı tipi seçimi mount sonrasında güvenli şekilde yerel tercihle birleşiyor ve değişiklikler anında belge köküne uygulanıyor.
- Giriş/kayıt ekranının sabit marka teması değiştirilmedi.
- Tema kartlarının mevcut `memo` ve filtre listelerinin mevcut `useMemo` optimizasyonları korundu.

### Bildirim Merkezi

- Dinamik bildirim sorguları liste ve sayaç için iki kez üretilmek yerine aynı snapshot içinde bir kez çalışıyor.
- Aynı tür ve kaynak kaydına ait dinamik/saklı bildirimler birleştirilirken tekilleştiriliyor.
- Görev son tarihi karşılaştırması İstanbul yerel tarih anahtarıyla düzeltildi; bugünkü görevler gecikmiş sayılmıyor.
- İlk panel verisi altı kayıtla sınırlandı; panel açıldığında en fazla otuz kayıt yükleniyor.
- Panel genişliği, mobil drawer davranışı, metin sarma ve gizlilik maskelemesi korunuyor.

### AI kararlılığı

- Gemini isteklerine 25 saniyelik zaman aşımı eklendi.
- Boş veya geçersiz JSON yanıtları teknik ayrıntı göstermeyen Türkçe hataya çevriliyor.
- Komuta özeti ve finans AI butonlarında aynı anda ikinci istek başlatılması engellendi.
- AI anahtarı ve sağlayıcı kullanımı sunucu tarafında kaldı; prompt ve yanıt loglanmıyor.

### Supabase sorguları

- Ayarlar ve ilk bildirim snapshot'ları request düzeyinde paylaştırıldı.
- Bildirim görev sorgusu yalnızca bugün/geçmiş, takvim sorgusu yalnızca bugün ve taksit sorgusu yedi günlük aralıkla limitli kaldı.
- Finans mutasyonları sonrasında gereksiz borç/taksit liste sorguları kaldırıldı.
- Liste sorgularındaki kullanıcı filtreleri ve mevcut limitler korundu. Detay için tam içeriğe ihtiyaç duyan Notes/Reports akışlarında riskli kolon daraltması yapılmadı.

### Mobil, yükleme ve hata durumları

- Mevcut safe-area, 16 px mobil input, drawer/modal genişlik ve yatay taşma kuralları denetlendi.
- Finans, Görevler ve Takvim route'larına tema değişkenlerini kullanan ortak yükleme iskeleti eklendi.
- Global ve panel hata ekranlarından teknik hata kodu kaldırıldı.
- Dashboard'un beklenmeyen servis hataları ham mesaj yerine güvenli Türkçe metne çevrildi.

### Production log ve kod temizliği

- Uygulama kaynaklarında `console.log`, `console.warn`, `console.error` ve `debugger` kalıbı bulunmadı.
- Hassas finans verisi, oturum bilgisi veya AI prompt/çıktısı loglanmıyor.
- Lint kullanılmayan import/değişken hatası olmadan tamamlandı.
- Finance AI panelinin başlangıç paketinden ayrılmasıyla ilk yükleme hafifletildi.

## Kalan Öneriler

- Gerçek production verisiyle Supabase Query Performance ekranından yavaş sorgular ayrıca izlenmeli.
- Bildirim sayısı ileride 100 saklı okunmamış kaydı aşarsa sayaç için tekilleştirmeyi sunucu tarafında yapan RPC düşünülebilir.
- Next.js build sırasında Node.js'in `module.register()` API'sine ait bağımlılık kaynaklı bir deprecation uyarısı görülebilir; uygulama derlemesini etkilemiyor. Bağımlılıklar güncellendiğinde yeniden kontrol edilmeli.
- Kimlik doğrulamalı ödeme/taksit ve tema kalıcılığı kontrolleri release öncesi gerçek kullanıcı hesabıyla uygulanmalı.

## Test

1. `npm run lint`
2. `npm run build`
3. Uygulamayı açıp login, Dashboard, Finans, Görevler, Takvim, Ayarlar ve Bildirim Merkezi akışlarını kontrol et.
4. Tema ve yazı tipini değiştirip sayfayı yenile; seçimin korunduğunu doğrula.
5. Finans'ta ödeme/taksit işlemlerini hızlı çift tıklamayla dene; tek kayıt oluştuğunu doğrula.
6. AI işlemlerini normal ve bağlantı kesintisi koşulunda dene; butonun takılı kalmadığını kontrol et.
7. `/manifest.json` isteğinin 200 döndüğünü doğrula.
8. 360, 375, 390, 393 ve 430 px genişliklerde yatay taşma ve kesilen aksiyon olmadığını kontrol et.

Bu faz veritabanı migrasyonu veya manuel Supabase SQL gerektirmez.
