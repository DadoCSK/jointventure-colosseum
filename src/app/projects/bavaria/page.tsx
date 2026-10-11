import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Sprout, Clock3, ArrowLeft } from "lucide-react";
import { bavaria, eur, useOfFunds, verifications, readiness, foundingLabel } from "@/data/projects";
import {
  MetricCard,
  StatusBadge,
  FacilityCaption,
} from "@/components/ui";
import { InvestmentModal, VerificationCard } from "@/components/interactive";
import {OnchainProject} from '@/components/financing';
import {IntegrityTestFixture} from '@/components/document-integrity';
export const metadata: Metadata = { title: "Bavaria Controlled Cultivation Infrastructure" };
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
          <span className="eyebrow">{foundingLabel}</span>
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
              Document integrity pending
            </span>
          </div>
        </div>
        <StatusBadge>{bavaria.status}</StatusBadge>
      </header>
      <div className="facility-masthead industrial-only"><FacilityCaption /></div>
      <section className="founding-statement panel">
        <span className="eyebrow">REAL BUSINESS · PROJECT DEVELOPER FACTS</span>
        <h2>Joint Venture was created from this project.</h2>
        <p>This is a real agricultural infrastructure financing requirement in Bavaria, Germany — not a fictional marketplace listing. The underlying cultivation association is licensed, the facility has been secured under lease, and the commercial rental agreement has been executed. The project is seeking capital for infrastructure deployment.</p>
        <p className="fine-print">The business has not started operating and the full €250,000 has not been raised. These facts are supplied by the project developer; Joint Venture has not independently authenticated the supporting legal documents.</p>
      </section>
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
              <MetricCard label="Current raise status" value="Open"/>
              <MetricCard label="Capital raised" value="Seeking financing"/>
              <MetricCard
                label="Contracted monthly revenue"
                value={`~${eur(bavaria.contractedMonthlyRevenue!)}`}
                note="Contracted · not yet operating revenue"
              />
              <MetricCard
                label="Infrastructure budget"
                value={eur(bavaria.infrastructureBudget!)}
              />
              <MetricCard label="Initial working capital" value={eur(bavaria.workingCapital!)} />
            </div>
            <p className="projection-note">
              Contracted rental revenue is approximately €33,000/month, not a guaranteed investor return. The business is pre-operational. Any financial projections are not guaranteed; no investor return or repayment terms are established.
            </p>
          </section>
          <section className="panel">
            <span className="eyebrow">BUSINESS OVERVIEW</span>
            <h2>Infrastructure for the next stage.</h2>
            <p>
              The infrastructure company is a GmbH. It has executed a commercial rental agreement with the licensed cultivation association. Cultivation work is performed by association members. Infrastructure deployment is the remaining major financing requirement before launch.
            </p>
            <p>Controlled-environment cultivation is the founding use case; agricultural infrastructure financing is the broader platform focus.</p>
          </section>
          <section className="panel">
            <span className="eyebrow">REAL BUSINESS READINESS</span>
            <h2>Project Readiness</h2>
            <div className="readiness-grid">{readiness.map(item => <MetricCard key={item.label} label={item.label} value={item.value}/>)}</div>
            <p className="fine-print">Phased deployment may be possible from approximately €50,000, with infrastructure expansion as operations scale. The preferred full-deployment target remains €250,000.</p>
            <p className="fine-print">Business readiness is distinct from document integrity: supporting document fingerprints remain pending.</p>
          </section>
          <OnchainProject/>
          <section className="panel">
            <div className="funds-heading">
              <div>
                <span className="eyebrow">CAPITAL ALLOCATION</span>
                <h2>Use of funds</h2>
              </div>
              <span className="mock-label">APPROXIMATE REQUIREMENT</span>
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
          <p className="business-raise">Capital raise open · Seeking financing</p>
          <p className="fine-print">No EUR financing progress is represented here. The Devnet action below is a separate technical demonstration.</p>
          <h3 className="demo-action-heading">Try the Devnet demo</h3>
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
            Wallet connection alone submits no transaction. The real €250,000 financing requirement stays separate; no currency conversion is performed.
          </p>
        </aside>
      </div>
      <section className="verification-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PROJECT TRANSPARENCY</span>
            <h2>Verification records</h2>
            <p>
              Files are hashed locally in your browser; only SHA-256 fingerprints are anchored on Solana. Contents are not uploaded. Matching proves file integrity, not legal authenticity or the truth of the contents.
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
