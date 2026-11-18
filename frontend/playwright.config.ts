import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const localEnv = fileURLToPath(new URL(".env.test.local", import.meta.url));
if (existsSync(localEnv)) process.loadEnvFile(localEnv);
const baseURL = process.env.JCRM_BASE_URL || "http://127.0.0.1:5173";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node ../scripts/dev.mjs",
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-gpu",
            "--renderer-process-limit=2",
            "--num-raster-threads=1",
          ],
        },
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        launchOptions: {
          args: [
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-gpu",
            "--renderer-process-limit=2",
            "--num-raster-threads=1",
          ],
        },
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop-webkit",
      grep: /@smoke/,
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "desktop-firefox",
      grep: /navigation @smoke/,
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: {
          firefoxUserPrefs: {
            "dom.ipc.processCount": 1,
            "dom.ipc.processCount.webIsolated": 1,
            "fission.autostart": false,
            "layers.acceleration.disabled": true,
          },
        },
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
});
