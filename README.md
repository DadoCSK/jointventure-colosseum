# Joint Venture Devnet MVP

Agricultural infrastructure financing with Next.js App Router, TypeScript, Tailwind CSS, DaisyUI, Lucide React and compatible Solana wallets. The Bavaria-only dashboard uses a single Industrial appearance with charcoal surfaces, white branding and restrained sage accents. Bavaria has a project account and a separate native SOL custody vault on Solana Devnet; financing transfers actual lamports through the Joint Venture program and records native demo positions. Legacy test-token accounts remain intact.

## Run

```sh
npm install
npm run dev
# http://localhost:3000

npm run typecheck
npm run lint
npm run build
npm run test:e2e
node scripts/test-amount.mjs
```

Routes: `/` (Overview), `/projects/bavaria` (Project), `/facility`, `/documents`, `/portfolio`. `/projects` redirects to Bavaria. Browser tests require Chromium (`npx playwright install chromium`). Node 24 was used, including its TypeScript stripping for the amount-check and mint scripts.

## Devnet deployment

| Account | Public address |
| --- | --- |
| Program | `Ezssvc6b1pDYT387dBUn95Lac429GQsSz7FHNEHqBcwJ` |
| Bavaria project PDA | `9zPe8V8s9WFhoJxHTfViwu9dhvgK3gc8bN3XiCGjEo1U` |
| Legacy token vault PDA | `2JGPfGiDD6wCUJ4dJyrYKQm7RP7NgQ56hdSCVNgJADHN` |
| Legacy JV Test USD mint | `BUb2CzJvDu7GuFjZ9a41z7uTQNCbgi97yybPs6uepYgL` |
| Native SOL vault PDA | `85dT3wXkBVom6e7w9c2zcwntBedAoC88nqLt417hufHX` |

[View the project on Devnet Explorer](https://explorer.solana.com/address/9zPe8V8s9WFhoJxHTfViwu9dhvgK3gc8bN3XiCGjEo1U?cluster=devnet). Public addresses and generated IDL are in `src/chain/`; deployment and verification receipts are in `chain/receipts/`.

The minimal project was deployed and initialized **before** adding the financing instruction and upgrading the same program. The project stores the agreed EUR metrics in integer cents and fixes the accepted mint. Initialization checks the deployed program's upgrade authority. The vault accepts classic SPL tokens and is controlled by the project PDA, not a recipient wallet. Financing validates the project, mint, source owner and vault, transfers through the program, and atomically updates the project total and a position PDA derived from project + investor. Expected nonces reject replayed attempts. An authority-only instruction can pause financing.

**Legacy state:** JV Test USD has six decimals and is a dedicated demo token, not official USDC or redeemable currency. Historical tokens remain in the legacy vault and are absent from the normal financing UI. Native SOL and legacy token custody have **no withdrawal or repayment instruction**. Upgrade and mint authorities are retained for development. This program has not undergone an independent security audit.

## Try native SOL financing

1. Select **Connect Wallet**, then a detected compatible Wallet Standard wallet or the supported Solflare web wallet. Use **Solana Devnet** and have native Devnet SOL in the wallet.
2. On Bavaria, choose **Finance this project**, enter a positive SOL amount (up to nine decimals), then **Review Financing**. The review shows the project-derived SOL vault, signing wallet, network and current EUR demo estimate.
3. Select **Approve in Wallet**. The client rechecks the native balance, network fee, rent for any new vault/position, financing pause and position nonce. It verifies the exact returned message and signature before submission.
4. Confirmed financing re-reads the native project total, wallet position, vault and wallet balances automatically. Inspect the Explorer transaction and **Portfolio**. Pending attempts retain their signature and block another submission; use **Check confirmation** before retrying.

**Devnet SOL has no monetary value and this is not a real investment.** Market-price estimates are presentation data, never onchain accounting. `/api/sol-eur` uses CoinGecko SOL/EUR with Kraken SOLEUR fallback, a 60-second in-process cache and concurrent-request deduplication. Invalid/stale/unavailable prices show EUR unavailable; financing still works. The source and quote/retrieval age are displayed.

`finance_sol(lamports, expected_nonce)` uses a **SolVault** PDA at `["sol-vault", project]` (49 bytes including discriminator) and **SolPosition** at `["sol-position", project, investor]` (89 bytes). Both are program-owned and initialized when first needed, with rent paid by the contributor. The vault holds native SOL and stores the recorded project total; its balance also includes rent and any direct deposits, which do not increase recorded financing. Canonical project/vault/position checks, signer requirements, checked arithmetic, atomic transfer/recording, pause and nonce protections apply. No withdrawal/close/reset path exists.

Project, legacy Position and DocumentRecord layouts are unchanged. Legacy token totals remain token units; native positions use lamports and separate PDAs. JV Test USD is retired from the normal UI, not deleted from Devnet. App wallet and pending-receipt state remain in memory; retain a pending Explorer link before refreshing. Installed Phantom/Solflare acceptance and mobile handoff still require manual testing; automated fixtures cover both signing paths, and an isolated Wallet Standard test signer exercised the actual Devnet frontend flow.

Explicit smoke command: `node scripts/smoke-native-sol.mjs`. It refuses duplicate deposits, uses an isolated Node signing key and funds only a very small Devnet contribution. Public receipts and compatibility checks are in `chain/receipts/native-sol-*.json`; private keys remain ignored. See PROJECT_STATUS.md for the completed deployment and smoke evidence.

## Single-project dashboard

Bavaria is the only MVP project: a real, pre-operational founding business with €350,000 total project capital: €100,000 already spent on licensing, legal, regulatory and facility/project preparation, plus a €250,000 current raise (€220,000 infrastructure & equipment and €30,000 working capital). The 29% business-capital bar represents historical spend, not installed productive equipment or Devnet contributions. The deployed business financing target remains €250,000. Contracted rent is approximately €33,000/month, not current revenue or an investor return. Developer-supplied business facts and project documents are not independently authenticated. Fictional marketplace listings, filters, totals and EUR portfolio examples have been removed.

The Project page shows the supplied seven-part allocation and a separate **Live Devnet Financing** card. It reads native SolVault/SolPosition accounts and shows SOL plus current EUR demo equivalents. An accurately sized striped demo overlay is drawn against total project capital without adding to the historical €100k or reducing the €250k real raise. Confirmed financing re-reads the native total, position and vault/wallet balances. Failed reads do not invent totals; pending receipts remain in memory and can be checked before another submission.

**Facility** demonstrates planned visibility using explicitly simulated telemetry, smooth 24-hour SVG trends, a selectable growth-cycle illustration and planned/simulated system statuses. Bounded readings change locally every four seconds and can be paused. No external sensor data, hardware, backend or IoT integration exists. The actual facility remains pre-operational.

**Project Data Room** presents business records separately from their pending onchain integrity status. The harmless integrity demo has a downloadable public test file, local hashing, read/compare and authority-only anchoring. Private project files are not downloadable. Industrial is the sole appearance; there is no appearance switch or saved appearance preference. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for verification and remaining limits.

## Document integrity (Phase 2F)

Open Documents → **Download harmless test file**, then the demo's **View record** → **Read integrity record**. Select the downloaded file locally to see a match; changing its bytes produces a mismatch. The download is identical to `tests/fixtures/integrity-test.txt`. The three actual project categories remain pending because their documents are unavailable. Do not commit sensitive documents to this repository.

Browser Web Crypto hashes files in memory (20 MiB limit, HTTPS/localhost required). There is no upload endpoint, document storage or onchain file content. Only the 32-byte digest, public category ID/name, authority and chain timestamp are recorded. Matching a fingerprint proves matching bytes; it does not authenticate the issuer, truth, legality or content.

Only the existing project authority can select a file and choose **Anchor fingerprint in Wallet**. Recording is permanent; duplicate IDs are rejected and replacement/versioning is not implemented. The UI retains uncertain signatures for status checking; save the Explorer link before refreshing. No frontend private keys are used. Document IDs are 1–32 lowercase ASCII letters/digits/hyphens and names are at most 64 UTF-8 bytes.

```sh
# On the initialized local validator, alongside the original tests:
node scripts/test-documents.mjs
# Explicitly anchor/read back only the public harmless fixture on Devnet:
node scripts/record-integrity-fixture.mjs
# Read-only check against the saved pre-upgrade public state:
node scripts/check-integrity-upgrade.mjs
```

The same program was upgraded compatibly; original Project/Position layouts and financing interfaces remain intact. Read [PROJECT_STATUS.md](PROJECT_STATUS.md) for the fixture address, public receipts, state preservation and current limitations. Explorer links are correctly constructed, but automated access returned HTTP 429. Default Turbopack encountered a machine process/port restriction; the verified production build command here is `npm run build -- --webpack`.

## Files and tooling

- `chain/programs/joint_venture/src/lib.rs`: project initialization, vault constraints, authority pause control, financing/position records and separate immutable document-integrity records.
- `chain/Cargo.lock`, `chain/Anchor.toml`: locked dependencies and Anchor workspace. See [chain setup](chain/README.md) for local validation and deployment commands.
- `scripts/`: guarded deployment, initialization, pause/enable, demo minting, local program tests, amount checks and idempotent Devnet smoke verification.
- `src/chain/`: public deployment configuration, generated IDL/types, exact SOL/legacy-token parsing, validated reads and program transaction construction.
- `src/components/financing.tsx`, `wallet-provider.tsx`, `wallet.tsx`: review, signing, confirmation recovery, native SOL positions and wallet reads.
- `src/data/projects.ts`: the sole Bavaria business facts, allocation and document notices.
- `tests/`: real adapter/SDK browser tests with fixture wallet and RPC responses.

New client dependencies are `@coral-xyz/anchor` 0.32.1 and `@solana/spl-token` 0.4.15, alongside the existing Solflare adapter and web3.js. Rust uses Anchor 0.32.1. The build used official platform-tools v1.57, SBPF v3, and Agave CLI/validator 4.3.0 for deployment/testing. This machine required isolated temporary compiler/Cargo directories because its pre-existing caches are not writable. Program and mint keypairs stay in ignored `.localkeys/`; generated binaries, local ledgers and build directories are also ignored.

## Verification and limits

Local program tests cover unauthorized and duplicate initialization, decimal restrictions, exact case metrics, PDA vault ownership, pause authority, zero amounts, wrong mint/source owner/vault/position, insufficient tokens, successful repeated deposits, replay protection and atomic failure. Exact amount checks cover six decimals and u64 boundaries. Devnet initialization, upgrade, enable and a real program financing transaction were read back and verified.

Frontend verification covers TypeScript, ESLint, production build, wallet/signing fixtures, amount and network validation, rejection, pending and unavailable confirmation, failed/expired transactions, stale positions, insufficient SOL, portfolio reads, and separate historical capital/current-raise metrics. Desktop, tablet, 390px and 320px route checks include overflow, accessibility and keyboard handling.

Final results: TypeScript, ESLint, production build, Rust formatting, local program security tests, exact amount tests and **all 62 browser regression cases passed in the final full run**. All 24 route/viewport combinations passed automated WCAG 2 A/AA and overflow checks. Browser hydration/console checks passed after waiting for hydration before taking screenshots. Native SOL smoke readback, legacy-account compatibility and deployed executable verification are recorded in PROJECT_STATUS.md. These automated checks complement manual accessibility and installed-wallet acceptance testing.

`npm audit` reports 20 findings (10 moderate, 10 high), including development ESLint/glob dependencies and transitive Solana/Anchor dependencies (`bigint-buffer`, `toml`, legacy `uuid`, `stream-json`). No incompatible forced upgrades were applied. The `toml` functionality is Node tooling rather than the browser financing path; the dependency findings still require review before production use. Public Devnet RPC calls can time out or be rate-limited; failed reads show unavailable/error states rather than invented balances.
