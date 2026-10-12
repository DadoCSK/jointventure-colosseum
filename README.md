# Joint Venture

### Onchain financing for real-world cultivation infrastructure

**Joint Venture** is a Solana-powered infrastructure financing platform connecting real-world projects with capital, verifiable records, and visibility into the physical assets being financed.

Our first use case is a real cultivation infrastructure project in **Bavaria, Germany**.

🌐 **Live Demo:** https://jointventurefi.com/

---

## The Problem

Cultivation operations require significant capital before they can begin production.

Facilities need:

- Climate control
- Lighting
- Irrigation
- Security infrastructure
- Cultivation equipment
- Processing equipment

These investments happen before the first harvest and before the operation begins generating revenue.

At the same time, investors need visibility into:

- What their capital is financing
- How much has been contributed
- The documents behind the project
- The infrastructure being deployed

Joint Venture brings these pieces together.

---

## The Bavaria Pilot

Joint Venture is being developed around a real project rather than a fictional marketplace example.

### Project Capital

| | Amount |
|---|---:|
| Total Project Capital | **€350,000** |
| Already Invested | **€100,000** |
| Current Raise | **€250,000** |
| Infrastructure & Equipment | **€220,000** |
| Initial Working Capital | **€30,000** |
| Contracted Monthly Revenue | **~€33,000** |

The first €100,000 has already been invested into licensing, legal and regulatory work, and project/facility preparation.

### Project Status

- ✅ Cultivation licence obtained
- ✅ Facility secured
- ✅ Customer agreement executed
- 🏗️ Infrastructure deployment pending
- 📍 Bavaria, Germany

---

# How Joint Venture Works

```text
Investor
   │
   ▼
Connect Solana Wallet
   │
   ▼
Select Real-World Project
   │
   ▼
Finance Infrastructure
   │
   ▼
Solana Program
   │
   ├── Records contribution
   ├── Updates project state
   └── Creates/updates investor position
   │
   ▼
Investor Portfolio
   │
   ├── Onchain position
   ├── Transaction verification
   ├── Document integrity
   └── Facility visibility
```

---

# Solana Integration

The hackathon implementation runs on **Solana Devnet**.

Investors can connect a compatible Solana wallet and interact with the financing system using native SOL.

The program handles:

- Project validation
- Project-controlled vault
- Native SOL contributions
- Investor position accounting
- Contribution tracking
- Replay/nonce protection
- Financing pause controls

The application also displays a current **SOL → EUR equivalent** to make contributions easier to understand.

The authoritative blockchain value remains the native SOL contribution.

> **Devnet contributions are demonstrations only. Devnet SOL has no monetary value and does not represent actual investment into the Bavaria project.**

---

## Onchain Architecture

```text
Investor Wallet
      │
      │ Native SOL
      ▼
Joint Venture Program
      │
      ├──────────────► Project State
      │
      ├──────────────► Project SOL Vault
      │
      └──────────────► Investor Position
```

### Program

```text
Ezssvc6b1pDYT387dBUn95Lac429GQsSz7FHNEHqBcwJ
```

### Bavaria Project PDA

```text
9zPe8V8s9WFhoJxHTfViwu9dhvgK3gc8bN3XiCGjEo1U
```

Network:

```text
Solana Devnet
```

---

# Investor Portfolio

Connected wallets can view their project positions directly from onchain state.

The portfolio displays:

- SOL contributed
- Current EUR equivalent
- Project
- Network
- Position status
- Solana Explorer links

The position is derived from the connected wallet's onchain account rather than being maintained as a conventional investment database entry.

---

# Document Integrity

Investment decisions require more than transaction records.

Joint Venture therefore includes an onchain document-integrity system.

Sensitive project documents remain **offchain and private**.

Instead, the application calculates a SHA-256 fingerprint locally:

```text
Private Document
       │
       ▼
SHA-256
       │
       ▼
Document Fingerprint
       │
       ▼
Solana Document Record
```

A document can later be hashed again and compared against the fingerprint recorded on Solana.

### What this proves

A matching fingerprint proves that the document being checked contains the **same bytes as the version whose fingerprint was recorded**.

It does not by itself prove:

- who issued the document
- legal validity
- accuracy of its contents

No private document contents need to be published onchain.

---

# Facility Digital Twin

Joint Venture goes beyond financial records.

Investors should be able to understand **what their capital is actually building**.

The Bavaria project includes an interactive facility digital twin showing:

- Temperature
- Humidity
- CO₂
- VPD
- Lighting
- HVAC
- Irrigation
- Power
- Cultivation stages
- Infrastructure systems

The application also includes an interactive floor plan derived from the real Bavaria facility layout.

For security reasons, sensitive access-control and physical-security details are intentionally excluded from the public version.

### Current Status

Facility telemetry is currently **simulated**.

The digital twin demonstrates how the interface can eventually consume real IoT telemetry from deployed infrastructure.

```text
Physical Facility
      │
      ▼
IoT Sensors
      │
      ▼
Telemetry Layer
      │
      ▼
Joint Venture Digital Twin
      │
      ▼
Investor Visibility
```

---

# Technology

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- DaisyUI
- Lucide

### Blockchain

- Solana
- Anchor
- Rust
- Native SOL
- Program Derived Addresses (PDAs)

### Wallets

Compatible Solana wallets can be detected through the wallet integration, including supported installations such as:

- Phantom
- Solflare

### Cryptography

- SHA-256 document fingerprints
- Browser-side hashing using Web Crypto

---

# Project Architecture

```text
                    ┌─────────────────────┐
                    │     Next.js App     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Project Data      Wallet Layer    Facility Twin
              │                │                │
              │                ▼                │
              │          Solana Wallet          │
              │                │                │
              └────────────┬───┘                │
                           ▼                    │
                  Joint Venture Program         │
                           │                    │
             ┌─────────────┼─────────────┐      │
             ▼             ▼             ▼      │
          Project       SOL Vault     Position  │
             │                                  │
             ▼                                  │
      Document Records                          │
                                                │
                           Simulated Telemetry ──┘
```

---

# Running Locally

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_NAME>
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The blockchain integration is configured for **Solana Devnet**.

A compatible Solana wallet configured for Devnet is required to test wallet interactions.

---

# Demo Flow

For the hackathon, the recommended product flow is:

1. Explore the real Bavaria project
2. Review its capital requirements
3. Connect a Solana wallet
4. Review the native SOL financing interface
5. Inspect an existing onchain investor position
6. Verify the corresponding Solana transaction
7. Explore document integrity
8. Inspect the Facility Digital Twin
9. Explore the real-layout-derived Floor Plan

---

# Why Solana?

Joint Venture uses Solana where shared, independently verifiable state adds value.

### Financing

Investor contributions and positions can be recorded onchain.

### Verification

Transactions can be independently inspected without relying solely on Joint Venture's database.

### Document Integrity

Document fingerprints create timestamped, independently verifiable integrity records.

### Future Infrastructure

The same financial layer can eventually connect financing positions with real-world infrastructure and telemetry.

The objective is not to put the entire business onchain.

It is to use blockchain for the parts where **transparent and independently verifiable records matter**.

---

# Vision

The Bavaria project is the first implementation.

The broader goal is to create a repeatable infrastructure-financing model for capital-intensive productive assets.

```text
Capital
   ↓
Infrastructure
   ↓
Physical Facility
   ↓
Production
   ↓
Revenue
```

Joint Venture connects that physical lifecycle with a transparent digital financing and verification layer.

---

# Hackathon Status

Joint Venture is currently a **hackathon prototype running on Solana Devnet**.

The Bavaria project itself is real.

The following components are demonstrations:

- Devnet SOL contributions
- SOL → EUR funding visualization
- Investor demo positions
- Simulated facility telemetry
- Digital twin sensor data

These should not be interpreted as actual investment activity or live facility telemetry.

---

## Built With

**Solana · Anchor · Rust · Next.js · React · TypeScript**

---

## Joint Venture

**Finance real infrastructure. Verify what your capital is building.**

🌐 https://jointventurefi.com/
