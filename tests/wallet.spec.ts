import { test, expect, type Page, type Route } from "@playwright/test";

const firstAccount = "11111111111111111111111111111111";
const secondAccount = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const rpc = "https://api.devnet.solana.com";

type FixtureMode = "connect" | "reject";
async function mockSolflare(
  page: Page,
  mode: () => FixtureMode = () => "connect",
) {
  await page.route("https://connect.solflare.com/**", async (route) => {
    expect(new URL(route.request().url()).searchParams.get("cluster")).toBe(
      "devnet",
    );
    const initialEvent = mode() === "reject" ? "disconnect" : "connect";
    await route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><body><p>Test-only Solflare fixture</p><script>
      const send = data => parent.postMessage({channel:'solflareIframeToWalletAdapter',data}, 'http://localhost:3000');
      window.addEventListener('message', event => {
        if(event.data.channel !== 'solflareWalletAdapterToIframe') return;
        const {id,method} = event.data.data;
        if(method !== 'disconnect') throw new Error('Unexpected wallet signing request: '+method);
        send({type:'response',id,result:null});
      });
      send({type:'event',event:{type:${JSON.stringify(initialEvent)},data:{publicKey:${JSON.stringify(firstAccount)},adapter:'extension'}}});
    </script></body></html>`,
    });
  });
}
async function respondBalance(route: Route, value: number) {
  const request = route.request().postDataJSON();
  expect(request.method).toBe("getBalance");
  await route.fulfill({
    json: {
      jsonrpc: "2.0",
      id: request.id,
      result: { context: { slot: 1 }, value },
    },
  });
}
async function connect(page: Page) {
  await page
    .locator(".site-header")
    .getByRole("button", { name: "Connect Solflare" })
    .click();
  await page
    .locator("dialog[open]")
    .getByRole("button", { name: "Continue to Solflare" })
    .click();
}
async function emitWalletEvent(page: Page, type: string, publicKey?: string) {
  const frame = page
    .frames()
    .find((frame) => frame.url().startsWith("https://connect.solflare.com/"));
  expect(frame).toBeDefined();
  await frame!.evaluate(
    ({ type, publicKey }) => {
      parent.postMessage(
        {
          channel: "solflareIframeToWalletAdapter",
          data: { type: "event", event: { type, data: { publicKey } } },
        },
        "http://localhost:3000",
      );
    },
    { type, publicKey },
  );
}

test("does not connect or read balances before an explicit user action", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:3000")) external.push(r.url());
  });
  await page.goto("/portfolio");
  await expect(
    page.getByRole("heading", { name: "Your Solflare wallet" }),
  ).toBeVisible();
  await page
    .locator(".site-header")
    .getByRole("button", { name: "Connect Solflare" })
    .click();
  await expect(page.locator("dialog[open]")).toContainText(
    "does not request a signature",
  );
  await page.keyboard.press("Escape");
  expect(external).toEqual([]);
});

test("connects, preserves identity across routes, refreshes, changes account, and disconnects", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let value = 1500000000;
  await mockSolflare(page);
  await page.route(rpc, (route) => respondBalance(route, value));
  await page.goto("/");
  await connect(page);
  await expect(page.locator(".site-header .wallet-button")).toHaveText(
    /1111…1111/,
  );
  await page.getByRole("link", { name: "My Portfolio", exact: true }).click();
  await expect(page.locator(".wallet-panel")).toContainText("1.5 SOL");
  await expect(page.locator(".wallet-panel .wallet-address")).toHaveText(
    firstAccount,
  );
  await expect(page.locator(".portfolio-metrics")).toContainText("€10,000");
  value = 0;
  await page.getByRole("button", { name: "Refresh balance" }).click();
  await expect(page.locator(".wallet-balance strong")).toHaveText("0 SOL");
  value = 2500000000;
  await emitWalletEvent(page, "accountChanged", secondAccount);
  await expect(page.locator(".wallet-panel .wallet-address")).toHaveText(
    secondAccount,
  );
  await expect(page.locator(".wallet-balance strong")).toHaveText("2.5 SOL");
  await page
    .locator(".wallet-panel")
    .getByRole("button", { name: "Disconnect Solflare", exact: true })
    .click();
  await expect(page.locator(".wallet-panel .wallet-address")).toHaveCount(0);
  await expect(page.locator(".site-header .wallet-button")).toHaveText(
    "Connect Solflare",
  );
  expect(errors).toEqual([]);
});

test("a declined request can be retried", async ({ page }) => {
  let mode: FixtureMode = "reject";
  await mockSolflare(page, () => mode);
  await page.route(rpc, (route) => respondBalance(route, 1000000000));
  await page.goto("/portfolio");
  await connect(page);
  await expect(page.locator(".site-header .wallet-notice")).toContainText(
    "declined, cancelled",
  );
  mode = "connect";
  await connect(page);
  await expect(page.locator(".wallet-balance strong")).toHaveText("1 SOL");
  await expect(page.locator(".wallet-notice")).toHaveCount(0);
});

test("a failed RPC read is unavailable, never a fake zero; external disconnect clears it", async ({
  page,
}) => {
  let failing = true;
  await mockSolflare(page);
  await page.route(rpc, async (route) => {
    if (!failing) {
      await respondBalance(route, 3000000000);
      return;
    }
    const request = route.request().postDataJSON();
    expect(request.method).toBe("getBalance");
    await route.fulfill({
      json: {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32005, message: "RPC unavailable" },
      },
    });
  });
  await page.goto("/portfolio");
  await connect(page);
  await expect(page.locator(".wallet-balance strong")).toHaveText(
    "Unavailable",
  );
  await expect(page.locator('.wallet-panel [role="alert"]')).toContainText(
    "Unable to read",
  );
  failing = false;
  await page.getByRole("button", { name: "Refresh balance" }).click();
  await expect(page.locator(".wallet-balance strong")).toHaveText("3 SOL");
  await emitWalletEvent(page, "disconnect");
  await expect(page.locator(".wallet-panel .wallet-address")).toHaveCount(0);
  await expect(page.locator(".wallet-balance")).toHaveCount(0);
});

test("an old account response cannot overwrite a new account balance; refresh resets identity", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  await mockSolflare(page);
  await page.route(rpc, async (route) => {
    const request = route.request().postDataJSON();
    if (request.params[0] === firstAccount) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await respondBalance(route, 7000000000).catch(() => {});
    } else await respondBalance(route, 4000000000);
  });
  await page.goto("/portfolio");
  await connect(page);
  await expect.poll(() => !!release).toBe(true);
  await emitWalletEvent(page, "accountChanged", secondAccount);
  await expect(page.locator(".wallet-balance strong")).toHaveText("4 SOL");
  release!();
  await expect(page.locator(".wallet-panel .wallet-address")).toHaveText(
    secondAccount,
  );
  await expect(page.locator(".wallet-balance strong")).toHaveText("4 SOL");
  await page.reload();
  await expect(page.locator(".site-header .wallet-button")).toHaveText(
    "Connect Solflare",
  );
  await expect(page.locator(".wallet-panel .wallet-address")).toHaveCount(0);
});

test("connected wallet layout fits narrow screens and financing requires connection and review", async ({
  page,
}, testInfo) => {
  await mockSolflare(page);
  await page.route(rpc, (route) => respondBalance(route, 1234567890));
  await page.goto("/portfolio");
  await connect(page);
  await expect(page.locator(".wallet-balance strong")).toHaveText(
    "1.23456789 SOL",
  );
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const sizes = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
    await expect(page.locator(".wallet-panel .wallet-address")).toHaveText(
      firstAccount,
    );
  }
  await page.screenshot({
    path: testInfo.outputPath("connected-wallet-mobile.png"),
    fullPage: true,
  });
  await page.goto("/projects/bavaria");
  // Full reload clears the in-memory identity; a signature requires a separate reviewed action.
  await page.getByRole("button", { name: "Finance this project" }).click();
  await expect(page.locator('dialog[open]')).toContainText('JV Test USD is not official USDC');
  await expect(page.locator('dialog[open]').getByRole('button',{name:'Connect Solflare',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator("progress")).toHaveAttribute("value", "75000");
});
