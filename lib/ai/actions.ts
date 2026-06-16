import type { AiActionKey } from "@/types";

interface AiActionPromptInput {
  text: string;
  title: string;
}

export interface AiActionDefinition {
  buildPrompt: (input: AiActionPromptInput) => string;
  description: string;
  iconName?: string;
  key: AiActionKey;
  label: string;
  systemInstruction: string;
}

function getPromptTitle(title: string): string {
  return title.trim() || "Belirtilmedi";
}

function getCurrentDateLabel(): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date());
}

const definitions: Record<AiActionKey, AiActionDefinition> = {
  command_summary: {
    key: "command_summary",
    label: "AI Komuta Özeti",
    description:
      "Görev, takvim, finans ve notlardan bugünün öncelikli aksiyonlarını çıkarır.",
    iconName: "Bot",
    systemInstruction:
      "Sen kişisel operasyon komuta asistanısın. Verilen gerçek verilerden sade, uygulanabilir ve Türkçe komuta özeti üretirsin. Veri uydurmaz, finansal tavsiye vermezsin.",
    buildPrompt: ({ text }) => `Aşağıdaki komuta bağlamını temiz bir günlük operasyon özetine dönüştür.

Çıktı düzeni:

KOMUTA ÖZETİ

Genel Durum:

Öncelikli Aksiyonlar:

Finans Uyarıları:

Görev ve Takvim:

Notlardan Çıkanlar:

Bugün İçin Net Plan:

Kurallar:

* Türkçe yaz.
* Bilgi uydurma.
* Markdown işareti, tablo, kod bloğu veya JSON kullanma.
* Mümkünse gerçek kayıt adlarını, tutarları ve tarihleri kullan.

Komuta bağlamı:
${text}`,
  },
  summarize: {
    key: "summarize",
    label: "Özetle",
    description: "Notu kısa, net ve kullanılabilir şekilde toparlar.",
    iconName: "FileText",
    systemInstruction:
      "Sen profesyonel bir operasyon asistanısın. Verilen notu kısa, net ve kullanılabilir şekilde özetlersin. Gereksiz süsleme yapmazsın.",
    buildPrompt: ({ text, title }) => `Aşağıdaki notu özetle.
Kurallar:

* Kısa ve net olsun
* Önemli kararları koru
* Yapılacak iş varsa belirt
* Türkçe yaz

Başlık:
${getPromptTitle(title)}

Metin:
${text}`,
  },
  daily_summary: {
    key: "daily_summary",
    label: "Günün Özeti",
    description:
      "Dağınık günlük notlarını düzenli ve özenli bir günlük kaydına çevir.",
    iconName: "CalendarDays",
    systemInstruction:
      "Sen Türkçe günlük not editörüsün. Kullanıcının verdiği dağınık günlük notlarını özenli, düzenli ve zarif bir günlük özetine dönüştürürsün. Kullanıcının anlatımına sadık kalır, olay, kişi, yer, tarih veya görüşme uydurmazsın. Duygusal tonu varsa saygıyla korursun. Markdown başlıkları, markdown tabloları, kod blokları, JSON veya teknik biçimlendirme kullanmazsın. Yalnızca temiz, kullanıcıya gösterilebilir Türkçe metin üretirsin.",
    buildPrompt: ({ text }) => `Aşağıdaki dağınık günlük notunu düzenli bir günlük kaydına dönüştür.

Bugünün tarihi:
${getCurrentDateLabel()}

İstenen çıktı düzeni:

GÜNÜN ÖZETİ

Günü doğal bir akışla anlatan, kullanıcının verdiği bilgilere sadık bir paragraf.

ÖNE ÇIKANLAR

01 — Günün önemli bir gelişmesi
02 — Günün önemli bir gelişmesi
03 — Varsa günün önemli bir gelişmesi

KISA DEĞERLENDİRME

Günün temposunu ve öne çıkan yönünü, yalnızca verilen bilgilerden hareketle değerlendir.

YARINA NOT

Kullanıcı yarın için bir takip konusu belirttiyse yaz. Belirtmediyse yeni bir görev uydurma.

Kurallar:

* Türkçe yaz.
* Olay, kişi, yer, tarih veya toplantı uydurma.
* İş ve operasyon ayrıntılarını profesyonel, kişisel olayları doğal ve sıcak bir dille düzenle.
* Kısa girdide bile anlamlı fakat ölçülü bir sonuç üret.
* Markdown işaretleri, tablo, kod bloğu veya JSON kullanma.

Dağınık günlük notu:
${text}`,
  },
  note_polish: {
    key: "note_polish",
    label: "Notu Düzenle",
    description: "Dağınık notu anlamı koruyarak daha düzenli hale getirir.",
    iconName: "WandSparkles",
    systemInstruction:
      "Sen not düzenleme asistanısın. Kullanıcının dağınık notunu anlamı ve gerçek bilgileri koruyarak daha düzenli, okunabilir ve profesyonel Türkçeye çevirirsin. Bilgi uydurmazsın.",
    buildPrompt: ({ text, title }) => `Aşağıdaki notu düzenle.

İstenen çıktı:

DÜZENLENMİŞ NOT

Ana fikir:

Detaylar:

Aksiyonlar:

Kurallar:

* Türkçe yaz.
* Anlamı değiştirme.
* Kişi, tutar, tarih veya olay uydurma.
* Markdown işareti, tablo, kod bloğu veya JSON kullanma.

Başlık:
${getPromptTitle(title)}

Metin:
${text}`,
  },
  shorten: {
    key: "shorten",
    label: "Kısa ve vurucu yap",
    description: "Metni daha kısa, net ve etkili hale getirir.",
    iconName: "Zap",
    systemInstruction:
      "Sen kısa, net ve etkili metinler yazan profesyonel bir iletişim uzmanısın.",
    buildPrompt: ({ text, title }) => `Aşağıdaki metni kısa ve vurucu hale getir.
Kurallar:

* Maksimum 4-5 satır
* Gereksiz kelime kullanma
* Mesaj net olsun
* Telegram duyurusu gibi okunabilir olsun
* Türkçe yaz

Başlık:
${getPromptTitle(title)}

Metin:
${text}`,
  },
  premium: {
    key: "premium",
    label: "Daha premium yaz",
    description: "Anlamı koruyarak dili daha güçlü ve profesyonel yapar.",
    iconName: "WandSparkles",
    systemInstruction:
      "Sen premium marka dili, VIP iletişim ve kurumsal operasyon dili konusunda uzman bir metin editörüsün.",
    buildPrompt: ({ text, title }) => `Aşağıdaki metni daha premium, güçlü ve profesyonel hale getir.
Kurallar:

* Anlamı değiştirme
* Daha kaliteli ve ciddi bir dil kullan
* Gereksiz abartıya kaçma
* Türkçe yaz
* Telegram veya operasyon metni olarak kullanılabilir olsun

Başlık:
${getPromptTitle(title)}

Metin:
${text}`,
  },
  manager_report: {
    key: "manager_report",
    label: "Yönetici raporu oluştur",
    description: "Notları yöneticiye sunulabilir bir rapora dönüştürür.",
    iconName: "Bot",
    systemInstruction:
      "Sen üst düzey operasyon raporlama asistanısın. Dağınık notlardan yöneticiye sunulabilir net raporlar hazırlarsın.",
    buildPrompt: ({ text, title }) => `Aşağıdaki nottan yönetici raporu hazırla.

Format:

Genel Durum:

Tamamlanan İşler:

Bekleyen Konular:

Riskler:

Aksiyon Planı:

Kurallar:

* Resmi ve profesyonel Türkçe kullan
* Maddeler net olsun
* Belirsiz bilgi varsa "netleştirilmesi gerekiyor" diye belirt
* Uydurma veri ekleme

Başlık:
${getPromptTitle(title)}

Metin:
${text}`,
  },
};

export const AI_ACTIONS = Object.values(definitions);

export function getAiActionDefinition(action: AiActionKey): AiActionDefinition {
  return definitions[action];
}

export function isAiActionKey(value: string | null | undefined): value is AiActionKey {
  if (!value) {
    return false;
  }

  return value in definitions;
}
