import { TaxonomyClient } from "@/components/taxonomy/taxonomy-client";
import {
  getManagedCategories,
  getManagedTags,
} from "@/services/taxonomy-service";

export const metadata = {
  title: "Düzen",
};

export const dynamic = "force-dynamic";

export default async function TaxonomyPage() {
  const [categoriesResult, tagsResult] = await Promise.all([
    getManagedCategories(),
    getManagedTags(),
  ]);

  return (
    <TaxonomyClient
      initialCategories={categoriesResult.data ?? []}
      initialError={categoriesResult.error ?? tagsResult.error ?? ""}
      initialTags={tagsResult.data ?? []}
    />
  );
}
