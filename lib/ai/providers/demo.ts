import { getAiActionDefinition } from "@/lib/ai/actions";
import type { AiActionKey } from "@/types";

interface GenerateWithDemoInput {
  action: AiActionKey;
  text: string;
  title?: string;
}

const demoOutputs: Record<AiActionKey, string> = {
  command_summary: `KOMUTA ÖZETİ

Genel Durum:
Bugünün operasyon verileri demo modda değerlendirildi.

Öncelikli Aksiyonlar:
01 — Geciken ve bugün son tarihli işleri kontrol et.
02 — Finans kayıtlarındaki yaklaşan ödemeleri gözden geçir.
03 — Günün sonunda kısa bir değerlendirme notu oluştur.

Finans Uyarıları:
01 — Demo modda gerçek finans uyarısı gösterilmiyor.

Görev ve Takvim:
01 — Bugünkü görev ve planlarını komuta ekranından takip et.

Notlardan Çıkanlar:
01 — Son notlarını gün içinde tekrar gözden geçir.

Bugün İçin Net Plan:
01 — En önemli işi seç.
02 — Finans kontrolünü tamamla.
03 — Günlük özet notunu kaydet.`,
  summarize:
    "Bu notun kısa özeti: Ana konu tespit edildi, önemli noktalar sadeleştirildi ve takip edilmesi gereken aksiyonlar ayrıldı.",
  daily_summary: "",
  note_polish:
    "DÜZENLENMİŞ NOT\n\nAna fikir:\nNotun ana konusu daha okunabilir hale getirildi.\n\nDetaylar:\nVerilen bilgiler korunarak gereksiz dağınıklık toparlandı.\n\nAksiyonlar:\n01 — Notu gözden geçir.\n02 — Eksik tarih, tutar veya takip bilgisini tamamla.",
  shorten:
    "Mesaj netleştirildi. Ana fikir korunarak daha kısa ve vurucu hale getirildi.",
  premium:
    "Metin daha profesyonel, güçlü ve premium bir dille yeniden yapılandırıldı. Ana mesaj korunarak daha kurumsal bir ton verildi.",
  manager_report: `Genel Durum:

Not içeriği operasyonel değerlendirme için uygun hale getirildi.

Tamamlanan İşler:

* Girilen ana bilgiler düzenlendi.
* Öncelikli başlıklar ayrıştırıldı.

Bekleyen Konular:

* Detayların netleştirilmesi gerekiyor.

Riskler:

* Eksik veri varsa rapor kesin karar için yeterli olmayabilir.

Aksiyon Planı:

* Notu gözden geçir.
* Eksik bilgileri tamamla.
* Nihai raporu kaydet.`,
};

function ensureSentence(value: string): string {
  const clean = value.trim().replace(/\s+/gu, " ");
  if (!clean) return "";
  const normalized = clean.charAt(0).toLocaleUpperCase("tr-TR") + clean.slice(1);
  return /[.!?]$/u.test(normalized) ? normalized : `${normalized}.`;
}

function buildDailySummaryDemo(text: string): string {
  const cleanText = ensureSentence(text);
  const highlights = text
    .split(/[.!?;\n]+|,\s+(?=(?:sonra|ardından|daha sonra|akşam|öğlen|sabah)\b)/giu)
    .map(ensureSentence)
    .filter(Boolean)
    .slice(0, 3);
  const tomorrowNote = highlights.find((item) => /\byarın\b/iu.test(item));

  return [
    "GÜNÜN ÖZETİ",
    "",
    cleanText,
    "",
    "ÖNE ÇIKANLAR",
    "",
    ...(highlights.length
      ? highlights.map(
          (item, index) =>
            `${String(index + 1).padStart(2, "0")} — ${item}`,
        )
      : ["01 — Günlük not düzenli bir kayıt haline getirildi."]),
    "",
    "KISA DEĞERLENDİRME",
    "",
    "Bugünün kaydı, aktarılan gelişmelerin sırası ve anlamı korunarak düzenlendi.",
    "",
    "YARINA NOT",
    "",
    tomorrowNote ??
      "Günlük kayıtta yarın için açıkça belirtilen bir takip konusu bulunmuyor.",
  ].join("\n");
}

export async function generateWithDemo({
  action,
  text,
}: GenerateWithDemoInput): Promise<{
  output: string;
  provider: "demo";
}> {
  const definition = getAiActionDefinition(action);

  return {
    provider: "demo",
    output:
      definition.key === "daily_summary"
        ? buildDailySummaryDemo(text)
        : demoOutputs[definition.key],
  };
}
