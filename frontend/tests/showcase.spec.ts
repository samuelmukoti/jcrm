import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Snapshot } from "../src/types";
const workspace = async (page: Page): Promise<Snapshot> =>
  (await page.request.get("/api/workspace")).json();
async function open(page: Page, path = "/") {
  await page.goto(path);
  await expect(
    page
      .locator(".page-heading h1, .record-heading h1, .ai-view-intro h1")
      .first(),
  ).toBeVisible();
}
function primary(data: Snapshot) {
  const account = data.accounts.find((a) => a.name === "Acme")!;
  return data.deals.find(
    (d) => d.accountId === account.id && d.stage === "Proposal",
  )!;
}

test("the primary story persists, explains its sources, and supports undo @smoke", async ({
  page,
}) => {
  await open(page);
  const before = await workspace(page),
    deal = primary(before);
  await page.getByRole("button", { name: "See the opportunity" }).click();
  await expect(page.locator(".record-heading h1")).toHaveText(
    "Enterprise rollout",
  );
  await page.getByRole("button", { name: "Draft a follow-up" }).click();
  const draft = page.getByRole("textbox", { name: "Follow-up draft" });
  await expect(draft).toHaveValue(/Jordan/);
  await draft.fill(
    (await draft.inputValue()) + "\n\nHappy to help with the next step.",
  );
  await page.getByRole("button", { name: "Save as note", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved as a note");
  await expect(
    page.getByRole("button", { name: "Create next step" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Create next step" }).click();
  await expect(page.getByRole("dialog")).toContainText("A new next step");
  await page
    .getByRole("textbox", { name: "Next step", exact: true })
    .fill("Follow up on the Acme commercial review");
  await page.getByRole("button", { name: "Save next step" }).click();
  await expect(page.getByRole("status")).toContainText("Next step scheduled");
  await page.getByLabel("Change deal stage").selectOption("Negotiation");
  await expect(page.getByRole("status")).toContainText("Moved to Negotiation");
  const moved = await workspace(page);
  expect(moved.dashboard.weightedForecastCents).toBe(
    before.dashboard.weightedForecastCents + deal.amountCents / 5,
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("undone");
  await page.reload();
  await expect(page.getByLabel("Change deal stage")).toHaveValue("Proposal");
  await expect(page.locator(".timeline")).toContainText(
    "Happy to help with the next step.",
  );
  await expect(page.locator(".deal-next-tasks")).toContainText(
    "Follow up on the Acme commercial review",
  );
  await expect(page.locator(".evidence-card")).toContainText(
    "No buyer activity",
  );
  const after = await workspace(page);
  expect(after.dashboard.weightedForecastCents).toBe(
    before.dashboard.weightedForecastCents,
  );
});

test("navigation @smoke stays usable at the viewport and has no dead primary pages", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [path, heading] of [
    ["/", "Good "],
    ["/pipeline", "Keep good things moving."],
    ["/relationships", "Relationships worth building."],
    ["/work", "Make room for what matters."],
    ["/ai", "A little help."],
  ]) {
    await open(page, path);
    await expect(page.locator("main")).toContainText(heading);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("accounts and contacts can be created, edited, and found through search", async ({
  page,
}) => {
  await open(page, "/relationships");
  await page.getByRole("button", { name: "New account", exact: true }).click();
  await page.getByLabel("Company name").fill("Kiteworks Studio");
  await page.getByLabel("Location", { exact: true }).fill("Portland, OR");
  await page
    .getByLabel("About this company")
    .fill("An independent design team exploring a customer platform.");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".record-heading h1")).toHaveText(
    "Kiteworks Studio",
  );
  await page.getByRole("button", { name: "Edit account" }).click();
  await page.getByLabel("Company name").fill("Kiteworks Collective");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".record-heading h1")).toHaveText(
    "Kiteworks Collective",
  );
  await page.getByRole("button", { name: "Add account contact" }).click();
  await page.getByLabel("Full name").fill("Robin Example");
  await page.getByLabel("Email address").fill("robin@kiteworks.example");
  await page.getByLabel("Job title").fill("Founder");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".account-contacts")).toContainText(
    "Robin Example",
  );
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search all records").fill("Kiteworks");
  await page
    .getByRole("button", { name: "Kiteworks Collective Technology" })
    .click();
  await expect(page.locator(".record-heading h1")).toHaveText(
    "Kiteworks Collective",
  );
});

test("failed saves preserve entered text and retry persists the intended amount", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      value: undefined,
    }),
  );
  await open(page);
  await page.getByRole("button", { name: "New deal", exact: true }).click();
  await page
    .getByLabel("Opportunity name")
    .fill("Acme — A resilient next step");
  await page.getByLabel("Value (USD)").fill("12345.67");
  await page.route("**/api/deals", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        message: "A temporary interruption. Please try again.",
      }),
    }),
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("temporary interruption");
  await expect(page.getByLabel("Opportunity name")).toHaveValue(
    "Acme — A resilient next step",
  );
  await page.unroute("**/api/deals");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".record-heading h1")).toHaveText(
    "A resilient next step",
  );
  const data = await workspace(page);
  expect(
    data.deals.find((d) => d.name === "Acme — A resilient next step")
      ?.amountCents,
  ).toBe(1234567);
});

test("pipeline filters and the accessible stage menu work in both layouts", async ({
  page,
}, testInfo) => {
  await open(page, "/pipeline");
  await page.getByLabel("Search opportunities").fill("Acme");
  const data = await workspace(page),
    deal = primary(data);
  if (testInfo.project.name.startsWith("mobile")) {
    await expect(page.locator(".pipeline-mobile")).toBeVisible();
    await page
      .locator(".pipeline-mobile")
      .getByLabel(`Move ${deal.name} to stage`)
      .selectOption("Negotiation");
  } else {
    await page
      .locator(".pipeline-board")
      .getByLabel(`Move ${deal.name} to stage`)
      .selectOption("Negotiation");
    await page.getByRole("button", { name: "Table view" }).click();
    await expect(page.locator(".deal-table")).toContainText("Acme");
  }
  await expect(page.getByRole("status")).toContainText("Moved to Negotiation");
  await page.getByLabel("Search opportunities").fill("Not a real company");
  await expect(
    page.getByRole("heading", {
      name: "A little space for the next big thing.",
    }),
  ).toBeVisible();
  await page.getByLabel("Search opportunities").fill("");
  await page.getByLabel("Opportunity status").selectOption("Won");
  const snapshot = await workspace(page);
  expect(snapshot.deals.find((d) => d.id === deal.id)?.stage).toBe(
    "Negotiation",
  );
  const lost = data.deals.find((d) => d.stage === "Lost")!;
  await page.goto(`/deals/${lost.id}`);
  await expect(page.locator(".deal-stage-track button.current")).toContainText(
    "Lost",
  );
  await page.getByLabel("Change deal stage").selectOption("Discovery");
  await expect(page.getByRole("status")).toContainText("Moved to Discovery");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("undone");
  expect(
    (await workspace(page)).deals.find((d) => d.id === lost.id)
      ?.actualCloseDate,
  ).toBe(lost.actualCloseDate);
});

test("Juno answers supported questions with evidence and handles unsupported requests", async ({
  page,
}) => {
  await open(page, "/ai");
  await page
    .getByRole("button", { name: "Which deals need attention?" })
    .click();
  await expect(page.locator(".ai-answer h2")).toContainText(
    "opportunities to look at",
  );
  await page.getByRole("button", { name: /Based on .* source fact/ }).click();
  await expect(page.locator(".ai-evidence-list")).toContainText(
    "Interpreted filters",
  );
  await expect(page.locator(".ai-evidence-list")).toContainText(
    "needs attention",
  );
  await page
    .getByLabel("Ask Juno about your CRM")
    .fill("Tell me the weather on Mars");
  await page
    .locator(".ai-question-form")
    .getByRole("button", { name: "Ask Juno", exact: true })
    .click();
  await expect(page.locator(".ai-answer")).toContainText(
    "focused set of CRM questions",
  );
  await expect(page.locator(".ai-results")).toHaveCount(0);
});

test("reset restores the original story without changing another visitor", async ({
  page,
  browser,
}) => {
  await open(page);
  const a = await workspace(page),
    deal = primary(a);
  await page.request.patch(`/api/deals/${deal.id}/stage`, {
    data: { stage: "Negotiation", version: deal.version },
  });
  const other = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  const otherPage = await other.newPage();
  await open(otherPage);
  const b = await workspace(otherPage);
  expect(b.workspace.id).not.toBe(a.workspace.id);
  await page.reload();
  await page.getByRole("button", { name: "Your profile", exact: true }).click();
  await page.getByRole("button", { name: "Reset demo workspace" }).click();
  await page.getByRole("button", { name: "Yes, reset demo" }).click();
  await expect(page.getByRole("status")).toContainText("restored");
  const reset = await workspace(page);
  expect(reset.deals.find((d) => d.id === deal.id)?.stage).toBe("Proposal");
  expect((await workspace(otherPage)).workspace.id).toBe(b.workspace.id);
  await other.close();
});

test("tasks can be completed, reopened, and edited without losing their relationships", async ({
  page,
}) => {
  await open(page, "/work");
  const data = await workspace(page),
    deal = primary(data);
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Next step", exact: true })
    .fill("A clear next step");
  await page
    .getByRole("combobox", { name: "Account", exact: true })
    .selectOption(deal.accountId);
  await page.getByLabel("Related opportunity").selectOption(deal.id);
  await page.getByRole("button", { name: "Save next step" }).click();
  await page
    .getByRole("button", { name: "Complete A clear next step", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Task complete");
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await page
    .getByRole("button", { name: "Reopen A clear next step", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Task reopened");
  await page.getByRole("button", { name: "All open", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit task: A clear next step", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Next step", exact: true })
    .fill("A better next step");
  const orbit = data.accounts.find((a) => a.name === "Orbit")!;
  await page
    .getByRole("combobox", { name: "Account", exact: true })
    .selectOption(orbit.id);
  await page.getByRole("button", { name: "Save next step" }).click();
  await expect(page.locator(".work-task-list")).toContainText(
    "A better next step",
  );
  const saved = (await workspace(page)).tasks.find(
    (t) => t.title === "A better next step",
  )!;
  expect(saved.accountId).toBe(orbit.id);
  expect(saved.dealId).toBeNull();
  expect(saved.completed).toBe(false);
});

test("a stale edit keeps its text and cannot silently overwrite a newer version", async ({
  page,
}) => {
  await open(page);
  const data = await workspace(page),
    deal = primary(data);
  await page.goto(`/deals/${deal.id}`);
  await page.getByRole("button", { name: "Edit deal", exact: true }).click();
  await page.getByLabel("Opportunity name").fill("Acme — My unsaved revision");
  await page.request.patch(`/api/deals/${deal.id}/stage`, {
    data: { stage: "Negotiation", version: deal.version },
  });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "changed in another view",
  );
  await expect(page.getByLabel("Opportunity name")).toHaveValue(
    "Acme — My unsaved revision",
  );
  await page
    .getByRole("button", { name: "Refresh workspace", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Workspace refreshed");
  const rejected = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/deals/${deal.id}`) &&
      response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  expect((await rejected).status()).toBe(409);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Edit deal", exact: true }).click();
  await expect(page.getByLabel("Opportunity name")).toHaveValue(deal.name);
  await page.getByLabel("Opportunity name").fill("Acme — Reviewed revision");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".record-heading h1")).toHaveText(
    "Reviewed revision",
  );
  expect(
    (await workspace(page)).deals.find((d) => d.id === deal.id)?.stage,
  ).toBe("Negotiation");
});
