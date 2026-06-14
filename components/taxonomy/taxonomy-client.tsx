"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  updateCategory,
  updateTag,
} from "@/services/taxonomy-service";
import { getCategoryDisplayName } from "@/lib/categories/display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColorSwatchPicker } from "@/components/ui/color-swatch-picker";
import type { ManagedCategory, ManagedTag } from "@/types";

interface TaxonomyClientProps {
  initialCategories: ManagedCategory[];
  initialError: string;
  initialTags: ManagedTag[];
}

type CategoryDraft = {
  color: string;
  id?: string;
  name: string;
};

type TagDraft = {
  color: string;
  id?: string;
  name: string;
};

const defaultCategoryDraft: CategoryDraft = {
  color: "#8b5cf6",
  name: "",
};

const defaultTagDraft: TagDraft = {
  color: "#64748b",
  name: "",
};

export function TaxonomyClient({
  initialCategories,
  initialError,
  initialTags,
}: TaxonomyClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState(initialTags);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [categoryDraft, setCategoryDraft] =
    useState<CategoryDraft>(defaultCategoryDraft);
  const [tagDraft, setTagDraft] = useState<TagDraft>(defaultTagDraft);

  async function handleCategorySubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setIsSavingCategory(true);
    setError("");
    setNotice("");

    const result = categoryDraft.id
      ? await updateCategory(categoryDraft.id, {
          color: categoryDraft.color,
          name: categoryDraft.name,
        })
      : await createCategory({
          color: categoryDraft.color,
          name: categoryDraft.name,
        });

    setIsSavingCategory(false);

    if (result.error || !result.data) {
      setError(result.error ?? "Kategori kaydedilemedi.");
      return;
    }

    const savedCategory = result.data;
    setCategories((current) =>
      categoryDraft.id
        ? current.map((item) =>
            item.id === savedCategory.id ? savedCategory : item,
          )
        : [...current, savedCategory].sort((a, b) =>
            a.name.localeCompare(b.name, "tr"),
          ),
    );
    setCategoryDraft(defaultCategoryDraft);
    setNotice(categoryDraft.id ? "Kategori güncellendi." : "Kategori oluşturuldu.");
  }

  async function handleTagSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setIsSavingTag(true);
    setError("");
    setNotice("");

    const result = tagDraft.id
      ? await updateTag(tagDraft.id, {
          color: tagDraft.color,
          name: tagDraft.name,
        })
      : await createTag({
          color: tagDraft.color,
          name: tagDraft.name,
        });

    setIsSavingTag(false);

    if (result.error || !result.data) {
      setError(result.error ?? "Etiket kaydedilemedi.");
      return;
    }

    const savedTag = result.data;
    setTags((current) =>
      tagDraft.id
        ? current.map((item) =>
            item.id === savedTag.id
              ? { ...savedTag, usageCount: item.usageCount }
              : item,
          )
        : [...current, savedTag].sort((a, b) =>
            a.name.localeCompare(b.name, "tr"),
          ),
    );
    setTagDraft(defaultTagDraft);
    setNotice(tagDraft.id ? "Etiket güncellendi." : "Etiket oluşturuldu.");
  }

  async function handleDeleteCategory(category: ManagedCategory) {
    const confirmed = window.confirm(
      category.isInbox
        ? "Hızlı Kayıt kategorisi silinemez."
        : `${getCategoryDisplayName(category)} silinsin mi? Bağlı kayıtlar kategorisiz kalabilir.`,
    );

    if (!confirmed || category.isInbox) {
      return;
    }

    const result = await deleteCategory(category.id);
    if (result.error) {
      setError(result.error);
      return;
    }

    setCategories((current) => current.filter((item) => item.id !== category.id));
    setNotice("Kategori silindi.");
  }

  async function handleDeleteTag(tag: ManagedTag) {
    if (!window.confirm(`${tag.name} etiketi silinsin mi?`)) {
      return;
    }

    const result = await deleteTag(tag.id);
    if (result.error) {
      setError(result.error);
      return;
    }

    setTags((current) => current.filter((item) => item.id !== tag.id));
    setNotice("Etiket silindi.");
  }

  const unusedTags = tags.filter((tag) => tag.usageCount === 0);

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
          Düzen Merkezi
        </p>
        <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight">
          Kategoriler ve Etiketler
        </h1>
        <p className="app-muted mt-2 text-sm">
          Not, şablon ve görevlerde kullandığın sınıflandırmayı buradan yönet.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/15 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold app-text">Kategoriler</h2>
              <p className="mt-1 text-xs app-muted">
                Hızlı Kayıt kategorisi korunur. Diğer kategorileri isim ve renk ile yönetebilirsin.
              </p>
            </div>
            <Button
              onClick={() => setCategoryDraft(defaultCategoryDraft)}
              size="sm"
              variant="secondary"
            >
              <Plus className="size-3.5" />
              Yeni
            </Button>
          </div>

          <form
            className="mt-4 grid min-w-0 gap-3"
            onSubmit={(event) => void handleCategorySubmit(event)}
          >
            <input
              className="app-input h-11 rounded-xl border px-3 text-sm outline-none"
              onChange={(event) =>
                setCategoryDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              maxLength={120}
              placeholder="Kategori adı"
              value={categoryDraft.name}
            />
            <ColorSwatchPicker
              label="Kategori rengi"
              onChange={(color) =>
                setCategoryDraft((current) => ({ ...current, color }))
              }
              value={categoryDraft.color}
            />
            <div className="flex justify-end">
              <Button
                className="w-full sm:w-auto"
                disabled={isSavingCategory || !categoryDraft.name.trim()}
                size="sm"
                type="submit"
              >
                {categoryDraft.id ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {categories.map((category) => (
              <div
                className="flex min-w-0 flex-col gap-3 rounded-xl border p-3.5 app-border app-surface-2 sm:flex-row sm:items-center sm:justify-between"
                key={category.id}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <p className="truncate text-sm font-semibold app-text">
                      {getCategoryDisplayName(category)}
                    </p>
                    {category.isInbox ? (
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold text-violet-300 app-border">
                        Hızlı Kayıt
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs app-muted">
                    {category.usageCount} kullanım
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <Button
                    className="min-w-0"
                    onClick={() =>
                      setCategoryDraft({
                        color: category.color,
                        id: category.id,
                        name: category.name,
                      })
                    }
                    size="sm"
                    variant="secondary"
                  >
                    <Pencil className="size-3.5" />
                    Düzenle
                  </Button>
                  <Button
                    className="min-w-0 text-rose-300"
                    onClick={() => void handleDeleteCategory(category)}
                    size="sm"
                    variant="secondary"
                  >
                    <Trash2 className="size-3.5" />
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold app-text">Etiketler</h2>
              <p className="mt-1 text-xs app-muted">
                Etiketleri sade tutup kullanılmayanları kolayca görebilirsin.
              </p>
            </div>
            <Button
              onClick={() => setTagDraft(defaultTagDraft)}
              size="sm"
              variant="secondary"
            >
              <Plus className="size-3.5" />
              Yeni
            </Button>
          </div>

          <form
            className="mt-4 grid min-w-0 gap-3"
            onSubmit={(event) => void handleTagSubmit(event)}
          >
            <input
              className="app-input h-11 rounded-xl border px-3 text-sm outline-none"
              onChange={(event) =>
                setTagDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              maxLength={50}
              placeholder="Etiket adı"
              value={tagDraft.name}
            />
            <ColorSwatchPicker
              label="Etiket rengi"
              onChange={(color) =>
                setTagDraft((current) => ({ ...current, color }))
              }
              value={tagDraft.color}
            />
            <div className="flex justify-end">
              <Button
                className="w-full sm:w-auto"
                disabled={isSavingTag || !tagDraft.name.trim()}
                size="sm"
                type="submit"
              >
                {tagDraft.id ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </form>

          {unusedTags.length > 0 ? (
            <div className="mt-4 rounded-xl border p-3.5 app-border app-surface-2">
              <p className="text-xs font-semibold app-text">Kullanılmayan etiketler</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {unusedTags.map((tag) => (
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] font-semibold app-border"
                    key={tag.id}
                    style={{ color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {tags.map((tag) => (
              <div
                className="flex min-w-0 flex-col gap-3 rounded-xl border p-3.5 app-border app-surface-2 sm:flex-row sm:items-center sm:justify-between"
                key={tag.id}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <p className="truncate text-sm font-semibold app-text">
                      {tag.name}
                    </p>
                  </div>
                  <p className="mt-1 text-xs app-muted">
                    {tag.usageCount} kullanım
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <Button
                    className="min-w-0"
                    onClick={() =>
                      setTagDraft({
                        color: tag.color,
                        id: tag.id,
                        name: tag.name,
                      })
                    }
                    size="sm"
                    variant="secondary"
                  >
                    <Pencil className="size-3.5" />
                    Düzenle
                  </Button>
                  <Button
                    className="min-w-0 text-rose-300"
                    onClick={() => void handleDeleteTag(tag)}
                    size="sm"
                    variant="secondary"
                  >
                    <Trash2 className="size-3.5" />
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
