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

const definitions: Record<AiActionKey, AiActionDefinition> = {
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

# Genel Durum

# Tamamlanan İşler

# Bekleyen Konular

# Riskler

# Aksiyon Planı

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
