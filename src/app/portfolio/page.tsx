import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, BriefcaseBusiness } from "lucide-react";
import { WalletPanel } from "@/components/wallet";
import {OnchainProject} from '@/components/financing';
import { bavaria, eur, portfolio } from "@/data/projects";
import {
  DemoBanner,
  MetricCard,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
export const metadata: Metadata = { title: "My Portfolio" };
export default function Portfolio() {
  return (
    <div className="container page-content">
      <PageHeader
        eyebrow="YOUR DASHBOARD"
        title="My Portfolio"
        subtitle="A clear view of your infrastructure financing positions."
      />
      <DemoBanner>
        Portfolio positions and activity are demo data, independent of your
        wallet. Live Devnet test contributions are shown separately below.
      </DemoBanner>
      <div className="portfolio-metrics">
        <MetricCard
          label="Active projects"
          value={String(portfolio.activeProjects)}
          note="Demo position"
        />
        <MetricCard
          label="Total committed"
          value={eur(portfolio.totalCommitted)}
          note="Demo commitment"
        />
        <MetricCard
          label="Repayments"
          value={eur(portfolio.repayments)}
          note="None in this demo"
        />
        <MetricCard
          label="Network"
          value={portfolio.network}
          note="Selected network · Solana Devnet"
        />
      </div>
      <WalletPanel />
      <OnchainProject portfolio/>
      <section className="portfolio-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR POSITIONS</span>
            <h2>Capital at work.</h2>
          </div>
          <span className="muted">1 demo position</span>
        </div>
        <div className="position-card panel">
          <div className="position-title">
            <span className="position-icon">
              <BriefcaseBusiness size={25} />
            </span>
            <div>
              <h3>{bavaria.name}</h3>
              <p>{bavaria.location}</p>
            </div>
            <StatusBadge>Active · demo</StatusBadge>
          </div>
          <div className="position-data">
            <MetricCard
              label="Your commitment"
              value={eur(portfolio.totalCommitted)}
            />
            <MetricCard label="Repayments" value={eur(portfolio.repayments)} />
            <MetricCard
              label="Project funding"
              value={`${Math.round((bavaria.funded / bavaria.target) * 100)}%`}
            />
            <Link href="/projects/bavaria" className="btn btn-outline">
              View project <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="portfolio-section panel">
        <span className="eyebrow">ACTIVITY</span>
        <h2>Transaction history</h2>
        <div
          className="table-wrapper"
          tabIndex={0}
          role="region"
          aria-label="Transaction history table"
        >
          <table className="table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Project</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="transaction-type">
                    <ArrowDownLeft size={17} />
                    Demo commitment
                  </span>
                </td>
                <td>{bavaria.name}</td>
                <td>
                  <time dateTime={portfolio.transaction.date}>1 Oct 2026</time>
                </td>
                <td className="financial-value">
                  {eur(portfolio.transaction.amount)}
                </td>
                <td>
                  <span className="status-badge">Recorded · demo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
