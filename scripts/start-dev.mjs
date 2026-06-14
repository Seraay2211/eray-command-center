import net from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const host = "127.0.0.1";
const projectDir = path.resolve(__dirname, "..");
const nextCli = path.join(
  projectDir,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function findAvailablePort() {
  for (let port = 3000; port <= 3010; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error("3000-3010 araliginda kullanilabilir port bulunamadi.");
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.redirected) {
        return;
      }
    } catch {
      // The development server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Uygulama zamaninda hazir olmadi.");
}

function openBrowser(url) {
  if (process.env.NO_OPEN_BROWSER === "1") {
    return;
  }

  const browserProcess = spawn("cmd.exe", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  browserProcess.unref();
}

async function main() {
  const port = await findAvailablePort();
  const url = `http://${host}:${port}`;

  console.log("");
  console.log("Eray Command Center baslatiliyor...");
  console.log(`Adres: ${url}`);
  console.log("Durdurmak icin bu pencerede Ctrl+C tuslarina basin.");
  console.log("");

  const server = spawn(
    process.execPath,
    [nextCli, "dev", "--hostname", host, "--port", String(port)],
    {
      cwd: projectDir,
      stdio: "inherit",
      windowsHide: true,
    },
  );

  const stopServer = () => {
    if (!server.killed) {
      server.kill("SIGINT");
    }
  };

  process.on("SIGINT", stopServer);
  process.on("SIGTERM", stopServer);

  try {
    await waitForServer(url);
    console.log(`Tarayici aciliyor: ${url}`);
    openBrowser(url);
  } catch (error) {
    console.error(error.message);
    stopServer();
    process.exitCode = 1;
  }

  server.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
