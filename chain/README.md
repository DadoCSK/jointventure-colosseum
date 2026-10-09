# Joint Venture Devnet program

The Bavaria project is a deterministic Anchor account, derived from `['project', 'bavaria']`. Its classic SPL token vault is derived from `['vault', project]` and owned by the project PDA. Initialization is restricted to the program's current upgrade authority. The accepted six-decimal mint is fixed at initialization.

EUR case metrics are stored in integer cents. Live financing totals are separate integer test-token units and start at zero; the frontend's €75,000 demo commitment is not an onchain deposit. JV Test USD is a dedicated demo token, not official USDC, a stablecoin, or an asset redeemable for currency. The token label is application metadata; no token metadata program is used.

## Tooling

Anchor CLI 0.32.1 and Agave CLI/validator 4.3.0; the lockfile pins Rust dependencies. Build with an official SBF compiler that supports SBPF v3 (platform-tools v1.57 was used here). On a normally writable installation:

```sh
cd chain
cargo build-sbf --tools-version v1.57 --arch v3
anchor idl build -o target/idl/joint_venture.json -t target/types/joint_venture.ts
```

An isolated SDK can be selected using `--sbf-sdk`, `--skip-tools-install`, `--no-rustup-override`, and `RUSTC`/`RUSTDOC` pointing to the downloaded platform compiler. This machine required an isolated `CARGO_HOME` because its pre-existing user caches are not writable.

From the repository root:

```sh
# Local validator with the CLI authority funded in its genesis
solana-test-validator --ledger chain/test-ledger --rpc-port 8899 --mint YOUR_CLI_PUBLIC_KEY
node scripts/deploy-program.mjs --local
# Initialization test needs a fresh local ledger/project account
node scripts/test-initialization.mjs
node scripts/test-financing.mjs
node scripts/test-documents.mjs

# Explicit Devnet deployment and initialization
node scripts/deploy-program.mjs
node scripts/initialize-bavaria.mjs
# After locally testing an upgraded financing binary:
node scripts/enable-financing.mjs
node scripts/smoke-devnet.mjs
# Pause new deposits if needed:
node scripts/enable-financing.mjs --pause
```

The scripts check Devnet's genesis hash before Devnet operations. `JV_ADMIN_KEYPAIR` can select an authority keypair; otherwise the existing Solana CLI keypair is used. Private program and mint keys live only in ignored `.localkeys/` with restrictive permissions. Keep them private and back them up securely if retaining this deployment. Public deployment receipts are kept in `chain/receipts/`; the frontend deployment manifest and generated IDL are public.

`JV_SOLANA_CLI` can select an explicitly installed CLI executable. Deployment uses a saved private buffer keypair so interrupted uploads can be resumed without logging recovery mnemonics. The initial project-only deployment and the financing upgrade have separate public receipts. When deploying an upgrade, build the matching IDL first and run the local tests before enabling it on Devnet. Initialization is idempotent for the expected dedicated mint; repeated smoke checks verify the existing test position instead of depositing again.

## Financing records

`finance(amount, expected_nonce)` validates the canonical Bavaria PDA, its fixed accepted mint, the PDA vault and the investor-owned source account. It creates or reuses a position PDA derived from `['position', project, investor]`, transfers classic SPL tokens via `transfer_checked`, and records integer base units. Arithmetic is checked and all changes roll back on failure. Each successful call increments the position nonce; stale nonce attempts are rejected before a token transfer.

`set_financing_enabled(enabled)` requires the project authority. The initialized project began paused; it was enabled only after the financing upgrade passed local tests. There is no close, reinitialize, withdraw, repayment or generic recipient instruction. Direct token transfers into the vault are not counted as recorded financing; read the program's total and position records as the accounting source.

## Document integrity

`record_document(document_id, document_name, sha256_hash)` requires the canonical Bavaria Project and its authority signer. It initializes a separate immutable PDA using `["document", project, document_id]`; Project stays read-only. IDs must be 1–32 lowercase ASCII letters/digits/hyphens, names nonblank and at most 64 UTF-8 bytes, and the supplied digest exactly 32 bytes. The account stores the digest as `[u8; 32]`, plus project, authority, ID/name, timestamp and bump. Duplicate creation fails. No replacement/versioning or document content/storage is supported.

Existing Project/Position layouts and all financing interfaces are unchanged. The current Devnet program was upgraded in place, with all original account data preserved. Do not reinitialize or reset its state for document recording.

`node scripts/record-integrity-fixture.mjs` anchors only `tests/fixtures/integrity-test.txt` on Devnet, using the existing CLI project authority. It checks an existing record rather than creating duplicates, verifies the digest and confirms that the three production document PDAs remain absent. Public receipt: `chain/receipts/document-integrity-test.json`. Browser Web Crypto independently hashes local files; only digest/category metadata reach Solana.

`node scripts/check-integrity-upgrade.mjs` compares all six original accounts against the saved Phase 2F baseline and verifies the accepted user wallet token balance. `--snapshot` is for a pre-upgrade baseline only and refuses to overwrite an existing snapshot. These checks are specific to this milestone's captured state; subsequent authorized financing activity will correctly make them fail.

A fingerprint match proves matching file bytes, not authentication of the document or issuer. All real Bavaria document categories remain pending. See [milestone status](../PROJECT_STATUS.md) for deployment, tests and remaining limitations.

## Scope

This is a Devnet MVP, not audited production finance software. Phase 2F document fingerprints are implemented; independent document authentication is outside this MVP. The upgrade authority is retained for development. No investment return, repayment schedule, EUR/token exchange rate, withdrawal rights, or production legal terms are established by this program.
