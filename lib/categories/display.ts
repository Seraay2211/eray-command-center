type CategoryLike = {
  name: string;
  slug?: string | null;
} | null | undefined;

export function getCategoryDisplayName(category: CategoryLike) {
  if (!category) {
    return "Kategorisiz";
  }

  if (category.slug === "inbox") {
    return "H\u0131zl\u0131 Kay\u0131t";
  }

  return category.name;
}

export function getCategoryCollectionLabel(category: CategoryLike) {
  if (category?.slug === "inbox") {
    return "H\u0131zl\u0131 Kay\u0131tlar";
  }

  return getCategoryDisplayName(category);
}
