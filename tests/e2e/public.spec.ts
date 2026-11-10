import { expect, test } from "@playwright/test";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/agents",
  "/dashboard/risk",
  "/dashboard/insurance",
  "/dashboard/incidents",
  "/dashboard/monitoring",
  "/dashboard/ai-copilot",
  "/dashboard/settings",
  "/dashboard/settings/team",
  "/dashboard/settings/organisation",
  "/onboarding",
];

test.describe("protected routes", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects signed-out visitors to sign-in`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`/sign-in\\?next=${encodeURIComponent(route)}$`));
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    });
  }

  test("a forged session cookie does not open the dashboard", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "sb-forged-auth-token", value: "base64-eyJhY2Nlc3NfdG9rZW4iOiJmYWtlIn0", url: baseURL! },
    ]);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("the email confirmation endpoint rejects a bogus link and never redirects off-site", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=bogus&type=signup&next=https://evil.example");
    await expect(page).toHaveURL(/\/sign-in\?error=link_invalid$/);
    await expect(page.getByText("That link is invalid or has expired")).toBeVisible();
  });
});

test.describe("public site", () => {
  test("landing page shows the headline, both calls to action and no unsupported claims", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Understand the risks behind your AI agents." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" }).first()).toHaveAttribute("href", "/sign-up");
    await expect(page.getByRole("link", { name: "Explore the platform" }).first()).toHaveAttribute("href", "/demo");

    const text = (await page.locator("body").innerText()).toLowerCase();
    for (const claim of ["europe's first", "guarantee", "proprietary actuarial", "trusted by", "partnered with"]) {
      expect(text).not.toContain(claim);
    }
    expect(text).toContain("no insurer, broker or mga partnerships");
  });

  for (const [route, heading] of [
    ["/how-it-works", "A single record that links what an agent can do to what could go wrong."],
    ["/about", "Making AI-agent risk something an organisation can see, manage and discuss with an insurer."],
    ["/security", "Built so that one organisation can never see another's risk record."],
  ] as const) {
    test(`${route} renders`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });
  }

  test("unknown routes return 404", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("responses carry security headers", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-powered-by"]).toBeUndefined();
  });
});

test.describe("demo preview", () => {
  test("is clearly labelled as demo data and uses the fictional organisation", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText("Northstar Automation GmbH").first()).toBeVisible();
    await expect(page.getByText("Every name and figure on this page is synthetic.")).toBeVisible();
    expect(await page.getByText("Demo data", { exact: true }).count()).toBeGreaterThanOrEqual(8);
    await expect(page.getByText("Demo Developer").first()).toBeVisible();
  });

  test("does not link into the real workspace", async ({ page }) => {
    await page.goto("/demo");
    expect(await page.locator('a[href^="/dashboard"]').count()).toBe(0);
  });
});

test.describe("authentication forms", () => {
  test("sign-in validates in the browser, then fails safely on the server", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("Authentication is not configured", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Enter your password")).toBeVisible();

    await page.getByLabel("Email").fill("ada@example.eu");
    await page.getByLabel("Password").fill("anything");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Authentication is not configured for this deployment yet" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("sign-up rejects weak passwords in the browser", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Full name").fill("Ada Example");
    await page.getByLabel("Business email").fill("ada@example.eu");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Use at least 10 characters")).toBeVisible();
  });

  test("sign-up page links back to sign-in and preserves the invite destination", async ({ page }) => {
    await page.goto("/sign-up?next=/invite/abcdefghijklmnopqrstuvwxyz");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in?next=%2Finvite%2Fabcdefghijklmnopqrstuvwxyz",
    );
  });

  test("an off-site next parameter is discarded", async ({ page }) => {
    await page.goto("/sign-in?next=https://evil.example/login");
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/sign-up?next=%2Fdashboard");
  });

  test("invitation page asks signed-out visitors to sign in first", async ({ page }) => {
    await page.goto("/invite/abcdefghijklmnopqrstuvwxyz0123456789");
    await expect(page.getByRole("link", { name: "Sign in to accept" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept invitation" })).toHaveCount(0);
  });

  test("forgot-password page renders its form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
