/**
 * End-to-end smoke test: claiming, link lookup, editing, reordering and
 * markdown import, driven through a real browser.
 *
 *   npm run build && npm start          # in one terminal
 *   npx playwright@latest install chromium
 *   node tests/e2e.mjs                  # BASE_URL=http://localhost:3000
 *
 * It serves its own fake product page, so nothing external is needed.
 */
import { createServer } from "node:http";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

let chromium;
try {
    ({ chromium } = await import("playwright"));
} catch {
    console.error("Playwright is not installed. Run: npx playwright@latest install chromium");
    process.exit(1);
}

// A stand-in shop page, so the link-lookup test does not depend on a real site.
const PRODUCT_PAGE = `<!doctype html><html><head><title>Shop</title>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Comandante C40 Grinder",
 "image":"https://example.com/c40.jpg","offers":{"price":"289.00","priceCurrency":"EUR"}}
</script></head><body></body></html>`;

const fixtures = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html" });
    response.end(PRODUCT_PAGE);
});
await new Promise((resolve) => fixtures.listen(0, "127.0.0.1", resolve));
const productUrl = `http://127.0.0.1:${fixtures.address().port}/product`;

const step = (message) => console.log("✓", message);

/** Editor mode is a toggle, so only click the pencil when it is showing. */
async function ensureEditMode(page) {
    const pencil = page.getByLabel("Enter editor mode");
    if (await pencil.isVisible().catch(() => false)) await pencil.click();
}
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const failures = [];
page.on("pageerror", (error) => failures.push(String(error)));
page.on("console", (message) => {
    // Blocked images and fonts are environment noise, not app errors.
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) failures.push(message.text());
});

try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    step("shopper view is the landing page");

    // First run: the app has no lists yet, so make one.
    if (await page.getByRole("button", { name: "New list" }).first().isVisible().catch(() => false)) {
        await page.getByRole("button", { name: "New list" }).first().click();
        await page.getByRole("textbox", { name: "List name" }).fill("Ellie");
        await page.getByRole("button", { name: "Create list" }).click();
        await page.waitForTimeout(800);
        step("created the first list from the empty state");
    } else {
        await ensureEditMode(page);
    }

    await page.getByRole("button", { name: /Add (a )?gift/ }).first().click();
    await page.getByRole("textbox", { name: "Link" }).fill(productUrl);
    await page.getByRole("button", { name: "Fetch" }).click();
    await page.waitForTimeout(1500);

    const title = await page.getByRole("textbox", { name: "Gift name" }).inputValue();
    const price = await page.getByRole("textbox", { name: "Price" }).inputValue();
    if (title !== "Comandante C40 Grinder" || price !== "289") {
        throw new Error(`link lookup did not fill the form: ${title} / ${price}`);
    }
    step(`link lookup filled the form (${title}, ${price})`);

    await page.getByRole("button", { name: "Add gift", exact: true }).last().click();
    await page.waitForTimeout(800);
    if (!(await page.getByText("Comandante C40 Grinder").first().isVisible())) throw new Error("gift was not added");
    step("gift saved and rendered");

    // A second gift, typed in by hand, so reordering has something to move.
    await ensureEditMode(page);
    await page.getByRole("button", { name: /Add (a )?gift/ }).first().click();
    await page.getByRole("textbox", { name: "Gift name" }).fill("Merino wool socks");
    await page.getByRole("textbox", { name: "Price" }).fill("32");
    await page.getByRole("button", { name: "Add gift", exact: true }).last().click();
    await page.waitForTimeout(800);
    step("gift added by hand, without a link");

    const before = await page.locator("article h3").allInnerTexts();
    if (before.length > 1) {
        await page.getByLabel("Move down").first().click();
        await page.waitForTimeout(600);
        await page.reload({ waitUntil: "networkidle" });
        const after = await page.locator("article h3").allInnerTexts();
        if (after[0] === before[0]) throw new Error("reorder did not persist");
        step("reorder persisted across a reload");
    }

    await ensureEditMode(page);
    await page.getByRole("button", { name: "Import", exact: true }).first().click();
    await page
        .getByRole("textbox", { name: "Markdown" })
        .fill("# Gran\n\n- [Warm scarf](https://shop.example.com/scarf) — £29 — lambswool\n- Tin of shortbread — £8\n");
    await page.getByRole("button", { name: "Import gifts" }).click();
    await page.waitForTimeout(1500);

    if (!(await page.getByRole("heading", { name: "Gran", level: 1 }).isVisible())) {
        throw new Error("import did not create and open the new list");
    }
    if (!/\/l\/gran(-\d+)?$/.test(page.url())) throw new Error(`list URL not updated: ${page.url()}`);
    step("markdown import created a list, opened it and updated the URL");

    await page.goto(page.url(), { waitUntil: "networkidle" });
    if (!(await page.getByText("Tin of shortbread").first().isVisible())) throw new Error("direct list URL failed");
    step("direct /l/<slug> link renders that list");

    await page.getByRole("button", { name: /I'll get this/ }).first().click();
    await page.getByRole("textbox", { name: "Your name" }).fill("Uncle Ray");
    await page.getByRole("button", { name: /I'll get this/ }).last().click();
    await page.waitForTimeout(800);
    if (!(await page.getByText("Uncle Ray is getting this").first().isVisible())) throw new Error("claim was not recorded");
    step("claiming a gift works");

    if (failures.length) throw new Error(`console or page errors:\n${failures.join("\n")}`);
    step("no console or page errors");

    console.log("\nAll end-to-end checks passed.");
} finally {
    await browser.close();
    fixtures.close();
}
