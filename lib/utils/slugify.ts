const TURKISH_CHARACTERS: Record<string, string> = {
  "\u00c7": "c",
  "\u00d6": "o",
  "\u00dc": "u",
  "\u011e": "g",
  "\u0130": "i",
  "\u015e": "s",
  "\u00e7": "c",
  "\u00f6": "o",
  "\u00fc": "u",
  "\u011f": "g",
  "\u0131": "i",
  "\u015f": "s",
  I: "i",
};

export function slugifyTurkish(input: string): string {
  return input
    .trim()
    .replace(
      /[\u00c7\u00d6\u00dc\u011e\u0130\u015e\u00e7\u00f6\u00fc\u011f\u0131\u015fI]/g,
      (character) => TURKISH_CHARACTERS[character] ?? character,
    )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const slugify = slugifyTurkish;
