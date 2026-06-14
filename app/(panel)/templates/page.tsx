import { TemplatesClient } from "@/components/templates/templates-client";
import { getCategories } from "@/features/notes/actions";
import { getTemplates } from "@/services/templates-service";

export const metadata = {
  title: "Şablonlar",
};

export const dynamic = "force-dynamic";

interface TemplatesPageProps {
  searchParams: Promise<{
    new?: string;
  }>;
}

export default async function TemplatesPage({
  searchParams,
}: TemplatesPageProps) {
  const [templatesResult, categoriesResult, query] = await Promise.all([
    getTemplates(),
    getCategories(),
    searchParams,
  ]);

  return (
    <TemplatesClient
      categories={categoriesResult.data ?? []}
      initialError={templatesResult.error ?? categoriesResult.error ?? ""}
      initialNewOpen={query.new === "1"}
      initialTemplates={templatesResult.data ?? []}
    />
  );
}
