import { getAiActionDefinition } from "@/lib/ai/actions";
import type { AiActionKey } from "@/types";

interface GenerateWithDemoInput {
  action: AiActionKey;
  text: string;
  title?: string;
}

const demoOutputs: Record<AiActionKey, string> = {
  summarize:
    "Bu notun kısa özeti: Ana konu tespit edildi, önemli noktalar sadeleştirildi ve takip edilmesi gereken aksiyonlar ayrıldı.",
  shorten:
    "Mesaj netleştirildi. Ana fikir korunarak daha kısa ve vurucu hale getirildi.",
  premium:
    "Metin daha profesyonel, güçlü ve premium bir dille yeniden yapılandırıldı. Ana mesaj korunarak daha kurumsal bir ton verildi.",
  manager_report: `# Genel Durum

Not içeriği operasyonel değerlendirme için uygun hale getirildi.

# Tamamlanan İşler

* Girilen ana bilgiler düzenlendi.
* Öncelikli başlıklar ayrıştırıldı.

# Bekleyen Konular

* Detayların netleştirilmesi gerekiyor.

# Riskler

* Eksik veri varsa rapor kesin karar için yeterli olmayabilir.

# Aksiyon Planı

* Notu gözden geçir.
* Eksik bilgileri tamamla.
* Nihai raporu kaydet.`,
};

export async function generateWithDemo({
  action,
}: GenerateWithDemoInput): Promise<{
  output: string;
  provider: "demo";
}> {
  const definition = getAiActionDefinition(action);

  return {
    provider: "demo",
    output: demoOutputs[definition.key],
  };
}
