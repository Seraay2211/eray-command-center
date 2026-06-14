import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const envPath =
  process.env.SUPABASE_CONFIG_PATH ?? path.join(projectDir, ".env.local");

function parseEnvironment(content) {
  const values = new Map();

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values.set(match[1], match[2].trim());
  }

  return values;
}

function isConfigured() {
  if (!fs.existsSync(envPath)) return false;

  const values = parseEnvironment(fs.readFileSync(envPath, "utf8"));
  return (
    validateUrl(values.get("NEXT_PUBLIC_SUPABASE_URL") ?? "") &&
    validateKey(values.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? "").valid
  );
}

function validateUrl(value) {
  try {
    const url = new URL(value);
    return (
      (url.hostname === "127.0.0.1" ||
        (url.protocol === "https:" &&
          url.hostname.endsWith(".supabase.co"))) &&
      url.hostname !== "proje-id.supabase.co" &&
      !url.hostname.includes("proje-id")
    );
  } catch {
    return false;
  }
}

function validateKey(value) {
  const normalized = value.toLowerCase();

  if (
    normalized.startsWith("sb_secret_") ||
    normalized.includes("service_role")
  ) {
    return {
      error:
        "Secret/service_role key kullanmayin. Publishable key veya legacy anon key gereklidir.",
      valid: false,
    };
  }

  if (value === "anon-key") {
    return {
      error:
        "Ornek 'anon-key' metnini degil, Supabase panelindeki gercek Publishable key degerini girin.",
      valid: false,
    };
  }

  const hasSupportedPrefix =
    value.startsWith("sb_publishable_") || value.startsWith("eyJ");

  return {
    error:
      value.length < 20 || !hasSupportedPrefix
        ? "Publishable key eksik veya gecersiz. Deger sb_publishable_ ya da eyJ ile baslamalidir."
        : "",
    valid: value.length >= 20 && hasSupportedPrefix,
  };
}

function getArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() ?? "" : "";
}

function saveConfiguration(url, key) {
  fs.writeFileSync(
    envPath,
    [
      `NEXT_PUBLIC_SUPABASE_URL=${url.replace(/\/+$/, "")}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`,
      "",
    ].join("\n"),
    "utf8",
  );
}

async function main() {
  if (process.argv.includes("--check")) {
    process.exitCode = isConfigured() ? 0 : 1;
    return;
  }

  const argumentUrl = getArgument("--url");
  const argumentKey = getArgument("--key");

  if (argumentUrl || argumentKey) {
    const keyResult = validateKey(argumentKey);

    if (!validateUrl(argumentUrl)) {
      throw new Error("Gecerli bir Supabase Project URL girilmedi.");
    }

    if (!keyResult.valid) {
      throw new Error(keyResult.error);
    }

    saveConfiguration(argumentUrl, argumentKey);
    console.log(`Supabase ayarlari kaydedildi: ${envPath}`);
    return;
  }

  console.log("");
  console.log("Eray Command Center - Supabase Ayarlari");
  console.log("----------------------------------------");
  console.log("Supabase Dashboard > Settings > API Keys bolumunu acin.");
  console.log("Project URL ve Publishable key degerlerini asagiya yapistirin.");
  console.log("Secret veya service_role key KULLANMAYIN.");
  console.log("");

  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    let url = "";
    while (!validateUrl(url)) {
      url = (await input.question("Project URL: ")).trim();
      if (!validateUrl(url)) {
        console.log(
          "Gecerli bir Supabase URL girin. Ornek: https://proje-id.supabase.co",
        );
      }
    }

    let key = "";
    while (true) {
      key = (await input.question("Publishable veya anon key: ")).trim();
      const result = validateKey(key);
      if (result.valid) break;
      console.log(result.error);
    }

    saveConfiguration(url, key);

    console.log("");
    console.log(`Supabase ayarlari kaydedildi: ${envPath}`);
    console.log(
      "Redirect URL olarak Supabase paneline http://localhost:3000/auth/callback eklemeyi unutmayin.",
    );
  } finally {
    input.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
