import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "docs", "review", "pr-011.png");
const baseUrl = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const loginUrl = `${baseUrl}/login?redirectTo=%2Finbox`;
const inboxUrl = `${baseUrl}/inbox`;
const tempPassword = `Screenshot1A${Date.now()}`;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveScreenshotUser() {
  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (usersError) {
    throw usersError;
  }

  const user = usersData.users[0];
  if (!user?.email) {
    throw new Error("No Supabase users found for screenshot login.");
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: tempPassword,
  });

  if (updateError) {
    throw updateError;
  }

  return user.email;
}

async function main() {
  await mkdir(path.dirname(outputPath), { recursive: true });

  const email = await resolveScreenshotUser();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 120_000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', tempPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/inbox/, { timeout: 120_000 });
  await page.waitForSelector("h1", { timeout: 60_000 });

  const firstConversation = page.locator('a[href*="/inbox?"][href*="c="]').first();
  if (await firstConversation.count()) {
    await firstConversation.click();
    await page.waitForURL(/c=/, { timeout: 60_000 });
  }

  await page.waitForSelector("textarea", { timeout: 60_000 });
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: outputPath,
    fullPage: false,
    type: "png",
  });

  await browser.close();
  console.log(`Saved screenshot to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
