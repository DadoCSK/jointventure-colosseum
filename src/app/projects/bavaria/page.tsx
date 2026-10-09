import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Sprout, Clock3, ArrowLeft } from "lucide-react";
import { bavaria, eur, useOfFunds, verifications } from "@/data/projects";
import {
  DemoBanner,
  FundingProgress,
  MetricCard,
  StatusBadge,
} from "@/components/ui";
import { InvestmentModal, VerificationCard } from "@/components/interactive";
import {OnchainProject} from '@/components/financing';
import {IntegrityTestFixture} from '@/components/document-integrity';
export const metadata: Metadata = { title: "Bavaria Cultivation Facility" };
export default function Bavaria() {
  return (
    <div className="container page-content">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/projects">Marketplace</Link>
        <ChevronRight size={14} />
        <span>Bavaria</span>
      </nav>
      <header className="detail-header">
        <div>
          <span className="eyebrow">AGRICULTURAL INFRASTRUCTURE</span>
          <h1>{bavaria.name}</h1>
          <div className="detail-metadata">
            <span>
              <MapPin size={16} />
              {bavaria.location}
            </span>
            <span>
              <Sprout size={16} />
              {bavaria.category}
            </span>
            <span>
              <Clock3 size={16} />
              Verification pending
            </span>
          </div>
        </div>
        <StatusBadge>{bavaria.status}</StatusBadge>
      </header>
      <DemoBanner>
        Real-world-inspired case. EUR funding activity is demo data. Live Devnet
        test-token contributions are separate. Document fingerprints establish
        file integrity; Joint Venture does not authenticate issuers or contents.
      </DemoBanner>
      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel">
            <span className="eyebrow">PROJECT ECONOMICS</span>
            <h2>A foundation for sustainable growth.</h2>
            <div className="metrics-grid">
              <MetricCard
                label="Financing target"
                value={eur(bavaria.target)}
              />
              <MetricCard
                label="Capital committed"
                value={eur(bavaria.funded)}
              />
              <MetricCard
                label="Remaining capital"
                value={eur(bavaria.target - bavaria.funded)}
              />
              <MetricCard
                label="Contracted monthly revenue"
                value={`~${eur(bavaria.contractedMonthlyRevenue!)}`}
                note="Document verification pending"
              />
              <MetricCard
                label="Infrastructure budget"
                value={eur(bavaria.infrastructureBudget!)}
              />
              <MetricCard label="Category" value={bavaria.category} />
            </div>
            <p className="projection-note">
              Contracted revenue describes the project’s customer rental
              agreement, not an investor return. Document verification is
              pending. No investment rate or repayment term has been
              established.
            </p>
          </section>
          <section className="panel">
            <span className="eyebrow">BUSINESS OVERVIEW</span>
            <h2>Infrastructure for the next stage.</h2>
            <p>
              The Bavaria project is a real-world-inspired example of financing
              agricultural infrastructure, with controlled-environment
              cultivation as the first use case. The proposed infrastructure
              includes lighting, climate control, irrigation, security, and
              facility improvements.
            </p>
            <p>
              This demonstration illustrates how a project’s financing needs and
              supporting records could be presented. It makes no claim about the
              operating status, licensing, or performance of an actual business.
            </p>
          </section>
          <OnchainProject/>
          <section className="panel">
            <div className="funds-heading">
              <div>
                <span className="eyebrow">CAPITAL ALLOCATION</span>
                <h2>Use of funds</h2>
              </div>
              <span className="mock-label">DEMO BREAKDOWN</span>
            </div>
            <div className="funds-list">
              {useOfFunds.map((f, i) => (
                <div key={f.label}>
                  <span className="funds-number">0{i + 1}</span>
                  <span>{f.label}</span>
                  <strong>{eur(f.amount)}</strong>
                </div>
              ))}
              <div className="funds-total">
                <span>Total financing required</span>
                <strong>
                  {eur(useOfFunds.reduce((s, f) => s + f.amount, 0))}
                </strong>
              </div>
            </div>
          </section>
        </div>
        <aside className="financing-panel panel">
          <span className="eyebrow">PROJECT FINANCING</span>
          <h2>Help build what’s next.</h2>
          <p>Infrastructure financing for Bavaria’s next chapter.</p>
          <div className="target-amount">
            {eur(bavaria.target)}
            <span>financing target</span>
          </div>
          <FundingProgress project={bavaria} />
          <InvestmentModal />
          <div className="finance-details">
            <div>
              <span>Test network</span>
              <strong>Solana Devnet</strong>
            </div>
            <div>
              <span>Dedicated demo token</span>
              <strong>JV Test USD</strong>
            </div>
          </div>
          <p className="fine-print">
            Financing uses a real Devnet project account and test-token vault.
            Wallet connection alone submits no transaction. EUR demo funding
            totals stay separate; no currency conversion is performed.
          </p>
        </aside>
      </div>
      <section className="verification-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PROJECT TRANSPARENCY</span>
            <h2>Verification records</h2>
            <p>
              Compare local files with fingerprints recorded for this project.
              Integrity records do not independently authenticate issuers or contents.
            </p>
          </div>
        </div>
        <div className="verification-grid">
          {verifications.map((r) => (
            <VerificationCard key={r.id} record={r} />
          ))}
        </div>
        <IntegrityTestFixture/>
      </section>
      <Link className="text-link back-link" href="/projects">
        <ArrowLeft size={16} />
        Back to marketplace
      </Link>
    </div>
  );
}
