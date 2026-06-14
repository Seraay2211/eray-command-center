import type {
  AiReportSourceNote,
  AiReportSourceTask,
  ReportType,
} from "@/types";

interface ReportPromptInput {
  manualText: string;
  notes: AiReportSourceNote[];
  periodEnd: string | null;
  periodStart: string | null;
  reportType: ReportType;
  tasks: AiReportSourceTask[];
  title: string;
}

const reportFormats: Record<ReportType, string[]> = {
  daily: [
    "Genel Durum",
    "Tamamlanan İşler",
    "Devam Eden İşler",
    "Bekleyen Konular",
    "Riskler",
    "Aksiyon Planı",
    "Kısa Yönetici Özeti",
  ],
  weekly: [
    "Haftalık Genel Özet",
    "Öne Çıkan Gelişmeler",
    "Tamamlanan İşler",
    "Açık Kalan İşler",
    "Riskler",
    "Önümüzdeki Hafta Aksiyonları",
  ],
  operation: [
    "Genel Durum",
    "Operasyonel Gelişmeler",
    "Tamamlanan İşler",
    "Devam Eden İşler",
    "Blokajlar",
    "Aksiyon Planı",
  ],
  manager: [
    "Yönetici Özeti",
    "Operasyonel Durum",
    "Kritik Başlıklar",
    "Risk ve Blokajlar",
    "Karar Gerektiren Konular",
    "Aksiyon Planı",
  ],
  finance: [
    "Finansal / Operasyonel Genel Durum",
    "Bekleyen Konular",
    "Tamamlanan İşlemler",
    "Riskli Başlıklar",
    "Takip Edilecek Aksiyonlar",
  ],
  custom: ["Özet", "Detaylar", "Bulgular", "Riskler", "Aksiyonlar"],
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  daily: "Günlük Operasyon Raporu",
  weekly: "Haftalık Özet",
  operation: "Operasyon Raporu",
  manager: "Yönetici Raporu",
  finance: "Finans / Operasyon Notu",
  custom: "Özel Rapor",
};

export const REPORT_SYSTEM_INSTRUCTION =
  "Sen profesyonel bir operasyon raporlama asistanısın. Dağınık notlar ve görevlerden yöneticiye sunulabilir, doğru ve eyleme dönük Türkçe raporlar oluşturursun. Uydurma veri eklemezsin; eksik ve belirsiz konuları açıkça belirtirsin.";

export function buildReportPrompt({
  manualText,
  notes,
  periodEnd,
  periodStart,
  reportType,
  tasks,
  title,
}: ReportPromptInput): string {
  const format = reportFormats[reportType]
    .map((heading) => `# ${heading}`)
    .join("\n");
  const noteText =
    notes.length > 0
      ? notes
          .map(
            (note, index) =>
              `NOT ${index + 1}\nBaşlık: ${note.title}\nİçerik:\n${note.content ?? ""}`,
          )
          .join("\n\n")
      : "Not seçilmedi.";
  const taskText =
    tasks.length > 0
      ? tasks
          .map(
            (task, index) =>
              `GÖREV ${index + 1}\nBaşlık: ${task.title}\nAçıklama: ${task.description ?? ""}\nDurum: ${task.status ?? "bilinmiyor"}\nÖncelik: ${task.priority ?? "bilinmiyor"}\nSon tarih: ${task.due_date ?? "yok"}`,
          )
          .join("\n\n")
      : "Görev seçilmedi.";

  return `Aşağıdaki kaynaklardan ${REPORT_TYPE_LABELS[reportType]} hazırla.

İstenen başlık: ${title || "Uygun, kısa ve profesyonel bir başlık üret"}
Dönem: ${periodStart || "belirtilmedi"} - ${periodEnd || "belirtilmedi"}

Zorunlu bölüm düzeni:
${format}

Kurallar:
- Türkçe yaz.
- Resmi, profesyonel ve net bir dil kullan.
- Uydurma veri ekleme.
- Eksik veya belirsiz konuları açıkça belirt.
- Görev durumlarını ve önceliklerini dikkate al.
- Notlardaki önemli kararları koru.
- Gereksiz uzun yazma ancak önemli bilgileri atlama.
- Çıktıyı yalnızca geçerli JSON olarak ver.
- JSON şeması: {"title":"...","summary":"...","content":"markdown rapor içeriği"}

NOTLAR
${noteText}

GÖREVLER
${taskText}

MANUEL EK BİLGİ
${manualText || "Manuel bilgi eklenmedi."}`;
}

export function buildDemoReport(input: ReportPromptInput) {
  const headings = reportFormats[input.reportType];
  const completedTasks = input.tasks.filter(
    (task) => task.status === "done",
  );
  const openTasks = input.tasks.filter((task) => task.status !== "done");
  const title =
    input.title.trim() ||
    `${REPORT_TYPE_LABELS[input.reportType]} - ${
      input.periodEnd || new Date().toISOString().slice(0, 10)
    }`;
  const sourceSummary = `${input.notes.length} not, ${input.tasks.length} görev${
    input.manualText.trim() ? " ve manuel bilgi" : ""
  } değerlendirildi.`;
  const sectionContent = (heading: string) => {
    if (heading.includes("Tamamlanan")) {
      return completedTasks.length
        ? completedTasks.map((task) => `- ${task.title}`).join("\n")
        : "- Kaynaklarda tamamlanmış iş belirtilmedi.";
    }
    if (
      heading.includes("Devam") ||
      heading.includes("Açık") ||
      heading.includes("Bekleyen")
    ) {
      return openTasks.length
        ? openTasks
            .map(
              (task) =>
                `- ${task.title} (${task.status ?? "durum belirtilmedi"})`,
            )
            .join("\n")
        : "- Kaynaklarda açık iş belirtilmedi.";
    }
    if (heading.includes("Risk") || heading.includes("Blokaj")) {
      return "- Kaynaklarda açıkça belirtilen riskler gözden geçirilmelidir.\n- Eksik veriler karar kalitesini etkileyebilir.";
    }
    if (heading.includes("Aksiyon")) {
      return openTasks.length
        ? openTasks.map((task) => `- ${task.title} için takip yap.`).join("\n")
        : "- Yeni aksiyon gerektiren konu belirtilmedi.";
    }
    return `- ${sourceSummary}\n- ${
      input.notes[0]?.title ??
      input.manualText.trim() ??
      "Kaynaklarda ek gelişme belirtilmedi."
    }`;
  };

  return {
    title,
    summary: sourceSummary,
    content: headings
      .map((heading) => `# ${heading}\n\n${sectionContent(heading)}`)
      .join("\n\n"),
  };
}
