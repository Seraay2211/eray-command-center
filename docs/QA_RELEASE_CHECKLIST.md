# Eray Command Center - Release Candidate QA Checklist

Bu belge Faz 26 icin uc uca kalite kontrol matrisidir. Her madde manuel testte güncellenebilir.

Durum değerleri: `Bekliyor`, `Geçti`, `Kaldı`

## 1. Auth

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Login sayfasi | Marka temasiyla açılır, teknik hata göstermez. | Bekliyor |  |
| Hesap oluşturma | Kullanici dostu mesajlarla çalışır. | Bekliyor |  |
| Korumali sayfa | Oturum yoksa login sayfasina yönlendirir. | Bekliyor |  |
| Oturumdan cikis | Kullanici login sayfasina doner. | Bekliyor |  |
| Tema izolasyonu | Kullanici temasi login/register ekranini etkilemez. | Bekliyor |  |

## 2. Dashboard

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Premium dashboard | Hero, ozetler ve kartlar hatasiz yuklenir. | Bekliyor |  |
| Hizli aksiyonlar | Ilgili sayfalara doğru gider. | Bekliyor |  |
| Bugun dikkat edilecekler | Onemli gorev/finans/takvim kayitlarini gosterir. | Bekliyor |  |
| Kisisellestirme | Gizlenen widget tekrar render hissi yaratmaz. | Bekliyor |  |
| Bos veri durumu | Buyuk bos alan yerine sade yonlendirme gosterir. | Bekliyor |  |

## 3. Finance

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Normal borc oluşturma | Borc listede ve ozetlerde görünür. | Bekliyor |  |
| Borc duzenleme | Tutar, tarih ve durum guncellenir. | Bekliyor |  |
| Odeme ekleme | Odenen/kalan tutar aninda guncellenir. | Bekliyor |  |
| Odeme silme | Odenen tutar geri alinir, negatif olmaz. | Bekliyor |  |
| Para formati | Tutarlar `₺100.000,00` formatinda kalir. | Bekliyor |  |

## 4. Installments

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Taksitli borc oluşturma | Taksit plani olusur ve detayda görünür. | Bekliyor |  |
| Taksit odeme | Secilen taksit odendi olarak isaretlenir. | Bekliyor |  |
| Kismi odeme | Desteklenen alanda borc hesaplari bozulmaz. | Bekliyor |  |
| Taksit odemesi silme | Taksit durumu ve borc tutari geri alinir. | Bekliyor |  |
| Dashboard finans kartlari | Taksit degisiklikleri ozetlere yansir. | Bekliyor |  |

## 5. Notes

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Not oluşturma | Not listeye eklenir. | Bekliyor |  |
| Not duzenleme | Baslik, icerik, kategori ve etiketler korunur. | Bekliyor |  |
| Sabitle/favori | Durum degisiklikleri kartlara yansir. | Bekliyor |  |
| Arsiv | Arsiv filtresinde doğru görünür. | Bekliyor |  |
| Fullscreen editor | Kaydet, kapat ve kisayollar çalışır. | Bekliyor |  |

## 6. Tasks

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Gorev oluşturma | Gorev aktif listede görünür. | Bekliyor |  |
| Gorev tamamlama | Tamamlanan sekmesine tasinir. | Bekliyor |  |
| Gorev arsivleme | Arsiv filtresi doğru çalışır. | Bekliyor |  |
| Filtreler | Aktif, Bugun, Tamamlanan, Arsiv, Tumu çalışır. | Bekliyor |  |
| Bos durum | Gorev yokken temiz empty state görünür. | Bekliyor |  |

## 7. Calendar

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Plan oluşturma | Plan listede ve detayda görünür. | Bekliyor |  |
| Plan duzenleme | Tarih, tur, durum ve oncelik guncellenir. | Bekliyor |  |
| Plan silme | Liste ve dashboard bozulmadan guncellenir. | Bekliyor |  |
| Gunluk To-Do | Bugunun gorevleri checkbox ile çalışır. | Bekliyor |  |
| Mobil modal | 360px ekranda tasma yapmaz. | Bekliyor |  |

## 8. AI

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| AI Asistan | Bos inputta istek baslatmaz. | Bekliyor |  |
| AI Komuta Ozeti | Temiz Turkce cikti uretir veya demo fallback gosterir. | Bekliyor |  |
| Gunun Ozeti | Kopyala ve nota kaydet akislari çalışır. | Bekliyor |  |
| Finans AI | Finans/taksit verisini teknik detay gostermeden isler. | Bekliyor |  |
| Markdown temizligi | Kullaniciya ham JSON veya markdown tablo gostermemeli. | Bekliyor |  |

## 9. Notifications

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Bildirim ikonu | Sayac doğru görünür. | Bekliyor |  |
| Panel acma | Drawer tasma yapmadan açılır. | Bekliyor |  |
| Okundu yapma | Tek bildirim sayaci gunceller. | Bekliyor |  |
| Tumunu okundu yapma | Sayac sifirlanir. | Bekliyor |  |
| Ilgili kayda gitme | Aksiyon varsa doğru sayfaya gider. | Bekliyor |  |

## 10. Settings / Appearance

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Gorunum Merkezi | Ayarlar resetlenmeden açılır. | Bekliyor |  |
| Tema degisimi | Tek tikla uygulanir ve kalici olur. | Bekliyor |  |
| Font degisimi | Yenileme sonrasi korunur. | Bekliyor |  |
| Yogunluk/kose ayarlari | UI okunabilir kalir. | Bekliyor |  |
| Dashboard kisisellestirme | Secimler kaybolmaz. | Bekliyor |  |

## 11. Theme Library

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Tema kutuphanesi | Drawer/modal hizli açılır. | Bekliyor |  |
| Arama | Tema listesi takilmadan filtrelenir. | Bekliyor |  |
| Kategori filtreleri | Koyu, Acik, Renkli, Premium, Sade çalışır. | Bekliyor |  |
| Secili tema | Secili gostergesi doğru görünür. | Bekliyor |  |
| Mobil gorunum | Tema kartlari 360px ekranda tasmaz. | Bekliyor |  |

## 12. Export / Backup

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Not export | Dosya iner, Turkce karakterler korunur. | Bekliyor |  |
| Finans export | Gizli anahtar veya oturum verisi içermez. | Bekliyor |  |
| Gorev export | Bos veri durumunda takilmaz. | Bekliyor |  |
| Tam yedek | Sadece kullanici verisini icerir. | Bekliyor |  |
| Loading state | Buton takili kalmaz. | Bekliyor |  |

## 13. Mobile

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| 360px Dashboard | Yatay scroll olusmaz. | Bekliyor |  |
| 360px Finance | Drawer ve formlar karta/dikey akisa uyar. | Bekliyor |  |
| 360px Notes | Liste ve editor tasmaz. | Bekliyor |  |
| 360px Settings | Segment kontroller ve drawer tasmaz. | Bekliyor |  |
| 360px Notifications | Panel ekran disina cikmaz. | Bekliyor |  |

## 14. PWA

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Manifest | `Eray Command Center` adi ve iconlar gecerlidir. | Bekliyor |  |
| Icon yolları | 192, 512 ve maskable iconlar public altinda vardir. | Bekliyor |  |
| Standalone | Ana ekrana ekleme icin metadata bozulmaz. | Bekliyor |  |
| Service worker | Varsa uygulamayi kirmadan kaydolur. | Bekliyor |  |
| Build | PWA dosyalari build hatasi uretmez. | Bekliyor |  |

## 15. Security / Production UI

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Teknik kelime taramasi | Normal kullaniciya teknik sistem terimi gorunmez. | Bekliyor |  |
| Gizli anahtar taramasi | Client kodda service role veya gizli key yoktur. | Bekliyor |  |
| Console log | Uygulama kodunda hassas veri loglanmaz. | Bekliyor |  |
| Hata mesajlari | Raw hata/stack yerine Turkce mesaj görünür. | Bekliyor |  |
| Auth veri guvenligi | Korumali veri oturumsuz gorunmez. | Bekliyor |  |

## 16. Final Build

| Test adı | Beklenen sonuç | Durum | Not |
| --- | --- | --- | --- |
| Lint | `npm run lint` basarili olur. | Bekliyor |  |
| Build | `npm run build` basarili olur. | Bekliyor |  |
| Typecheck | Script varsa basarili olur; yoksa raporlanir. | Bekliyor |  |
| Test | Script varsa basarili olur; yoksa raporlanir. | Bekliyor |  |
| Git durumu | Degisiklikler bilerek ve acik sekilde listelenir. | Bekliyor |  |
